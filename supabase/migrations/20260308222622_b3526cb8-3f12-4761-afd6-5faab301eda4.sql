
-- Add program_id and study_year to profiles
ALTER TABLE public.profiles 
  ADD COLUMN program_id uuid REFERENCES public.programs(id) DEFAULT NULL,
  ADD COLUMN study_year smallint DEFAULT NULL;

-- Update handle_new_user trigger to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  INSERT INTO public.profiles (user_id, name, email, founding_user, subscription_tier, program_id, study_year)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    v_founding,
    v_tier,
    NULLIF(NEW.raw_user_meta_data->>'program_id', '')::uuid,
    NULLIF(NEW.raw_user_meta_data->>'study_year', '')::smallint
  );
  RETURN NEW;
END;
$function$;
