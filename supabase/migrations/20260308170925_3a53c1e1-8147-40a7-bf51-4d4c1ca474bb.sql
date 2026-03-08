
-- Create programs table for university → department → program hierarchy
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university TEXT NOT NULL,
  department TEXT NOT NULL,
  program_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(university, department, program_name)
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programs are publicly readable" ON public.programs FOR SELECT USING (true);

-- Add program_id to courses
ALTER TABLE public.courses ADD COLUMN program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL;

-- Remove old unique constraint on course_code (some codes appear in multiple programs)
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_course_code_key;

-- Add composite unique: course_code + program
ALTER TABLE public.courses ADD CONSTRAINT courses_code_program_unique UNIQUE(course_code, program_id);

-- Create index on program_id
CREATE INDEX idx_courses_program_id ON public.courses(program_id);
