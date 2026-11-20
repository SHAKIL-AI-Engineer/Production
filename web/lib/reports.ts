export interface Production {
  id: string;
  production_date: string;
  items_produced: number;
  units: string;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  description?: string;
  created_at: string;
}

export interface Account {
  id: string;
  email: string;
  role: "admin" | "manager" | "user";
}

export interface Summary {
  total_items_produced: number;
  total_production_value: number;
  total_expense: number;
  net_profit: number;
  by_category: { category: string; amount: number }[];
}

export const categories = [
  "Raw materials",
  "Labor",
  "Utilities",
  "Maintenance",
  "Transport",
  "Other",
];
export const number = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

// Keep the operator's calendar date instead of shifting it to UTC.
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function monthRange(month: string) {
  const [year, index] = month.split("-").map(Number);
  return { start: `${month}-01`, end: localDate(new Date(year, index, 0)) };
}

export function dateLabel(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(
    "en-US",
    options,
  );
}

export function expenseCategories(expenses: Expense[]) {
  const totals = new Map<string, number>();
  for (const row of expenses)
    totals.set(row.category, (totals.get(row.category) ?? 0) + row.amount);
  return Array.from(totals, ([category, amount]) => ({
    category,
    amount,
  })).sort((a, b) => b.amount - a.amount);
}

export function dailySeries(
  start: string,
  end: string,
  productions: Production[],
  expenses: Expense[],
) {
  const days = new Map<
    string,
    { date: string; production: number; expense: number }
  >();
  const cursor = new Date(`${start}T12:00:00`);
  while (localDate(cursor) <= end) {
    const date = localDate(cursor);
    days.set(date, { date, production: 0, expense: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const row of productions) {
    const day = days.get(row.production_date.slice(0, 10));
    if (day) day.production += row.items_produced;
  }
  for (const row of expenses) {
    const day = days.get(row.expense_date.slice(0, 10));
    if (day) day.expense += row.amount;
  }
  return Array.from(days.values());
}

export function exportCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  // Prevent spreadsheet formulas in exported free-text fields.
  const escape = (value: string | number) => {
    let text = String(value);
    if (typeof value === "string" && /^\s*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
