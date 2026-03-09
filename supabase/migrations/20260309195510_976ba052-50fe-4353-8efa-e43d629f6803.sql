
-- Junction table: courses can belong to multiple programmes with year/semester info
CREATE TABLE public.course_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  year smallint NOT NULL DEFAULT 1,
  semester smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, program_id)
);

ALTER TABLE public.course_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course programs are publicly readable"
  ON public.course_programs FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can manage course programs"
  ON public.course_programs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert courses
CREATE POLICY "Admins can insert courses"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update courses"
  ON public.courses FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage programs
CREATE POLICY "Admins can insert programs"
  ON public.programs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update programs"
  ON public.programs FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
