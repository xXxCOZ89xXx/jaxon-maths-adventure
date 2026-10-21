-- STAGING ONLY: sfogrvedypgtxfvecmbx; owner verifies dashboard ref first.
-- New SQL Editor query, postgres role; run the WHOLE file, share only six rows.
-- Reference: staging 001/003 at branch head 8cf12fc; baseline literals contain repository code only.
-- Catalogs only. No application routines invoked and no account/data tables read.
-- Baseline source below is a quoted comparison value, NEVER executed.
-- PASS means equivalent to the legacy staging baseline, NOT V5.2 security approval.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '15s';
WITH expected(ord,sig,definer,lang,argnames,body) AS (VALUES
 (1,'public.v3_identity()',true,'sql',NULL::text[],$baseline$
 select jsonb_build_object('name',name,'projectRef',project_ref) from public.v3_environment;
$baseline$),
 (2,'public.v3_role()',true,'plpgsql',NULL::text[],$baseline$
declare u uuid:=auth.uid(); c uuid; r text;
begin
 if u is null then raise exception 'Account sign-in required'; end if;
 -- Ambiguous or mixed-role identities fail closed. Multi-child selection is explicit future work.
 if (select count(*) from public.maths_families where parent_user_id=u or child_user_id=u)<>1
 then raise exception 'One unambiguous linked family required'; end if;
 select child_user_id,case when parent_user_id=u then 'parent' else 'learner' end into c,r
 from public.maths_families where parent_user_id=u or child_user_id=u;
 return jsonb_build_object('role',r,'child',c,'user',u,'pinSet',exists(select 1 from public.v3_pins where user_id=u));
end $baseline$),
 (3,'public.v3_set_pin(text)',true,'plpgsql',ARRAY['p_pin']::text[],$baseline$
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
end $baseline$),
 (4,'public.v3_unlock(text)',true,'plpgsql',ARRAY['p_pin']::text[],$baseline$
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
end $baseline$),
 (5,'public.v3_request(text,text,jsonb)',true,'plpgsql',ARRAY['p_token','p_operation','p_args']::text[],$baseline$
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
end $baseline$),
 (6,'public.v3_admin_import(uuid,jsonb)',false,'plpgsql',ARRAY['p_child','p_progress']::text[],$baseline$
declare oldcoins numeric; oldearned numeric; oldminutes numeric; items jsonb;
begin
 if not exists(select 1 from public.v3_environment where name='jaxon-maths-v3-staging')
 then raise exception 'Staging identity missing'; end if;
 if not exists(select 1 from public.maths_families where child_user_id=p_child)
 then raise exception 'Linked synthetic learner required'; end if;
 if exists(select 1 from public.v3_progress where child_user_id=p_child) or exists(select 1 from public.v3_wallet where child_user_id=p_child)
 then raise exception 'Import is allowed only before the first V3 read; existing data is never overwritten'; end if;
 if jsonb_typeof(p_progress) is distinct from 'object' then raise exception 'Invalid fixture'; end if;
 oldcoins:=coalesce((p_progress->>'coins')::numeric,0);oldearned:=coalesce((p_progress->>'earned')::numeric,0);oldminutes:=coalesce((p_progress->>'minutes')::numeric,0);
 items:=coalesce(p_progress->'bought','[]');
 if oldcoins<0 or oldearned<0 or oldminutes<0 or oldcoins::text in ('NaN','Infinity') or oldminutes::text in ('NaN','Infinity') or jsonb_typeof(items)<>'array'
 then raise exception 'Review invalid balances or ownership first'; end if;
 insert into public.v3_progress(child_user_id,progress) values(p_child,p_progress);
 insert into public.v3_wallet(child_user_id,coins,active_seconds,owned) values(p_child,oldcoins,oldminutes*60,items);
end $baseline$)
),
actual AS (
 SELECT e.*, p.oid, p.prosrc, p.prosecdef, p.proowner, p.proconfig,
   l.lanname,
   p.prorettype=to_regtype(CASE WHEN e.ord=6 THEN 'void' ELSE 'jsonb' END) AS returns_match,
   p.prokind='f' AND NOT p.proretset AND NOT p.proisstrict AND NOT p.proleakproof
   AND p.provariadic=0 AND p.provolatile='v' AND p.proparallel='u'
   AND p.proallargtypes IS NULL AND p.prosqlbody IS NULL AND p.probin IS NULL AND p.prosupport=0
   AND p.proargnames IS NOT DISTINCT FROM e.argnames
   AND CASE WHEN e.ord=5 THEN p.pronargdefaults=1
        AND pg_get_expr(p.proargdefaults,0)=$default$'{}'::jsonb$default$
       ELSE p.pronargdefaults=0 AND p.proargdefaults IS NULL END AS bindings_match,
   p.proowner=(SELECT oid FROM pg_roles WHERE rolname='postgres') AS owner_match,
   coalesce(p.proconfig @> ARRAY['search_path=""'],false) AS old_exact_path_match,
   (SELECT count(*) FROM unnest(p.proconfig) v WHERE v LIKE 'search_path=%')=1
   AND EXISTS (SELECT 1 FROM unnest(p.proconfig) v
               WHERE v IN ('search_path=','search_path=""')) AS empty_path,
   (SELECT count(*) FROM unnest(p.proconfig) v WHERE v NOT LIKE 'search_path=%') AS other_settings,
   coalesce((SELECT bool_or(x.grantee=0 AND x.privilege_type='EXECUTE')
     FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x),false) AS public_exec,
   has_function_privilege(to_regrole('anon'),p.oid,'EXECUTE') AS anon_exec,
   has_function_privilege(to_regrole('authenticated'),p.oid,'EXECUTE') AS authenticated_exec,
   has_function_privilege(to_regrole('service_role'),p.oid,'EXECUTE') AS service_exec
 FROM expected e LEFT JOIN pg_proc p ON p.oid=to_regprocedure(e.sig)
 LEFT JOIN pg_language l ON l.oid=p.prolang
),
sources AS (
 SELECT ord,'expected' AS kind,body AS src FROM actual
 UNION ALL SELECT ord,'actual',prosrc FROM actual
),
-- Conservative lexical comparison only. Quoted literals/identifiers and token
-- boundaries are retained; unquoted identifier case, whitespace and -- comments
-- may differ. Backslashes, block comments and dollar quoting are NOT normalized:
-- they force REVIEW unless the complete raw source already matches.
-- The reviewed baseline has no adjacent string literals needing newline joining.
tokens AS (
 SELECT s.*, lex.supported, t.canonical,
        t.reconstructed IS NOT DISTINCT FROM s.src AS covered
 FROM sources s
 CROSS JOIN LATERAL (
  SELECT s.src IS NOT NULL AND strpos(s.src,chr(92))=0 AND strpos(s.src,'/*')=0
    AND s.src !~ $unsupported$\$([A-Za-z_][A-Za-z_0-9]*)?\$$unsupported$
    AND current_setting('standard_conforming_strings')='on' AS supported
 ) lex
 CROSS JOIN LATERAL (
  SELECT array_agg(
    CASE WHEN m[1] ~ '^[A-Za-z_][A-Za-z_0-9$]*$' THEN lower(m[1]) ELSE m[1] END
    ORDER BY n) FILTER (WHERE m[1] !~ '^[[:space:]]+$' AND left(m[1],2)<>'--') AS canonical,
    string_agg(m[1],'' ORDER BY n) AS reconstructed
  FROM regexp_matches(s.src,
    $lex$('(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\r\n]*|[[:space:]]+|[A-Za-z_][A-Za-z_0-9$]*|[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?|[-+*/<>=~!@#%^&|`?:]+|.)$lex$,
    'g') WITH ORDINALITY AS r(m,n)
 ) t
),
comparison AS (
 SELECT a.*,
   CASE WHEN a.oid IS NULL THEN 'MISSING'
        WHEN a.prosrc=a.body THEN 'EXACT'
        WHEN e.supported AND v.supported AND e.covered AND v.covered
         AND e.canonical=v.canonical THEN 'FORMATTING_ONLY'
        ELSE 'REVIEW_BODY' END AS body_result,
   coalesce(NOT a.public_exec
     AND a.anon_exec=(a.ord=1)
     AND a.authenticated_exec=(a.ord<>6)
     AND (a.ord<>6 OR NOT a.service_exec),false) AS access_match
 FROM actual a JOIN tokens e ON e.ord=a.ord AND e.kind='expected'
 JOIN tokens v ON v.ord=a.ord AND v.kind='actual'
)
SELECT sig AS "Routine",
 CASE WHEN oid IS NULL THEN 'FAIL'
      WHEN NOT empty_path OR prosecdef IS DISTINCT FROM definer OR public_exec
        OR (ord<>1 AND anon_exec) OR (ord=6 AND (authenticated_exec OR service_exec)) THEN 'FAIL'
      WHEN body_result IN ('EXACT','FORMATTING_ONLY')
       AND lanname=lang AND returns_match AND bindings_match AND owner_match
       AND other_settings=0 AND access_match THEN 'PASS'
      ELSE 'REVIEW' END AS "Result",
 body_result AS "Body comparison",
 CASE WHEN empty_path AND old_exact_path_match THEN 'EMPTY_ORIGINAL_FORM'
      WHEN empty_path THEN 'EMPTY_EQUIVALENT_FORM'
      ELSE 'ABSENT_NONEMPTY_OR_MULTIPLE' END AS "Search path",
 jsonb_build_object('definer_matches',prosecdef IS NOT DISTINCT FROM definer,
  'language_matches',lanname IS NOT DISTINCT FROM lang,
  'return_matches',returns_match,'bindings_matches',bindings_match,
  'owner_is_postgres',owner_match,'other_setting_count',other_settings) AS "Attributes",
 jsonb_build_object('PUBLIC',public_exec,'anon',anon_exec,
  'authenticated',authenticated_exec,'service_role',service_exec) AS "Execute access"
FROM comparison ORDER BY ord;
ROLLBACK;
