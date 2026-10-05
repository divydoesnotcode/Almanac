import type { Metadata } from "next";

import { LedgerSubpage } from "@/components/dashboard/subpage";

export const metadata: Metadata = { title: "AI CFO — Almanac" };

export default function CfoPage() {
  return (
    <LedgerSubpage
      kicker="Agent"
      title="AI CFO"
      body="Ask from anywhere with Ask your CFO. Answers will use your ledger once the conversational agent is connected — they will not be fabricated in the meantime."
    />
  );
}
