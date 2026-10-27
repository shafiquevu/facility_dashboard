import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// One sign-in for dashboard.gomcgrath.com and this app: both use the same
// Supabase project, and in production the session cookie is set on the parent
// domain (AUTH_COOKIE_DOMAIN=.gomcgrath.com) so each app can read it.
export function cookieOptions(): CookieOptions | undefined {
  const domain = process.env.AUTH_COOKIE_DOMAIN?.trim();
  return domain ? { domain } : undefined;
}

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: cookieOptions(),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component; the proxy refreshes the session.
          }
        },
      },
    },
  );
}
