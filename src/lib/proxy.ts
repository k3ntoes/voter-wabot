import "server-only";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";

export async function requireAuth() {
  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function redirectIfAuthenticated() {
  const session = await verifySession();
  if (session) {
    redirect("/dashboard");
  }
}
