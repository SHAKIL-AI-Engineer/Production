"use client";

import {
  AlertCircle,
  ArrowUpRight,
  Factory,
  LogIn,
  Package,
  ReceiptText,
  RefreshCw,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useOperations } from "@/components/operations/operations-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { money, number, type Summary } from "@/lib/reports";

export function ReportStatus({
  loading,
  error,
}: {
  loading: boolean;
  error: string;
}) {
  const { account, ready, signIn, refresh } = useOperations();
  if (error)
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4"
      >
        <AlertCircle className="size-5 shrink-0 text-destructive" />
        <p className="min-w-40 flex-1 text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  if (ready && !account)
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-card text-primary">
          <Factory className="size-6" />
        </span>
        <div className="min-w-40 flex-1">
          <h2 className="text-sm font-semibold">Your operations start here</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to view your factory’s reports and add your first record.
          </p>
        </div>
        <Button onClick={signIn}>
          <LogIn />
          Sign in to workspace
        </Button>
      </div>
    );
  if (loading)
    return (
      <p role="status" className="sr-only">
        Loading report…
      </p>
    );
  return null;
}

export function MetricCards({
  summary,
  loading,
  expenseCount,
  productionCount,
}: {
  summary: Summary | null;
  loading: boolean;
  expenseCount: number;
  productionCount: number;
}) {
  const cards = [
    {
      title: "Total production",
      value: summary ? number(summary.total_items_produced) : "—",
      unit: "items",
      note: `${number(productionCount)} production records`,
      icon: Package,
      color: "text-primary bg-primary/10",
    },
    {
      title: "Production value",
      value: summary ? money(summary.total_production_value) : "—",
      unit: "",
      note: "Estimated at $25 per item",
      icon: Factory,
      color: "text-blue-700 bg-blue-500/10 dark:text-blue-300",
    },
    {
      title: "Total expenses",
      value: summary ? money(summary.total_expense) : "—",
      unit: "",
      note: `${number(expenseCount)} expense records`,
      icon: ReceiptText,
      color: "text-amber-700 bg-amber-500/10 dark:text-amber-300",
    },
    {
      title: "Estimated net",
      value: summary ? money(summary.net_profit) : "—",
      unit: "",
      note: "Production value less expenses",
      icon: Wallet,
      color: "text-primary bg-primary/10",
    },
  ];
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 min-[460px]:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div className="panel p-5" key={card.title}>
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="text-xs font-medium text-muted-foreground">
              {card.title}
            </h2>
            <span
              className={`flex size-8 items-center justify-center rounded-lg ${card.color}`}
            >
              <card.icon className="size-4" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="my-1 h-8 w-32" />
          ) : (
            <p className="flex flex-wrap items-baseline gap-1.5 text-[27px] font-semibold tracking-tight tabular-nums">
              {card.value}
              <span className="text-xs font-normal tracking-normal text-muted-foreground">
                {card.unit}
              </span>
            </p>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            {summary ? card.note : "Waiting for report data"}
          </p>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title = "No records in this period",
  description = "Choose a different date range or add a new record to get started.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-2xl border bg-background text-muted-foreground">
        <ReceiptText className="size-5" />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ReportLinks() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        {
          title: "Daily production",
          text: "Keep every batch accounted for.",
          url: "/dashboard/production",
          icon: Factory,
        },
        {
          title: "Monthly expenses",
          text: "See where your money goes.",
          url: "/dashboard/monthly-expenses",
          icon: ReceiptText,
        },
        {
          title: "Summary report",
          text: "Connect output with spending.",
          url: "/dashboard/summary",
          icon: Wallet,
        },
      ].map((item) => (
        <Link
          href={item.url}
          key={item.url}
          className="panel group flex items-center gap-3 p-4 transition-colors hover:border-primary/40"
        >
          <item.icon className="size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-semibold">{item.title}</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {item.text}
            </p>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}
