import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items) => {
          try {
            items.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
              });
            });
          } catch {
            // Server Components cannot write cookies; middleware refreshes sessions.
          }
        },
      },
    },
  );
}
