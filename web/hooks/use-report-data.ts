"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { type Production, type Expense, type Summary } from "@/lib/reports";
import { useOperations } from "@/components/operations/operations-provider";

interface ReportData {
  productions: Production[];
  expenses: Expense[];
  summary: Summary | null;
}
const empty: ReportData = { productions: [], expenses: [], summary: null };

export function useReportData(start: string, end: string) {
  const { account, ready, revision, signOut } = useOperations();
  const key = `${account?.id}:${start}:${end}:${revision}`;
  const [state, setState] = useState<{
    key: string;
    data: ReportData;
    error: string;
  }>({ key: "", data: empty, error: "" });
  const valid = Boolean(start && end && start <= end);
  useEffect(() => {
    if (!account || !valid) return;
    const controller = new AbortController();
    const query = `?${new URLSearchParams({ start_date: start, end_date: end })}`;
    const options = { signal: controller.signal };
    Promise.all([
      api.get<Production[]>(`/productions${query}`, options),
      api.get<Expense[]>(`/expenses${query}`, options),
      api.get<Summary>(`/reports/summary${query}`, options),
    ])
      .then(([productions, expenses, summary]) => {
        if (!controller.signal.aborted)
          setState({
            key,
            data: {
              productions: productions.data ?? [],
              expenses: expenses.data ?? [],
              summary: summary.data,
            },
            error: "",
          });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error &&
          typeof error === "object" &&
          "statusCode" in error &&
          error.statusCode === 401
        )
          signOut();
        setState({
          key,
          data: empty,
          error:
            error instanceof Error
              ? error.message
              : "Reports could not be loaded. Please try again.",
        });
      });
    return () => controller.abort();
  }, [account, start, end, key, valid, signOut]);
  return {
    ...(account && state.key === key ? state.data : empty),
    loading: !ready || Boolean(account && valid && state.key !== key),
    error: !valid
      ? "Choose a valid date range. The end date must be on or after the start date."
      : state.key === key
        ? state.error
        : "",
  };
}
