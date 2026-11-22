import { getUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await getUser(); // middleware already redirects unauthenticated users
  return <AppShell>{children}</AppShell>;
}
