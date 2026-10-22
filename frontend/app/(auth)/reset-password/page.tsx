import type { Metadata } from "next";

import { AuthShell } from "../auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset password — The Almanac",
  description: "Set a new access key for your The Almanac ledger identity.",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      kicker="01 / Security"
      figure="02 / Identification"
      title={["Set new", "access key"]}
      lede="Enter and confirm your new password to restore access to your autonomous financial ledger."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
