import "server-only";
import { getUser, type User } from "@/lib/auth";
import { redirect } from "next/navigation";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

// Signed in and allowed, or null (the page shows NoAccess).
export async function access(): Promise<User | null> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user.allowed ? user : null;
}

// A page's data, or the reason it could not be loaded.
export async function attempt<T>(load: () => Promise<T>): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    return { data: await load(), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "The maintenance service could not be reached." };
  }
}

export function withStore(href: string, store: string): string {
  if (!store) return href;
  return `${href}${href.includes("?") ? "&" : "?"}store=${encodeURIComponent(store)}`;
}
