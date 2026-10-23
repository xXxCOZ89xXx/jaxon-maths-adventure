-- STAGING ONLY. Requires manual project verification and explicit authorisation.
-- This file is never applied by the application or GitHub Actions to a remote DB.
begin;
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
commit;
