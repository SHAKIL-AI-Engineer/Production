"use client";

import { useId, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  dateLabel,
  expenseCategories,
  money,
  number,
  type Expense,
  type dailySeries,
} from "@/lib/reports";
import { EmptyState } from "@/components/operations/report-ui";
import { Skeleton } from "@/components/ui/skeleton";

type Series = ReturnType<typeof dailySeries>;
export function TrendChart({
  data,
  loading,
  expenseOnly = false,
  hasData,
}: {
  data: Series;
  loading: boolean;
  expenseOnly?: boolean;
  hasData: boolean;
}) {
  const [metric, setMetric] = useState<"production" | "expense">("production");
  const selected = expenseOnly ? "expense" : metric;
  const gradient = useId().replaceAll(":", "");
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2 className="text-sm font-semibold">
            {expenseOnly ? "Daily spending" : "Operations trend"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {selected === "production"
              ? "Production output · items per day"
              : "Expense totals · USD per day"}
          </p>
        </div>
        {!expenseOnly && (
          <div
            aria-label="Chart metric"
            className="flex rounded-lg border bg-background p-1"
          >
            {(["production", "expense"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={metric === value}
                onClick={() => setMetric(value)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-medium capitalize transition-colors ${metric === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {value === "expense" ? "Expenses" : "Production"}
              </button>
            ))}
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-72 p-6">
          <Skeleton className="h-full w-full" />
        </div>
      ) : !hasData ? (
        <EmptyState
          title="A clearer picture, one day at a time"
          description="Your daily trend will appear here as you record production and expenses."
        />
      ) : (
        <div
          className="h-72 min-w-0 px-2 pb-5 pt-6 sm:px-4"
          role="img"
          aria-label={`Daily ${selected === "expense" ? "expenses in USD" : "production in items"} chart. Values are also available in the report tables.`}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ top: 4, right: 12, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.22}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.01}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 5"
              />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => dateLabel(String(value))}
                tickLine={false}
                axisLine={false}
                minTickGap={34}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                dy={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(value) =>
                  selected === "expense"
                    ? `$${new Intl.NumberFormat("en-US", { notation: "compact" }).format(value)}`
                    : new Intl.NumberFormat("en-US", {
                        notation: "compact",
                      }).format(value)
                }
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <Tooltip
                labelFormatter={(value) =>
                  dateLabel(String(value), {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                }
                formatter={(value) => [
                  selected === "expense"
                    ? money(Number(value))
                    : `${number(Number(value))} items`,
                  selected === "expense" ? "Expenses" : "Production",
                ]}
                contentStyle={{
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey={selected}
                stroke="var(--chart-1)"
                fill={`url(#${gradient})`}
                strokeWidth={2.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function CategoryBreakdown({
  expenses,
  loading,
}: {
  expenses: Expense[];
  loading: boolean;
}) {
  const categories = expenseCategories(expenses);
  const total = expenses.reduce((sum, row) => sum + row.amount, 0);
  return (
    <section className="panel flex flex-col">
      <div className="panel-heading">
        <div>
          <h2 className="text-sm font-semibold">Expense breakdown</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Spending by category
          </p>
        </div>
        <span className="rounded-md border px-2 py-1 text-[10px] text-muted-foreground">
          USD
        </span>
      </div>
      {loading ? (
        <div className="space-y-5 p-6">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-7 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Add an expense to see your spending breakdown."
        />
      ) : (
        <div className="flex-1 space-y-5 p-5 sm:p-6">
          <div>
            <p className="eyebrow">Total spent</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
              {money(total)}
            </p>
          </div>
          <div className="max-h-64 space-y-4 overflow-y-auto pr-1">
            {categories.map((row, index) => (
              <div key={row.category}>
                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: `var(--chart-${(index % 5) + 1})` }}
                    />
                    <span className="truncate">{row.category}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {money(row.amount)}{" "}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                      {total ? Math.round((row.amount / total) * 100) : 0}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${total ? (row.amount / total) * 100 : 0}%`,
                      background: `var(--chart-${(index % 5) + 1})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
