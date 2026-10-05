import type { Metadata } from "next";

import { InvestmentsView } from "@/components/dashboard/investments-view";

export const metadata: Metadata = { title: "Investments — Almanac" };

export default function InvestmentsPage() {
  return <InvestmentsView />;
}
