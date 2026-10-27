import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  allowed: boolean;
};

// The same profiles table dashboard.gomcgrath.com uses. Admins and the
// maintenance role get in; everyone else sees a no-access page.
export async function getUser(): Promise<User | null> {
  const devUser = devBypass();
  if (devUser) return devUser;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb
    .from("esther_profiles")
    .select("full_name, email, role, hidden_tabs")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(profile?.role ?? "store");
  const hidden = (profile?.hidden_tabs ?? []) as string[];
  const email = profile?.email ?? user.email ?? "";
  return {
    id: user.id,
    name: profile?.full_name || email || "User",
    email,
    role,
    allowed: role === "admin" || (role === "maintenance" && !hidden.includes("/maintenance")),
  };
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

// For server actions: never trust the client, re-check the person every time.
export async function requireAllowedUser(): Promise<User> {
  const user = await requireUser();
  if (!user.allowed) throw new Error("You do not have access to Facility Maintenance.");
  return user;
}

// Local development only: lets the console be clicked through without a
// Supabase login. Ignored in any production build.
function devBypass(): User | null {
  const name = process.env.FACILITY_DEV_USER?.trim();
  if (!name || process.env.NODE_ENV === "production") return null;
  return { id: "dev", name, email: "dev@localhost", role: "admin", allowed: true };
}
