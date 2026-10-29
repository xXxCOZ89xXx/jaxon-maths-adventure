-- OWNER-RUN ONLY after review. Target: newly verified staging ref; never Main or deleted. Never run by the build.
-- Additive migration: no existing progress, wallets, PINs or transaction rows are changed.
-- Old clients remain compatible. Do not restore the old RPC after compact receipts exist.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $guard$
BEGIN
 IF coalesce(current_setting('app.v3.staging_ref',true),'') !~ '^[a-z]{20}$' OR current_setting('app.v3.staging_ref',true) IN ('sfogrvedypgtxfvecmbx','mbdelspbjusarbwlltol') THEN RAISE EXCEPTION 'Wrong project: Main and deleted project forbidden'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.v3_environment WHERE name='jaxon-maths-v3-staging' AND project_ref=current_setting('app.v3.staging_ref',true))
 THEN RAISE EXCEPTION 'Wrong project: compact receipts require the existing staging project'; END IF;
 IF EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.v3_transactions'::regclass AND attname='request_fingerprint' AND NOT attisdropped)
 THEN RAISE EXCEPTION 'Receipt migration already present: run verification instead'; END IF;
 IF EXISTS(SELECT 1 FROM (VALUES
 ('public.v3_request(text,text,jsonb)','8d33d57a858472359f5c765b4adb23230edee5faaaa344cdc0995503ace9ae09'),
 ('public.v3_identity()','45442f5fae7afe907fe02162963a84b60846acc4f181c2c241fb7b63e5312d25')
 ) e(sig,hash) LEFT JOIN pg_proc p ON p.oid=to_regprocedure(e.sig)
 WHERE p.oid IS NULL OR p.proowner<>'postgres'::regrole OR NOT p.prosecdef
 OR p.proconfig IS DISTINCT FROM ARRAY['search_path=""']
 OR encode(sha256(convert_to(replace(p.prosrc,chr(13)||chr(10),chr(10)),'UTF8')),'hex')<>e.hash)
 THEN RAISE EXCEPTION 'RPC differs from reviewed baseline; stop and review, do not bypass'; END IF;
END $guard$;
ALTER TABLE public.v3_transactions ADD COLUMN request_fingerprint bytea
 CHECK(request_fingerprint IS NULL OR octet_length(request_fingerprint)=32);
ALTER TABLE public.v3_transactions ADD CONSTRAINT v3_compact_receipt_no_snapshot
 CHECK(request_fingerprint IS NULL OR NOT (payload ? 'progress'));

-- Numeric normalisation preserves jsonb equality (1, 1.0 and 1.00 are equal).
-- Object keys are canonicalised by jsonb; array order and nulls remain meaningful.
CREATE FUNCTION public.v3_receipt_normalize(p jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE STRICT SET search_path='' AS $normal$
BEGIN
 CASE jsonb_typeof(p)
 WHEN 'number' THEN RETURN to_jsonb(trim_scale((p#>>'{}')::numeric));
 WHEN 'object' THEN RETURN coalesce((SELECT jsonb_object_agg(k,public.v3_receipt_normalize(v)) FROM jsonb_each(p) e(k,v)),'{}'::jsonb);
 WHEN 'array' THEN RETURN coalesce((SELECT jsonb_agg(public.v3_receipt_normalize(v) ORDER BY ord) FROM jsonb_array_elements(p) WITH ORDINALITY e(v,ord)),'[]'::jsonb);
 ELSE RETURN p;
 END CASE;
END $normal$;
REVOKE ALL ON FUNCTION public.v3_receipt_normalize(jsonb) FROM public,anon,authenticated,service_role;

-- Also cover an old RPC invocation already in flight at the migration boundary.
-- Legacy rows are untouched; only future inserts pass through this guard.
CREATE FUNCTION public.v3_compact_receipt_insert() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $insert$
BEGIN
 IF NEW.request_fingerprint IS NULL THEN
  NEW.request_fingerprint:=extensions.digest(convert_to(public.v3_receipt_normalize(NEW.payload)::text,'UTF8'),'sha256');
  NEW.payload:=jsonb_build_object('requestId',NEW.request_id)||case NEW.operation
   when 'save' then jsonb_build_object('revision',NEW.payload->'revision')
   when 'buy' then jsonb_build_object('item',NEW.payload->'item')
   when 'active' then jsonb_build_object('seconds',NEW.payload->'seconds')
   else jsonb_build_object('amount',NEW.payload->'amount') end;
 END IF;
 RETURN NEW;
END $insert$;
REVOKE ALL ON FUNCTION public.v3_compact_receipt_insert() FROM public,anon,authenticated,service_role;
CREATE TRIGGER v3_compact_receipts_insert BEFORE INSERT ON public.v3_transactions
 FOR EACH ROW EXECUTE FUNCTION public.v3_compact_receipt_insert();

create or replace function public.v3_request(p_token text,p_operation text,p_args jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare r jsonb:=public.v3_role(); c uuid:=(r->>'child')::uuid; w public.v3_wallet; pr public.v3_progress;
 old public.v3_transactions; req uuid; result jsonb; price integer; amt numeric; secs numeric; clean jsonb; fingerprint bytea; receipt_payload jsonb;
begin
 if not exists(select 1 from public.v3_unlocks u join public.v3_pins p on p.user_id=u.user_id and p.generation=u.generation
 where u.token_hash=extensions.digest(p_token,'sha256') and u.user_id=auth.uid() and u.expires_at>now())
 then raise exception 'Unlock required'; end if;
 if p_operation='lock' then delete from public.v3_unlocks where token_hash=extensions.digest(p_token,'sha256'); return '{"ok":true}'; end if;
 -- Serialize ALL writes per learner; transaction retries and revisions share this lock.
 insert into public.v3_wallet(child_user_id) values(c) on conflict do nothing;
 select * into w from public.v3_wallet where child_user_id=c for update;
 insert into public.v3_progress(child_user_id) values(c) on conflict do nothing;
 select * into pr from public.v3_progress where child_user_id=c;
 if p_operation='read' then
 return jsonb_build_object('revision',pr.revision,'progress',pr.progress,'updatedAt',pr.updated_at,'wallet',to_jsonb(w)-'child_user_id','role',r->>'role');
 end if;
 if p_operation not in ('save','award','redeem','confirm_offline','buy','active') then raise exception 'Unknown operation'; end if;
 if p_operation in ('award','redeem','confirm_offline') and r->>'role'<>'parent' then raise exception 'Parent account required'; end if;
 if p_operation in ('save','buy','active') and r->>'role'<>'learner' then raise exception 'Learner account required'; end if;
 req:=(p_args->>'requestId')::uuid;
 if req is null then raise exception 'Stable request ID required'; end if;
 fingerprint:=extensions.digest(convert_to(public.v3_receipt_normalize(p_args)::text,'UTF8'),'sha256');
 select * into old from public.v3_transactions where child_user_id=c and request_id=req;
 if found then
 if old.operation<>p_operation or
 (old.request_fingerprint is null and old.payload<>p_args) or
 (old.request_fingerprint is not null and old.request_fingerprint<>fingerprint) then raise exception 'Request ID reused with different contents'; end if;
 return old.result; end if;
 if p_operation='save' then
 if (p_args->>'revision')::bigint is distinct from pr.revision then
 return jsonb_build_object('conflict',true,'revision',pr.revision,'progress',pr.progress); end if;
 clean:=p_args->'progress';
 if jsonb_typeof(clean) is distinct from 'object' or octet_length(clean::text)>2000000 then raise exception 'Invalid progress'; end if;
 -- Preserve V2 fields and unknown future fields. The wallet is never taken from client snapshots.
 update public.v3_progress set progress=clean,revision=revision+1,updated_at=now() where child_user_id=c returning * into pr;
 result:=jsonb_build_object('revision',pr.revision);
 elsif p_operation in ('award','redeem','confirm_offline') then
 amt:=(p_args->>'amount')::numeric;
 if amt is null or amt<1 or amt>60 or amt<>trunc(amt) then raise exception 'Amount must be a whole number from 1 to 60'; end if;
 if p_operation='award' then update public.v3_wallet set bonus=bonus+amt where child_user_id=c;
 elsif p_operation='confirm_offline' then
 -- Offline reward reconciliation requires an explicit parent review. Never a learner privilege.
 if coalesce(pr.progress->>'minutes','0') !~ '^[0-9]+([.][0-9]+)?$'
 or coalesce((pr.progress->>'minutes')::numeric,0)*60-w.active_seconds<amt*60
 then raise exception 'Not enough uncredited reported learning time'; end if;
 update public.v3_wallet set active_seconds=active_seconds+amt*60,coins=coins+amt*10 where child_user_id=c;
 else
 if w.active_seconds/60-w.redeemed<amt then raise exception 'Not enough earned screen time'; end if;
 update public.v3_wallet set redeemed=redeemed+amt where child_user_id=c;
 end if;
 elsif p_operation='buy' then
 select cost into price from public.v3_catalog where item_id=p_args->>'item';
 if price is null then raise exception 'Unknown item'; end if;
 if w.owned ? (p_args->>'item') then raise exception 'Already owned'; end if;
 if w.coins+w.bonus<price then raise exception 'Not enough coins'; end if;
 update public.v3_wallet set coins=greatest(0,coins-price),bonus=bonus-greatest(0,price-coins),
 owned=owned||jsonb_build_array(p_args->>'item') where child_user_id=c;
 elsif p_operation='active' then
 -- Shared server clock caps concurrent devices. Offline time stays learning evidence, never minted as money.
 secs:=least(15,greatest(0,extract(epoch from clock_timestamp()-w.last_active)),greatest(0,coalesce((p_args->>'seconds')::numeric,0)));
 update public.v3_wallet set active_seconds=active_seconds+secs,coins=coins+secs/6,last_active=greatest(last_active,clock_timestamp()) where child_user_id=c;
 end if;
 if result is null then select jsonb_build_object('wallet',to_jsonb(t)-'child_user_id') into result from public.v3_wallet t where child_user_id=c; end if;
 -- Never retain caller-supplied progress or arbitrary extra fields in new receipts.
 receipt_payload:=jsonb_build_object('requestId',req)||case p_operation
 when 'save' then jsonb_build_object('revision',p_args->'revision')
 when 'buy' then jsonb_build_object('item',p_args->'item')
 when 'active' then jsonb_build_object('seconds',p_args->'seconds')
 else jsonb_build_object('amount',p_args->'amount') end;
 insert into public.v3_transactions(child_user_id,request_id,operation,payload,result,request_fingerprint)
 values(c,req,p_operation,receipt_payload,result,fingerprint);
 return result;
end $$;

create or replace function public.v3_identity() returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('name',name,'projectRef',project_ref,'saveReceiptVersion',1) from public.v3_environment;
$$;

-- CREATE OR REPLACE retains existing grants, owner and security context.
-- No data cleanup, retention job, permission widening or Auth changes.
COMMIT;
