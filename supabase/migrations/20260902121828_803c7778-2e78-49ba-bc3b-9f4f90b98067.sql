CREATE TABLE public.job_state (
  job_name text PRIMARY KEY,
  locked_until timestamptz,
  last_run_at timestamptz,
  is_paused boolean NOT NULL DEFAULT false,
  pause_reason text,
  last_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.job_state TO authenticated;
GRANT ALL ON public.job_state TO service_role;

ALTER TABLE public.job_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view job state" ON public.job_state
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_job_state_updated_at
  BEFORE UPDATE ON public.job_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.job_state (job_name) VALUES ('news-digest');