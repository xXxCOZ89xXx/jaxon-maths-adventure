-- PREPARED ONLY. Owner approval required. Staging sfogrvedypgtxfvecmbx only.
-- Never executed by builder/CI. Each phase is a complete error-stopping transaction.
begin;
set local search_path='';
set local lock_timeout='3s';
set local statement_timeout='30s';
select v52_staging_private.assert_target();
do $guard$ begin

 if (select state from v52_staging_private.control) is distinct from 'paused' then raise exception 'Pause phase required; never rerun'; end if;
 if exists(select 1 from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid()
 and backend_type='client backend' and state is distinct from 'idle') then raise exception 'Drain other database/API transactions before installation'; end if;
end $guard$;
lock table auth.users in share mode;
lock table public.maths_families,public.v3_environment,public.v3_pins,public.v3_unlocks,public.v3_progress,public.v3_wallet,public.v3_catalog,public.v3_transactions in access exclusive mode;
do $preflight$ begin
if exists(select 1 from (values('public.v3_identity()'),('public.v3_role()'),('public.v3_set_pin(text)'),('public.v3_unlock(text)'),('public.v3_request(text,text,jsonb)') ) f(sig)
 cross join (values('anon'),('authenticated'),('service_role')) r(role) where has_function_privilege(r.role,f.sig,'EXECUTE'))
 then raise exception 'Inherited RPC access remains; no broad role changes allowed'; end if;
 if exists(select 1 from pg_proc p where p.oid in ('public.v3_identity()'::regprocedure,'public.v3_role()'::regprocedure,'public.v3_set_pin(text)'::regprocedure,'public.v3_unlock(text)'::regprocedure,'public.v3_request(text,text,jsonb)'::regprocedure )
 and pg_get_functiondef(p.oid) is distinct from ((select previous from v52_staging_private.control)->(p.oid::regprocedure::text)->>'definition'))
 then raise exception 'Routine changed after pause'; end if;
 if (select count(*) from auth.users)<>4 or (select count(*) from public.maths_families)<>2
 or (select count(distinct child_user_id) from public.maths_families)<>2 or (select count(distinct parent_user_id) from public.maths_families)<>2
 or exists(select 1 from public.maths_families a join public.maths_families b on a.child_user_id=b.parent_user_id)
 then raise exception 'Preserved fictional account/family count mismatch'; end if;
 if (select count(*) from public.v3_pins)<>4
 or exists(select 1 from public.maths_families f left join public.v3_progress p using(child_user_id) left join public.v3_wallet w using(child_user_id)
 where p.child_user_id is null or w.child_user_id is null)
 then raise exception 'Existing PIN/progress/wallet coverage required; never auto-initialise'; end if;
 if exists(select 1 from public.v3_progress where revision<0 or revision>9007199254740991 or jsonb_typeof(progress) is distinct from 'object')
 or exists(select 1 from public.v3_wallet where coins::text in ('NaN','Infinity','-Infinity') or bonus::text in ('NaN','Infinity','-Infinity')
 or active_seconds::text in ('NaN','Infinity','-Infinity') or redeemed::text in ('NaN','Infinity','-Infinity')
 or coins<0 or bonus<0 or active_seconds<0 or redeemed<0 or jsonb_typeof(owned) is distinct from 'array')
 then raise exception 'Existing values require review; never repair or round'; end if;
 if exists(select 1 from public.v3_wallet w cross join lateral jsonb_array_elements(w.owned) i
 where jsonb_typeof(i)<>'string' or not exists(select 1 from public.v3_catalog c where c.item_id=i#>>'{}'))
 then raise exception 'Existing ownership requires review'; end if;
 if exists(select 1 from pg_class c where c.oid in ('public.maths_families'::regclass,'public.v3_environment'::regclass,'public.v3_pins'::regclass,'public.v3_unlocks'::regclass,'public.v3_progress'::regclass,'public.v3_wallet'::regclass,'public.v3_catalog'::regclass,'public.v3_transactions'::regclass ) and not c.relrowsecurity)
 then raise exception 'Protected staging table RLS required'; end if;
 if exists(select 1 from pg_class c cross join (values('anon'),('authenticated')) r(role)
 cross join (values('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) v(priv)
 where c.oid in ('public.maths_families'::regclass,'public.v3_environment'::regclass,'public.v3_pins'::regclass,'public.v3_unlocks'::regclass,'public.v3_progress'::regclass,'public.v3_wallet'::regclass,'public.v3_catalog'::regclass,'public.v3_transactions'::regclass ) and has_table_privilege(r.role,c.oid,v.priv))
 then raise exception 'Unexpected direct client table access'; end if;
 if exists(select 1 from pg_class c cross join (values('anon'),('authenticated')) r(role)
 cross join (values('SELECT'),('INSERT'),('UPDATE'),('REFERENCES')) v(priv)
 where c.oid in ('public.maths_families'::regclass,'public.v3_environment'::regclass,'public.v3_pins'::regclass,'public.v3_unlocks'::regclass,
 'public.v3_progress'::regclass,'public.v3_wallet'::regclass,'public.v3_catalog'::regclass,'public.v3_transactions'::regclass)
 and has_any_column_privilege(r.role,c.oid,v.priv)) then raise exception 'Unexpected direct client column access'; end if;

end $preflight$;
update v52_staging_private.control set before_digest=v52_staging_private.data_digest();
alter table public.v3_wallet add column opening_seconds numeric not null default 0 check(opening_seconds>=0),
 add column legacy_redeemed numeric not null default 0 check(legacy_redeemed>=0);
alter table public.v3_environment add column staging_upgrade_version integer not null default 1 check(staging_upgrade_version in (1,2));
create or replace function public.v3_identity() returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('name',name,'projectRef',project_ref,'stagingUpgradeVersion',staging_upgrade_version) from public.v3_environment;
$$;
create or replace function public.v3_set_pin(p_pin text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb:=public.v3_role(); recent boolean;
begin
 select exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) m
 where m->>'method'='password' and (m->>'timestamp')::numeric between extract(epoch from now())-300 and extract(epoch from now())+30) into recent;
 if not recent then raise exception 'Sign in again with your account password before setting or recovering a PIN'; end if;
 if p_pin is null or p_pin !~ (case when r->>'role'='parent' then '^[0-9]{6}$' else '^[0-9]{4}$' end)
 then raise exception 'PIN length does not match account role'; end if;
 insert into public.v3_pins(user_id,hash) values(auth.uid(),extensions.crypt(p_pin,extensions.gen_salt('bf',10)))
 on conflict(user_id) do update set hash=excluded.hash,attempts=0,blocked_until=null,generation=public.v3_pins.generation+1;
 delete from public.v3_unlocks where user_id=auth.uid();
 return jsonb_build_object('ok',true);
end $$;
create or replace function public.v3_unlock(p_pin text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb:=public.v3_role(); p public.v3_pins; tok text; expiry timestamptz;
begin
 select * into p from public.v3_pins where user_id=auth.uid() for update;
 if not found then return jsonb_build_object('error','Set your PIN after signing in with your account password'); end if;
 if p.blocked_until>now() then return jsonb_build_object('error','Too many attempts. Wait five minutes before trying again'); end if;
 if p_pin is null or p_pin !~ (case when r->>'role'='parent' then '^[0-9]{6}$' else '^[0-9]{4}$' end) or extensions.crypt(p_pin,p.hash)<>p.hash then
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
create or replace function public.v3_request(p_token text,p_operation text,p_args jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare r jsonb:=public.v3_role(); c uuid:=(r->>'child')::uuid; w public.v3_wallet; pr public.v3_progress;
 old public.v3_transactions; req uuid; result jsonb; price integer; amt numeric; secs numeric; clean jsonb;
begin
 perform 1 from public.v3_pins where user_id=auth.uid() for share;
 if not exists(select 1 from public.v3_unlocks u join public.v3_pins p on p.user_id=u.user_id and p.generation=u.generation
 where u.token_hash=extensions.digest(p_token,'sha256') and u.user_id=auth.uid() and u.expires_at>now())
 then raise exception 'Unlock required'; end if;
 if p_operation='lock' then delete from public.v3_unlocks where token_hash=extensions.digest(p_token,'sha256'); return '{"ok":true}'; end if;
 -- Serialize ALL writes per learner; transaction retries and revisions share this lock.
 select * into w from public.v3_wallet where child_user_id=c for update;
 if not found then raise exception 'Account opening review required'; end if;
 select * into pr from public.v3_progress where child_user_id=c;
 if not found then raise exception 'Account progress not prepared'; end if;
 if p_operation='read' then
 return jsonb_build_object('revision',pr.revision,'progress',pr.progress,'updatedAt',pr.updated_at,'wallet',to_jsonb(w)-'child_user_id','role',r->>'role');
 end if;
 if p_operation is null or p_operation not in ('save','award','redeem','confirm_offline','buy','active') then raise exception 'Unknown operation'; end if;
 if p_operation in ('award','redeem','confirm_offline') and r->>'role'<>'parent' then raise exception 'Parent account required'; end if;
 if p_operation in ('save','buy','active') and r->>'role'<>'learner' then raise exception 'Learner account required'; end if;
 if jsonb_typeof(p_args) is distinct from 'object' then raise exception 'Invalid operation arguments'; end if;
 req:=(p_args->>'requestId')::uuid;
 if req is null then raise exception 'Stable request ID required'; end if;
 select * into old from public.v3_transactions where child_user_id=c and request_id=req;
 if found then
 if old.operation is distinct from p_operation or old.payload is distinct from p_args then raise exception 'Request ID reused with different contents'; end if;
 return old.result; end if;
 if (p_args - (case when p_operation='save' then array['requestId','revision','progress'] when p_operation='buy' then array['requestId','item'] when p_operation='active' then array['requestId','seconds'] else array['requestId','amount'] end)) <> '{}'::jsonb then raise exception 'Unexpected operation arguments'; end if;

 if p_operation='save' then
 if (p_args->>'revision')::bigint is distinct from pr.revision then
 return jsonb_build_object('conflict',true,'revision',pr.revision,'progress',pr.progress); end if;
 if pr.revision>=9007199254740991 then raise exception 'Safe revision limit reached'; end if;
 clean:=p_args->'progress';
 if jsonb_typeof(clean) is distinct from 'object' or octet_length(clean::text)>2000000 then raise exception 'Invalid progress'; end if;
 -- Preserve V2 fields and unknown future fields. The wallet is never taken from client snapshots.
 update public.v3_progress set progress=clean,revision=revision+1,updated_at=now() where child_user_id=c returning * into pr;
 result:=jsonb_build_object('revision',pr.revision);
 elsif p_operation in ('award','redeem','confirm_offline') then
 amt:=(p_args->>'amount')::numeric;
 if amt is null or amt::text in ('NaN','Infinity','-Infinity') or amt<1 or amt>60 or amt<>trunc(amt) then raise exception 'Amount must be a whole number from 1 to 60'; end if;
 if p_operation='award' then update public.v3_wallet set bonus=bonus+amt where child_user_id=c;
 elsif p_operation='confirm_offline' then
 -- Offline reward reconciliation requires an explicit parent review. Never a learner privilege.
 if coalesce(pr.progress->>'minutes','0') !~ '^[0-9]+([.][0-9]+)?$'
 or coalesce((pr.progress->>'minutes')::numeric,0)*60-w.active_seconds<amt*60
 then raise exception 'Not enough uncredited reported learning time'; end if;
 update public.v3_wallet set active_seconds=active_seconds+amt*60,coins=coins+amt*10 where child_user_id=c;
 else
 if (w.active_seconds+w.opening_seconds)/60-w.redeemed<amt then raise exception 'Not enough earned screen time'; end if;
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
 if p_args->>'seconds' is null or (p_args->>'seconds')::numeric::text in ('NaN','Infinity','-Infinity') or (p_args->>'seconds')::numeric<0 or (p_args->>'seconds')::numeric>15 then raise exception 'Invalid active seconds'; end if;
 secs:=least(15,greatest(0,extract(epoch from clock_timestamp()-w.last_active)),greatest(0,coalesce((p_args->>'seconds')::numeric,0)));
 update public.v3_wallet set active_seconds=active_seconds+secs,coins=coins+secs/6,last_active=greatest(last_active,clock_timestamp()) where child_user_id=c;
 end if;
 if result is null then select jsonb_build_object('wallet',to_jsonb(t)-'child_user_id') into result from public.v3_wallet t where child_user_id=c; end if;
 insert into public.v3_transactions(child_user_id,request_id,operation,payload,result) values(c,req,p_operation,p_args,result);
 return result;
end $$;
do $preserved$ begin

 if exists(select 1 from (values
('public.v3_identity()','a0420550ddd99c33f4dd78302ce31b023b80e9b5606e4a1d8ca8f42faf577c87','af0908d31f0dff80844a340663857fb3b443d1a8156c92af8b20109b52c11d0e'),
('public.v3_set_pin(text)','f04b639552ed894c78090255b1cbb9a8fd18bb05f3e33d79bf2b78fc692bec12','4686af264542c2eceef614fd5a9b816cd862bef8953dd34562fc534ef28af5b1'),
('public.v3_unlock(text)','4177cf56336079d69078026a709305b025026aa9c54ab31e1c33e2391799737a','2c3e1c256e225a5b80f76d64a574fe14104926875acb40ced2be54a378eb7f73'),
('public.v3_request(text,text,jsonb)','79b6662869333f17b8f2af88c522de6a64fa6e08f9072d213656b650d7f7104e','e5025c5b9ae28cc705340104aa378d918c8e142122e74cd01b7a371b453da0a4')
 ) e(sig,lf,crlf) left join pg_proc p on p.oid=to_regprocedure(e.sig)
 where p.oid is null or p.proowner<>'postgres'::regrole or not p.prosecdef
 or encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') not in (e.lf,e.crlf))
 then raise exception 'Installed RPC differs from reviewed V5.2 source'; end if;
 if exists(select 1 from (values('anon'),('authenticated'),('service_role')) r(role)
 where has_schema_privilege(r.role,'v52_staging_private','USAGE')
 or has_table_privilege(r.role,'v52_staging_private.control','SELECT'))
 then raise exception 'Private upgrade metadata exposed'; end if;
 if exists(select 1 from pg_class c cross join (values('anon'),('authenticated')) r(role)
 cross join (values('SELECT'),('INSERT'),('UPDATE'),('REFERENCES')) v(priv)
 where c.oid in ('public.v3_wallet'::regclass,'public.v3_environment'::regclass)
 and (not c.relrowsecurity or has_any_column_privilege(r.role,c.oid,v.priv)))
 then raise exception 'Additive field protection changed'; end if;
 if v52_staging_private.data_digest() is distinct from (select before_digest from v52_staging_private.control)
 then raise exception 'Original application/Auth data changed; abort whole upgrade'; end if;
 if exists(select 1 from public.v3_wallet where opening_seconds<>0 or legacy_redeemed<>0) then raise exception 'Nonzero compatibility opening'; end if;
if exists(select 1 from (values('public.v3_identity()'),('public.v3_role()'),('public.v3_set_pin(text)'),('public.v3_unlock(text)'),('public.v3_request(text,text,jsonb)') ) f(sig)
 cross join (values('anon'),('authenticated'),('service_role')) r(role) where has_function_privilege(r.role,f.sig,'EXECUTE'))
 then raise exception 'Inherited RPC access remains; no broad role changes allowed'; end if;
 if exists(select 1 from (values('anon'),('authenticated'),('service_role')) r(role) where has_function_privilege(r.role,'public.v3_admin_import(uuid,jsonb)','EXECUTE')) then raise exception 'Importer denial changed'; end if;
end $preserved$;
update public.v3_environment set staging_upgrade_version=2;
update v52_staging_private.control set state='installed_closed',installed_routines=v52_staging_private.routine_state();
select 'installed_closed' as state, true as original_data_preserved;
commit;
