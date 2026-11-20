import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dailySeries,
  dateLabel,
  expenseCategories,
  localDate,
  money,
  monthRange,
  type Expense,
  type Production,
} from "../lib/reports";

test("month boundaries include leap days and year boundaries", () => {
  assert.deepEqual(monthRange("2024-02"), {
    start: "2024-02-01",
    end: "2024-02-29",
  });
  assert.deepEqual(monthRange("2026-02"), {
    start: "2026-02-01",
    end: "2026-02-28",
  });
  assert.deepEqual(monthRange("2026-12"), {
    start: "2026-12-01",
    end: "2026-12-31",
  });
});

test("local calendar formatting preserves the operator's date near midnight", () => {
  assert.equal(localDate(new Date(2026, 10, 20, 0, 5)), "2026-11-20");
  assert.equal(localDate(new Date(2026, 10, 20, 23, 55)), "2026-11-20");
});

test("daily series sums duplicate dates, ignores outside records, and fills missing days", () => {
  const production = (date: string, quantity: number) =>
    ({ production_date: date, items_produced: quantity }) as Production;
  const expense = (date: string, amount: number) =>
    ({ expense_date: date, amount }) as Expense;
  assert.deepEqual(
    dailySeries(
      "2026-11-01",
      "2026-11-03",
      [
        production("2026-11-01", 10),
        production("2026-11-01T00:00:00Z", 20),
        production("2026-10-31", 99),
      ],
      [expense("2026-11-03", 2.5), expense("2026-11-03", 1.25)],
    ),
    [
      { date: "2026-11-01", production: 30, expense: 0 },
      { date: "2026-11-02", production: 0, expense: 0 },
      { date: "2026-11-03", production: 0, expense: 3.75 },
    ],
  );
});

test("daily series handles a daylight-saving transition without skipping a calendar date", () => {
  assert.deepEqual(
    dailySeries("2026-03-07", "2026-03-10", [], []).map((row) => row.date),
    ["2026-03-07", "2026-03-08", "2026-03-09", "2026-03-10"],
  );
});

test("empty and reversed ranges produce safe empty series", () => {
  assert.deepEqual(dailySeries("2026-11-03", "2026-11-01", [], []), []);
  assert.deepEqual(expenseCategories([]), []);
});

test("category totals preserve custom and zero-valued categories and sort by spending", () => {
  const expenses = [
    { category: "Utilities", amount: 25.5 },
    { category: "Raw materials", amount: 100 },
    { category: "Utilities", amount: 14.5 },
    { category: "Custom category", amount: 0 },
  ] as Expense[];
  assert.deepEqual(expenseCategories(expenses), [
    { category: "Raw materials", amount: 100 },
    { category: "Utilities", amount: 40 },
    { category: "Custom category", amount: 0 },
  ]);
});

test("display formatting keeps negative and zero amounts explicit", () => {
  assert.equal(money(0), "$0.00");
  assert.equal(money(-12.5), "-$12.50");
  assert.equal(
    dateLabel("2026-11-20", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    "Nov 20, 2026",
  );
});
