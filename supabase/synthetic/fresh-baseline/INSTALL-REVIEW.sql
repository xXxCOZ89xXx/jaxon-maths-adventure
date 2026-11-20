-- REVIEW BEFORE OWNER-RUN INSTALLATION. Target: vyxvemtevkxlwqzelghj ONLY.
-- Not a live migration. No users, family links, credentials or progress are created.
-- SQL-editor project selection must be verified by the owner; a session flag does not prove physical hosting identity.
BEGIN;
SET LOCAL search_path='';
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='60s';
SELECT pg_advisory_xact_lock(hashtextextended('esa-synthetic-fresh-baseline',0));
DO $fresh$
DECLARE unexpected boolean; occupied boolean; storage_table text;
BEGIN
 IF current_user<>'postgres'
 OR current_setting('app.synthetic_fresh_install_reviewed',true) IS DISTINCT FROM 'yes'
 OR current_setting('app.synthetic_dashboard_ref',true) IS DISTINCT FROM 'vyxvemtevkxlwqzelghj'
 THEN RAISE EXCEPTION 'Owner review and exact separate dashboard target required'; END IF;
 IF to_regnamespace('esa_test_private') IS NOT NULL THEN RAISE EXCEPTION 'Already installed: inspect, never rerun'; END IF;
 IF to_regclass('auth.users') IS NULL OR to_regclass('auth.identities') IS NULL
 OR to_regprocedure('auth.uid()') IS NULL OR to_regprocedure('auth.jwt()') IS NULL
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon')
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated')
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role')
 THEN RAISE EXCEPTION 'Managed Auth baseline missing; do not create substitute Auth objects'; END IF;
 LOCK TABLE auth.users,auth.identities IN SHARE MODE;
 IF EXISTS(SELECT 1 FROM auth.users) OR EXISTS(SELECT 1 FROM auth.identities)
 THEN RAISE EXCEPTION 'Empty project required; existing Auth records preserved'; END IF;
 -- Storage is not cloned or certified by this installer. Refuse existing buckets/uploads.
 FOREACH storage_table IN ARRAY ARRAY['storage.buckets','storage.objects'] LOOP
 IF to_regclass(storage_table) IS NOT NULL THEN
 EXECUTE format('LOCK TABLE %s IN SHARE MODE',storage_table);
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s LIMIT 1)',storage_table) INTO occupied;
 IF occupied THEN RAISE EXCEPTION 'Empty project required; existing Storage records preserved'; END IF;
 END IF;
 END LOOP;
 -- Refuse even empty application relations/functions/types, not just known V3 names.
 SELECT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d
 WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e'))
 OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d
 WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e'))
 OR EXISTS(SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
 WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d
 WHERE d.classid='pg_type'::regclass AND d.objid=t.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e'))
 INTO unexpected;
 IF unexpected THEN RAISE EXCEPTION 'Empty application schema required; all existing objects preserved'; END IF;
 IF EXISTS(SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace
 WHERE e.extname='pgcrypto' AND n.nspname<>'extensions')
 THEN RAISE EXCEPTION 'Review pgcrypto schema; do not move existing extensions'; END IF;
END $fresh$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC,anon,authenticated,service_role;
SELECT set_config('app.v3.staging_authorized','yes',true),
 set_config('app.v3.staging_ref','vyxvemtevkxlwqzelghj',true);
-- STAGING ONLY. Requires manual project verification and explicit authorisation.
-- This file is never applied by the application or GitHub Actions to a remote DB.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
do $$ begin
 if current_setting('app.v3.staging_authorized',true) is distinct from 'yes'
 or coalesce(current_setting('app.v3.staging_ref',true),'') !~ '^[a-z]{20}$'
 then raise exception 'Verify and authorise the separate staging project first'; end if;
end $$;
create table public.v3_environment(name text primary key, project_ref text not null);
insert into public.v3_environment values ('jaxon-maths-v3-staging',current_setting('app.v3.staging_ref'));
create table if not exists public.maths_families (
 child_user_id uuid primary key references auth.users(id),
 parent_user_id uuid not null references auth.users(id),
 check(child_user_id<>parent_user_id)
);
create table public.v3_pins(user_id uuid primary key references auth.users(id), hash text not null,
 attempts integer not null default 0, blocked_until timestamptz, generation integer not null default 1);
create table public.v3_unlocks(token_hash bytea primary key,user_id uuid not null references auth.users(id),
 generation integer not null,expires_at timestamptz not null);
create table public.v3_progress(child_user_id uuid primary key references auth.users(id),
 revision bigint not null default 0,progress jsonb not null default '{}',updated_at timestamptz not null default now(),
 check(jsonb_typeof(progress)='object'));
create table public.v3_wallet(child_user_id uuid primary key references auth.users(id),
 coins numeric not null default 0 check(coins>=0), bonus numeric not null default 0 check(bonus>=0),
 active_seconds numeric not null default 0 check(active_seconds>=0), redeemed numeric not null default 0 check(redeemed>=0),
 last_active timestamptz not null default now(), owned jsonb not null default '[]');
create table public.v3_catalog(item_id text primary key,cost integer not null check(cost>0));
create table public.v3_transactions(child_user_id uuid not null references auth.users(id),request_id uuid not null,
 operation text not null,payload jsonb not null,result jsonb not null,created_at timestamptz not null default now(),
 primary key(child_user_id,request_id));
-- No client gets direct access to sensitive tables, even with an authenticated JWT.
do $$ declare t text; begin
 foreach t in array array['v3_environment','maths_families','v3_pins','v3_unlocks','v3_progress','v3_wallet','v3_catalog','v3_transactions'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 end loop;
end $$;
create function public.v3_identity() returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('name',name,'projectRef',project_ref) from public.v3_environment;
$$;
create function public.v3_role() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c uuid; r text;
begin
 if u is null then raise exception 'Account sign-in required'; end if;
 -- Ambiguous or mixed-role identities fail closed. Multi-child selection is explicit future work.
 if (select count(*) from public.maths_families where parent_user_id=u or child_user_id=u)<>1
 then raise exception 'One unambiguous linked family required'; end if;
 select child_user_id,case when parent_user_id=u then 'parent' else 'learner' end into c,r
 from public.maths_families where parent_user_id=u or child_user_id=u;
 return jsonb_build_object('role',r,'child',c,'user',u,'pinSet',exists(select 1 from public.v3_pins where user_id=u));
end $$;
create function public.v3_set_pin(p_pin text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb:=public.v3_role(); recent boolean;
begin
 select exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) m
 where m->>'method'='password' and (m->>'timestamp')::bigint > extract(epoch from now())-300) into recent;
 if not recent then raise exception 'Sign in again with your account password before setting or recovering a PIN'; end if;
 if p_pin is null or p_pin !~ (case when r->>'role'='parent' then '^[0-9]{6}$' else '^[0-9]{4}$' end)
 then raise exception 'PIN length does not match account role'; end if;
 insert into public.v3_pins(user_id,hash) values(auth.uid(),extensions.crypt(p_pin,extensions.gen_salt('bf',10)))
 on conflict(user_id) do update set hash=excluded.hash,attempts=0,blocked_until=null,generation=public.v3_pins.generation+1;
 delete from public.v3_unlocks where user_id=auth.uid();
 return jsonb_build_object('ok',true);
end $$;
create function public.v3_unlock(p_pin text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb:=public.v3_role(); p public.v3_pins; tok text; expiry timestamptz;
begin
 select * into p from public.v3_pins where user_id=auth.uid() for update;
 if not found then return jsonb_build_object('error','Set your PIN after signing in with your account password'); end if;
 if p.blocked_until>now() then return jsonb_build_object('error','Too many attempts. Wait five minutes before trying again'); end if;
 if p_pin is null or length(p_pin)>6 or extensions.crypt(p_pin,p.hash)<>p.hash then
 update public.v3_pins set attempts=case when blocked_until<=now() then 1 else attempts+1 end,
 blocked_until=case when (case when blocked_until<=now() then 1 else attempts+1 end)>=5 then now()+interval '5 minutes' else null end where user_id=auth.uid();
 return jsonb_build_object('error','PIN was not recognised. You can try again or recover using your account password');
 end if;
 update public.v3_pins set attempts=0,blocked_until=null where user_id=auth.uid();
 tok:=encode(extensions.gen_random_bytes(32),'hex');
 expiry:=now()+case when r->>'role'='parent' then interval '15 minutes' else interval '12 hours' end;
 delete from public.v3_unlocks where expires_at<now();
 insert into public.v3_unlocks values(extensions.digest(tok,'sha256'),auth.uid(),p.generation,expiry);
 return r||jsonb_build_object('token',tok,'expires',expiry);
end $$;
create function public.v3_request(p_token text,p_operation text,p_args jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare r jsonb:=public.v3_role(); c uuid:=(r->>'child')::uuid; w public.v3_wallet; pr public.v3_progress;
 old public.v3_transactions; req uuid; result jsonb; price integer; amt numeric; secs numeric; clean jsonb;
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
 select * into old from public.v3_transactions where child_user_id=c and request_id=req;
 if found then
 if old.operation<>p_operation or old.payload<>p_args then raise exception 'Request ID reused with different contents'; end if;
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
 insert into public.v3_transactions(child_user_id,request_id,operation,payload,result) values(c,req,p_operation,p_args,result);
 return result;
end $$;
revoke all on function public.v3_identity(),public.v3_role(),public.v3_set_pin(text),public.v3_unlock(text),public.v3_request(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.v3_identity() to anon,authenticated;
grant execute on function public.v3_role(),public.v3_set_pin(text),public.v3_unlock(text),public.v3_request(text,text,jsonb) to authenticated;


-- STAGING ONLY; apply after 001. Prices match the preserved 40-item catalog.

insert into public.v3_catalog(item_id,cost) values
('helmet',100),
('cap',45),
('crown',450),
('wizardhat',240),
('hardhat',110),
('headphones',160),
('tophat',180),
('jacket',150),
('hoodie',90),
('armour',420),
('suit',220),
('cape',300),
('spacesuit',520),
('ninja',330),
('wings',250),
('jetpack',550),
('rucksack',100),
('shield',230),
('parachute',210),
('dragon',650),
('glasses',70),
('medal',120),
('watch',100),
('scarf',85),
('gloves',75),
('sword',190),
('wand',210),
('fox',320),
('dog',280),
('cat',230),
('frog',180),
('robot',450),
('axolotl',380),
('bee',160),
('forestbg',140),
('desertbg',160),
('spacebg',310),
('castlebg',230),
('mountainbg',240),
('neonbg',350);


-- OWNER-RUN ONLY after review. Target: vyxvemtevkxlwqzelghj. Never run by the build.
-- Additive migration: no existing progress, wallets, PINs or transaction rows are changed.
-- Old clients remain compatible. Do not restore the old RPC after compact receipts exist.

SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $guard$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.v3_environment WHERE name='jaxon-maths-v3-staging' AND project_ref='vyxvemtevkxlwqzelghj')
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


SELECT set_config('app.base_camp_reset_reviewed','yes',true);
-- REVIEW DRAFT ONLY. No reset is executed by this installation.
-- Apply only in a separately reviewed release step. Tests use disposable local PostgreSQL.

DO $$ BEGIN
 IF current_user <> 'postgres' OR current_setting('app.base_camp_reset_reviewed',true) IS DISTINCT FROM 'yes'
 THEN RAISE EXCEPTION 'Explicit parent reset migration review required'; END IF;
 IF to_regprocedure('public.v3_request_before_game_reset(text,text,jsonb)') IS NOT NULL
 THEN RAISE EXCEPTION 'Reset upgrade already installed'; END IF;
 IF NOT (SELECT prosecdef AND proowner='postgres'::regrole AND proconfig=ARRAY['search_path=""'] FROM pg_proc WHERE oid='public.v3_request(text,text,jsonb)'::regprocedure)
 THEN RAISE EXCEPTION 'Reviewed secure request contract required'; END IF;
END $$;
ALTER TABLE public.v3_progress ADD COLUMN game_epoch bigint NOT NULL DEFAULT 0 CHECK(game_epoch BETWEEN 0 AND 9007199254740991);
CREATE TABLE public.v3_game_resets(
 child_user_id uuid NOT NULL REFERENCES auth.users(id), request_id uuid NOT NULL,
 parent_user_id uuid NOT NULL REFERENCES auth.users(id), old_epoch bigint NOT NULL,
 new_epoch bigint NOT NULL, revision bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(child_user_id,request_id));
CREATE TABLE public.v3_game_requests(
 child_user_id uuid NOT NULL REFERENCES auth.users(id), request_id uuid NOT NULL,
 game_epoch bigint NOT NULL, PRIMARY KEY(child_user_id,request_id));
ALTER TABLE public.v3_game_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v3_game_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.v3_game_resets,public.v3_game_requests FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.v3_request(text,text,jsonb) RENAME TO v3_request_before_game_reset;
REVOKE ALL ON FUNCTION public.v3_request_before_game_reset(text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.v3_request(p_token text,p_operation text,p_args jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r jsonb:=public.v3_role(); c uuid:=(r->>'child')::uuid; pr public.v3_progress;
 saved public.v3_game_resets; req uuid; result jsonb; prior_epoch bigint;
BEGIN
 -- Same lock order as the existing request: PIN, then learner wallet. Reset and all
 -- in-flight writes serialize, including requests that entered the old function.
 PERFORM 1 FROM public.v3_pins WHERE user_id=auth.uid() FOR SHARE;
 IF NOT EXISTS(SELECT 1 FROM public.v3_unlocks u JOIN public.v3_pins p ON p.user_id=u.user_id AND p.generation=u.generation
 WHERE u.token_hash=extensions.digest(p_token,'sha256') AND u.user_id=auth.uid() AND u.expires_at>now())
 THEN RAISE EXCEPTION 'Unlock required'; END IF;
 -- Preserve staging's existing first-read initialization, without changing
 -- production's reviewed account-opening requirement or touching existing rows.
 IF EXISTS(SELECT 1 FROM public.v3_environment WHERE name='jaxon-maths-v3-staging') THEN
  IF NOT EXISTS(SELECT 1 FROM public.v3_wallet WHERE child_user_id=c) THEN
   INSERT INTO public.v3_wallet(child_user_id) VALUES(c) ON CONFLICT DO NOTHING;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.v3_progress WHERE child_user_id=c) THEN
   INSERT INTO public.v3_progress(child_user_id) VALUES(c) ON CONFLICT DO NOTHING;
  END IF;
 END IF;
 PERFORM 1 FROM public.v3_wallet WHERE child_user_id=c FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account opening review required'; END IF;
 SELECT * INTO STRICT pr FROM public.v3_progress WHERE child_user_id=c FOR UPDATE;
 IF p_operation='read' THEN
  -- The staging delegate does INSERT ON CONFLICT even for reads; fence those
  -- no-op inserts with the verified current generation too.
  PERFORM set_config('app.game_request_epoch',pr.game_epoch::text,true);
  RETURN public.v3_request_before_game_reset(p_token,p_operation,p_args)||jsonb_build_object('gameEpoch',pr.game_epoch,'gameResetVersion',1);
 END IF;
 IF p_operation='lock' THEN RETURN public.v3_request_before_game_reset(p_token,p_operation,p_args); END IF;
 IF jsonb_typeof(p_args) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid operation arguments'; END IF;
 req:=(p_args->>'requestId')::uuid;
 IF req IS NULL THEN RAISE EXCEPTION 'Stable request ID required'; END IF;
 IF p_operation='reset_game' THEN
  IF r->>'role'<>'parent' THEN RAISE EXCEPTION 'Parent account required'; END IF;
  IF p_args->>'confirmation' IS DISTINCT FROM 'RESET ALL GAME PROGRESS'
   OR (p_args-array['requestId','gameEpoch','revision','confirmation'])<>'{}'::jsonb
  THEN RAISE EXCEPTION 'Explicit total game reset confirmation required'; END IF;
  SELECT * INTO saved FROM public.v3_game_resets WHERE child_user_id=c AND request_id=req;
  IF FOUND THEN
   IF saved.parent_user_id<>auth.uid() OR saved.old_epoch IS DISTINCT FROM (p_args->>'gameEpoch')::bigint
     OR saved.revision-1 IS DISTINCT FROM (p_args->>'revision')::bigint THEN RAISE EXCEPTION 'Reset request ID reused'; END IF;
   -- Retry acknowledges the original reset; it never clears any new progress.
   RETURN jsonb_build_object('reset',true,'gameEpoch',saved.new_epoch,'revision',saved.revision);
  END IF;
  IF EXISTS(SELECT 1 FROM public.v3_transactions WHERE child_user_id=c AND request_id=req)
  THEN RAISE EXCEPTION 'Reset request ID reused'; END IF;
  IF (p_args->>'gameEpoch')::bigint IS DISTINCT FROM pr.game_epoch OR (p_args->>'revision')::bigint IS DISTINCT FROM pr.revision
  THEN RAISE EXCEPTION 'Game changed; refresh and confirm the reset again'; END IF;
  PERFORM set_config('app.game_request_epoch',(pr.game_epoch+1)::text,true);
  UPDATE public.v3_progress SET progress='{}',revision=revision+1,game_epoch=game_epoch+1,updated_at=now() WHERE child_user_id=c RETURNING * INTO pr;
  UPDATE public.v3_wallet SET coins=0,bonus=0,owned='[]',active_seconds=0,redeemed=0,last_active=clock_timestamp() WHERE child_user_id=c;
  -- Production has reviewed historical entitlement fields; staging does not.
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='v3_wallet' AND column_name='opening_seconds') THEN
   EXECUTE 'UPDATE public.v3_wallet SET opening_seconds=0,legacy_redeemed=0 WHERE child_user_id=$1' USING c;
  END IF;
  DELETE FROM public.v3_unlocks WHERE user_id=c;
  INSERT INTO public.v3_game_resets VALUES(c,req,auth.uid(),pr.game_epoch-1,pr.game_epoch,pr.revision,now());
  RETURN jsonb_build_object('reset',true,'gameEpoch',pr.game_epoch,'revision',pr.revision);
 END IF;
 -- Legacy clients work before the first deliberate reset. Afterwards they must
 -- upgrade; no revision conflict, retry receipt or local-choice merge bypasses this.
 IF coalesce((p_args->>'gameEpoch')::bigint,0)<>pr.game_epoch THEN RAISE EXCEPTION 'GAME_RESET_REQUIRED'; END IF;
 SELECT game_epoch INTO prior_epoch FROM public.v3_game_requests WHERE child_user_id=c AND request_id=req;
 IF (FOUND AND prior_epoch<>pr.game_epoch) OR (pr.game_epoch>0 AND prior_epoch IS NULL AND EXISTS(
   SELECT 1 FROM public.v3_transactions WHERE child_user_id=c AND request_id=req))
 THEN RAISE EXCEPTION 'GAME_RESET_REQUIRED'; END IF;
 IF EXISTS(SELECT 1 FROM public.v3_game_resets WHERE child_user_id=c AND request_id=req) THEN RAISE EXCEPTION 'Request ID reused'; END IF;
 PERFORM set_config('app.game_request_epoch',pr.game_epoch::text,true);
 result:=public.v3_request_before_game_reset(p_token,p_operation,p_args-'gameEpoch');
 INSERT INTO public.v3_game_requests VALUES(c,req,pr.game_epoch) ON CONFLICT DO NOTHING;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.v3_request(text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.v3_request(text,text,jsonb) TO authenticated;
-- Fence a legacy function invocation already in flight during installation/reset.
CREATE FUNCTION public.v3_game_epoch_write_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE epoch bigint;
BEGIN
 IF TG_TABLE_NAME='v3_progress' THEN epoch:=NEW.game_epoch;
 ELSE SELECT game_epoch INTO epoch FROM public.v3_progress WHERE child_user_id=NEW.child_user_id; END IF;
 IF epoch>0 AND current_setting('app.game_request_epoch',true) IS DISTINCT FROM epoch::text
 THEN RAISE EXCEPTION 'GAME_RESET_REQUIRED'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.v3_game_epoch_write_guard() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER v3_game_epoch_progress BEFORE INSERT OR UPDATE ON public.v3_progress FOR EACH ROW EXECUTE FUNCTION public.v3_game_epoch_write_guard();
CREATE TRIGGER v3_game_epoch_wallet BEFORE INSERT OR UPDATE ON public.v3_wallet FOR EACH ROW EXECUTE FUNCTION public.v3_game_epoch_write_guard();


-- Fresh definitions above are source-hash-pinned and installed in this transaction.
-- Fingerprints here bind the marker to those exact newly created functions, not unknown pre-existing RPCs.
SELECT set_config('app.synthetic_setup_reviewed','yes',true),
 set_config('app.synthetic_expected_project_ref','vyxvemtevkxlwqzelghj',true),
 set_config('app.synthetic_identity_sha256',encode(extensions.digest(convert_to(pg_get_functiondef('public.v3_identity()'::regprocedure),'UTF8'),'sha256'),'hex'),true),
 set_config('app.synthetic_request_sha256',encode(extensions.digest(convert_to(pg_get_functiondef('public.v3_request(text,text,jsonb)'::regprocedure),'UTF8'),'sha256'),'hex'),true);
-- REVIEW PACKAGE ONLY. Never install on the family/legacy live project.
-- Requires a separate EMPTY synthetic project and a separately reviewed installed baseline.
-- No accounts/records are copied or created. No environment rename is performed.

SET LOCAL search_path='';
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='15s';
DO $guard$
DECLARE expected text := current_setting('app.synthetic_expected_project_ref',true); app_table record; has_rows boolean;
BEGIN
 IF current_user<>'postgres' OR current_setting('app.synthetic_setup_reviewed',true) IS DISTINCT FROM 'yes'
 OR coalesce(expected,'')!~'^[a-z]{20}$' OR expected IN ('sfogrvedypgtxfvecmbx','mbdelspbjusarbwlltol')
 THEN RAISE EXCEPTION 'Reviewed separate synthetic project required'; END IF;
 IF (SELECT count(*) FROM public.v3_environment)<>1 OR NOT EXISTS
 (SELECT 1 FROM public.v3_environment WHERE project_ref=expected AND name='jaxon-maths-v3-staging')
 THEN RAISE EXCEPTION 'Synthetic project identity mismatch'; END IF;
 IF to_regnamespace('esa_test_private') IS NOT NULL OR to_regprocedure('public.v3_identity_before_synthetic()') IS NOT NULL
 THEN RAISE EXCEPTION 'Synthetic marker already exists; never rerun'; END IF;
 LOCK TABLE auth.users,auth.identities,public.maths_families,public.v3_pins,public.v3_unlocks,
 public.v3_progress,public.v3_wallet,public.v3_transactions,public.v3_game_resets,public.v3_game_requests IN SHARE MODE;
 -- Refuse any data-bearing or live-like environment, even if an operator supplies wrong flags.
 IF EXISTS(SELECT 1 FROM auth.users) OR EXISTS(SELECT 1 FROM auth.identities)
 OR EXISTS(SELECT 1 FROM public.maths_families) OR EXISTS(SELECT 1 FROM public.v3_pins)
 OR EXISTS(SELECT 1 FROM public.v3_unlocks) OR EXISTS(SELECT 1 FROM public.v3_progress)
 OR EXISTS(SELECT 1 FROM public.v3_wallet) OR EXISTS(SELECT 1 FROM public.v3_transactions)
 OR EXISTS(SELECT 1 FROM public.v3_game_resets) OR EXISTS(SELECT 1 FROM public.v3_game_requests)
 THEN RAISE EXCEPTION 'Empty synthetic environment required; existing records are preserved'; END IF;
 -- Also reject unrelated/legacy public records; do not rely only on known V3 names.
 FOR app_table IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname NOT IN ('v3_environment','v3_catalog')
 AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid
 AND d.refclassid='pg_extension'::regclass AND d.deptype='e') LOOP
   EXECUTE format('LOCK TABLE public.%I IN SHARE MODE',app_table.relname);
   EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I LIMIT 1)',app_table.relname) INTO has_rows;
   IF has_rows THEN RAISE EXCEPTION 'Empty synthetic environment required; unrelated records are preserved'; END IF;
 END LOOP;
 IF to_regprocedure('public.v3_request_before_game_reset(text,text,jsonb)') IS NULL
 OR NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.v3_progress'::regclass AND attname='game_epoch' AND NOT attisdropped)
 THEN RAISE EXCEPTION 'Reviewed reset baseline required'; END IF;
 IF EXISTS(SELECT 1 FROM (VALUES
 ('public.v3_identity()',current_setting('app.synthetic_identity_sha256',true)),
 ('public.v3_request(text,text,jsonb)',current_setting('app.synthetic_request_sha256',true))) e(sig,expected_hash)
 LEFT JOIN pg_proc p ON p.oid=to_regprocedure(e.sig)
 WHERE p.oid IS NULL OR coalesce(e.expected_hash,'')!~'^[a-f0-9]{64}$'
 OR NOT p.prosecdef OR p.proowner<>'postgres'::regrole OR p.proconfig IS DISTINCT FROM ARRAY['search_path=""']
 OR encode(extensions.digest(convert_to(pg_get_functiondef(p.oid),'UTF8'),'sha256'),'hex')<>e.expected_hash)
 THEN RAISE EXCEPTION 'Review exact synthetic baseline definitions before installing marker'; END IF;
 IF has_function_privilege('anon','public.v3_request(text,text,jsonb)','EXECUTE') OR
 EXISTS(SELECT 1 FROM (VALUES('anon'),('authenticated'),('service_role')) r(role)
 WHERE has_function_privilege(r.role,'public.v3_request_before_game_reset(text,text,jsonb)','EXECUTE'))
 THEN RAISE EXCEPTION 'Reviewed private RPC delegate grants required'; END IF;
 IF EXISTS(SELECT 1 FROM (VALUES('maths_families'),('v3_environment'),('v3_pins'),('v3_unlocks'),
 ('v3_progress'),('v3_wallet'),('v3_catalog'),('v3_transactions'),('v3_game_resets'),('v3_game_requests')) t(name)
 JOIN pg_class c ON c.oid=to_regclass('public.'||t.name) CROSS JOIN (VALUES('anon'),('authenticated')) r(role)
 WHERE NOT c.relrowsecurity OR has_table_privilege(r.role,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
 THEN RAISE EXCEPTION 'Reviewed table isolation required'; END IF;
 IF public.v3_identity()->>'saveReceiptVersion' IS DISTINCT FROM '1'
 THEN RAISE EXCEPTION 'Reviewed compact receipt baseline required'; END IF;
END $guard$;
CREATE SCHEMA esa_test_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA esa_test_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE esa_test_private.environment(singleton boolean PRIMARY KEY CHECK(singleton),
 project_ref text NOT NULL CHECK(project_ref ~ '^[a-z]{20}$' AND project_ref NOT IN ('sfogrvedypgtxfvecmbx','mbdelspbjusarbwlltol')));
ALTER TABLE esa_test_private.environment ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON esa_test_private.environment FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO esa_test_private.environment VALUES(true,current_setting('app.synthetic_expected_project_ref'));
ALTER FUNCTION public.v3_identity() RENAME TO v3_identity_before_synthetic;
REVOKE ALL ON FUNCTION public.v3_identity_before_synthetic() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.v3_identity() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT public.v3_identity_before_synthetic() || jsonb_build_object(
 'environmentKind','synthetic-test','syntheticOnly',true,'syntheticContractVersion',1)
 FROM esa_test_private.environment WHERE singleton;
$$;
REVOKE ALL ON FUNCTION public.v3_identity() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.v3_identity() TO anon,authenticated;


-- Supabase may grant browser/service roles via default privileges. Close every created object explicitly.
DO $grants$
DECLARE obj record;
BEGIN
 FOR obj IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e') LOOP
 EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC,anon,authenticated,service_role',obj.relname);
 END LOOP;
 FOR obj IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'v3_%' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',obj.sig);
 END LOOP;
END $grants$;
GRANT EXECUTE ON FUNCTION public.v3_identity() TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.v3_role(),public.v3_set_pin(text),public.v3_unlock(text),public.v3_request(text,text,jsonb) TO authenticated;
DO $verify$
BEGIN
 IF public.v3_identity()->>'projectRef' IS DISTINCT FROM 'vyxvemtevkxlwqzelghj'
 OR public.v3_identity()->>'environmentKind' IS DISTINCT FROM 'synthetic-test'
 OR public.v3_identity()->>'saveReceiptVersion' IS DISTINCT FROM '1'
 OR public.v3_identity()->>'syntheticOnly' IS DISTINCT FROM 'true'
 OR (SELECT count(*) FROM public.v3_catalog)<>40
 THEN RAISE EXCEPTION 'Fresh synthetic baseline postcondition failed'; END IF;
END $verify$;
COMMIT;
-- Aggregate public metadata only. Provider Auth/API acceptance is a separate step.
SELECT public.v3_identity() AS synthetic_identity;
