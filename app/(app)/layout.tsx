import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/nav/app-nav";
import { listEmployees } from "@/lib/data/employees";
import { listSentimentOptions } from "@/lib/data/sentiment";

// Protected layout: a second auth gate behind the middleware (defense in depth).
// Also feeds the nav's global quick-add FAB (employees + active sentiment options).
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

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex-1">{children}</div>
      <AppNav
        employees={employees.map((e) => ({ id: e.id, name: e.name }))}
        sentiments={sentiments}
      />
    </div>
  );
}
