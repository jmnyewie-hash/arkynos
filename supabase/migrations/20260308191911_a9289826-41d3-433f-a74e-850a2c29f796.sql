ALTER TABLE public.class_tags ADD COLUMN is_preferred boolean NOT NULL DEFAULT false;

CREATE POLICY "Admins can update class tags"
  ON public.class_tags FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
