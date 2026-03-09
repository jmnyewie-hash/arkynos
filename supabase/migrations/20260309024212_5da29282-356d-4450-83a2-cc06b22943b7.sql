
-- Make course_id nullable for Mad As Math resources (they don't belong to courses)
ALTER TABLE public.resources ALTER COLUMN course_id DROP NOT NULL;

-- Add subject and topic fields for Mad As Math
ALTER TABLE public.resources
  ADD COLUMN mad_math_subject text,
  ADD COLUMN mad_math_topic text;
