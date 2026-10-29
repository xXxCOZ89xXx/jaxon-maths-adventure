-- LOCAL / DEDICATED STAGING ONLY. Generated from reviewed business rules; no production target permitted.
-- Requires foundation 001 and compact save receipts. No Auth user is created for a child.
begin;
set local lock_timeout='5s';
do $$ begin
 if current_user<>'postgres' or current_setting('app.v13.bridge_reviewed',true) is distinct from 'yes'
 or coalesce(current_setting('app.v12.target_ref',true),'') !~ '^[a-z]{20}$'
 or current_setting('app.v12.target_ref',true)='mbdelspbjusarbwlltol'
 or not exists(select 1 from public.v3_environment where name='jaxon-maths-v3-staging' and project_ref=current_setting('app.v12.target_ref',true))
 then raise exception 'Reviewed distinct staging bridge target required'; end if;
 if encode(extensions.digest((select prosrc from pg_proc where oid='public.v3_request(text,text,jsonb)'::regprocedure),'sha256'),'hex')<>'ca2432d4745cee13a1ce8a5c47176d76ab1c41dbafd8f4191fbdb84b78a4c698'
 then raise exception 'Game RPC differs from reviewed compact baseline; stop and reconcile'; end if;
 if encode(extensions.digest((select prosrc from pg_proc where oid='public.v3_role()'::regprocedure),'sha256'),'hex')<>'29ca307a30a2ca49992eadcf74cb63b4d42812a578ec90d52437c3b39cc77ba9' then raise exception 'Role RPC differs from reviewed baseline; stop and reconcile'; end if;
 if exists(select 1 from public.maths_families group by parent_user_id having count(*)<>1)
 then raise exception 'One-child relationships must be reviewed'; end if;
end $$;
lock table public.maths_families,public.v3_progress,public.v3_wallet,public.v3_transactions in access exclusive mode;
create table v12_private.children(child_id uuid primary key,legacy_auth_user uuid unique references auth.users(id));
alter table v12_private.children enable row level security;
revoke all on v12_private.children from public,anon,authenticated,service_role;
insert into v12_private.children select child_user_id,child_user_id from public.maths_families;
insert into v12_private.children(child_id) select child_id from v12_private.profiles on conflict do nothing;
do $$ declare t text; k record; begin
 foreach t in array array['maths_families','v3_progress','v3_wallet','v3_transactions'] loop
  for k in select conname from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
   where c.conrelid=('public.'||t)::regclass and c.contype='f' and c.confrelid='auth.users'::regclass and a.attname='child_user_id' loop
    execute format('alter table public.%I drop constraint %I',t,k.conname);
  end loop;
  execute format('alter table public.%I add constraint %I foreign key(child_user_id) references v12_private.children(child_id)',t,t||'_canonical_child');
 end loop;
end $$;
alter table v12_private.profiles add constraint v13_profile_child foreign key(child_id) references v12_private.children(child_id);
create unique index v13_one_child_per_parent on public.maths_families(parent_user_id);
alter table public.v3_wallet add column if not exists opening_seconds numeric not null default 0 check(opening_seconds>=0);
alter table public.v3_wallet add column if not exists legacy_redeemed numeric not null default 0 check(legacy_redeemed>=0);
create function v12_private.parent_active(p uuid) returns boolean language sql security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=p and email_confirmed_at is not null and not coalesce(is_anonymous,false) and deleted_at is null and (banned_until is null or banned_until<=now()));
$$;
revoke all on function v12_private.parent_active(uuid) from public,anon,authenticated,service_role;
create function v12_private.open_child() returns trigger language plpgsql security definer set search_path='' as $$
declare old_child uuid;
begin
 select child_user_id into old_child from public.maths_families where parent_user_id=new.parent_id;
 if old_child is not null then new.child_id:=old_child;
 else
  insert into v12_private.children(child_id) values(new.child_id);
  insert into public.maths_families(child_user_id,parent_user_id) values(new.child_id,new.parent_id);
 end if;
 insert into public.v3_progress(child_user_id) values(new.child_id) on conflict do nothing;
 insert into public.v3_wallet(child_user_id) values(new.child_id) on conflict do nothing;
 return new;
end $$;
revoke all on function v12_private.open_child() from public,anon,authenticated,service_role;
create trigger v13_open_child before insert on v12_private.profiles for each row execute function v12_private.open_child();
-- Adopt previously created foundation-only profiles without inventing Auth accounts.
insert into public.maths_families(child_user_id,parent_user_id) select child_id,parent_id from v12_private.profiles on conflict do nothing;
insert into public.v3_progress(child_user_id) select child_id from v12_private.profiles on conflict do nothing;
insert into public.v3_wallet(child_user_id) select child_id from v12_private.profiles on conflict do nothing;
create function v12_private.request_core(p_scope jsonb,p_operation text,p_args jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r jsonb:=p_scope; c uuid:=(r->>'child')::uuid; w public.v3_wallet; pr public.v3_progress;
 old public.v3_transactions; req uuid; result jsonb; price integer; amt numeric; secs numeric; clean jsonb; fingerprint bytea; receipt_payload jsonb;
begin
 if r->>'role' is null or r->>'role' not in ('parent','learner') or c is null then raise exception 'Invalid authorised scope'; end if;
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
 if (p_args - (case when p_operation='save' then array['requestId','revision','progress'] when p_operation='buy' then array['requestId','item'] when p_operation='active' then array['requestId','seconds'] else array['requestId','amount'] end)) <> '{}'::jsonb then raise exception 'Unexpected operation arguments'; end if;
 req:=(p_args->>'requestId')::uuid;
 if req is null then raise exception 'Stable request ID required'; end if;
 fingerprint:=extensions.digest(convert_to(public.v3_receipt_normalize(p_args)::text,'UTF8'),'sha256');
 select * into old from public.v3_transactions where child_user_id=c and request_id=req;
 if found then
 if old.operation is distinct from p_operation or (old.request_fingerprint is null and old.payload is distinct from p_args) or (old.request_fingerprint is not null and old.request_fingerprint is distinct from fingerprint) then raise exception 'Request ID reused with different contents'; end if;
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
 receipt_payload:=jsonb_build_object('requestId',req)||case p_operation when 'save' then jsonb_build_object('revision',p_args->'revision') when 'buy' then jsonb_build_object('item',p_args->'item') when 'active' then jsonb_build_object('seconds',p_args->'seconds') else jsonb_build_object('amount',p_args->'amount') end;
 insert into public.v3_transactions(child_user_id,request_id,operation,payload,result,request_fingerprint) values(c,req,p_operation,receipt_payload,result,fingerprint);
 return result;
end $$;
revoke all on function v12_private.request_core(jsonb,text,jsonb) from public,anon,authenticated,service_role;
create or replace function public.v3_request(p_token text,p_operation text,p_args jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare r jsonb:=public.v3_role();
begin
 perform 1 from public.v3_pins where user_id=auth.uid() for share;
 if not exists(select 1 from public.v3_unlocks u join public.v3_pins p on p.user_id=u.user_id and p.generation=u.generation where u.token_hash=extensions.digest(p_token,'sha256') and u.user_id=auth.uid() and u.expires_at>now()) then raise exception 'Unlock required'; end if;
 if p_operation='lock' then delete from public.v3_unlocks where token_hash=extensions.digest(p_token,'sha256'); return '{"ok":true}'; end if;
 return v12_private.request_core(r,p_operation,p_args);
end $$;
create or replace function public.v3_role() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c uuid; r text;
begin
 if u is null then raise exception 'Account sign-in required'; end if;
 if not exists(select 1 from auth.users where id=u and deleted_at is null and (banned_until is null or banned_until<=now())) then raise exception 'Account sign-in required'; end if;
 -- Ambiguous or mixed-role identities fail closed. Multi-child selection is explicit future work.
 if (select count(*) from public.maths_families where parent_user_id=u or child_user_id=u)<>1
 then raise exception 'One unambiguous linked family required'; end if;
 select child_user_id,case when parent_user_id=u then 'parent' else 'learner' end into c,r
 from public.maths_families where parent_user_id=u or child_user_id=u;
 return jsonb_build_object('role',r,'child',c,'user',u,'pinSet',exists(select 1 from public.v3_pins where user_id=u));
end $$;
create or replace function public.v12_parent(p_action text,p_args jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p v12_private.profiles; code text; target uuid; recent boolean;
begin
 if u is null or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null and coalesce(is_anonymous,false)=false and deleted_at is null and (banned_until is null or banned_until<=now()))
 then raise exception 'Verified parent account required'; end if;
 -- Existing learner identities cannot become parents through this new RPC.
 if exists(select 1 from public.maths_families where child_user_id=u) then raise exception 'Parent account required'; end if;
 select exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) m
 where m->>'method'='password' and (m->>'timestamp')::numeric between extract(epoch from now())-300 and extract(epoch from now())+30) into recent;
 if not recent then raise exception 'Sign in again before managing setup'; end if;
 if jsonb_typeof(p_args) is distinct from 'object' then raise exception 'Invalid setup request'; end if;
 if not v12_private.take_limit('parent:'||u,30,interval '15 minutes') then return jsonb_build_object('error','Please wait before trying setup again'); end if;
 -- Same parent serializes creation, replacement, reset and revocation.
 perform pg_advisory_xact_lock(hashtextextended(u::text,12));
 select * into p from v12_private.profiles where parent_id=u for update;
 if p_action='create' then
  if p_args-'nickname'<>'{}'::jsonb or jsonb_typeof(p_args->'nickname') is distinct from 'string' then raise exception 'Nickname only'; end if;
  -- The canonical registry trigger adopts an existing child; duplicate profiles are refused.

  if p.child_id is not null then return jsonb_build_object('error','One child profile already exists'); end if;
  insert into v12_private.profiles(parent_id,nickname) values(u,btrim(p_args->>'nickname')) returning * into p;
 elsif p.child_id is null then
  if p_action='read' and p_args='{}'::jsonb then return jsonb_build_object('needsProfile',true,'gameReady',true); end if;
  raise exception 'Create your child profile first';
 end if;
 if p_action in ('create','read') then
  if p_action='read' and p_args<>'{}'::jsonb then raise exception 'Unexpected setup fields'; end if;
  return jsonb_build_object('nickname',p.nickname,'pinSet',p.pin_hash is not null,'devices',coalesce((select jsonb_agg(jsonb_build_object('id',device_id,'created',created_at,'expires',expires_at,'revoked',revoked_at)) from v12_private.devices where child_id=p.child_id),'[]'::jsonb),'gameReady',true);
 elsif p_action='pin' then
  if p_args-'pin'<>'{}'::jsonb or p_args->>'pin' is null or p_args->>'pin' !~ '^[0-9]{4}$' then raise exception 'Use four PIN digits'; end if;
  update v12_private.profiles set pin_hash=extensions.crypt(p_args->>'pin',extensions.gen_salt('bf',10)),generation=generation+1,attempts=0,blocked_until=null where child_id=p.child_id;
  delete from v12_private.grants where device_id in(select device_id from v12_private.devices where child_id=p.child_id);
  delete from v12_private.codes where child_id=p.child_id;
  -- Preserve the existing Auth learner's identity, but reset/revoke its PIN capabilities too.
  update public.v3_pins set hash=(select pin_hash from v12_private.profiles where child_id=p.child_id),generation=generation+1,attempts=0,blocked_until=null where user_id=(select legacy_auth_user from v12_private.children where child_id=p.child_id);
  delete from public.v3_unlocks where user_id=(select legacy_auth_user from v12_private.children where child_id=p.child_id);
  return jsonb_build_object('ok',true);
 elsif p_action='issue' then
  if p_args<>'{}'::jsonb then raise exception 'Unexpected setup fields'; end if;
  if p.pin_hash is null then raise exception 'Set learner PIN first'; end if;
  if not v12_private.take_limit('issue:'||u,5,interval '15 minutes') then return jsonb_build_object('error','Please wait before requesting another code'); end if;
  delete from v12_private.codes where child_id=p.child_id;
  code:=encode(extensions.gen_random_bytes(16),'hex');
  insert into v12_private.codes values(extensions.digest(code,'sha256'),p.child_id,now()+interval '10 minutes',null);
  return jsonb_build_object('code',code,'expires',now()+interval '10 minutes');
 elsif p_action='revoke' then
  if p_args-'device'<>'{}'::jsonb then raise exception 'Unexpected setup fields'; end if;
  target:=(p_args->>'device')::uuid;
  if not exists(select 1 from v12_private.devices where device_id=target and child_id=p.child_id) then raise exception 'Device unavailable'; end if;
  update v12_private.devices set revoked_at=coalesce(revoked_at,now()) where device_id=target and child_id=p.child_id;
  delete from v12_private.grants where device_id=target;
  delete from v12_private.codes where child_id=p.child_id;
  return jsonb_build_object('ok',true);
 elsif p_action='cancel-code' then
  if p_args<>'{}'::jsonb then raise exception 'Unexpected setup fields'; end if;
  delete from v12_private.codes where child_id=p.child_id;
  return jsonb_build_object('ok',true);
 end if;
 raise exception 'Unknown setup action';
end $$;
create function public.v13_device_request(p_grant text,p_operation text,p_args jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare s jsonb; child uuid; device uuid;
begin
 select d.child_id,g.device_id into child,device from v12_private.grants g join v12_private.devices d using(device_id) where g.token_hash=extensions.digest(p_grant,'sha256');
 if child is null then raise exception 'Unlock required'; end if;
 if p_operation='lock' then return public.v12_device_lock(p_grant); end if;
 -- Same profile lock as parent reset/revoke; holds through the entire game transaction.
 perform 1 from v12_private.profiles where child_id=child for share;
 s:=public.v12_device_scope(p_grant);
 if not v12_private.parent_active((s->>'parent')::uuid) then raise exception 'Unlock required'; end if;
 return v12_private.request_core(s,p_operation,p_args);
end $$;
create function public.v13_device_status(p_device text,p_grant text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d v12_private.devices; p v12_private.profiles; expiry timestamptz;
begin
 select * into d from v12_private.devices where token_hash=extensions.digest(p_device,'sha256') and revoked_at is null and expires_at>now();
 if d.device_id is null then return '{"connected":false}'; end if;
 select * into p from v12_private.profiles where child_id=d.child_id for share;
 if not v12_private.parent_active(p.parent_id) then return '{"connected":false}'; end if;
 if not exists(select 1 from v12_private.devices where device_id=d.device_id and revoked_at is null and expires_at>now()) then return '{"connected":false}'; end if;
 select expires_at into expiry from v12_private.grants where token_hash=extensions.digest(p_grant,'sha256') and device_id=d.device_id and generation=p.generation and expires_at>now();
 return jsonb_build_object('connected',true,'unlocked',expiry is not null,'expires',expiry,'child',p.child_id,'user',p.child_id,'role','learner','nickname',p.nickname,'pinSet',p.pin_hash is not null,'gameReady',true);
end $$;
revoke all on function public.v13_device_request(text,text,jsonb),public.v13_device_status(text,text) from public,anon,authenticated,service_role;
grant execute on function public.v13_device_request(text,text,jsonb),public.v13_device_status(text,text) to service_role;
create function public.v13_capabilities() returns jsonb language sql security definer set search_path='' as $$select '{"canonicalChild":true,"version":1}'::jsonb$$;
revoke all on function public.v13_capabilities() from public,anon,authenticated,service_role;
grant execute on function public.v13_capabilities() to anon,authenticated,service_role;
create or replace function public.v12_pair(p_code text,p_bucket text) returns jsonb language plpgsql security definer set search_path='' as $$
declare c v12_private.codes; token text; d uuid;
begin
 if p_bucket is null or p_bucket !~ '^[a-f0-9]{64}$' then raise exception 'Trusted rate bucket required'; end if;
 if not v12_private.take_limit('pair:'||p_bucket,10,interval '15 minutes') then return jsonb_build_object('error','Pairing unavailable. Wait and ask your parent for help'); end if;
 if p_code is null or p_code !~ '^[a-f0-9]{32}$' then return jsonb_build_object('error','Pairing unavailable. Wait and ask your parent for help'); end if;
 select * into c from v12_private.codes where code_hash=extensions.digest(p_code,'sha256');
 if c.child_id is null or c.used_at is not null or c.expires_at<=now() then return jsonb_build_object('error','Pairing unavailable. Wait and ask your parent for help'); end if;
 -- Recheck after acquiring the child lock, so a racing reset/replacement wins safely.
 perform 1 from v12_private.profiles where child_id=c.child_id for update;
 if not exists(select 1 from v12_private.codes where code_hash=c.code_hash and used_at is null and expires_at>now()) then return jsonb_build_object('error','Pairing unavailable. Wait and ask your parent for help'); end if;
 if not v12_private.parent_active((select parent_id from v12_private.profiles where child_id=c.child_id)) then return jsonb_build_object('error','Pairing unavailable'); end if;
 token:=encode(extensions.gen_random_bytes(32),'hex');
 insert into v12_private.devices(child_id,token_hash,expires_at) values(c.child_id,extensions.digest(token,'sha256'),now()+interval '30 days') returning device_id into d;
 update v12_private.codes set used_at=now() where code_hash=c.code_hash;
 return jsonb_build_object('deviceToken',token,'device',d,'expires',now()+interval '30 days','gameReady',true);
end $$;
create or replace function public.v12_device_unlock(p_device text,p_pin text,p_bucket text) returns jsonb language plpgsql security definer set search_path='' as $$
declare d v12_private.devices; p v12_private.profiles; token text;
begin
 if p_bucket is null or p_bucket !~ '^[a-f0-9]{64}$' then raise exception 'Trusted rate bucket required'; end if;
 if not v12_private.take_limit('unlock:'||p_bucket,20,interval '15 minutes') then return jsonb_build_object('error','Unlock unavailable. Wait and ask your parent for help'); end if;
 select * into d from v12_private.devices where token_hash=extensions.digest(p_device,'sha256');
 if d.device_id is null or d.revoked_at is not null or d.expires_at<=now() then return jsonb_build_object('error','Connect this device again with your parent'); end if;
 select * into p from v12_private.profiles where child_id=d.child_id for update;
 if not exists(select 1 from v12_private.devices where device_id=d.device_id and revoked_at is null and expires_at>now()) then return jsonb_build_object('error','Connect this device again with your parent'); end if;
 if not v12_private.parent_active(p.parent_id) then return jsonb_build_object('error','Unlock unavailable'); end if;
 if p.blocked_until>now() then return jsonb_build_object('error','Wait five minutes before trying again'); end if;
 if p.pin_hash is null or p_pin is null or p_pin !~ '^[0-9]{4}$' or extensions.crypt(p_pin,p.pin_hash) is distinct from p.pin_hash then
  update v12_private.profiles set attempts=case when blocked_until<=now() then 1 else attempts+1 end,
  blocked_until=case when (case when blocked_until<=now() then 1 else attempts+1 end)>=5 then now()+interval '5 minutes' else null end where child_id=p.child_id;
  return jsonb_build_object('error','PIN not recognised. Ask your parent if you need help');
 end if;
 update v12_private.profiles set attempts=0,blocked_until=null where child_id=p.child_id;
 token:=encode(extensions.gen_random_bytes(32),'hex');
 delete from v12_private.grants where device_id=d.device_id;
 insert into v12_private.grants values(extensions.digest(token,'sha256'),d.device_id,p.generation,least(d.expires_at,now()+interval '12 hours'));
 return jsonb_build_object('grantToken',token,'expires',least(d.expires_at,now()+interval '12 hours'),'gameReady',true);
end $$;
create or replace function public.v12_device_scope(p_grant text) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 select jsonb_build_object('child',p.child_id,'parent',p.parent_id,'device',d.device_id,'role','learner','gameReady',true) into result
 from v12_private.grants g join v12_private.devices d using(device_id) join v12_private.profiles p using(child_id)
 where g.token_hash=extensions.digest(p_grant,'sha256') and g.expires_at>now() and d.expires_at>now() and d.revoked_at is null and g.generation=p.generation;
 if result is null then raise exception 'Unlock this connected device again'; end if;
 return result;
end $$;
create or replace function public.v12_device_lock(p_grant text) returns jsonb language plpgsql security definer set search_path='' as $$
declare child uuid;
begin
 select d.child_id into child from v12_private.grants g join v12_private.devices d using(device_id) where g.token_hash=extensions.digest(p_grant,'sha256');
 perform 1 from v12_private.profiles where child_id=child for update;
 delete from v12_private.grants where token_hash=extensions.digest(p_grant,'sha256');
 return '{"ok":true}';
end $$;
notify pgrst,'reload schema';
commit;
