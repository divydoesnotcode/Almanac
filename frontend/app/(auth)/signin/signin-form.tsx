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
