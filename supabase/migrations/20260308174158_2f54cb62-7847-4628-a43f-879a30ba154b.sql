CREATE POLICY "Admins can delete resources" ON public.resources FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete flags for deleted resources" ON public.resource_flags FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));