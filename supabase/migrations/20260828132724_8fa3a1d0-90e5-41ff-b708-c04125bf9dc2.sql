DROP POLICY IF EXISTS "Anyone can view published news" ON public.news;
DROP POLICY IF EXISTS "Admins can manage news" ON public.news;

CREATE POLICY "Anyone can view published news"
ON public.news FOR SELECT TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Admins can manage news"
ON public.news FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));