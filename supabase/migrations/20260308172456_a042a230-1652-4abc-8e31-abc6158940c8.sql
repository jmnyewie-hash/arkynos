
-- 1. Create admin role system (roles in separate table per security best practice)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Only admins can read user_roles, users can read their own
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add preferred column to resources
ALTER TABLE public.resources ADD COLUMN is_preferred BOOLEAN NOT NULL DEFAULT false;

-- Only admins can update resources (for marking preferred)
CREATE POLICY "Admins can update resources" ON public.resources
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 3. Add recommended_books to resource_type enum
ALTER TYPE public.resource_type ADD VALUE 'recommended_books';
