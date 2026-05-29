-- Create function to update updated_at column (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for landing page configurations
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL DEFAULT 'builder' CHECK (page_type IN ('builder', 'html')),
  sections JSONB DEFAULT '[]'::jsonb,
  custom_html TEXT,
  custom_css TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- Enable Row Level Security
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (published pages only)
CREATE POLICY "Anyone can view published landing pages"
ON public.landing_pages
FOR SELECT
USING (is_published = true);

-- Create policy for event organizers to manage landing pages
CREATE POLICY "Event organizers can manage landing pages"
ON public.landing_pages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.event_organizers
    WHERE event_organizers.event_id = landing_pages.event_id
    AND event_organizers.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment describing the sections JSONB structure
COMMENT ON COLUMN public.landing_pages.sections IS 'Array of section objects: [{type: "hero"|"about"|"speakers"|"agenda"|"sponsors"|"cta", config: {...}, order: number}]';