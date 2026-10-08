import { Suspense } from "react";
import type { Metadata } from "next";

import { SettingsHub } from "@/components/dashboard/settings-hub";

export const metadata: Metadata = { title: "Financial Policy — The Almanac" };

export default function PreferencesPage() {
  return (
    <Suspense fallback={<div className="dash-content-inner"><div className="dash-subpage dash-subpage--wide"><p>Loading preferences…</p></div></div>}>
      <SettingsHub defaultTab="preferences" />
    </Suspense>
  );
}
