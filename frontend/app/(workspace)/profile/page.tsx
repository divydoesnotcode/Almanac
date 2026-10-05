import { Suspense } from "react";
import type { Metadata } from "next";

import { SettingsHub } from "@/components/dashboard/settings-hub";

export const metadata: Metadata = { title: "Profile — Almanac" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="dash-content-inner"><div className="dash-subpage dash-subpage--wide"><p>Loading profile…</p></div></div>}>
      <SettingsHub defaultTab="profile" />
    </Suspense>
  );
}
