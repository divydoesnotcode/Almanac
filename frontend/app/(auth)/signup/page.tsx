import type { Metadata } from "next";

import { AuthShell } from "../auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create account — Almanac",
  description:
    "Create a private ledger identity to track accounts, cash flow, and goals.",
};

export default function SignupPage() {
  return (
    <AuthShell
      kicker="01 / Enrollment"
      figure="02 / Credentials"
      title={["Create", "your account"]}
      lede="Open a private ledger identity to track accounts, cash flow, and goals."
    >
      <SignupForm />
    </AuthShell>
  );
}
