import type { Metadata } from "next";

import { GoalsView } from "@/components/dashboard/goals-view";

export const metadata: Metadata = { title: "Goals — Almanac" };

export default function GoalsPage() {
  return <GoalsView />;
}
