-- Leads are written only by the submitLead server function, which validates the input
-- and inserts with the service role (bypassing RLS). The public INSERT policy let anyone
-- holding the publishable key write rows straight through the REST API, skipping that
-- validation, so it is removed. Admin read/delete policies are unchanged.
DROP POLICY IF EXISTS "Anyone can submit a lead with consent" ON public.leads;
REVOKE INSERT, SELECT ON public.leads FROM anon;
REVOKE INSERT, UPDATE ON public.leads FROM authenticated;
