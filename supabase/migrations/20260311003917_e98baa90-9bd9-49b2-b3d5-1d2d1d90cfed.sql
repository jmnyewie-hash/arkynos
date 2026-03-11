
-- Semesters table for semester-based billing
CREATE TABLE public.semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semesters are publicly readable" ON public.semesters FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage semesters" ON public.semesters FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- App settings table (key-value store for global config)
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App settings are publicly readable" ON public.app_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage app settings" ON public.app_settings FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default paywall setting
INSERT INTO public.app_settings (key, value) VALUES ('paywall_enabled', 'true');

-- Add semester_id to profiles for tracking which semester a user paid for
ALTER TABLE public.profiles ADD COLUMN paid_semester_id uuid REFERENCES public.semesters(id);

-- Update attempt_download to check paywall and semester
CREATE OR REPLACE FUNCTION public.attempt_download(p_resource_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier public.subscription_tier;
  v_downloads integer;
  v_last_date date;
  v_paywall_on boolean;
  v_paid_semester uuid;
  v_active_semester uuid;
BEGIN
  -- Check global paywall setting
  SELECT (value = 'true') INTO v_paywall_on FROM public.app_settings WHERE key = 'paywall_enabled';
  IF v_paywall_on IS NULL THEN v_paywall_on := true; END IF;

  -- If paywall is OFF, allow all downloads
  IF NOT v_paywall_on THEN
    UPDATE public.resources SET downloads = downloads + 1 WHERE id = p_resource_id;
    RETURN true;
  END IF;

  -- Get user profile
  SELECT subscription_tier, downloads_today, last_download_date, paid_semester_id
  INTO v_tier, v_downloads, v_last_date, v_paid_semester
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Founders: always unlimited
  IF v_tier = 'founder' THEN
    UPDATE public.resources SET downloads = downloads + 1 WHERE id = p_resource_id;
    RETURN true;
  END IF;

  -- Premium: check if paid for active semester
  IF v_tier = 'premium' THEN
    SELECT id INTO v_active_semester FROM public.semesters WHERE is_active = true LIMIT 1;
    IF v_active_semester IS NOT NULL AND v_paid_semester = v_active_semester THEN
      UPDATE public.resources SET downloads = downloads + 1 WHERE id = p_resource_id;
      RETURN true;
    END IF;
    -- Premium but not paid for current semester = treat as free
  END IF;

  -- Free tier: reset daily counter if new day
  IF v_last_date < CURRENT_DATE THEN
    v_downloads := 0;
  END IF;

  -- Check limit
  IF v_downloads >= 5 THEN
    RETURN false;
  END IF;

  -- Allow download
  UPDATE public.profiles
  SET downloads_today = v_downloads + 1, last_download_date = CURRENT_DATE
  WHERE user_id = auth.uid();

  UPDATE public.resources SET downloads = downloads + 1 WHERE id = p_resource_id;
  RETURN true;
END;
$$;

-- Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for search
CREATE INDEX IF NOT EXISTS idx_courses_code_trgm ON public.courses USING gin (course_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courses_name_trgm ON public.courses USING gin (course_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courses_dept_trgm ON public.courses USING gin (department gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_resources_title_trgm ON public.resources USING gin (title gin_trgm_ops);

-- Function for fuzzy course search
CREATE OR REPLACE FUNCTION public.search_courses(search_term text)
RETURNS SETOF public.courses
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.courses
  WHERE course_code ILIKE '%' || search_term || '%'
     OR course_name ILIKE '%' || search_term || '%'
     OR department ILIKE '%' || search_term || '%'
     OR similarity(course_code, search_term) > 0.2
     OR similarity(course_name, search_term) > 0.2
  ORDER BY
    CASE WHEN course_code ILIKE search_term || '%' THEN 0 ELSE 1 END,
    GREATEST(similarity(course_code, search_term), similarity(course_name, search_term)) DESC
  LIMIT 50;
$$;
