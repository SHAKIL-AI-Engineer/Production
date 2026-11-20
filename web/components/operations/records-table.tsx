"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownUp,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  dateLabel,
  exportCsv,
  money,
  number,
  type Production,
  type Expense,
} from "@/lib/reports";
import { useOperations } from "@/components/operations/operations-provider";
import { EmptyState } from "@/components/operations/report-ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = { loading: boolean; disabled: boolean } & (
  | { kind: "production"; rows: Production[] }
  | { kind: "expense"; rows: Expense[] }
);
export function RecordsTable(props: Props) {
  const { openRecord, refresh } = useOperations();
  const [page, setPage] = useState(1);
  const [ascending, setAscending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const production = props.kind === "production";
  const sorted = [...props.rows].sort((a, b) => {
    const dateA = "production_date" in a ? a.production_date : a.expense_date;
    const dateB = "production_date" in b ? b.production_date : b.expense_date;
    return (
      (ascending ? 1 : -1) *
      (dateA.localeCompare(dateB) || a.created_at.localeCompare(b.created_at))
    );
  });
  const pages = Math.max(1, Math.ceil(sorted.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = sorted.slice((currentPage - 1) * 10, currentPage * 10);
  async function remove(event: React.MouseEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.delete(
        `/${production ? "productions" : "expenses"}/${deleting}`,
      );
      setDeleting(null);
      refresh();
      toast.success("Record deleted");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete this record.",
      );
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (props.kind === "production")
      exportCsv(
        "daily-production.csv",
        ["Date", "Quantity", "Unit", "Notes"],
        props.rows.map((row) => [
          row.production_date.slice(0, 10),
          row.items_produced,
          row.units,
          row.notes ?? "",
        ]),
      );
    else
      exportCsv(
        "daily-expenses.csv",
        ["Date", "Category", "Amount (USD)", "Description"],
        props.rows.map((row) => [
          row.expense_date.slice(0, 10),
          row.category,
          row.amount,
          row.description ?? "",
        ]),
      );
  }
  return (
    <section className="panel overflow-hidden">
      <div className="panel-heading items-center">
        <div>
          <h2 className="text-sm font-semibold">
            {production ? "Production records" : "Expense records"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {number(props.rows.length)} matching records
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={props.loading || props.disabled || !props.rows.length}
          onClick={download}
        >
          <Download />
          Export CSV
        </Button>
      </div>
      {props.loading ? (
        <div className="space-y-4 p-6">
          {[1, 2, 3, 4].map((value) => (
            <Skeleton key={value} className="h-10 w-full" />
          ))}
        </div>
      ) : !visible.length ? (
        <EmptyState
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => openRecord({ kind: props.kind })}
            >
              Add {production ? "production" : "expense"}
            </Button>
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="whitespace-nowrap pl-5 sm:pl-6">
                  <button
                    className="flex items-center gap-2 py-2 text-xs"
                    onClick={() => setAscending((value) => !value)}
                    aria-label={`Sort by date ${ascending ? "newest" : "oldest"} first`}
                  >
                    Date
                    <ArrowDownUp className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-xs">
                  {production ? "Quantity" : "Category"}
                </TableHead>
                <TableHead className="text-xs">
                  {production ? "Unit" : "Amount (USD)"}
                </TableHead>
                <TableHead className="text-xs">
                  {production ? "Notes" : "Description"}
                </TableHead>
                <TableHead className="w-14 pr-5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow key={row.id} className="h-[68px]">
                  <TableCell className="whitespace-nowrap pl-5 text-xs font-medium sm:pl-6">
                    {dateLabel(
                      "production_date" in row
                        ? row.production_date
                        : row.expense_date,
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs font-semibold tabular-nums">
                    {"items_produced" in row ? (
                      number(row.items_produced)
                    ) : (
                      <span className="rounded-md border bg-background px-2 py-1 text-[11px] font-medium">
                        {row.category}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs tabular-nums">
                    {"units" in row ? row.units : money(row.amount)}
                  </TableCell>
                  <TableCell className="min-w-40 max-w-80 whitespace-normal break-words text-xs text-muted-foreground">
                    {("notes" in row
                      ? row.notes
                      : "description" in row
                        ? row.description
                        : undefined) || "—"}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for record ${row.id}`}
                          className="size-8"
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() =>
                            "items_produced" in row
                              ? openRecord({ kind: "production", record: row })
                              : openRecord({ kind: "expense", record: row })
                          }
                        >
                          <Pencil className="mr-2 size-4" />
                          Edit record
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => {
                            setError("");
                            setDeleting(row.id);
                          }}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground sm:px-6">
            <span>
              Showing {(currentPage - 1) * 10 + 1}–
              {Math.min(currentPage * 10, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft />
              </Button>
              <span>
                {currentPage} / {pages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Next page"
                disabled={currentPage === pages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      )}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the record and update your report
              totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={remove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? "Deleting…" : "Delete record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export function RecentActivity({
  productions,
  expenses,
  loading,
}: {
  productions: Production[];
  expenses: Expense[];
  loading: boolean;
}) {
  const rows = [
    ...productions.map((row) => ({
      id: row.id,
      date: row.production_date,
      created: row.created_at,
      type: "production",
      title: row.notes || "Production recorded",
      detail: row.units,
      amount: `${number(row.items_produced)} ${row.units}`,
    })),
    ...expenses.map((row) => ({
      id: row.id,
      date: row.expense_date,
      created: row.created_at,
      type: "expense",
      title: row.description || row.category,
      detail: row.category,
      amount: money(row.amount),
    })),
  ]
    .sort((a, b) => b.created.localeCompare(a.created))
    .slice(0, 6);
  return (
    <section className="panel overflow-hidden">
      <div className="panel-heading items-center">
        <div>
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest entries in the selected period
          </p>
        </div>
        <Link
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          href="/dashboard/production"
        >
          View reports
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-4 p-6">
          {[1, 2, 3].map((value) => (
            <Skeleton key={value} className="h-10 w-full" />
          ))}
        </div>
      ) : !rows.length ? (
        <EmptyState
          title="Your latest updates will live here"
          description="Record a production batch or an expense to start building your daily picture."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="pl-6 text-xs">Activity</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="pr-6 text-right text-xs">
                Amount / output
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow className="h-16" key={`${row.type}-${row.id}`}>
                <TableCell className="min-w-48 max-w-96 pl-6">
                  <p className="max-w-80 truncate text-xs font-medium">
                    {row.title}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {row.detail}
                  </p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {dateLabel(row.date)}
                </TableCell>
                <TableCell>
                  <span
                    className={`rounded-md px-2 py-1 text-[10px] font-medium capitalize ${row.type === "production" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}
                  >
                    {row.type}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap pr-6 text-right text-xs font-medium tabular-nums">
                  {row.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
