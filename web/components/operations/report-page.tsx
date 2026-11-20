"use client";

import { useState } from "react";
import {
  CalendarDays,
  Download,
  Factory,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useReportData } from "@/hooks/use-report-data";
import {
  dailySeries,
  dateLabel,
  expenseCategories,
  exportCsv,
  localDate,
  money,
  monthRange,
  number,
  type Expense,
  type Summary,
} from "@/lib/reports";
import { useOperations } from "@/components/operations/operations-provider";
import {
  ReportStatus,
  MetricCards,
  ReportLinks,
  EmptyState,
} from "@/components/operations/report-ui";
import {
  CategoryBreakdown,
  TrendChart,
} from "@/components/operations/report-charts";
import {
  RecentActivity,
  RecordsTable,
} from "@/components/operations/records-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type Mode = "overview" | "production" | "expense" | "monthly" | "summary";
const copy: Record<
  Mode,
  { eyebrow: string; title: string; description: string }
> = {
  overview: {
    eyebrow: "Your operations, in focus",
    title: "Your factory, at a glance.",
    description:
      "A little clarity for your everyday output, spending, and performance.",
  },
  production: {
    eyebrow: "Production reports",
    title: "Daily production",
    description:
      "Every batch, every shift. Keep your factory output in one place.",
  },
  expense: {
    eyebrow: "Expense reports",
    title: "Daily expenses",
    description: "A clear record of what you spend to keep things moving.",
  },
  monthly: {
    eyebrow: "Expense reports",
    title: "Monthly expenses",
    description:
      "Follow your monthly spending and understand the bigger picture.",
  },
  summary: {
    eyebrow: "Performance reports",
    title: "Summary",
    description:
      "Bring your production and expenses together for a clearer view.",
  },
};

export function ReportPage({ mode }: { mode: Mode }) {
  const { account, ready, refresh, openRecord } = useOperations();
  const [today] = useState(() => localDate());
  const [month, setMonth] = useState(() => localDate().slice(0, 7));
  const [startDate, setStartDate] = useState(() => localDate());
  const [endDate, setEndDate] = useState(() => localDate());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const daily = mode === "production" || mode === "expense";
  const range = daily ? { start: startDate, end: endDate } : monthRange(month);
  const data = useReportData(range.start, range.end);
  const available = Boolean(account && !data.loading && !data.error);
  const productions = data.productions.filter((row) =>
    `${row.notes ?? ""} ${row.units} ${row.items_produced}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const expenses = data.expenses.filter(
    (row) =>
      `${row.description ?? ""} ${row.category} ${row.amount}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (category === "all" || row.category === category),
  );
  // Avoid drawing future calendar days as a drop to zero. Include any
  // future-dated records so the chart still accounts for the monthly totals.
  let latestRecordedDate = today;
  for (const row of data.productions) {
    const date = row.production_date.slice(0, 10);
    if (date > latestRecordedDate) latestRecordedDate = date;
  }
  for (const row of data.expenses) {
    const date = row.expense_date.slice(0, 10);
    if (date > latestRecordedDate) latestRecordedDate = date;
  }
  const trendEnd =
    range.end < latestRecordedDate ? range.end : latestRecordedDate;
  const series = daily
    ? []
    : dailySeries(range.start, trendEnd, data.productions, data.expenses);
  const hasData =
    available && Boolean(data.productions.length || data.expenses.length);
  const text = copy[mode];
  const periodLabel = daily
    ? `${dateLabel(range.start)} – ${dateLabel(range.end)}`
    : dateLabel(range.start, { month: "long", year: "numeric" });
  const unitCount = new Set(data.productions.map((row) => row.units)).size;
  if (!ready)
    return (
      <div role="status" aria-label="Loading workspace" className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-80 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((value) => (
            <Skeleton key={value} className="h-40 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow mb-3">{text.eyebrow}</p>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">
            {text.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {text.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!daily && (
            <div className="flex h-10 items-center gap-2 rounded-lg border bg-card px-3">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <Label htmlFor="report-month" className="sr-only">
                Report month
              </Label>
              <input
                className="w-36 bg-transparent text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                id="report-month"
                type="month"
                value={month}
                onChange={(event) => {
                  if (/^\d{4}-\d{2}$/.test(event.target.value))
                    setMonth(event.target.value);
                }}
                required
              />
            </div>
          )}
          {daily && (
            <Button
              onClick={() =>
                openRecord({
                  kind: mode === "production" ? "production" : "expense",
                })
              }
            >
              <Plus />
              {mode === "production" ? "Add production" : "Add expense"}
            </Button>
          )}
          {!daily && (
            <Button
              variant="outline"
              className="bg-card"
              disabled={!available || !hasData}
              onClick={() => {
                if (mode === "monthly") {
                  exportCsv(
                    `monthly-expenses-${month}.csv`,
                    ["Date", "Category", "Amount (USD)", "Description"],
                    data.expenses.map((row) => [
                      row.expense_date.slice(0, 10),
                      row.category,
                      row.amount,
                      row.description ?? "",
                    ]),
                  );
                  return;
                }
                const summary = data.summary;
                if (summary)
                  exportCsv(
                    `${mode}-${month}.csv`,
                    ["Metric", "Value", "Basis"],
                    [
                      ["Period", month, "Calendar month"],
                      [
                        "Total items",
                        summary.total_items_produced,
                        "Recorded quantity across units",
                      ],
                      [
                        "Estimated production value (USD)",
                        summary.total_production_value,
                        "$25 per item",
                      ],
                      [
                        "Expenses (USD)",
                        summary.total_expense,
                        "Recorded expenses",
                      ],
                      [
                        "Estimated net (USD)",
                        summary.net_profit,
                        "Estimated value less expenses",
                      ],
                    ],
                  );
              }}
            >
              <Download />
              Export report
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`size-1.5 rounded-full ${available ? "bg-primary" : "bg-muted-foreground"}`}
          />
          <span>
            {available
              ? `Report for ${periodLabel}`
              : ready && !account
                ? "Workspace sign-in required"
                : "Loading your report"}
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">All amounts in USD</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={data.loading || !account}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw className={data.loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
      <ReportStatus loading={data.loading} error={data.error} />
      {daily ? (
        <>
          <section
            aria-label="Report filters"
            className="panel flex flex-wrap items-end gap-4 p-4 sm:p-5"
          >
            <div className="flex w-full items-center gap-2 text-xs font-semibold sm:hidden">
              <SlidersHorizontal className="size-4" />
              Filter records
            </div>
            <div className="min-w-0 flex-1 basis-32 space-y-2">
              <Label htmlFor="start-date" className="text-xs">
                From
              </Label>
              <Input
                className="bg-background/40 text-xs"
                id="start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => {
                  if (event.target.value) setStartDate(event.target.value);
                }}
              />
            </div>
            <div className="min-w-0 flex-1 basis-32 space-y-2">
              <Label htmlFor="end-date" className="text-xs">
                To
              </Label>
              <Input
                className="bg-background/40 text-xs"
                id="end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => {
                  if (event.target.value) setEndDate(event.target.value);
                }}
              />
            </div>
            {mode === "expense" && (
              <div className="min-w-0 flex-1 basis-36 space-y-2">
                <Label className="text-xs" htmlFor="category-filter">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger
                    id="category-filter"
                    className="bg-background/40"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {Array.from(
                      new Set(data.expenses.map((row) => row.category)),
                    )
                      .sort()
                      .map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="min-w-0 flex-[2] basis-48 space-y-2">
              <Label htmlFor="record-search" className="text-xs">
                Search records
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="record-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    mode === "production"
                      ? "Search notes, units, quantity…"
                      : "Search category or description…"
                  }
                  className="bg-background/40 pl-9 text-xs"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate(today);
                setEndDate(today);
                setSearch("");
                setCategory("all");
              }}
            >
              Reset
            </Button>
          </section>
          <DailyMetrics
            mode={mode}
            productions={productions}
            expenses={expenses}
            loading={data.loading}
            available={available}
          />
          {mode === "production" ? (
            <RecordsTable
              key={`${range.start}:${range.end}:${search}`}
              kind="production"
              rows={productions}
              loading={data.loading}
              disabled={!available}
            />
          ) : (
            <RecordsTable
              key={`${range.start}:${range.end}:${search}:${category}`}
              kind="expense"
              rows={expenses}
              loading={data.loading}
              disabled={!available}
            />
          )}
        </>
      ) : mode === "monthly" ? (
        <>
          <ExpenseMetrics
            expenses={data.expenses}
            loading={data.loading}
            available={available}
          />
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
            <TrendChart
              data={series}
              loading={data.loading}
              expenseOnly
              hasData={available && data.expenses.length > 0}
            />
            <CategoryBreakdown
              expenses={data.expenses}
              loading={data.loading}
            />
          </div>
          <MonthlyLedger
            expenses={data.expenses}
            month={month}
            loading={data.loading}
          />
        </>
      ) : (
        <>
          <MetricCards
            summary={available ? data.summary : null}
            loading={data.loading}
            expenseCount={data.expenses.length}
            productionCount={data.productions.length}
          />
          {unitCount > 1 && (
            <p className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
              This period contains multiple production units. Total production
              combines recorded quantities; compare individual units in the
              daily production report.
            </p>
          )}
          {mode === "summary" && (
            <FinancialSummary
              summary={available ? data.summary : null}
              loading={data.loading}
            />
          )}
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
            <TrendChart
              data={series}
              loading={data.loading}
              hasData={hasData}
            />
            <CategoryBreakdown
              expenses={data.expenses}
              loading={data.loading}
            />
          </div>
          {mode === "overview" ? (
            <>
              <RecentActivity
                productions={data.productions}
                expenses={data.expenses}
                loading={data.loading}
              />
              <ReportLinks />
            </>
          ) : (
            <CategoryLedger expenses={data.expenses} loading={data.loading} />
          )}
        </>
      )}
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <Factory className="mt-0.5 size-3.5 shrink-0" />
        {daily || mode === "monthly"
          ? "Reports reflect your selected dates and visible records. Amounts are recorded in USD."
          : "Production value and net are estimates using the API’s fixed $25 per recorded item, across all units. These figures do not represent realized sales or accounting profit."}
      </p>
    </>
  );
}

function MiniMetrics({
  cards,
  loading,
}: {
  cards: { label: string; value: string; detail: string }[];
  loading: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div className="panel p-5" key={card.label}>
          <p className="text-xs text-muted-foreground">{card.label}</p>
          {loading ? (
            <Skeleton className="mt-4 h-8 w-28" />
          ) : (
            <p className="mt-3 break-words text-2xl font-semibold tracking-tight tabular-nums">
              {card.value}
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            {card.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function DailyMetrics({
  mode,
  productions,
  expenses,
  loading,
  available,
}: {
  mode: "production" | "expense";
  productions: import("@/lib/reports").Production[];
  expenses: Expense[];
  loading: boolean;
  available: boolean;
}) {
  const units = new Map<string, number>();
  for (const row of productions)
    units.set(row.units, (units.get(row.units) ?? 0) + row.items_produced);
  const quantities = Array.from(
    units,
    ([unit, quantity]) => `${number(quantity)} ${unit}`,
  ).join(" · ");
  const total = expenses.reduce((sum, row) => sum + row.amount, 0);
  return mode === "production" ? (
    <MiniMetrics
      loading={loading}
      cards={[
        {
          label: "Recorded output",
          value: available ? quantities || "0 items" : "—",
          detail: "Matching records · grouped by unit",
        },
        {
          label: "Production entries",
          value: available ? number(productions.length) : "—",
          detail: "Within your current filters",
        },
        {
          label: "Active production days",
          value: available
            ? number(
                new Set(
                  productions.map((row) => row.production_date.slice(0, 10)),
                ).size,
              )
            : "—",
          detail: "Days with recorded output",
        },
      ]}
    />
  ) : (
    <MiniMetrics
      loading={loading}
      cards={[
        {
          label: "Total expenses",
          value: available ? money(total) : "—",
          detail: "Matching records · USD",
        },
        {
          label: "Expense entries",
          value: available ? number(expenses.length) : "—",
          detail: "Within your current filters",
        },
        {
          label: "Average expense",
          value: available
            ? money(expenses.length ? total / expenses.length : 0)
            : "—",
          detail: "Average per matching entry",
        },
      ]}
    />
  );
}

function ExpenseMetrics({
  expenses,
  loading,
  available,
}: {
  expenses: Expense[];
  loading: boolean;
  available: boolean;
}) {
  const total = expenses.reduce((sum, row) => sum + row.amount, 0);
  const days = new Set(expenses.map((row) => row.expense_date.slice(0, 10)))
    .size;
  return (
    <MiniMetrics
      loading={loading}
      cards={[
        {
          label: "Monthly spending",
          value: available ? money(total) : "—",
          detail: `${expenses.length} recorded expenses`,
        },
        {
          label: "Average per spending day",
          value: available ? money(days ? total / days : 0) : "—",
          detail: `${days} days with recorded expenses`,
        },
        {
          label: "Expense categories",
          value: available
            ? number(new Set(expenses.map((row) => row.category)).size)
            : "—",
          detail: "Distinct categories this month",
        },
      ]}
    />
  );
}

function MonthlyLedger({
  expenses,
  month,
  loading,
}: {
  expenses: Expense[];
  month: string;
  loading: boolean;
}) {
  const days = new Map<
    string,
    { count: number; amount: number; categories: Set<string> }
  >();
  for (const row of expenses) {
    const key = row.expense_date.slice(0, 10);
    const day = days.get(key) ?? {
      count: 0,
      amount: 0,
      categories: new Set<string>(),
    };
    day.count++;
    day.amount += row.amount;
    day.categories.add(row.category);
    days.set(key, day);
  }
  const rows = Array.from(days, ([date, day]) => ({ date, ...day })).sort(
    (a, b) => b.date.localeCompare(a.date),
  );
  return (
    <section className="panel overflow-hidden">
      <div className="panel-heading items-center">
        <div>
          <h2 className="text-sm font-semibold">Daily spending ledger</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A day-by-day view of this month
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || !rows.length}
          onClick={() =>
            exportCsv(
              `monthly-expenses-${month}.csv`,
              ["Date", "Entries", "Categories", "Total (USD)"],
              rows.map((row) => [
                row.date,
                row.count,
                Array.from(row.categories).join(", "),
                row.amount,
              ]),
            )
          }
        >
          <Download />
          Export CSV
        </Button>
      </div>
      {loading ? (
        <div className="p-6">
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !rows.length ? (
        <EmptyState title="No spending recorded this month" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="pl-6 text-xs">Date</TableHead>
              <TableHead className="text-xs">Entries</TableHead>
              <TableHead className="text-xs">Categories</TableHead>
              <TableHead className="pr-6 text-right text-xs">
                Total (USD)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.date} className="h-14">
                <TableCell className="whitespace-nowrap pl-6 text-xs font-medium">
                  {dateLabel(row.date, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-xs">{row.count}</TableCell>
                <TableCell className="min-w-48 whitespace-normal text-xs text-muted-foreground">
                  {Array.from(row.categories).join(", ")}
                </TableCell>
                <TableCell className="pr-6 text-right text-xs font-semibold tabular-nums">
                  {money(row.amount)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell className="pl-6 text-xs" colSpan={3}>
                Monthly total
              </TableCell>
              <TableCell className="pr-6 text-right text-xs tabular-nums">
                {money(expenses.reduce((sum, row) => sum + row.amount, 0))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </section>
  );
}

function FinancialSummary({
  summary,
  loading,
}: {
  summary: Summary | null;
  loading: boolean;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2 className="text-sm font-semibold">
            Production & expense statement
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            An operational estimate for the selected month
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary">
          Estimated
        </span>
      </div>
      {loading ? (
        <div className="p-6">
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-4 p-5 text-sm sm:p-6">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              Estimated production value{" "}
              <span className="text-xs">($25 / item)</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {summary ? money(summary.total_production_value) : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Recorded expenses</span>
            <span className="shrink-0 font-medium tabular-nums">
              {summary ? money(summary.total_expense) : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-t pt-4 font-semibold">
            <span>Estimated net</span>
            <span
              className={`shrink-0 tabular-nums ${summary && summary.net_profit < 0 ? "text-destructive" : "text-primary"}`}
            >
              {summary ? money(summary.net_profit) : "—"}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function CategoryLedger({
  expenses,
  loading,
}: {
  expenses: Expense[];
  loading: boolean;
}) {
  const rows = expenseCategories(expenses);
  const total = expenses.reduce((sum, row) => sum + row.amount, 0);
  return (
    <section className="panel overflow-hidden">
      <div className="panel-heading">
        <div>
          <h2 className="text-sm font-semibold">Category summary</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Compare each category’s share of expenses
          </p>
        </div>
      </div>
      {loading ? (
        <div className="p-6">
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !rows.length ? (
        <EmptyState title="No category totals yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="pl-6 text-xs">Category</TableHead>
              <TableHead className="text-right text-xs">Share</TableHead>
              <TableHead className="pr-6 text-right text-xs">
                Amount (USD)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.category} className="h-14">
                <TableCell className="pl-6 text-xs font-medium">
                  {row.category}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {total ? ((row.amount / total) * 100).toFixed(1) : "0.0"}%
                </TableCell>
                <TableCell className="pr-6 text-right text-xs tabular-nums">
                  {money(row.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
