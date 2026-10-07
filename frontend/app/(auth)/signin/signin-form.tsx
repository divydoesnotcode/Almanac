"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useId, useMemo, useState, type FormEvent } from "react";
import { z } from "zod";

import { useEffect } from "react";
import { fieldErrorsFromValidation, getApiErrorMessage } from "@/lib/api";
import { signinRequest } from "@/lib/auth-api";
import { setAuthSession } from "@/lib/auth-storage";
import { useAuth } from "@/lib/use-auth";

const signinSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type FieldName = "email" | "password";
type FieldErrors = Partial<Record<FieldName, string>>;

function SigninFormInner() {
  const formId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const { user, status: authStatus } = useAuth();

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(
    registered ? "Account created. Sign in to continue." : "",
  );
  const [statusTone, setStatusTone] = useState<"idle" | "error" | "ok">(
    registered ? "ok" : "idle",
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authStatus !== "loading" && user) {
      router.replace("/dashboard");
    }
  }, [authStatus, user, router]);

  const initialHint = useMemo(
    () => (registered ? "Account created. Sign in to continue." : ""),
    [registered],
  );

  function setField(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setStatus(initialHint);
    setStatusTone(registered ? "ok" : "idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = signinSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "password") {
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
    setStatus("Authenticating…");
    setStatusTone("idle");

    try {
      const response = await signinRequest({
        email: result.data.email,
        password: result.data.password,
      });

      setAuthSession({
        user: response.data.user,
        token: response.data.token,
        refreshToken: response.data.refresh_token,
      });

      setStatus("Signed in. Redirecting…");
      setStatusTone("ok");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const apiFields = fieldErrorsFromValidation(error);
      const nextErrors: FieldErrors = {};

      if (apiFields.email) {
        nextErrors.email = apiFields.email;
      }
      if (apiFields.password) {
        nextErrors.password = apiFields.password;
      }

      setErrors(nextErrors);
      setStatus(getApiErrorMessage(error, "Invalid email or password"));
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
            autoComplete="current-password"
            placeholder="Your password"
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

      <button className="auth-submit" type="submit" disabled={submitting}>
        {submitting ? "Working" : "Sign in"}
      </button>

      <div className="auth-divider" role="separator" aria-label="Or continue with">
        <span>or signin with</span>
      </div>

      <div className="auth-oauth-grid">
        <button
          type="button"
          className="auth-oauth-btn"
          disabled={submitting}
          aria-label="Sign in with Google"
        >
          <svg className="auth-oauth-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 5c1.56 0 2.96.54 4.07 1.43l3.05-3.05C17.27 1.7 14.81 1 12 1 7.37 1 3.44 3.65 1.54 7.5l3.69 2.86C6.11 7.41 8.8 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-1.99 3.72-4.94 3.72-8.69z"
            />
            <path
              fill="#FBBC05"
              d="M5.23 10.36A7.03 7.03 0 0 1 5 12c0 .57.08 1.12.23 1.64l-3.69 2.86A11.96 11.96 0 0 1 0 12c0-1.89.44-3.67 1.54-5.22l3.69 3.58z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.07.72-2.45 1.16-4.23 1.16-3.2 0-5.89-2.41-6.77-5.36L1.54 15.88C3.44 20.35 7.37 23 12 23z"
            />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          className="auth-oauth-btn"
          disabled={submitting}
          aria-label="Sign in with Apple"
        >
          <svg className="auth-oauth-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-2 .6-2.64 1.35-.56.65-1.06 1.71-.93 2.74 1.01.08 2.04-.47 2.65-1.22z" />
          </svg>
          <span>Apple</span>
        </button>
      </div>

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
        Need an account? <Link href="/signup">Create one</Link>
      </p>
    </form>
  );
}

export function SigninForm() {
  return (
    <Suspense fallback={<p className="auth-status">Loading access form…</p>}>
      <SigninFormInner />
    </Suspense>
  );
}
