-- REVIEW DRAFT ONLY. No reset is executed by this installation.
-- Apply only in a separately reviewed release step. Tests use disposable local PostgreSQL.
BEGIN;
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
COMMIT;
