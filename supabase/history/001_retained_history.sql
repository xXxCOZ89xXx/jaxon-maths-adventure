-- REVIEW PACKAGE. Install only after a verified encrypted backup and review.
-- Additive installation leaves the capability DISABLED. No learner data is migrated.
BEGIN;
DO $$ BEGIN
 IF current_user<>'postgres' OR current_setting('app.history_storage_reviewed',true) IS DISTINCT FROM 'yes' THEN RAISE EXCEPTION 'Reviewed history installation required'; END IF;
 IF current_setting('app.history_expected_project_ref',true) IS DISTINCT FROM (SELECT project_ref FROM public.v3_environment) THEN RAISE EXCEPTION 'Reviewed history project reference required'; END IF;
 IF to_regprocedure('public.v3_request_before_history(text,text,jsonb)') IS NOT NULL THEN RAISE EXCEPTION 'History storage already installed'; END IF;
 IF to_regprocedure('public.v3_request_before_game_reset(text,text,jsonb)') IS NULL THEN RAISE EXCEPTION 'Reviewed reset-generation wrapper required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.v3_request(text,text,jsonb)'::regprocedure AND prosecdef AND proowner='postgres'::regrole AND proconfig=ARRAY['search_path=""']) THEN RAISE EXCEPTION 'Reviewed secure request contract required'; END IF;
END $$;
CREATE TABLE public.v3_history_settings(singleton boolean PRIMARY KEY CHECK(singleton),enabled boolean NOT NULL DEFAULT false,write_enabled boolean NOT NULL DEFAULT false,client_release text CHECK(client_release IS NULL OR client_release~'^[0-9a-f]{40}$'));
INSERT INTO public.v3_history_settings(singleton,enabled,write_enabled) VALUES(true,false,false);
CREATE TABLE public.v3_history_nodes(
 child_user_id uuid NOT NULL REFERENCES auth.users(id),game_epoch bigint NOT NULL CHECK(game_epoch>=0),
 id text NOT NULL CHECK(id~'^[0-9a-f]{64}$'),body text NOT NULL CHECK(octet_length(body)<=200000),
 PRIMARY KEY(child_user_id,game_epoch,id),
 CHECK(encode(extensions.digest(convert_to(body,'UTF8'),'sha256'),'hex')=id));
ALTER TABLE public.v3_history_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v3_history_nodes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.v3_history_settings,public.v3_history_nodes FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.v3_history_children(n jsonb) RETURNS text[] LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE ids text[]; kind text:=n->>'kind'; BEGIN
 IF kind='value' AND n ? 'value' THEN RETURN ARRAY[]::text[];
 ELSIF kind='text' AND jsonb_typeof(n->'text')='string' THEN RETURN ARRAY[]::text[];
 ELSIF kind='sequence' AND jsonb_typeof(n->'children')='array' AND jsonb_array_length(n->'children')<=32 THEN SELECT coalesce(array_agg(x#>>'{}'),ARRAY[]::text[]) INTO ids FROM jsonb_array_elements(n->'children') x;
 ELSIF kind='json' AND jsonb_typeof(n->'root')='string' THEN ids:=ARRAY[n->>'root'];
 ELSIF kind='map' AND jsonb_typeof(n->'entries')='array' AND jsonb_array_length(n->'entries')<=16 THEN
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(n->'entries') e WHERE jsonb_typeof(e->'key') IS DISTINCT FROM 'string' OR e->>'key'=ANY(ARRAY['__proto__','constructor','prototype'])) THEN RAISE EXCEPTION 'Invalid history map'; END IF;
  SELECT coalesce(array_agg(e->>'root'),ARRAY[]::text[]) INTO ids FROM jsonb_array_elements(n->'entries') e;
 ELSIF kind='dictionary' AND jsonb_typeof(n->'slots')='object' AND (SELECT count(*) FROM jsonb_object_keys(n->'slots'))<=16 THEN
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(n->'slots') k WHERE k!~'^[0-9a-f]$') THEN RAISE EXCEPTION 'Invalid history dictionary'; END IF;
  SELECT coalesce(array_agg(v#>>'{}'),ARRAY[]::text[]) INTO ids FROM jsonb_each(n->'slots') e(k,v);
 ELSE RAISE EXCEPTION 'Invalid history node'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(ids) id WHERE id IS NULL OR id!~'^[0-9a-f]{64}$') THEN RAISE EXCEPTION 'Invalid child reference'; END IF;
 RETURN ids;
END $$;

CREATE FUNCTION public.v3_history_value(c uuid,epoch bigint,node_id text,depth integer DEFAULT 0) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE n jsonb; result jsonb; item jsonb; child jsonb; contents text:=''; BEGIN
 IF depth>32 THEN RAISE EXCEPTION 'History depth exceeded'; END IF;
 SELECT body::jsonb INTO n FROM public.v3_history_nodes WHERE child_user_id=c AND game_epoch=epoch AND id=node_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'History page missing'; END IF;
 IF n->>'kind'='value' THEN RETURN n->'value';
 ELSIF n->>'kind'='text' THEN RETURN n->'text';
 ELSIF n->>'kind'='sequence' THEN
  result:='[]';FOR item IN SELECT * FROM jsonb_array_elements(n->'children') LOOP
   child:=public.v3_history_value(c,epoch,item#>>'{}',depth+1);
   IF (SELECT body::jsonb->>'kind' FROM public.v3_history_nodes WHERE child_user_id=c AND game_epoch=epoch AND id=item#>>'{}')='sequence' THEN result:=result||child; ELSE result:=result||jsonb_build_array(child); END IF;
  END LOOP; RETURN result;
 ELSIF n->>'kind'='json' THEN
  FOR item IN SELECT * FROM jsonb_array_elements(public.v3_history_value(c,epoch,n->>'root',depth+1)) LOOP contents:=contents||(item#>>'{}');END LOOP;RETURN contents::jsonb;
 ELSIF n->>'kind'='map' THEN result:='{}';FOR item IN SELECT * FROM jsonb_array_elements(n->'entries') LOOP result:=result||jsonb_build_object(item->>'key',public.v3_history_value(c,epoch,item->>'root',depth+1));END LOOP;RETURN result;
 ELSIF n->>'kind'='dictionary' THEN result:='{}';FOR item IN SELECT v FROM jsonb_each(n->'slots') e(k,v) LOOP result:=result||public.v3_history_value(c,epoch,item#>>'{}',depth+1);END LOOP;RETURN result;
 END IF; RAISE EXCEPTION 'Invalid history node';
END $$;
CREATE FUNCTION public.v3_history_restore(c uuid,epoch bigint,p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE ref jsonb; path text[]; value jsonb; BEGIN
 IF NOT p ? '_historyV2' THEN RETURN p; END IF;
 FOR ref IN SELECT * FROM jsonb_array_elements(p#>'{_historyV2,refs}') LOOP
  SELECT array_agg(v#>>'{}' ORDER BY ord) INTO path FROM jsonb_array_elements(ref->'path') WITH ORDINALITY e(v,ord);
  value:=public.v3_history_value(c,epoch,ref->>'root');
  IF ref->>'mode'='merge' THEN value:=value||coalesce(p#>path,'{}'::jsonb); END IF;
  p:=jsonb_set(p,path,value,false);
 END LOOP;RETURN p-'_historyV2';
END $$;
REVOKE ALL ON FUNCTION public.v3_history_children(jsonb),public.v3_history_value(uuid,bigint,text,integer),public.v3_history_restore(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;

ALTER FUNCTION public.v3_request(text,text,jsonb) RENAME TO v3_request_before_history;
REVOKE ALL ON FUNCTION public.v3_request_before_history(text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.v3_request(p_token text,p_operation text,p_args jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE remote jsonb; role_data jsonb; child uuid; epoch bigint; settings public.v3_history_settings; n jsonb; ident text; body_text text; children text[]; ref jsonb; path text[]; result jsonb;
BEGIN
 IF p_operation NOT IN ('read','save','read_v2','save_v2','history_has','history_put','history_get') THEN RETURN public.v3_request_before_history(p_token,p_operation,p_args); END IF;
 remote:=public.v3_request_before_history(p_token,'read','{}');role_data:=public.v3_role();child:=(role_data->>'child')::uuid;epoch:=(remote->>'gameEpoch')::bigint;
 SELECT * INTO settings FROM public.v3_history_settings WHERE singleton;
 IF p_operation='read' THEN
  IF remote->'progress' ? '_historyV2' THEN remote:=jsonb_set(remote,'{progress}',public.v3_history_restore(child,epoch,remote->'progress'));IF octet_length((remote->'progress')::text)>2000000 THEN RAISE EXCEPTION 'UPDATE_REQUIRED: retained history needs the current game'; END IF; END IF;RETURN remote;
 ELSIF p_operation='save' THEN
  IF p_args->'progress' ? '_historyV2' THEN RAISE EXCEPTION 'Verified V2 save required'; END IF;
  IF remote->'progress' ? '_historyV2' AND NOT EXISTS(SELECT 1 FROM public.v3_transactions WHERE child_user_id=child AND request_id=(p_args->>'requestId')::uuid) THEN RAISE EXCEPTION 'UPDATE_REQUIRED: original request preserved; recover it in the current game'; END IF;
  RETURN public.v3_request_before_history(p_token,p_operation,p_args);
 END IF;
 IF NOT settings.enabled THEN RAISE EXCEPTION 'History capability is not enabled'; END IF;
 IF p_operation='read_v2' THEN RETURN remote||jsonb_build_object('progressStorageVersion',2); END IF;
 IF coalesce((p_args->>'gameEpoch')::bigint,0)<>epoch THEN RAISE EXCEPTION 'GAME_RESET_REQUIRED'; END IF;
 IF p_operation IN ('history_has','history_get') THEN
  IF jsonb_typeof(p_args->'ids') IS DISTINCT FROM 'array' OR jsonb_array_length(p_args->'ids')>64 THEN RAISE EXCEPTION 'Bounded history page required'; END IF;
  IF p_operation='history_has' THEN SELECT jsonb_build_object('ids',coalesce(jsonb_agg(id),'[]')) INTO result FROM public.v3_history_nodes WHERE child_user_id=child AND game_epoch=epoch AND id IN (SELECT jsonb_array_elements_text(p_args->'ids'));
  ELSE SELECT jsonb_build_object('nodes',coalesce(jsonb_agg(jsonb_build_object('id',id,'body',body)),'[]')) INTO result FROM public.v3_history_nodes WHERE child_user_id=child AND game_epoch=epoch AND id IN (SELECT jsonb_array_elements_text(p_args->'ids')); END IF;RETURN result;
 END IF;
 IF role_data->>'role'<>'learner' THEN RAISE EXCEPTION 'Learner account required'; END IF;
 IF NOT settings.write_enabled THEN RAISE EXCEPTION 'History writes are paused; original request retained'; END IF;
 IF p_operation='history_put' THEN
  ident:=p_args#>>'{node,id}';body_text:=p_args#>>'{node,body}';
  IF ident IS NULL OR ident!~'^[0-9a-f]{64}$' OR body_text IS NULL OR octet_length(body_text)>200000 OR encode(extensions.digest(convert_to(body_text,'UTF8'),'sha256'),'hex')<>ident THEN RAISE EXCEPTION 'History hash mismatch'; END IF;
  n:=body_text::jsonb;children:=public.v3_history_children(n);
  IF EXISTS(SELECT 1 FROM unnest(children) wanted(id) WHERE NOT EXISTS(SELECT 1 FROM public.v3_history_nodes h WHERE h.child_user_id=child AND h.game_epoch=epoch AND h.id=wanted.id)) THEN RAISE EXCEPTION 'History child page missing'; END IF;
  INSERT INTO public.v3_history_nodes VALUES(child,epoch,ident,body_text) ON CONFLICT DO NOTHING;
  IF (SELECT body FROM public.v3_history_nodes WHERE child_user_id=child AND game_epoch=epoch AND id=ident) IS DISTINCT FROM body_text THEN RAISE EXCEPTION 'Immutable history node reused'; END IF;
  RETURN jsonb_build_object('stored',ident);
 END IF;
 IF p_operation='save_v2' THEN
  n:=p_args#>'{progress,_historyV2}';
  IF n->>'version' IS DISTINCT FROM '2' OR coalesce(n->>'sourceHash','')!~'^[0-9a-f]{64}$' OR jsonb_typeof(n->'refs') IS DISTINCT FROM 'array' OR jsonb_array_length(n->'refs')>1000 OR octet_length((p_args->'progress')::text)>2000000 THEN RAISE EXCEPTION 'Invalid bounded current progress'; END IF;
  FOR ref IN SELECT * FROM jsonb_array_elements(n->'refs') LOOP
   IF jsonb_typeof(ref->'path') IS DISTINCT FROM 'array' OR jsonb_array_length(ref->'path') NOT BETWEEN 1 AND 8 OR coalesce(ref->>'mode','') NOT IN ('array','merge','value') THEN RAISE EXCEPTION 'Invalid history reference'; END IF;
   SELECT array_agg(v#>>'{}' ORDER BY ord) INTO path FROM jsonb_array_elements(ref->'path') WITH ORDINALITY e(v,ord);
   IF EXISTS(SELECT 1 FROM unnest(path) k WHERE k IS NULL OR k=ANY(ARRAY['__proto__','constructor','prototype','_historyV2'])) OR (p_args->'progress')#>path IS NULL OR NOT EXISTS(SELECT 1 FROM public.v3_history_nodes WHERE child_user_id=child AND game_epoch=epoch AND id=ref->>'root') THEN RAISE EXCEPTION 'History reference missing or invalid'; END IF;
  END LOOP;
  result:=public.v3_request_before_history(p_token,'save',p_args);
  RETURN result;
 END IF;
 RAISE EXCEPTION 'Unknown history operation';
END $$;
REVOKE ALL ON FUNCTION public.v3_request(text,text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.v3_request(text,text,jsonb) TO authenticated;
ALTER FUNCTION public.v3_identity() RENAME TO v3_identity_before_history;
REVOKE ALL ON FUNCTION public.v3_identity_before_history() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.v3_identity() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ SELECT public.v3_identity_before_history()||jsonb_build_object('progressStorageVersion',CASE WHEN (SELECT enabled FROM public.v3_history_settings WHERE singleton) THEN 2 ELSE 1 END) $$;
REVOKE ALL ON FUNCTION public.v3_identity() FROM PUBLIC,service_role;
GRANT EXECUTE ON FUNCTION public.v3_identity() TO anon,authenticated;
COMMIT;
