import type { Metadata } from "next";

import { BudgetsView } from "@/components/dashboard/budgets-view";

export const metadata: Metadata = { title: "Budgets — Almanac" };

export default function BudgetsPage() {
  return <BudgetsView />;
}
