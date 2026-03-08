
-- Drop the overly permissive update policy
DROP POLICY "Anyone can increment downloads" ON public.resources;

-- Create a secure function to increment downloads
CREATE OR REPLACE FUNCTION public.increment_downloads(resource_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.resources SET downloads = downloads + 1 WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
