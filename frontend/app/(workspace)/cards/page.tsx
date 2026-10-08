import type { Metadata } from "next";

import { CardsView } from "@/components/dashboard/cards-view";

export const metadata: Metadata = {
  title: "Cards & Credit Lines — The Almanac",
  description: "Manage credit and debit cards, monitor credit limit utilization, and track billing due dates.",
};

export default function CardsPage() {
  return <CardsView />;
}
