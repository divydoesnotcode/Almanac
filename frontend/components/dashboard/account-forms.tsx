"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import {
  changePassword,
  fetchPreferences,
  fetchProfile,
  fetchSecurity,
  fetchSettings,
  revokeSession,
  signOutAll,
  updatePreferences,
  updateProfile,
  updateSettings,
  type DeviceSession,
  type FinancialPreferences,
  type Profile,
  type SecuritySnapshot,
  type WorkspaceSettings,
} from "@/lib/account-api";
import { getApiErrorMessage } from "@/lib/api";
import { setAuthSession } from "@/lib/auth-storage";
import { formatDate, formatRelativeTime } from "@/lib/format-money";
import { useAuth } from "@/lib/use-auth";

import { Corners } from "./ui";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="cfo-field">
      <span className="cfo-label-row">
        <span className="cfo-label">{label}</span>
        {hint ? <span className="cfo-hint">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function FormStatus({
  tone,
  message,
}: {
  tone: "idle" | "error" | "ok";
  message: string;
}) {
  if (!message) return null;
  return (
    <p className={tone === "error" ? "cfo-error" : "cfo-hint"} role={tone === "error" ? "alert" : "status"}>
      {message}
    </p>
  );
}

function PanelShell({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <section className="cfo-panel dash-panel">
      <Corners accent />
      <div className="cfo-panel-head">
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      {children}
    </section>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return <p className="cfo-coords">{label}</p>;
}

export function ProfilePanel() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tone, setTone] = useState<"idle" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoading(false);
        setTone("error");
        setMessage(getApiErrorMessage(error, "Unable to load profile"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextName = name.trim();
    const nextEmail = email.trim().toLowerCase();
    if (nextName.length < 2) {
      setTone("error");
      setMessage("Enter your full name");
      return;
    }
    if (!nextEmail.includes("@")) {
      setTone("error");
      setMessage("Enter a valid email");
      return;
    }
    setBusy(true);
    try {
      const updated = await updateProfile({ name: nextName, email: nextEmail });
      setProfile(updated);
      if (session) {
        setAuthSession({
          token: session.token,
          refreshToken: session.refreshToken,
          user: { id: updated.id, name: updated.name, email: updated.email },
        });
      }
      setTone("ok");
      setMessage("Profile saved");
    } catch (error) {
      setTone("error");
      setMessage(getApiErrorMessage(error, "Unable to save profile"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <PanelShell title="Identity" meta="PROFILE">
        <LoadingBlock label="Loading identity…" />
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Identity" meta="PROFILE">
      <form className="cfo-form dash-ledger-form" onSubmit={onSubmit}>
        <Field label="Name">
          <input className="cfo-input" value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <Field label="Email">
          <input className="cfo-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <p className="cfo-hint">
          Joined{" "}
          {profile?.createdAt
            ? formatDate(profile.createdAt, { day: "numeric", month: "long", year: "numeric" })
            : "—"}
        </p>
        <FormStatus tone={tone} message={message} />
        <button type="submit" className="cfo-btn cfo-btn--ghost" disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </PanelShell>
  );
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tone, setTone] = useState<"idle" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchSettings()
      .then((data) => {
        if (cancelled) return;
        setSettings(data);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoading(false);
        setTone("error");
        setMessage(getApiErrorMessage(error, "Unable to load settings"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setBusy(true);
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      setTone("ok");
      setMessage("Settings saved");
    } catch (error) {
      setTone("error");
      setMessage(getApiErrorMessage(error, "Unable to save settings"));
    } finally {
      setBusy(false);
    }
  }

  if (loading || !settings) {
    return (
      <PanelShell title="Workspace" meta="SETTINGS">
        {message ? <FormStatus tone={tone} message={message} /> : <LoadingBlock label="Loading settings…" />}
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Workspace" meta="SETTINGS">
      <form className="cfo-form dash-ledger-form" onSubmit={onSubmit}>
        <Field label="Density">
          <select
            className="cfo-input"
            value={settings.density}
            onChange={(event) =>
              setSettings({
                ...settings,
                density: event.target.value as WorkspaceSettings["density"],
              })
            }
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </Field>
        <fieldset className="dash-check-set">
          <legend className="cfo-label">Notifications</legend>
          {(
            [
              ["notifyBudget", "Budget warnings"],
              ["notifyUpcoming", "Upcoming commitments"],
              ["notifyGoals", "Goal progress"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="dash-check">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(event) =>
                  setSettings({ ...settings, [key]: event.target.checked })
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <FormStatus tone={tone} message={message} />
        <button type="submit" className="cfo-btn cfo-btn--ghost" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
      </form>
    </PanelShell>
  );
}

export function PreferencesPanel() {
  const [prefs, setPrefs] = useState<FinancialPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tone, setTone] = useState<"idle" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchPreferences()
      .then((data) => {
        if (cancelled) return;
        setPrefs(data);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoading(false);
        setTone("error");
        setMessage(getApiErrorMessage(error, "Unable to load preferences"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!prefs) return;
    setBusy(true);
    try {
      const updated = await updatePreferences({
        riskTolerance: prefs.riskTolerance,
        monthlySavingsTargetPct: Number(prefs.monthlySavingsTargetPct),
        emergencyFundMonths: Number(prefs.emergencyFundMonths),
      });
      setPrefs(updated);
      setTone("ok");
      setMessage("Preferences saved");
    } catch (error) {
      setTone("error");
      setMessage(getApiErrorMessage(error, "Unable to save preferences"));
    } finally {
      setBusy(false);
    }
  }

  if (loading || !prefs) {
    return (
      <PanelShell title="Policy" meta="PREFS">
        {message ? <FormStatus tone={tone} message={message} /> : <LoadingBlock label="Loading preferences…" />}
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Policy" meta="PREFS">
      <form className="cfo-form dash-ledger-form" onSubmit={onSubmit}>
        <Field label="Currency" hint="Ledger standard">
          <input className="cfo-input" value={prefs.currency} disabled />
        </Field>
        <Field label="Risk tolerance">
          <select
            className="cfo-input"
            value={prefs.riskTolerance}
            onChange={(event) =>
              setPrefs({
                ...prefs,
                riskTolerance: event.target.value as FinancialPreferences["riskTolerance"],
              })
            }
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </Field>
        <Field label="Monthly savings target (%)">
          <input
            className="cfo-input"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={prefs.monthlySavingsTargetPct}
            onChange={(event) =>
              setPrefs({ ...prefs, monthlySavingsTargetPct: Number(event.target.value) })
            }
          />
        </Field>
        <Field label="Emergency fund (months of expenses)">
          <input
            className="cfo-input"
            type="number"
            min="1"
            max="24"
            step="1"
            value={prefs.emergencyFundMonths}
            onChange={(event) =>
              setPrefs({ ...prefs, emergencyFundMonths: Number(event.target.value) })
            }
          />
        </Field>
        <FormStatus tone={tone} message={message} />
        <button type="submit" className="cfo-btn cfo-btn--ghost" disabled={busy}>
          {busy ? "Saving…" : "Save preferences"}
        </button>
      </form>
    </PanelShell>
  );
}

function agentLabel(value: string) {
  const text = value.trim() || "Unknown device";
  return text.length > 72 ? `${text.slice(0, 69)}…` : text;
}

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

export function SecurityPanel() {
  const { session, endSession } = useAuth();
  const [security, setSecurity] = useState<SecuritySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tone, setTone] = useState<"idle" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");
  const [sessionBusy, setSessionBusy] = useState<string | null>(null);

  const strength = calculatePasswordStrength(newPassword);
  const isCriteriaMatched =
    strength.hasMinLength &&
    strength.hasLetter &&
    strength.hasNumber;
  const isPasswordConfirmed =
    confirmPassword.length > 0 && confirmPassword === newPassword;
  const canSubmitPassword =
    currentPassword.trim().length > 0 &&
    isCriteriaMatched &&
    isPasswordConfirmed &&
    !busy;

  useEffect(() => {
    let cancelled = false;
    fetchSecurity()
      .then((data) => {
        if (cancelled) return;
        setSecurity(data);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoading(false);
        setTone("error");
        setMessage(getApiErrorMessage(error, "Unable to load security"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onPassword(event: FormEvent) {
    event.preventDefault();
    if (!canSubmitPassword) {
      if (!isCriteriaMatched) {
        setTone("error");
        setMessage("New password does not meet security criteria");
        return;
      }
      if (!isPasswordConfirmed) {
        setTone("error");
        setMessage("Passwords do not match");
        return;
      }
      return;
    }
    setBusy(true);
    try {
      const result = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (session) {
        setAuthSession({
          token: result.token,
          refreshToken: session.refreshToken,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
          },
        });
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      const next = await fetchSecurity();
      setSecurity(next);
      setTone("ok");
      setMessage("Password updated. Other devices were signed out.");
    } catch (error) {
      setTone("error");
      setMessage(getApiErrorMessage(error, "Unable to update password"));
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(item: DeviceSession) {
    setSessionBusy(item.id);
    try {
      const result = await revokeSession(item.id);
      if (result.signedOut) {
        endSession();
        return;
      }
      setSecurity((current) =>
        current
          ? {
              ...current,
              sessions: current.sessions.filter((row) => row.id !== item.id),
            }
          : current,
      );
      setTone("ok");
      setMessage("Session revoked");
    } catch (error) {
      setTone("error");
      setMessage(getApiErrorMessage(error, "Unable to revoke session"));
    } finally {
      setSessionBusy(null);
    }
  }

  async function onSignOutAll() {
    setSessionBusy("all");
    try {
      await signOutAll();
      endSession();
    } catch (error) {
      setTone("error");
      setMessage(getApiErrorMessage(error, "Unable to sign out all devices"));
      setSessionBusy(null);
    }
  }

  if (loading) {
    return (
      <PanelShell title="Access" meta="SECURITY">
        {message ? <FormStatus tone={tone} message={message} /> : <LoadingBlock label="Loading security…" />}
      </PanelShell>
    );
  }

  return (
    <>
      <PanelShell title="Password" meta="CREDENTIAL">
        <form className="cfo-form dash-ledger-form" onSubmit={onPassword}>
          <Field label="Current password">
            <div className="cfo-control">
              <input
                className="cfo-input cfo-input--padded"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="cfo-toggle"
                onClick={() => setShowCurrent((open) => !open)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Field label="New password">
            <div className="cfo-control">
              <input
                className="cfo-input cfo-input--padded"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="cfo-toggle"
                onClick={() => setShowNew((open) => !open)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className="cfo-strength" aria-live="polite">
                <div className="cfo-strength-header">
                  <span className="cfo-strength-title">Entropy // Key strength</span>
                  <span className={`cfo-strength-value cfo-strength-value--${strength.score}`}>
                    {strength.label}
                  </span>
                </div>

                <div
                  className="cfo-strength-bars"
                  role="progressbar"
                  aria-valuenow={strength.score}
                  aria-valuemin={0}
                  aria-valuemax={4}
                >
                  {[1, 2, 3, 4].map((barIndex) => (
                    <div
                      key={barIndex}
                      className={`cfo-strength-bar ${
                        barIndex <= strength.score
                          ? `cfo-strength-bar--active-${strength.score}`
                          : ""
                      }`}
                    />
                  ))}
                </div>

                <div className="cfo-strength-rules">
                  <span
                    className={`cfo-strength-rule ${
                      strength.hasMinLength ? "cfo-strength-rule--met" : ""
                    }`}
                  >
                    <span className="cfo-strength-rule-dot" aria-hidden="true" />
                    8+ Chars
                  </span>
                  <span
                    className={`cfo-strength-rule ${
                      strength.hasLetter ? "cfo-strength-rule--met" : ""
                    }`}
                  >
                    <span className="cfo-strength-rule-dot" aria-hidden="true" />
                    Letter
                  </span>
                  <span
                    className={`cfo-strength-rule ${
                      strength.hasNumber ? "cfo-strength-rule--met" : ""
                    }`}
                  >
                    <span className="cfo-strength-rule-dot" aria-hidden="true" />
                    Number
                  </span>
                  <span
                    className={`cfo-strength-rule ${
                      strength.hasSpecialOrUpper ? "cfo-strength-rule--met" : ""
                    }`}
                  >
                    <span className="cfo-strength-rule-dot" aria-hidden="true" />
                    Symbol / Upper
                  </span>
                </div>
              </div>
            )}
          </Field>
          <Field label="Confirm new password">
            <input
              className="cfo-input"
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <p className="cfo-error" role="alert" style={{ marginTop: "0.25rem" }}>
                Passwords do not match
              </p>
            )}
          </Field>
          <p className="cfo-hint">
            Last changed{" "}
            {security?.passwordChangedAt
              ? formatRelativeTime(security.passwordChangedAt)
              : "never on record"}
          </p>
          <FormStatus tone={tone} message={message} />
          <button type="submit" className="cfo-btn cfo-btn--ghost" disabled={!canSubmitPassword}>
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      </PanelShell>

      <PanelShell title="Sessions" meta="DEVICES">
        {security?.sessions.length ? (
          <ul className="dash-session-list">
            {security.sessions.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.current ? "This device" : "Signed in"}</strong>
                  <span>{agentLabel(item.userAgent)}</span>
                  <span>
                    Started {formatRelativeTime(item.createdAt)} · expires{" "}
                    {formatDate(item.expiresAt, { day: "numeric", month: "short" })}
                  </span>
                </div>
                <button
                  type="button"
                  className="dash-quiet"
                  disabled={sessionBusy === item.id}
                  onClick={() => void onRevoke(item)}
                >
                  {item.current ? "Sign out" : "Revoke"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No tracked sessions yet. Sign in again to register this device.</p>
        )}
        <div className="dash-cta-row" style={{ marginTop: "0.85rem" }}>
          <button
            type="button"
            className="cfo-btn cfo-btn--ghost"
            disabled={sessionBusy === "all"}
            onClick={() => void onSignOutAll()}
          >
            Sign out all devices
          </button>
        </div>
      </PanelShell>
    </>
  );
}
