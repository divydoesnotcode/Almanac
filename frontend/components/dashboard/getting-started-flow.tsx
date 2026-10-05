"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import { invalidateDashboardCache } from "@/lib/dashboard/use-dashboard";
import { listCategories, type LedgerCategory } from "@/lib/ledger-api";
import {
  fetchOnboardingStatus,
  submitStep1Accounts,
  deleteOnboardingAccount,
  submitStep2Income,
  submitStep3Policy,
  submitStep4Budgets,
  deleteOnboardingBudget,
  submitCompleteOnboarding,
} from "@/lib/onboarding-api";
import { setGlobalOnboardingCompleted } from "@/lib/use-onboarding";
import { formatINR } from "@/lib/format-money";
import { Corners } from "./ui";

interface AccountDraft {
  id: string;
  name: string;
  account_type: "bank" | "savings" | "cash" | "investment";
  balance: string;
  description: string;
}

interface BudgetDraft {
  id: string;
  category_id: string;
  category_name: string;
  limit: string;
}

const STEPS = [
  { num: 1, label: "Accounts" },
  { num: 2, label: "Income" },
  { num: 3, label: "Policy" },
  { num: 4, label: "Budgets" },
  { num: 5, label: "Review" },
] as const;

const DEFAULT_ACCOUNTS: AccountDraft[] = [
  {
    id: "1",
    name: "",
    account_type: "bank",
    balance: "",
    description: "",
  },
];

const DEFAULT_BUDGETS: BudgetDraft[] = [
  {
    id: "1",
    category_id: "",
    category_name: "",
    limit: "",
  },
];

function StepActions({
  onBack,
  onNext,
  busy,
  busyLabel,
  nextLabel,
  nextShort,
  icon,
  disabled = false,
}: {
  onBack?: () => void;
  onNext: () => void;
  busy: boolean;
  busyLabel: string;
  nextLabel: string;
  nextShort: string;
  icon: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="dash-onboarding-actions">
      {onBack ? (
        <button type="button" className="cfo-btn cfo-btn--ghost" disabled={busy} onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </button>
      ) : null}
      <button type="button" className="cfo-btn cfo-btn--fill" disabled={busy || disabled} onClick={onNext}>
        {busy ? (
          busyLabel
        ) : (
          <>
            <span className="dash-onboarding-btn-long">{nextLabel}</span>
            <span className="dash-onboarding-btn-short">{nextShort}</span>
          </>
        )}{" "}
        {icon}
      </button>
    </div>
  );
}

export function GettingStartedFlow({
  onCompleted,
}: {
  onCompleted?: () => void;
}) {
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);
  const skipScroll = useRef(true);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [busy, setBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<LedgerCategory[]>([]);

  // Step 1: Accounts
  const [accounts, setAccounts] = useState<AccountDraft[]>(DEFAULT_ACCOUNTS);

  // Step 2: Income
  const [incomeSource, setIncomeSource] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [recordInitialIncome, setRecordInitialIncome] = useState(false);

  // Step 3: Financial Policy
  const [savingsTarget, setSavingsTarget] = useState(20);
  const [emergencyMonths, setEmergencyMonths] = useState(6);
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");

  // Step 4: Budget Caps
  const [budgets, setBudgets] = useState<BudgetDraft[]>(DEFAULT_BUDGETS);

  const [isCompletedUser, setIsCompletedUser] = useState(false);

  // 1. Fetch persistent status directly from PostgreSQL on mount
  useEffect(() => {
    Promise.all([listCategories(), fetchOnboardingStatus()])
      .then(([cats, dbState]) => {
        setCategories(cats || []);

        if (dbState) {
          if (dbState.completed || dbState.show_getting_started === false) {
            setIsCompletedUser(true);
            router.replace("/dashboard");
            return;
          }
          if (dbState.step) setStep(dbState.step);
          if (dbState.accounts && dbState.accounts.length > 0) {
            setAccounts(dbState.accounts as AccountDraft[]);
          }
          if (dbState.income?.income_source) {
            setIncomeSource(dbState.income.income_source);
          }
          if (dbState.income?.monthly_income) {
            setMonthlyIncome(dbState.income.monthly_income);
          }
          if (typeof dbState.income?.record_initial_income === "boolean") {
            setRecordInitialIncome(dbState.income.record_initial_income);
          }
          if (dbState.policy?.savings_target) {
            setSavingsTarget(dbState.policy.savings_target);
          }
          if (dbState.policy?.emergency_months) {
            setEmergencyMonths(dbState.policy.emergency_months);
          }
          if (dbState.policy?.risk_tolerance) {
            setRiskTolerance(dbState.policy.risk_tolerance);
          }

          if (dbState.budgets && dbState.budgets.length > 0) {
            setBudgets(
              dbState.budgets.map((b, idx) => ({
                id: b.category_id || String(idx + 1),
                category_id: b.category_id,
                category_name: b.category_name || "",
                limit: String(b.monthly_limit || ""),
              }))
            );
          } else {
            setBudgets(DEFAULT_BUDGETS);
          }
        }
      })
      .catch(() => { })
      .finally(() => {
        setInitialLoading(false);
      });
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topRef.current?.scrollIntoView({
      block: "start",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [step, initialLoading]);

  const addAccountRow = () => {
    setAccounts((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: "",
        account_type: "bank",
        balance: "",
        description: "",
      },
    ]);
  };

  const removeAccountRow = (id: string) => {
    if (accounts.length <= 1) return;
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (id && id.includes("-") && id.length === 36) {
      deleteOnboardingAccount(id).catch(() => { });
    }
  };

  const updateAccountDraft = (id: string, key: keyof AccountDraft, val: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [key]: val } : a))
    );
  };

  const addBudgetRow = () => {
    setBudgets((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        category_id: "",
        category_name: "",
        limit: "",
      },
    ]);
  };

  const removeBudgetRow = (id: string) => {
    if (budgets.length <= 1) return;
    const targetBudget = budgets.find((b) => b.id === id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    if (
      targetBudget?.category_id &&
      targetBudget.category_id.includes("-") &&
      targetBudget.category_id.length === 36
    ) {
      deleteOnboardingBudget(targetBudget.category_id).catch(() => { });
    }
  };

  const updateBudgetDraft = (id: string, key: "category_id" | "limit", val: string) => {
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (key === "category_id") {
          const selectedCat = categories.find((c) => c.id === val);
          return {
            ...b,
            category_id: val,
            category_name: selectedCat?.name || "",
          };
        }
        return { ...b, [key]: val };
      })
    );
  };

  const isStep1Valid =
    accounts.length > 0 &&
    accounts.every(
      (a) => a.name.trim().length > 0 && Boolean(a.account_type && a.account_type.trim().length > 0),
    );

  const isStep2Valid =
    incomeSource.trim().length > 0 &&
    monthlyIncome.trim().length > 0 &&
    !isNaN(parseFloat(monthlyIncome)) &&
    parseFloat(monthlyIncome) > 0;

  const isStep4Valid =
    budgets.length >= 1 &&
    budgets.every(
      (b) =>
        b.category_id.trim().length > 0 &&
        b.limit.trim().length > 0 &&
        !isNaN(parseFloat(b.limit)) &&
        parseFloat(b.limit) > 0,
    );

  // STEP 1 PROCEED: Calls Step-1 API
  const handleProceedStep1 = async () => {
    if (!isStep1Valid) {
      setError("Account Name and Account Type are mandatory for all accounts.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await submitStep1Accounts(accounts);
      if (res?.accounts && res.accounts.length > 0) {
        setAccounts(res.accounts as AccountDraft[]);
      }
      setStep(2);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save accounts to database"));
    } finally {
      setBusy(false);
    }
  };

  // STEP 2 PROCEED: Calls Step-2 API
  const handleProceedStep2 = async () => {
    if (!isStep2Valid) {
      setError("Primary income source and expected monthly inflow (> 0) are mandatory.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitStep2Income({
        income_source: incomeSource,
        monthly_income: monthlyIncome,
        record_initial_income: recordInitialIncome,
      });
      setStep(3);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save income details"));
    } finally {
      setBusy(false);
    }
  };

  // STEP 3 PROCEED: Calls Step-3 API
  const handleProceedStep3 = async () => {
    setBusy(true);
    setError(null);
    try {
      await submitStep3Policy({
        savings_target: savingsTarget,
        emergency_months: emergencyMonths,
        risk_tolerance: riskTolerance,
      });
      setStep(4);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save financial policy"));
    } finally {
      setBusy(false);
    }
  };

  // STEP 4 PROCEED: Calls Step-4 API
  const handleProceedStep4 = async () => {
    if (!isStep4Valid) {
      setError("At least 1 budget with a selected category and monthly cap (> 0) is mandatory.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitStep4Budgets(
        budgets.map((b) => ({
          category_id: b.category_id,
          category_name: b.category_name,
          limit: b.limit,
        }))
      );
      setStep(5);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save budget limits"));
    } finally {
      setBusy(false);
    }
  };

  // STEP 5 FINAL LAUNCH: Calls Complete API
  const handleFinish = async () => {
    setBusy(true);
    setError(null);
    try {
      await submitCompleteOnboarding();
      setGlobalOnboardingCompleted(true);
      invalidateDashboardCache();

      if (onCompleted) {
        onCompleted();
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to finalize workspace"));
      setBusy(false);
    }
  };

  if (initialLoading || isCompletedUser) {
    return (
      <div className="dash-onboarding-container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <p className="cfo-coords">
          {isCompletedUser
            ? "Workspace setup already complete. Opening dashboard…"
            : "Loading ledger initialization state from database…"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="dash-onboarding-container"
      ref={topRef}
      style={{ "--onboard-step": step } as CSSProperties}
    >
      {/* Header Progress Matrix */}
      <div className="dash-onboarding-header">
        <div className="dash-onboarding-kicker">
          <span>Initialization matrix</span>
          <span className="dash-onboarding-dot">● Saved as you go</span>
        </div>
        <h1>Welcome to Almanac</h1>
        <p>
          Set your accounts, income, and a few policy targets. Each step is saved to your ledger, and you can change any of it later.
        </p>

        <div className="dash-onboarding-meter" aria-hidden="true">
          <span />
        </div>
        <p className="dash-onboarding-now">
          <span>Step {step} of {STEPS.length}</span>
          <strong>{STEPS[step - 1].label}</strong>
        </p>

        <div className="dash-onboarding-stepper" aria-label="Setup steps">
          {STEPS.map((s) => {
            const isStepDisabled =
              busy ||
              (s.num > 1 && !isStep1Valid) ||
              (s.num > 2 && !isStep2Valid) ||
              (s.num > 4 && !isStep4Valid);
            return (
              <button
                key={s.num}
                type="button"
                disabled={isStepDisabled}
                aria-current={step === s.num ? "step" : undefined}
                className={`dash-onboarding-step-btn ${step === s.num ? "active" : step > s.num ? "completed" : ""}`}
                onClick={() => !isStepDisabled && setStep(s.num)}
              >
                <span className="dash-onboarding-step-num">{s.num}</span>
                <span className="dash-onboarding-step-title">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="dash-onboarding-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* STEP 1: Accounts & Capital */}
      {step === 1 && (
        <section className="cfo-panel dash-onboarding-panel">
          <Corners accent />
          <div className="cfo-panel-head">
            <strong>01 // Liquid Accounts & Starting Capital</strong>
            <span>STEP 1 OF 4</span>
          </div>
          <div className="dash-onboarding-body">
            <p className="dash-onboarding-hint">
              Enter your active bank accounts, savings, or cash reserves. Starting balances will form your day-one net worth foundation.
            </p>

            <div className="dash-onboarding-accounts-list">
              {accounts.map((acc, index) => (
                <div key={acc.id} className="dash-onboarding-card">
                  <div className="dash-onboarding-card-head">
                    <span className="cfo-kicker">ACCOUNT #{index + 1}</span>
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        className="dash-quiet dash-onboarding-remove"
                        onClick={() => removeAccountRow(acc.id)}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                  <div className="dash-onboarding-grid">
                    <label className="cfo-field">
                      <span className="cfo-label">
                        Account Name <abbr title="Mandatory" style={{ color: "var(--cfo-accent, #c45c26)", textDecoration: "none" }}>*</abbr>
                      </span>
                      <input
                        type="text"
                        required
                        className="cfo-input"
                        placeholder="e.g. HDFC Salary Account"
                        value={acc.name}
                        onChange={(e) => updateAccountDraft(acc.id, "name", e.target.value)}
                      />
                    </label>

                    <label className="cfo-field">
                      <span className="cfo-label">
                        Account Type <abbr title="Mandatory" style={{ color: "var(--cfo-accent, #c45c26)", textDecoration: "none" }}>*</abbr>
                      </span>
                      <select
                        required
                        className="cfo-input"
                        value={acc.account_type}
                        onChange={(e) =>
                          updateAccountDraft(
                            acc.id,
                            "account_type",
                            e.target.value as AccountDraft["account_type"],
                          )
                        }
                      >
                        <option value="bank">Bank Checking / Salary</option>
                        <option value="savings">High-Yield Savings</option>
                        <option value="cash">Physical Cash / Wallet</option>
                        <option value="investment">Investment / Demat Cash</option>
                      </select>
                    </label>

                    <label className="cfo-field">
                      <span className="cfo-label">Starting Balance (₹)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        className="cfo-input"
                        placeholder="50000"
                        value={acc.balance}
                        onChange={(e) => updateAccountDraft(acc.id, "balance", e.target.value)}
                      />
                    </label>

                    <label className="cfo-field">
                      <span className="cfo-label">Description / Purpose</span>
                      <input
                        type="text"
                        className="cfo-input"
                        placeholder="e.g. Primary salary & daily transactions"
                        value={acc.description}
                        onChange={(e) => updateAccountDraft(acc.id, "description", e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="cfo-btn cfo-btn--ghost dash-onboarding-add-btn"
              onClick={addAccountRow}
            >
              <Plus size={14} /> Add Another Account
            </button>

            <div className="dash-onboarding-footer">
              <span className="dash-onboarding-meta">
                Starting cash: <strong>{formatINR(accounts.reduce((acc, a) => acc + (parseFloat(a.balance) || 0), 0))}</strong>
              </span>
              <StepActions
                busy={busy}
                disabled={!isStep1Valid}
                busyLabel="Saving accounts…"
                nextLabel="Proceed to inflows"
                nextShort="Continue"
                onNext={handleProceedStep1}
                icon={<ArrowRight size={14} />}
              />
            </div>
          </div>
        </section>
      )}

      {/* STEP 2: Income & Inflow Streams */}
      {step === 2 && (
        <section className="cfo-panel dash-onboarding-panel">
          <Corners accent />
          <div className="cfo-panel-head">
            <strong>02 // Inflows & Primary Income Stream</strong>
            <span>STEP 2 OF 4</span>
          </div>
          <div className="dash-onboarding-body">
            <p className="dash-onboarding-hint">
              Define your monthly recurring income stream. You can record an opening deposit for the current month in your primary account.
            </p>

            <div className="dash-onboarding-card">
              <div className="dash-onboarding-grid">
                <label className="cfo-field">
                  <span className="cfo-label">
                    Primary Income Source <abbr title="Mandatory" style={{ color: "var(--cfo-accent, #c45c26)", textDecoration: "none" }}>*</abbr>
                  </span>
                  <input
                    type="text"
                    required
                    className="cfo-input"
                    placeholder="e.g. Monthly Salary / Consulting"
                    value={incomeSource}
                    onChange={(e) => setIncomeSource(e.target.value)}
                  />
                </label>

                <label className="cfo-field">
                  <span className="cfo-label">
                    Expected Monthly Inflow (₹) <abbr title="Mandatory" style={{ color: "var(--cfo-accent, #c45c26)", textDecoration: "none" }}>*</abbr>
                  </span>
                  <input
                    type="number"
                    required
                    inputMode="decimal"
                    className="cfo-input"
                    placeholder="100000"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                  />
                </label>
              </div>

              <div className="dash-onboarding-check">
                <label>
                  <input
                    type="checkbox"
                    checked={recordInitialIncome}
                    onChange={(e) => setRecordInitialIncome(e.target.checked)}
                  />
                  <span>
                    Record this month&apos;s income (<strong>{formatINR(parseFloat(monthlyIncome) || 0)}</strong>) on the ledger now
                  </span>
                </label>
                <p>Gives the ledger an opening balance so expenses can post right away.</p>
              </div>
            </div>

            <div className="dash-onboarding-footer">
              <StepActions
                onBack={() => setStep(1)}
                busy={busy}
                disabled={!isStep2Valid}
                busyLabel="Saving income…"
                nextLabel="Proceed to policy"
                nextShort="Continue"
                onNext={handleProceedStep2}
                icon={<ArrowRight size={14} />}
              />
            </div>
          </div>
        </section>
      )}

      {/* STEP 3: Financial Policy & Risk Settings */}
      {step === 3 && (
        <section className="cfo-panel dash-onboarding-panel">
          <Corners accent />
          <div className="cfo-panel-head">
            <strong>03 // Financial Policy & Target Cushion</strong>
            <span>STEP 3 OF 4</span>
          </div>
          <div className="dash-onboarding-body">
            <p className="dash-onboarding-hint">
              These policy targets govern your autonomous CFO Health Grade, savings alerts, and next move recommendations.
            </p>

            <div className="dash-onboarding-card">
              <div className="dash-onboarding-policy-section">
                <div className="dash-onboarding-policy-block">
                  <label className="cfo-label">Monthly savings target</label>
                  <p>Share of income set aside for saving and paying down debt.</p>
                  <div className="dash-onboarding-pills">
                    {[10, 20, 30, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        className={`dash-onboarding-pill ${savingsTarget === pct ? "active" : ""}`}
                        onClick={() => setSavingsTarget(pct)}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="dash-onboarding-policy-block">
                  <label className="cfo-label">Emergency cushion</label>
                  <p>Months of essential expenses to keep in cash.</p>
                  <div className="dash-onboarding-pills">
                    {[3, 6, 9, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`dash-onboarding-pill ${emergencyMonths === m ? "active" : ""}`}
                        onClick={() => setEmergencyMonths(m)}
                      >
                        {m} months
                      </button>
                    ))}
                  </div>
                </div>

                <div className="dash-onboarding-policy-block">
                  <label className="cfo-label">Risk appetite</label>
                  <div className="dash-onboarding-choices">
                    {[
                      { id: "conservative" as const, label: "Conservative", hint: "Protect capital" },
                      { id: "moderate" as const, label: "Moderate", hint: "Balanced growth" },
                      { id: "aggressive" as const, label: "Aggressive", hint: "Higher volatility" },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`dash-onboarding-pill dash-onboarding-pill--choice ${riskTolerance === r.id ? "active" : ""}`}
                        onClick={() => setRiskTolerance(r.id)}
                      >
                        <span>{r.label}</span>
                        <small>{r.hint}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-onboarding-footer">
              <StepActions
                onBack={() => setStep(2)}
                busy={busy}
                busyLabel="Saving policy…"
                nextLabel="Proceed to budgets"
                nextShort="Continue"
                onNext={handleProceedStep3}
                icon={<ArrowRight size={14} />}
              />
            </div>
          </div>
        </section>
      )}

      {/* STEP 4: Budget Caps */}
      {step === 4 && (
        <section className="cfo-panel dash-onboarding-panel">
          <Corners accent />
          <div className="cfo-panel-head">
            <strong>04 // Monthly Budget Caps</strong>
            <span>STEP 4 OF 4</span>
          </div>
          <div className="dash-onboarding-body">
            <p className="dash-onboarding-hint">
              Set monthly spending ceilings on your expense categories. At least 1 budget cap is required.
            </p>

            <div className="dash-onboarding-budgets-table">
              {budgets.map((b) => (
                <div key={b.id} className="dash-onboarding-budget-row">
                  <label className="cfo-field">
                    <span className="cfo-label">
                      Category <abbr title="Mandatory" style={{ color: "var(--cfo-accent, #c45c26)", textDecoration: "none" }}>*</abbr>
                    </span>
                    <select
                      required
                      className="cfo-input"
                      value={b.category_id}
                      onChange={(e) => updateBudgetDraft(b.id, "category_id", e.target.value)}
                    >
                      <option value="">Select Category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.is_system ? "" : "(Custom)"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="cfo-field">
                    <span className="cfo-label">
                      Monthly Limit (₹) <abbr title="Mandatory" style={{ color: "var(--cfo-accent, #c45c26)", textDecoration: "none" }}>*</abbr>
                    </span>
                    <input
                      type="number"
                      required
                      inputMode="decimal"
                      className="cfo-input"
                      placeholder="e.g. 15000"
                      value={b.limit}
                      onChange={(e) => updateBudgetDraft(b.id, "limit", e.target.value)}
                    />
                  </label>

                  {budgets.length > 1 ? (
                    <button
                      type="button"
                      className="dash-onboarding-budget-del"
                      title="Remove budget cap"
                      aria-label="Remove budget"
                      onClick={() => removeBudgetRow(b.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="cfo-btn cfo-btn--ghost dash-onboarding-add-btn"
              onClick={addBudgetRow}
            >
              <Plus size={14} /> Add Budget
            </button>

            <div className="dash-onboarding-footer">
              <span className="dash-onboarding-meta">
                Total Budgeted: <strong>{formatINR(budgets.reduce((acc, b) => acc + (parseFloat(b.limit) || 0), 0))} / month</strong>
              </span>
              <StepActions
                onBack={() => setStep(3)}
                busy={busy}
                disabled={!isStep4Valid}
                busyLabel="Saving budgets…"
                nextLabel="Review and finalize"
                nextShort="Review"
                onNext={handleProceedStep4}
                icon={<ArrowRight size={14} />}
              />
            </div>
          </div>
        </section>
      )}

      {/* STEP 5: Review & Launch */}
      {step === 5 && (
        <section className="cfo-panel dash-onboarding-panel">
          <Corners accent />
          <div className="cfo-panel-head">
            <strong>05 // Review &amp; Workspace Launch</strong>
            <span>CONFIRMATION</span>
          </div>
          <div className="dash-onboarding-body">
            <div className="dash-onboarding-summary">
              <div className="dash-onboarding-summary-col">
                <span className="cfo-kicker">ACCOUNTS INITIALIZED</span>
                <p><strong>{accounts.length} Accounts</strong> totaling {formatINR(accounts.reduce((acc, a) => acc + (parseFloat(a.balance) || 0), 0))}</p>
              </div>

              <div className="dash-onboarding-summary-col">
                <span className="cfo-kicker">MONTHLY INFLOW</span>
                <p><strong>{formatINR(parseFloat(monthlyIncome) || 0)} / month</strong> ({incomeSource})</p>
              </div>

              <div className="dash-onboarding-summary-col">
                <span className="cfo-kicker">POLICY SETTINGS</span>
                <p><strong>{savingsTarget}% Target</strong> · {emergencyMonths}M Cushion · {riskTolerance.toUpperCase()}</p>
              </div>

              <div className="dash-onboarding-summary-col">
                <span className="cfo-kicker">BUDGET CAPS</span>
                <p><strong>{budgets.length} Categories</strong> totaling {formatINR(budgets.reduce((acc, b) => acc + (parseFloat(b.limit) || 0), 0))} / month</p>
              </div>
            </div>

            <div className="dash-onboarding-notice">
              <CheckCircle2 size={16} />
              <p>
                Balances, accounts, policy, and category caps are saved on your ledger. You can adjust or export them anytime in <strong>Settings</strong>.
              </p>
            </div>

            <div className="dash-onboarding-footer">
              <StepActions
                onBack={() => setStep(4)}
                busy={busy}
                busyLabel="Opening workspace…"
                nextLabel="Launch workspace"
                nextShort="Launch"
                onNext={handleFinish}
                icon={<Sparkles size={14} />}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
