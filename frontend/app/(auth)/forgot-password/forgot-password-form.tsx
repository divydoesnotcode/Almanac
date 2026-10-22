"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { z } from "zod";

import { fieldErrorsFromValidation, getApiErrorMessage } from "@/lib/api";
import { forgotPasswordRequest } from "@/lib/auth-api";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

type FieldErrors = {
  email?: string;
};

export function ForgotPasswordForm() {
  const formId = useId();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"idle" | "error" | "ok">("idle");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = forgotPasswordSchema.safeParse({ email });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === "email") {
          fieldErrors.email = issue.message;
        }
      }
      setErrors(fieldErrors);
      setStatus("");
      setStatusTone("idle");
      return;
    }

    setErrors({});
    setSubmitting(true);
    setStatus("Dispatching reset instructions…");
    setStatusTone("idle");

    try {
      const response = await forgotPasswordRequest({ email: result.data.email });
      setStatus(
        response.message ||
          `Recovery instructions sent to ${result.data.email}. Check your inbox to proceed.`,
      );
      setStatusTone("ok");
    } catch (error) {
      const apiFields = fieldErrorsFromValidation(error);
      if (apiFields.email) {
        setErrors({ email: apiFields.email });
      }
      setStatus(
        getApiErrorMessage(
          error,
          "Failed to dispatch reset email. Please try again.",
        ),
      );
      setStatusTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label" htmlFor={`${formId}-email`}>
            Email address
          </label>
          <span className="auth-hint">F.MAIL</span>
        </div>
        <input
          id={`${formId}-email`}
          className="auth-input"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          spellCheck={false}
          placeholder="name@domain.tld"
          value={email}
          disabled={submitting}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${formId}-email-error` : undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors({});
            setStatus("");
            setStatusTone("idle");
          }}
        />
        <p className="auth-error" id={`${formId}-email-error`} role="alert">
          {errors.email}
        </p>
      </div>

      <button className="auth-submit" type="submit" disabled={submitting}>
        {submitting ? "Transmitting…" : "Send recovery link"}
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
