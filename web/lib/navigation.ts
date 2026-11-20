import {
  LayoutDashboard,
  Factory,
  ReceiptText,
  CalendarRange,
  ChartNoAxesCombined,
  Settings2,
} from "lucide-react";

export const navigation = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
    section: "workspace",
  },
  {
    title: "Daily production",
    url: "/dashboard/production",
    icon: Factory,
    section: "reports",
  },
  {
    title: "Daily expenses",
    url: "/dashboard/expenses",
    icon: ReceiptText,
    section: "reports",
  },
  {
    title: "Monthly expenses",
    url: "/dashboard/monthly-expenses",
    icon: CalendarRange,
    section: "reports",
  },
  {
    title: "Summary",
    url: "/dashboard/summary",
    icon: ChartNoAxesCombined,
    section: "reports",
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings2,
    section: "workspace",
  },
];
