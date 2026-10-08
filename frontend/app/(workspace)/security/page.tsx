import { Suspense } from "react";
import type { Metadata } from "next";

import { SettingsHub } from "@/components/dashboard/settings-hub";

export const metadata: Metadata = { title: "Security — The Almanac" };

export default function SecurityPage() {
  return (
    <Suspense fallback={<div className="dash-content-inner"><div className="dash-subpage dash-subpage--wide"><p>Loading security…</p></div></div>}>
      <SettingsHub defaultTab="security" />
    </Suspense>
  );
}
