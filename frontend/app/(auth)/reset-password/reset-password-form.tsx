"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useId, useState, type FormEvent } from "react";
import { z } from "zod";

import { fieldErrorsFromValidation, getApiErrorMessage } from "@/lib/api";
import { resetPasswordRequest } from "@/lib/auth-api";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(128, "Password is too long")
      .regex(/[a-zA-Z]/, "Password must include a letter")
      .regex(/[0-9]/, "Password must include a number"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FieldErrors = {
  password?: string;
  confirmPassword?: string;
};

type PasswordStrength = {
  score: number;
  label: string;
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecialOrUpper: boolean;
};

function calculatePasswordStrength(pass: string): PasswordStrength {
  if (!pass) {
    return {
      score: 0,
      label: "INITIAL",
      hasMinLength: false,
      hasLetter: false,
      hasNumber: false,
      hasSpecialOrUpper: false,
    };
  }

  const hasMinLength = pass.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecialOrUpper =
    /[^a-zA-Z0-9]/.test(pass) ||
    (/[a-z]/.test(pass) && /[A-Z]/.test(pass));

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasLetter) score += 1;
  if (hasNumber) score += 1;
  if (hasMinLength && (hasSpecialOrUpper || pass.length >= 12)) score += 1;

  const labels = ["INITIAL", "WEAK", "FAIR", "GOOD", "STRONG"];

  return {
    score,
    label: labels[score] ?? "WEAK",
    hasMinLength,
    hasLetter,
    hasNumber,
    hasSpecialOrUpper,
  };
}

function ResetPasswordFormInner() {
  const formId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"idle" | "error" | "ok">("idle");
  const [submitting, setSubmitting] = useState(false);

  const strength = calculatePasswordStrength(password);
  const isCriteriaMatched = strength.hasMinLength && strength.hasLetter && strength.hasNumber;
  const isPasswordConfirmed = confirmPassword.length > 0 && confirmPassword === password;
  const canSubmit = isCriteriaMatched && isPasswordConfirmed && !submitting;

  if (!token) {
    return (
      <div className="auth-form" role="region" aria-label="Password Reset Error">
        <p className="auth-status auth-status--error" role="alert">
          Invalid or missing recovery token. The link may be incomplete or expired.
        </p>
        <p className="auth-alt" style={{ marginTop: "1.5rem" }}>
          <Link href="/forgot-password" className="auth-submit" style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}>
            Request new recovery link
          </Link>
        </p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === "password") {
          fieldErrors.password = issue.message;
        }
        if (issue.path[0] === "confirmPassword") {
          fieldErrors.confirmPassword = issue.message;
        }
      }
      setErrors(fieldErrors);
      setStatus("");
      setStatusTone("idle");
      return;
    }

    setErrors({});
    setSubmitting(true);
    setStatus("Updating ledger credentials…");
    setStatusTone("idle");

    try {
      const response = await resetPasswordRequest({
        token,
        password: result.data.password,
      });

      setStatus(response.message || "Password updated. Redirecting to sign in…");
      setStatusTone("ok");

      setTimeout(() => {
        router.push("/signin");
      }, 1500);
    } catch (error) {
      const apiFields = fieldErrorsFromValidation(error);
      const nextErrors: FieldErrors = {};
      if (apiFields.password) {
        nextErrors.password = apiFields.password;
      }
      setErrors(nextErrors);
      setStatus(
        getApiErrorMessage(
          error,
          "Failed to reset password. The recovery link may be expired or invalid.",
        ),
      );
      setStatusTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit} aria-busy={submitting}>
      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label" htmlFor={`${formId}-password`}>
            New password
          </label>
          <span className="auth-hint">F.KEY</span>
        </div>
        <div className="auth-control">
          <input
            id={`${formId}-password`}
            className="auth-input auth-input--toggle"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            autoFocus
            disabled={submitting}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? `${formId}-password-error` : undefined}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((curr) => ({ ...curr, password: undefined }));
              setStatus("");
              setStatusTone("idle");
            }}
          />
          <button
            className="auth-toggle"
            type="button"
            aria-pressed={showPassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={submitting}
            onClick={() => setShowPassword((curr) => !curr)}
          >
            {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        </div>

        {/* Password Strength Meter */}
        {password.length > 0 && (
          <div className="auth-strength" aria-live="polite">
            <div className="auth-strength-header">
              <span className="auth-strength-title">Entropy // Key strength</span>
              <span className={`auth-strength-value auth-strength-value--${strength.score}`}>
                {strength.label}
              </span>
            </div>

            <div className="auth-strength-bars" role="progressbar" aria-valuenow={strength.score} aria-valuemin={0} aria-valuemax={4}>
              {[1, 2, 3, 4].map((barIndex) => (
                <div
                  key={barIndex}
                  className={`auth-strength-bar ${
                    barIndex <= strength.score
                      ? `auth-strength-bar--active-${strength.score}`
                      : ""
                  }`}
                />
              ))}
            </div>

            <div className="auth-strength-rules">
              <span className={`auth-strength-rule ${strength.hasMinLength ? "auth-strength-rule--met" : ""}`}>
                <span className="auth-strength-rule-dot" aria-hidden="true" />
                8+ Chars
              </span>
              <span className={`auth-strength-rule ${strength.hasLetter ? "auth-strength-rule--met" : ""}`}>
                <span className="auth-strength-rule-dot" aria-hidden="true" />
                Letter
              </span>
              <span className={`auth-strength-rule ${strength.hasNumber ? "auth-strength-rule--met" : ""}`}>
                <span className="auth-strength-rule-dot" aria-hidden="true" />
                Number
              </span>
              <span className={`auth-strength-rule ${strength.hasSpecialOrUpper ? "auth-strength-rule--met" : ""}`}>
                <span className="auth-strength-rule-dot" aria-hidden="true" />
                Symbol / Upper
              </span>
            </div>
          </div>
        )}

        <p className="auth-error" id={`${formId}-password-error`} role="alert">
          {errors.password}
        </p>
      </div>

      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label" htmlFor={`${formId}-confirm`}>
            Confirm new password
          </label>
          <span className="auth-hint">F.CONFIRM</span>
        </div>
        <div className="auth-control">
          <input
            id={`${formId}-confirm`}
            className="auth-input auth-input--toggle"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirmPassword}
            disabled={submitting}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? `${formId}-confirm-error` : undefined}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrors((curr) => ({ ...curr, confirmPassword: undefined }));
              setStatus("");
              setStatusTone("idle");
            }}
          />
          <button
            className="auth-toggle"
            type="button"
            aria-pressed={showConfirm}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            disabled={submitting}
            onClick={() => setShowConfirm((curr) => !curr)}
          >
            {showConfirm ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        </div>
        <p className="auth-error" id={`${formId}-confirm-error`} role="alert">
          {errors.confirmPassword}
        </p>
      </div>

      <button className="auth-submit" type="submit" disabled={!canSubmit}>
        {submitting ? "Transmitting…" : "Update password"}
      </button>

      <p
        className={
          statusTone === "error"
            ? "auth-status auth-status--error"
            : statusTone === "ok"
              ? "auth-status auth-status--ok"
              : "auth-status"
        }
        role="status"
      >
        {status}
      </p>

      <p className="auth-alt">
        Remember your password? <Link href="/signin">Sign in</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<p className="auth-status">Loading reset form…</p>}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
