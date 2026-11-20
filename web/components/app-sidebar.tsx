"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Factory, Layers3, X } from "lucide-react";
import { navigation } from "@/lib/navigation";
import { AccountMenu } from "@/components/operations/account-menu";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  function item(entry: (typeof navigation)[number]) {
    const active = pathname === entry.url;
    return (
      <SidebarMenuItem key={entry.url}>
        <SidebarMenuButton
          asChild
          isActive={active}
          className="h-11 gap-3 rounded-lg px-3 text-sm font-medium data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-none"
        >
          <Link
            href={entry.url}
            aria-current={active ? "page" : undefined}
            onClick={() => setOpenMobile(false)}
          >
            <entry.icon className="size-[18px]" />
            <span>{entry.title}</span>
            {active && (
              <span className="ml-auto size-1.5 rounded-full bg-primary" />
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="px-5 py-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={() => setOpenMobile(false)}
            className="flex items-center gap-3 rounded-lg outline-offset-4"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Factory className="size-6" />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">
                FactoryOps<span className="text-primary">.</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                Production & finance
              </span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close navigation"
            className="md:hidden"
            onClick={() => setOpenMobile(false)}
          >
            <X />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-6 px-4 py-3">
        <div className="mb-1 flex items-center gap-3 rounded-xl border bg-card/70 p-3">
          <div className="flex size-8 items-center justify-center rounded-lg border bg-background">
            <Layers3 className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">Factory workspace</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Your operations, connected
            </p>
          </div>
        </div>
        <nav aria-label="Main navigation" className="space-y-7">
          <div>
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Workspace
            </p>
            <SidebarMenu>{item(navigation[0])}</SidebarMenu>
          </div>
          <Collapsible defaultOpen className="group/reports">
            <CollapsibleTrigger className="mb-3 flex w-full items-center justify-between rounded px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
              Reports
              <ChevronDown className="size-3.5 transition-transform group-data-[state=closed]/reports:-rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu className="gap-1">
                {navigation
                  .filter((entry) => entry.section === "reports")
                  .map(item)}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
          <div>
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Preferences
            </p>
            <SidebarMenu>{item(navigation[navigation.length - 1])}</SidebarMenu>
          </div>
        </nav>
        <div className="mt-auto rounded-xl border border-primary/15 bg-primary/5 p-4">
          <span className="mb-2 flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Factory className="size-4" />
          </span>
          <p className="text-xs font-semibold">A clearer view of every day.</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Turn daily production and expenses into better decisions.
          </p>
          <Link
            href="/dashboard/summary"
            onClick={() => setOpenMobile(false)}
            className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
          >
            View your summary →
          </Link>
        </div>
      </SidebarContent>
      <SidebarFooter className="mt-4 border-t px-4 py-3">
        <AccountMenu expanded />
      </SidebarFooter>
    </Sidebar>
  );
}
