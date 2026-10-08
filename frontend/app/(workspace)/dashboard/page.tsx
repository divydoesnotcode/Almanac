import type { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard — The Almanac",
  description: "Your private financial command center.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
