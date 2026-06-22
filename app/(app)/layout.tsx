import { AppNav } from "@/components/nav/app-nav";
import { AppSidebar } from "@/components/nav/app-sidebar";

// Static app shell (no server-side auth/data here) so client-rendered pages can be served
// from the CDN — navigation doesn't invoke the (far) serverless function. Auth is enforced
// by the edge middleware (proxy.ts → updateSession redirects unauthenticated to /login) and
// by RLS on every query. The sidebar reads the user email client-side.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex lg:h-dvh lg:overflow-hidden">
      <AppSidebar />
      <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col lg:mx-0 lg:h-dvh lg:max-w-none lg:overflow-y-auto">
        <div className="flex-1">{children}</div>
        <AppNav />
      </div>
    </div>
  );
}
