-- Allow admins to delete profiles
DROP POLICY IF EXISTS "profiles delete admin" ON public.profiles;

CREATE POLICY "profiles delete admin" ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
