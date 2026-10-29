-- INACTIVE FOUNDATION / NOT A PRODUCTION MIGRATION.
-- No Auth users, legacy family relationships, saves or wallets are changed.
-- Staging owner review is required. This is not the missing game-identity bridge.
begin;
do $$ begin
 if current_user <> 'postgres' or current_setting('app.v12.foundation_reviewed',true) is distinct from 'yes'
 then raise exception 'Reviewed local/staging foundation only'; end if;
 if coalesce(current_setting('app.v12.target_ref',true),'') !~ '^[a-z]{20}$'
 or current_setting('app.v12.target_ref',true) in ('sfogrvedypgtxfvecmbx','mbdelspbjusarbwlltol')
 or not exists(select 1 from public.v3_environment where name='jaxon-maths-v3-staging'
 and project_ref=current_setting('app.v12.target_ref',true))
 then raise exception 'Distinct verified staging target required; production refused'; end if;
end $$;
create schema v12_private;
revoke all on schema v12_private from public,anon,authenticated;
create table v12_private.profiles (
 child_id uuid primary key default extensions.gen_random_uuid(),
 parent_id uuid not null unique references auth.users(id),
 nickname text not null check(length(nickname) between 1 and 24 and nickname !~ '[[:cntrl:]]'),
 pin_hash text, generation integer not null default 1, attempts integer not null default 0,
 blocked_until timestamptz, created_at timestamptz not null default now()
);
create table v12_private.codes (
 code_hash bytea primary key, child_id uuid not null references v12_private.profiles(child_id),
 expires_at timestamptz not null, used_at timestamptz
);
create table v12_private.devices (
 device_id uuid primary key default extensions.gen_random_uuid(),
 child_id uuid not null references v12_private.profiles(child_id), token_hash bytea not null unique,
 created_at timestamptz not null default now(), expires_at timestamptz not null,
 revoked_at timestamptz
);
create table v12_private.grants (
 token_hash bytea primary key, device_id uuid not null references v12_private.devices(device_id),
 generation integer not null, expires_at timestamptz not null
);
create table v12_private.limits (bucket text primary key, count integer not null, resets_at timestamptz not null);
do $$ declare t text; begin
 foreach t in array array['profiles','codes','devices','grants','limits'] loop
 execute format('alter table v12_private.%I enable row level security',t);
 execute format('revoke all on v12_private.%I from public,anon,authenticated,service_role',t);
 end loop;
end $$;
create function v12_private.take_limit(k text, ceiling integer, period interval) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into v12_private.limits values(k,1,now()+period)
 on conflict(bucket) do update set count=case when v12_private.limits.resets_at<=now() then 1 else v12_private.limits.count+1 end,
 resets_at=case when v12_private.limits.resets_at<=now() then now()+period else v12_private.limits.resets_at end
 returning count into n;
 return n<=ceiling;
end $$;
create function public.v12_parent(p_action text,p_args jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p v12_private.profiles; code text; target uuid; recent boolean;
begin
 if u is null or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null and coalesce(is_anonymous,false)=false)
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
  -- Existing families need a separately reviewed identity bridge, not duplicate children.
  if exists(select 1 from public.maths_families where parent_user_id=u) then raise exception 'Existing family is preserved; identity bridge pending'; end if;
  if p.child_id is not null then return jsonb_build_object('error','One child profile already exists'); end if;
  insert into v12_private.profiles(parent_id,nickname) values(u,btrim(p_args->>'nickname')) returning * into p;
 elsif p.child_id is null then raise exception 'Create your child profile first';
 end if;
 if p_action in ('create','read') then
  if p_action='read' and p_args<>'{}'::jsonb then raise exception 'Unexpected setup fields'; end if;
  return jsonb_build_object('nickname',p.nickname,'pinSet',p.pin_hash is not null,'devices',coalesce((select jsonb_agg(jsonb_build_object('id',device_id,'created',created_at,'expires',expires_at,'revoked',revoked_at)) from v12_private.devices where child_id=p.child_id),'[]'::jsonb),'gameReady',false);
 elsif p_action='pin' then
  if p_args-'pin'<>'{}'::jsonb or p_args->>'pin' is null or p_args->>'pin' !~ '^[0-9]{4}$' then raise exception 'Use four PIN digits'; end if;
  update v12_private.profiles set pin_hash=extensions.crypt(p_args->>'pin',extensions.gen_salt('bf',10)),generation=generation+1,attempts=0,blocked_until=null where child_id=p.child_id;
  delete from v12_private.grants where device_id in(select device_id from v12_private.devices where child_id=p.child_id);
  delete from v12_private.codes where child_id=p.child_id;
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
-- Trusted gateway only. p_bucket is HMAC(server secret, trusted remote address), NEVER caller input.
create function public.v12_pair(p_code text,p_bucket text) returns jsonb
language plpgsql security definer set search_path='' as $$
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
 token:=encode(extensions.gen_random_bytes(32),'hex');
 insert into v12_private.devices(child_id,token_hash,expires_at) values(c.child_id,extensions.digest(token,'sha256'),now()+interval '30 days') returning device_id into d;
 update v12_private.codes set used_at=now() where code_hash=c.code_hash;
 return jsonb_build_object('deviceToken',token,'device',d,'expires',now()+interval '30 days','gameReady',false);
end $$;
create function public.v12_device_unlock(p_device text,p_pin text,p_bucket text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d v12_private.devices; p v12_private.profiles; token text;
begin
 if p_bucket is null or p_bucket !~ '^[a-f0-9]{64}$' then raise exception 'Trusted rate bucket required'; end if;
 if not v12_private.take_limit('unlock:'||p_bucket,20,interval '15 minutes') then return jsonb_build_object('error','Unlock unavailable. Wait and ask your parent for help'); end if;
 select * into d from v12_private.devices where token_hash=extensions.digest(p_device,'sha256');
 if d.device_id is null or d.revoked_at is not null or d.expires_at<=now() then return jsonb_build_object('error','Connect this device again with your parent'); end if;
 select * into p from v12_private.profiles where child_id=d.child_id for update;
 if not exists(select 1 from v12_private.devices where device_id=d.device_id and revoked_at is null and expires_at>now()) then return jsonb_build_object('error','Connect this device again with your parent'); end if;
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
 return jsonb_build_object('grantToken',token,'expires',least(d.expires_at,now()+interval '12 hours'),'gameReady',false);
end $$;
-- Scope primitive ONLY; this cannot call or bypass v3_request. A reviewed bridge is required.
create function public.v12_device_scope(p_grant text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 select jsonb_build_object('child',p.child_id,'parent',p.parent_id,'device',d.device_id,'role','learner','gameReady',false) into result
 from v12_private.grants g join v12_private.devices d using(device_id) join v12_private.profiles p using(child_id)
 where g.token_hash=extensions.digest(p_grant,'sha256') and g.expires_at>now() and d.expires_at>now() and d.revoked_at is null and g.generation=p.generation;
 if result is null then raise exception 'Unlock this connected device again'; end if;
 return result;
end $$;
create function public.v12_device_lock(p_grant text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 delete from v12_private.grants where token_hash=extensions.digest(p_grant,'sha256');
 return jsonb_build_object('ok',true);
end $$;
revoke all on all functions in schema v12_private from public,anon,authenticated,service_role;
revoke all on function public.v12_parent(text,jsonb),public.v12_pair(text,text),public.v12_device_unlock(text,text,text),public.v12_device_scope(text),public.v12_device_lock(text) from public,anon,authenticated,service_role;
grant execute on function public.v12_parent(text,jsonb) to authenticated;
grant execute on function public.v12_pair(text,text),public.v12_device_unlock(text,text,text),public.v12_device_scope(text),public.v12_device_lock(text) to service_role;
commit;
