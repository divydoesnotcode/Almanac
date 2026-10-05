import type { Metadata } from "next";

import { AuthShell } from "../auth-shell";
import { SigninForm } from "./signin-form";

export const metadata: Metadata = {
  title: "Sign in — Almanac",
  description: "Return to an existing Almanac ledger identity.",
};

export default function SigninPage() {
  return (
    <AuthShell
      kicker="01 / Access"
      figure="02 / Credentials"
      title={["Access", "your account"]}
      lede="Return to an existing ledger identity. Sessions stay local to this machine until auth is wired."
    >
      <SigninForm />
    </AuthShell>
  );
}
