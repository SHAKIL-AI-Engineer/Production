"use client";

import Link from "next/link";
import {
  ChevronsUpDown,
  LogIn,
  LogOut,
  Settings2,
  UserRound,
} from "lucide-react";
import { useOperations } from "@/components/operations/operations-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu({ expanded = false }: { expanded?: boolean }) {
  const { account, ready, signIn, signOut } = useOperations();
  if (!account)
    return (
      <Button
        disabled={!ready}
        variant={expanded ? "outline" : "ghost"}
        onClick={signIn}
        className={expanded ? "w-full justify-start bg-card" : "px-2 sm:px-3"}
      >
        <LogIn />
        <span className={expanded ? "" : "hidden sm:inline"}>Sign in</span>
        {!expanded && <span className="sr-only sm:hidden">Sign in</span>}
      </Button>
    );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Open account menu"
          className={
            expanded
              ? "h-auto w-full justify-start gap-3 px-2 py-3"
              : "size-10 p-0"
          }
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-primary/10 text-xs font-semibold uppercase text-primary">
            {account.email.slice(0, 2)}
          </span>
          {expanded && (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium">
                  {account.email.split("@")[0]}
                </span>
                <span className="block truncate text-xs font-normal capitalize text-muted-foreground">
                  {account.role} account
                </span>
              </span>
              <ChevronsUpDown className="text-muted-foreground" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side={expanded ? "top" : "bottom"}
        className="w-64 max-w-[calc(100vw-2rem)]"
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <UserRound className="size-4 shrink-0" />
          <span className="truncate">{account.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings2 className="mr-2 size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
