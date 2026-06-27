-- READ ONLY: run in Supabase SQL Editor and send the single JSON result to Codex.
-- This version does not assume Supabase CLI migration history exists.
select jsonb_pretty(jsonb_build_object(
  'owner_user', (
    select to_jsonb(u) from (
      select id, email, email_confirmed_at, created_at
      from auth.users
      where lower(email) = '12k21rakeshkannam@gmail.com'
      limit 1
    ) u
  ),
  'owner_profile', (
    select to_jsonb(p) from (
      select id, display_name, role, avatar_url, updated_at
      from public.profiles
      where id = (select id from auth.users where lower(email) = '12k21rakeshkannam@gmail.com' limit 1)
      limit 1
    ) p
  ),
  'legacy_admin_users', (
    select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
    from public.admin_users a
  ),
  'legacy_settings', (
    select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
    from public.settings s
  ),
  'relevant_columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', table_name,
      'column', column_name,
      'type', data_type,
      'nullable', is_nullable,
      'default', column_default
    ) order by table_name, ordinal_position), '[]'::jsonb)
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('profiles', 'admin_users', 'settings', 'orders', 'games', 'customer_proofs')
  ),
  'order_functions', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', p.proname,
      'arguments', pg_get_function_identity_arguments(p.oid),
      'returns', pg_get_function_result(p.oid),
      'definition', pg_get_functiondef(p.oid)
    )), '[]'::jsonb)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('create_store_order', 'activate_rakexura_owner', 'is_admin', 'current_user_role')
  ),
  'storage_buckets', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id,
      'public', public,
      'file_size_limit', file_size_limit,
      'allowed_mime_types', allowed_mime_types
    )), '[]'::jsonb)
    from storage.buckets
    where id in ('payment-proofs', 'avatars', 'game-images', 'review-media')
  ),
  'relevant_policies', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'schema', schemaname,
      'table', tablename,
      'policy', policyname,
      'roles', roles,
      'command', cmd,
      'using', qual,
      'check', with_check
    )), '[]'::jsonb)
    from pg_policies
    where (schemaname = 'public' and tablename in ('profiles', 'admin_users', 'settings', 'orders', 'customer_proofs'))
       or (schemaname = 'storage' and tablename = 'objects')
  ),
  'available_tables', (
    select coalesce(jsonb_agg(table_name order by table_name), '[]'::jsonb)
    from information_schema.tables
    where table_schema = 'public'
  )
)) as diagnostic;
