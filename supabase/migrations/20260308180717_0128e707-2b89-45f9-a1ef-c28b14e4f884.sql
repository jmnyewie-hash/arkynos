
-- Add subscription_tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'premium', 'founder');

-- Add monetization columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN founding_user boolean NOT NULL DEFAULT false,
  ADD COLUMN subscription_tier public.subscription_tier NOT NULL DEFAULT 'free',
  ADD COLUMN downloads_today integer NOT NULL DEFAULT 0,
  ADD COLUMN last_download_date date NOT NULL DEFAULT CURRENT_DATE;

-- Function to check and attempt download (handles daily reset + limit)
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
BEGIN
  -- Get user profile
  SELECT subscription_tier, downloads_today, last_download_date
  INTO v_tier, v_downloads, v_last_date
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Founders and premium: unlimited
  IF v_tier IN ('founder', 'premium') THEN
    UPDATE public.resources SET downloads = downloads + 1 WHERE id = p_resource_id;
    RETURN true;
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

-- Function to get founding spots remaining
CREATE OR REPLACE FUNCTION public.get_founding_spots_remaining()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT GREATEST(0, 500 - (SELECT count(*)::integer FROM public.profiles));
$$;

-- Function to get user stats for admin
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'founding_users', (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'founder'),
    'premium_users', (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'premium'),
    'free_users', (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'free'),
    'founding_spots_remaining', (SELECT GREATEST(0, 500 - count(*)::integer) FROM public.profiles)
  );
$$;

-- Update handle_new_user to assign founder status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total integer;
  v_tier public.subscription_tier;
  v_founding boolean;
BEGIN
  SELECT count(*) INTO v_total FROM public.profiles;
  
  IF v_total < 500 THEN
    v_tier := 'founder';
    v_founding := true;
  ELSE
    v_tier := 'free';
    v_founding := false;
  END IF;

  INSERT INTO public.profiles (user_id, name, email, founding_user, subscription_tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    v_founding,
    v_tier
  );
  RETURN NEW;
END;
$$;
