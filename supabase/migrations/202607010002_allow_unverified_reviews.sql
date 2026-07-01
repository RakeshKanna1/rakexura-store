-- Allow all logged-in users to review games, but mark verified_purchase = false if they do not own the game
create or replace function public.submit_verified_review(
  p_game_id bigint,
  p_rating integer,
  p_message text,
  p_media_urls text[] default '{}'
) returns bigint language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order_id bigint;
  v_review_id bigint;
  v_customer_name text;
  v_verified boolean := false;
begin
  if v_user is null then raise exception 'Sign in to review a game'; end if;
  if p_rating < 1 or p_rating > 5 then raise exception 'Rating must be between 1 and 5'; end if;
  if char_length(trim(p_message)) < 10 or char_length(trim(p_message)) > 1200 then
    raise exception 'Review must be between 10 and 1200 characters';
  end if;

  -- Try to find a delivered or completed order for this game
  select o.id into v_order_id
  from public.orders o
  where o.user_id = v_user
    and lower(coalesce(o.order_status, o.payment_status, '')) in ('delivered', 'completed')
    and (
      o.game_id = p_game_id
      or exists (
        select 1 from jsonb_array_elements(coalesce(o.cart_items, '[]'::jsonb)) line
        where line->>'game_id' = p_game_id::text
      )
    )
  order by o.created_at desc
  limit 1;

  -- Set verified to true if order is found or it exists in their library
  if v_order_id is not null or exists (
    select 1 from public.customer_library l where l.user_id = v_user and l.game_id = p_game_id
  ) then
    v_verified := true;
  end if;

  select coalesce(nullif(trim(display_name), ''), case when v_verified then 'Verified customer' else 'Rakexura customer' end) into v_customer_name
  from public.profiles where id = v_user;

  insert into public.reviews (game_id, customer_name, rating, message, approved, user_id, order_id, verified_purchase, media_urls)
  values (p_game_id, v_customer_name, p_rating, trim(p_message), false, v_user, v_order_id, v_verified, coalesce(p_media_urls, '{}'))
  on conflict (user_id, game_id) where user_id is not null do update
    set rating = excluded.rating,
        message = excluded.message,
        order_id = excluded.order_id,
        verified_purchase = excluded.verified_purchase,
        media_urls = excluded.media_urls,
        approved = false,
        created_at = now()
  returning id into v_review_id;

  return v_review_id;
end; $$;
