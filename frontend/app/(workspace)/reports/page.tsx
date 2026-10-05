import type { Metadata } from "next";

import { ReportsView } from "@/components/dashboard/reports/reports-view";

export const metadata: Metadata = { title: "Reports — Almanac" };

export default function ReportsPage() {
  return <ReportsView />;
}
