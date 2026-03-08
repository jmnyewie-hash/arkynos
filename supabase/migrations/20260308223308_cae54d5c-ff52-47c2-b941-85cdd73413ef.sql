
-- Create user_library table for personal saved resources
CREATE TABLE public.user_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);

ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

-- Users can only see their own library
CREATE POLICY "Users can read own library"
  ON public.user_library FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add to their own library
CREATE POLICY "Users can add to own library"
  ON public.user_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own library
CREATE POLICY "Users can remove from own library"
  ON public.user_library FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
