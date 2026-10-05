"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useEffect, type FormEvent } from "react";
import { z } from "zod";

import { fieldErrorsFromValidation, getApiErrorMessage } from "@/lib/api";
import { signupRequest } from "@/lib/auth-api";
import { useAuth } from "@/lib/use-auth";

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name"),
    email: z.email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .refine((value) => /[A-Za-z]/.test(value), "Password must include a letter")
      .refine((value) => /\d/.test(value), "Password must include a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FieldName = "fullName" | "email" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<FieldName, string>>;

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignupForm() {
  const formId = useId();
  const router = useRouter();
  const { user, status: authStatus } = useAuth();
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"idle" | "error" | "ok">(
    "idle",
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authStatus !== "loading" && user) {
      router.replace("/dashboard");
    }
  }, [authStatus, user, router]);

  function setField(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setStatus("");
    setStatusTone("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = signupSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (
          key === "fullName" ||
          key === "email" ||
          key === "password" ||
          key === "confirmPassword"
        ) {
          nextErrors[key] ??= issue.message;
        }
      }
      setErrors(nextErrors);
      setStatus("");
      setStatusTone("idle");
      return;
    }

    setErrors({});
    setSubmitting(true);
    setStatus("Submitting enrollment…");
    setStatusTone("idle");

    try {
      await signupRequest({
        name: result.data.fullName,
        email: result.data.email,
        password: result.data.password,
      });

      setStatus("Account created. Redirecting to sign in…");
      setStatusTone("ok");
      router.push("/signin?registered=1");
    } catch (error) {
      const apiFields = fieldErrorsFromValidation(error);
      const nextErrors: FieldErrors = {};

      if (apiFields.name) {
        nextErrors.fullName = apiFields.name;
      }
      if (apiFields.email) {
        nextErrors.email = apiFields.email;
      }
      if (apiFields.password) {
        nextErrors.password = apiFields.password;
      }

      const message = getApiErrorMessage(
        error,
        "Could not create the account",
      );

      if (message.toLowerCase().includes("already exists")) {
        nextErrors.email = message;
      }

      setErrors(nextErrors);
      setStatus(message);
      setStatusTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="auth-form"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={submitting}
    >
      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label" htmlFor={`${formId}-name`}>
            Full name
          </label>
          <span className="auth-hint">F.NAME</span>
        </div>
        <input
          id={`${formId}-name`}
          className="auth-input"
          name="fullName"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          spellCheck={false}
          placeholder="Your name"
          value={values.fullName}
          disabled={submitting}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? `${formId}-name-error` : undefined}
          onChange={(event) => setField("fullName", event.target.value)}
        />
        <p className="auth-error" id={`${formId}-name-error`} role="alert">
          {errors.fullName}
        </p>
      </div>

      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label" htmlFor={`${formId}-email`}>
            Email
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
          spellCheck={false}
          placeholder="name@domain.tld"
          value={values.email}
          disabled={submitting}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${formId}-email-error` : undefined}
          onChange={(event) => setField("email", event.target.value)}
        />
        <p className="auth-error" id={`${formId}-email-error`} role="alert">
          {errors.email}
        </p>
      </div>

      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label" htmlFor={`${formId}-password`}>
            Password
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
            placeholder="Min. 8 characters"
            value={values.password}
            disabled={submitting}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? `${formId}-password-error` : undefined
            }
            onChange={(event) => setField("password", event.target.value)}
          />
          <button
            className="auth-toggle"
            type="button"
            aria-pressed={showPassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={submitting}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="auth-error" id={`${formId}-password-error`} role="alert">
          {errors.password}
        </p>
      </div>

      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label" htmlFor={`${formId}-confirm`}>
            Confirm password
          </label>
          <span className="auth-hint">F.KEY.CONFIRM</span>
        </div>
        <div className="auth-control">
          <input
            id={`${formId}-confirm`}
            className="auth-input auth-input--toggle"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat password"
            value={values.confirmPassword}
            disabled={submitting}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? `${formId}-confirm-error` : undefined
            }
            onChange={(event) => setField("confirmPassword", event.target.value)}
          />
          <button
            className="auth-toggle"
            type="button"
            aria-pressed={showConfirm}
            aria-label={
              showConfirm ? "Hide confirm password" : "Show confirm password"
            }
            disabled={submitting}
            onClick={() => setShowConfirm((current) => !current)}
          >
            {showConfirm ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="auth-error" id={`${formId}-confirm-error`} role="alert">
          {errors.confirmPassword}
        </p>
      </div>

      <button className="auth-submit" type="submit" disabled={submitting}>
        {submitting ? "Working" : "Create account"}
      </button>

      <p
        className={
          statusTone === "error"
            ? "auth-status auth-status--error"
            : "auth-status"
        }
        role="status"
      >
        {status}
      </p>

      <p className="auth-alt">
        Already have an account? <Link href="/signin">Sign in</Link>
      </p>
    </form>
  );
}
