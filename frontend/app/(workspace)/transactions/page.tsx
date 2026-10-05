import type { Metadata } from "next";

import { TransactionsView } from "@/components/dashboard/transactions-view";

export const metadata: Metadata = { title: "Transactions — Almanac" };

export default function TransactionsPage() {
  return <TransactionsView />;
}
