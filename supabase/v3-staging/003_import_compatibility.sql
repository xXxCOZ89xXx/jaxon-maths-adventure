-- Administrator-only import of a REVIEWED FICTIONAL V2 fixture into STAGING.
-- No client RPC grant. Never run against or export a real learner record for QA.
begin;
create function public.v3_admin_import(p_child uuid,p_progress jsonb) returns void
language plpgsql set search_path='' as $$
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
end $$;
revoke all on function public.v3_admin_import(uuid,jsonb) from public,anon,authenticated;
commit;
