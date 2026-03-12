
-- Payment logs table for tracking all payments
CREATE TABLE public.payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  payment_type text NOT NULL, -- 'semester_premium' or 'class_access'
  amount_pesewas integer NOT NULL,
  currency text NOT NULL DEFAULT 'GHS',
  reference text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, success, failed
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payment_logs_user ON public.payment_logs(user_id);
CREATE INDEX idx_payment_logs_status ON public.payment_logs(status);
CREATE INDEX idx_payment_logs_created ON public.payment_logs(created_at DESC);

-- RLS
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment logs"
  ON public.payment_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment logs"
  ON public.payment_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Download tracking table
CREATE TABLE public.download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_download_logs_user ON public.download_logs(user_id);
CREATE INDEX idx_download_logs_resource ON public.download_logs(resource_id);
CREATE INDEX idx_download_logs_created ON public.download_logs(created_at DESC);

ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all download logs"
  ON public.download_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert download logs"
  ON public.download_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update attempt_download to also log downloads
CREATE OR REPLACE FUNCTION public.attempt_download(p_resource_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tier public.subscription_tier;
  v_downloads integer;
  v_last_date date;
  v_paywall_on boolean;
  v_paid_semester uuid;
  v_active_semester uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  SELECT (value = 'true') INTO v_paywall_on FROM public.app_settings WHERE key = 'paywall_enabled';
  IF v_paywall_on IS NULL THEN v_paywall_on := true; END IF;

  IF NOT v_paywall_on THEN
    UPDATE public.resources SET downloads = downloads + 1 WHERE id = p_resource_id;
    INSERT INTO public.download_logs (user_id, resource_id) VALUES (v_user_id, p_resource_id);
    RETURN true;
  END IF;

  SELECT subscription_tier, downloads_today, last_download_date, paid_semester_id
  INTO v_tier, v_downloads, v_last_date, v_paid_semester
  FROM public.profiles
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN RETURN false; END IF;

  IF v_tier = 'founder' THEN
    UPDATE public.resources SET downloads = downloads + 1 WHERE id = p_resource_id;
    INSERT INTO public.download_logs (user_id, resource_id) VALUES (v_user_id, p_resource_id);
    RETURN true;
  END IF;

  IF v_tier = 'premium' THEN
    SELECT id INTO v_active_semester FROM public.semesters WHERE is_active = true LIMIT 1;
    IF v_active_semester IS NOT NULL AND v_paid_semester = v_active_semester THEN
      UPDATE public.resources SET downloads = downloads + 1 WHERE id = p_resource_id;
      INSERT INTO public.download_logs (user_id, resource_id) VALUES (v_user_id, p_resource_id);
      RETURN true;
    END IF;
  END IF;

  IF v_last_date < CURRENT_DATE THEN v_downloads := 0; END IF;
  IF v_downloads >= 5 THEN RETURN false; END IF;

  UPDATE public.profiles
  SET downloads_today = v_downloads + 1, last_download_date = CURRENT_DATE
  WHERE user_id = v_user_id;

  UPDATE public.resources SET downloads = downloads + 1 WHERE id = p_resource_id;
  INSERT INTO public.download_logs (user_id, resource_id) VALUES (v_user_id, p_resource_id);
  RETURN true;
END;
$function$;

-- Admin stats function update to include more analytics
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'founding_users', (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'founder'),
    'premium_users', (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'premium'),
    'free_users', (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'free'),
    'founding_spots_remaining', (SELECT GREATEST(0, 1260 - count(*)::integer) FROM public.profiles),
    'total_resources', (SELECT count(*) FROM public.resources WHERE is_hidden = false),
    'total_downloads', (SELECT COALESCE(sum(downloads), 0) FROM public.resources),
    'downloads_today', (SELECT count(*) FROM public.download_logs WHERE created_at >= CURRENT_DATE),
    'uploads_today', (SELECT count(*) FROM public.resources WHERE created_at >= CURRENT_DATE)
  );
$function$;
