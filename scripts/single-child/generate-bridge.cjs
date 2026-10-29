// Deterministic, offline migration generation. Never connects to a database.
const fs=require('node:fs'),crypto=require('node:crypto');
const prod=fs.readFileSync('supabase/v51-production/001_secure_backend.sql','utf8'),compact=fs.readFileSync('supabase/v3-staging/004_compact_save_receipts.sql','utf8'),foundation=fs.readFileSync('supabase/single-child-draft/001_pairing_foundation.sql','utf8');
const extract=(s,name)=>{const start=s.indexOf('function public.'+name+'(');if(start<0)throw Error(name);const from=s.indexOf('as $$',start)+5,to=s.indexOf('$$;',from);return s.slice(from,to);};
const baseline=extract(compact,'v3_request'),hash=crypto.createHash('sha256').update(baseline).digest('hex');
let core=extract(prod,'v3_request');core=core.replace('r jsonb:=public.v3_role(); c uuid:=(r->>\'child\')::uuid;','r jsonb:=p_scope; c uuid:=(r->>\'child\')::uuid;').replace('clean jsonb;','clean jsonb; fingerprint bytea; receipt_payload jsonb;');
const marker=' -- Serialize ALL writes per learner';core=core.slice(0,core.indexOf('begin')+5)+'\n if r->>\'role\' is null or r->>\'role\' not in (\'parent\',\'learner\') or c is null then raise exception \'Invalid authorised scope\'; end if;\n'+core.slice(core.indexOf(marker));
core=core.replace(" if not exists(select 1 from public.v3_environment where ready) then raise exception 'Backend activation pending'; end if;",'');
core=core.replace(' select * into old from public.v3_transactions'," fingerprint:=extensions.digest(convert_to(public.v3_receipt_normalize(p_args)::text,'UTF8'),'sha256');\n select * into old from public.v3_transactions");
core=core.replace('old.payload is distinct from p_args',"(old.request_fingerprint is null and old.payload is distinct from p_args) or (old.request_fingerprint is not null and old.request_fingerprint is distinct from fingerprint)");
core=core.replace(' insert into public.v3_transactions(child_user_id,request_id,operation,payload,result) values(c,req,p_operation,p_args,result);',` receipt_payload:=jsonb_build_object('requestId',req)||case p_operation when 'save' then jsonb_build_object('revision',p_args->'revision') when 'buy' then jsonb_build_object('item',p_args->'item') when 'active' then jsonb_build_object('seconds',p_args->'seconds') else jsonb_build_object('amount',p_args->'amount') end;
 insert into public.v3_transactions(child_user_id,request_id,operation,payload,result,request_fingerprint) values(c,req,p_operation,receipt_payload,result,fingerprint);`);
let parent=extract(foundation,'v12_parent').replace("  if exists(select 1 from public.maths_families where parent_user_id=u) then raise exception 'Existing family is preserved; identity bridge pending'; end if;",'');
parent=parent.replace("elsif p.child_id is null then raise exception 'Create your child profile first';", "elsif p.child_id is null then\n  if p_action='read' and p_args='{}'::jsonb then return jsonb_build_object('needsProfile',true,'gameReady',true); end if;\n  raise exception 'Create your child profile first';");parent=parent.replace('Existing families need a separately reviewed identity bridge, not duplicate children.','The canonical registry trigger adopts an existing child; duplicate profiles are refused.').replaceAll("'gameReady',false","'gameReady',true").replace("coalesce(is_anonymous,false)=false","coalesce(is_anonymous,false)=false and deleted_at is null and (banned_until is null or banned_until<=now())");
parent=parent.replace("  delete from v12_private.codes where child_id=p.child_id;\n  return jsonb_build_object('ok',true);",`  delete from v12_private.codes where child_id=p.child_id;
  -- Preserve the existing Auth learner's identity, but reset/revoke its PIN capabilities too.
  update public.v3_pins set hash=(select pin_hash from v12_private.profiles where child_id=p.child_id),generation=generation+1,attempts=0,blocked_until=null where user_id=(select legacy_auth_user from v12_private.children where child_id=p.child_id);
  delete from public.v3_unlocks where user_id=(select legacy_auth_user from v12_private.children where child_id=p.child_id);
  return jsonb_build_object('ok',true);`); // Applies to pin branch, not revoke with intervening statements.
const legacyRole=extract(fs.readFileSync('supabase/v3-staging/001_secure_core.sql','utf8'),'v3_role');
const roleHash=crypto.createHash('sha256').update(legacyRole).digest('hex');
const guardedRole=legacyRole.replace(" if u is null then raise exception 'Account sign-in required'; end if;"," if u is null then raise exception 'Account sign-in required'; end if;\n if not exists(select 1 from auth.users where id=u and deleted_at is null and (banned_until is null or banned_until<=now())) then raise exception 'Account sign-in required'; end if;");
const deviceFunctions=['v12_pair','v12_device_unlock','v12_device_scope'].map(name=>{
 let body=extract(foundation,name).replaceAll("'gameReady',false","'gameReady',true");
 if(name==='v12_pair')body=body.replace(" token:=encode(extensions.gen_random_bytes(32),'hex');"," if not v12_private.parent_active((select parent_id from v12_private.profiles where child_id=c.child_id)) then return jsonb_build_object('error','Pairing unavailable'); end if;\n token:=encode(extensions.gen_random_bytes(32),'hex');");
 if(name==='v12_device_unlock')body=body.replace(" if p.blocked_until>now() then"," if not v12_private.parent_active(p.parent_id) then return jsonb_build_object('error','Unlock unavailable'); end if;\n if p.blocked_until>now() then");
 const args=name==='v12_pair'?'p_code text,p_bucket text':name==='v12_device_unlock'?'p_device text,p_pin text,p_bucket text':'p_grant text';
 return `create or replace function public.${name}(${args}) returns jsonb language plpgsql security definer set search_path='' as $$${body}$$;`;
}).join('\n');
const head=`-- LOCAL / DEDICATED STAGING ONLY. Generated from reviewed business rules; no production target permitted.
-- Requires foundation 001 and compact save receipts. No Auth user is created for a child.
begin;
set local lock_timeout='5s';
do $$ begin
 if current_user<>'postgres' or current_setting('app.v13.bridge_reviewed',true) is distinct from 'yes'
 or coalesce(current_setting('app.v12.target_ref',true),'') !~ '^[a-z]{20}$'
 or current_setting('app.v12.target_ref',true)='mbdelspbjusarbwlltol'
 or not exists(select 1 from public.v3_environment where name='jaxon-maths-v3-staging' and project_ref=current_setting('app.v12.target_ref',true))
 then raise exception 'Reviewed distinct staging bridge target required'; end if;
 if encode(extensions.digest((select prosrc from pg_proc where oid='public.v3_request(text,text,jsonb)'::regprocedure),'sha256'),'hex')<>'${hash}'
 then raise exception 'Game RPC differs from reviewed compact baseline; stop and reconcile'; end if;
 if encode(extensions.digest((select prosrc from pg_proc where oid='public.v3_role()'::regprocedure),'sha256'),'hex')<>'${roleHash}' then raise exception 'Role RPC differs from reviewed baseline; stop and reconcile'; end if;
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
language plpgsql security definer set search_path='' as $$${core}$$;
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
create or replace function public.v3_role() returns jsonb language plpgsql security definer set search_path='' as $$${guardedRole}$$;
create or replace function public.v12_parent(p_action text,p_args jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$${parent}$$;
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
 if not v12_private.parent_active(p.parent_id) then return '{\"connected\":false}'; end if;
 if not exists(select 1 from v12_private.devices where device_id=d.device_id and revoked_at is null and expires_at>now()) then return '{\"connected\":false}'; end if;
 select expires_at into expiry from v12_private.grants where token_hash=extensions.digest(p_grant,'sha256') and device_id=d.device_id and generation=p.generation and expires_at>now();
 return jsonb_build_object('connected',true,'unlocked',expiry is not null,'expires',expiry,'child',p.child_id,'user',p.child_id,'role','learner','nickname',p.nickname,'pinSet',p.pin_hash is not null,'gameReady',true);
end $$;
revoke all on function public.v13_device_request(text,text,jsonb),public.v13_device_status(text,text) from public,anon,authenticated,service_role;
grant execute on function public.v13_device_request(text,text,jsonb),public.v13_device_status(text,text) to service_role;
create function public.v13_capabilities() returns jsonb language sql security definer set search_path='' as $$select '{\"canonicalChild\":true,\"version\":1}'::jsonb$$;
revoke all on function public.v13_capabilities() from public,anon,authenticated,service_role;
grant execute on function public.v13_capabilities() to anon,authenticated,service_role;
${deviceFunctions}
create or replace function public.v12_device_lock(p_grant text) returns jsonb language plpgsql security definer set search_path='' as $$
declare child uuid;
begin
 select d.child_id into child from v12_private.grants g join v12_private.devices d using(device_id) where g.token_hash=extensions.digest(p_grant,'sha256');
 perform 1 from v12_private.profiles where child_id=child for update;
 delete from v12_private.grants where token_hash=extensions.digest(p_grant,'sha256');
 return '{\"ok\":true}';
end $$;
notify pgrst,'reload schema';
commit;
`;
fs.writeFileSync('supabase/single-child-draft/002_identity_bridge.sql',head);
console.log('Generated guarded identity bridge; no database access.');
