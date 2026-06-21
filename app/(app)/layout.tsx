import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/nav/app-nav";
import { AppSidebar } from "@/components/nav/app-sidebar";

// Protected layout: a second auth gate behind the middleware (defense in depth).
// Uses getClaims() (verifies the JWT signature — secure, and local when the project uses
// asymmetric signing keys) instead of a second network getUser() per navigation. The
// middleware already does the full getUser() refresh on each request.
// Quick-add data is loaded lazily on open (see actions/quick-add), so navigations stay light.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) redirect("/login");
  const userEmail = typeof claims.email === "string" ? claims.email : "";

  return (
    <div className="lg:flex lg:h-dvh lg:overflow-hidden">
      <AppSidebar userEmail={userEmail} />
      <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col lg:mx-0 lg:h-dvh lg:max-w-none lg:overflow-y-auto">
        <div className="flex-1">{children}</div>
        <AppNav />
      </div>
    </div>
  );
}
