
-- Add Mad As Math columns to resources
ALTER TABLE public.resources
  ADD COLUMN is_mad_math boolean NOT NULL DEFAULT false,
  ADD COLUMN show_in_general boolean NOT NULL DEFAULT false;
