import type { Metadata } from "next";
import { GettingStartedFlow } from "@/components/dashboard/getting-started-flow";

export const metadata: Metadata = {
  title: "Getting Started — The Almanac",
  description: "Initialize your accounts, income streams, and financial policy settings.",
};

export default function GettingStartedPage() {
  return (
    <div className="dash-content-inner">
      <div className="dash-subpage dash-subpage--wide">
        <GettingStartedFlow />
      </div>
    </div>
  );
}
