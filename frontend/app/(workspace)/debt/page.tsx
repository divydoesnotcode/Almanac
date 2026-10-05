import type { Metadata } from "next";

import { DebtView } from "@/components/dashboard/debt-view";

export const metadata: Metadata = { title: "Debt — Almanac" };

export default function DebtPage() {
  return <DebtView />;
}
