
CREATE OR REPLACE FUNCTION public.get_founding_spots_remaining()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT GREATEST(0, 1260 - (SELECT count(*)::integer FROM public.profiles));
$$;

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
    'founding_spots_remaining', (SELECT GREATEST(0, 1260 - count(*)::integer) FROM public.profiles)
  );
$$;

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
  
  IF v_total < 1260 THEN
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
