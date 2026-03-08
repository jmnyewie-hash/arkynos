
-- Flag reason enum
CREATE TYPE public.flag_reason AS ENUM (
  'wrong_category',
  'inappropriate_content',
  'spam',
  'copyright_violation',
  'low_quality',
  'other'
);

-- Flag status enum
CREATE TYPE public.flag_status AS ENUM ('pending', 'resolved', 'dismissed');

-- Resource flags table
CREATE TABLE public.resource_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason flag_reason NOT NULL,
  description TEXT,
  status flag_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  UNIQUE(resource_id, flagged_by)
);

ALTER TABLE public.resource_flags ENABLE ROW LEVEL SECURITY;

-- Authenticated users can flag (insert)
CREATE POLICY "Users can flag resources" ON public.resource_flags
  FOR INSERT WITH CHECK (auth.uid() = flagged_by);

-- Users can see their own flags
CREATE POLICY "Users can view own flags" ON public.resource_flags
  FOR SELECT USING (auth.uid() = flagged_by);

-- Admins can see all flags
CREATE POLICY "Admins can view all flags" ON public.resource_flags
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update flags (resolve/dismiss)
CREATE POLICY "Admins can update flags" ON public.resource_flags
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Index for quick lookups
CREATE INDEX idx_resource_flags_resource_id ON public.resource_flags(resource_id);
CREATE INDEX idx_resource_flags_status ON public.resource_flags(status);
