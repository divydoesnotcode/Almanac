import { Suspense } from "react";
import type { Metadata } from "next";

import { SettingsHub } from "@/components/dashboard/settings-hub";

export const metadata: Metadata = {
  title: "Accounts — Almanac",
  description: "Manage checking, savings, cash, and investment accounts.",
};

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="dash-content-inner">
          <div className="dash-subpage dash-subpage--wide">
            <p>Loading accounts…</p>
          </div>
        </div>
      }
    >
      <SettingsHub defaultTab="accounts" />
    </Suspense>
  );
}
