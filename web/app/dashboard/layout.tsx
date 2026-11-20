import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { OperationsProvider } from "@/components/operations/operations-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OperationsProvider>
      <SidebarProvider
        style={{ "--sidebar-width": "16.5rem" } as React.CSSProperties}
      >
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-primary p-3 text-primary-foreground focus:not-sr-only"
        >
          Skip to content
        </a>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <SiteHeader />
          <div
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-4 outline-none sm:p-6 lg:p-8"
          >
            {children}
          </div>
          <footer className="mx-4 flex flex-wrap items-center justify-between gap-2 border-t py-5 text-[11px] text-muted-foreground sm:mx-6 lg:mx-8">
            <span>FactoryOps · Production & finance</span>
            <span>Built for a better working day.</span>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </OperationsProvider>
  );
}
