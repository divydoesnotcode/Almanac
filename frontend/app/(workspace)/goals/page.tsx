import type { Metadata } from "next";

import { GoalsView } from "@/components/dashboard/goals-view";

export const metadata: Metadata = { title: "Goals — The Almanac" };

export default function GoalsPage() {
  return <GoalsView />;
}
