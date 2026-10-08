import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  CreditCard,
  FileBarChart,
  Landmark,
  LayoutDashboard,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

import type { AppNavItem } from "@/lib/dashboard/nav";

export const NAV_ICONS: Record<AppNavItem["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  transactions: ArrowLeftRight,
  cards: CreditCard,
  budgets: Wallet,
  goals: Target,
  investments: TrendingUp,
  debt: Landmark,
  cfo: Sparkles,
  reports: FileBarChart,
  settings: Settings,
};
