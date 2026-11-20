"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Factory, Plus, ReceiptText, Search } from "lucide-react";
import { navigation } from "@/lib/navigation";
import { useOperations } from "@/components/operations/operations-provider";
import { ThemeMenu } from "@/components/operations/theme-menu";
import { AccountMenu } from "@/components/operations/account-menu";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { openRecord } = useOperations();
  const [search, setSearch] = useState(false);
  const page =
    navigation.find((item) => item.url === pathname)?.title ?? "Workspace";
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearch((value) => !value);
      }
    }
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);
  return (
    <>
      <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between gap-2 border-b bg-card/95 px-4 backdrop-blur-lg lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <SidebarTrigger className="size-10 shrink-0 text-muted-foreground" />
          <div className="hidden h-5 w-px bg-border sm:block" />
          <span className="hidden text-xs text-muted-foreground xl:inline">
            Workspace
          </span>
          <ChevronRight className="hidden size-3.5 text-muted-foreground xl:block" />
          <span className="truncate text-sm font-medium">{page}</span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => setSearch(true)}
            aria-label="Search pages"
            className="size-10 text-muted-foreground lg:h-9 lg:w-48 lg:justify-start lg:border lg:bg-background"
          >
            <Search />
            <span className="hidden text-xs lg:inline">Search anything…</span>
            <kbd className="ml-auto hidden rounded border bg-card px-1 text-[10px] lg:inline">
              ⌘ K
            </kbd>
          </Button>
          <ThemeMenu />
          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                aria-label="New entry"
                className="size-9 rounded-lg p-0 sm:w-auto sm:px-3"
              >
                <Plus />
                <span className="hidden sm:inline">New entry</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Add a record</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => openRecord({ kind: "production" })}
              >
                <Factory className="mr-2 size-4" />
                Record production
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => openRecord({ kind: "expense" })}
              >
                <ReceiptText className="mr-2 size-4" />
                Record expense
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AccountMenu />
        </div>
      </header>
      <CommandDialog open={search} onOpenChange={setSearch}>
        <CommandInput placeholder="Find a page…" />
        <CommandList>
          <CommandEmpty>No pages found.</CommandEmpty>
          <CommandGroup heading="Go to page">
            {navigation.map((item) => (
              <CommandItem
                key={item.url}
                onSelect={() => {
                  setSearch(false);
                  router.push(item.url);
                }}
              >
                <item.icon />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
