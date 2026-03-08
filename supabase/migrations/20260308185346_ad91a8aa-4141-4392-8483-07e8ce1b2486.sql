
CREATE TABLE public.class_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_tag_id uuid NOT NULL REFERENCES public.class_tags(id) ON DELETE CASCADE,
  payment_reference text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_tag_id)
);

ALTER TABLE public.class_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own access"
  ON public.class_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert access"
  ON public.class_access FOR INSERT
  WITH CHECK (true);
