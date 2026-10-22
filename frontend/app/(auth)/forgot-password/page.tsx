import type { Metadata } from "next";

import { AuthShell } from "../auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Recover password — The Almanac",
  description: "Reset your access key for your The Almanac ledger identity.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      kicker="01 / Recovery"
      figure="02 / Identification"
      title={["Recover", "your account"]}
      lede="Enter the email address associated with your ledger identity to receive reset instructions."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
