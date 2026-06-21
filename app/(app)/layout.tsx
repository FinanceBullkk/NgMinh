import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/nav/app-nav";
import { AppSidebar } from "@/components/nav/app-sidebar";
import { listEmployees } from "@/lib/data/employees";
import { listSentimentOptions } from "@/lib/data/sentiment";

// Protected layout: a second auth gate behind the middleware (defense in depth).
// Responsive shell: desktop (≥ lg) = left sidebar + scrollable main; mobile = centered
// column + bottom nav. Both feed the global quick-add (employees + active sentiments).
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [employees, sentiments] = await Promise.all([
    listEmployees(),
    listSentimentOptions(),
  ]);
  const people = employees.map((e) => ({ id: e.id, name: e.name }));

  return (
    <div className="lg:flex lg:h-dvh lg:overflow-hidden">
      <AppSidebar employees={people} sentiments={sentiments} userEmail={user.email ?? ""} />
      <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col lg:mx-0 lg:h-dvh lg:max-w-none lg:overflow-y-auto">
        <div className="flex-1">{children}</div>
        <AppNav employees={people} sentiments={sentiments} />
      </div>
    </div>
  );
}
