
CREATE TABLE public.class_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name)
);

ALTER TABLE public.class_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class tags are publicly readable" ON public.class_tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create class tags" ON public.class_tags FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

ALTER TABLE public.resources ADD COLUMN class_tag_id uuid REFERENCES public.class_tags(id) ON DELETE SET NULL;
