"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getApiErrorMessage } from "@/lib/api";
import { invalidateDashboardCache } from "@/lib/dashboard/use-dashboard";
import {
  createAccount,
  updateAccount,
  createGoal,
  updateGoal,
  createTransaction,
  updateTransaction,
  listAccounts,
  listCategories,
  listGoals,
  upsertBudget,
  type LedgerAccount,
  type LedgerBudget,
  type LedgerCategory,
  type LedgerGoal,
  type LedgerTransaction,
} from "@/lib/ledger-api";

import { Corners } from "./ui";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="cfo-field">
      <span className="cfo-label">{label}</span>
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

function toDateTimeLocalValue(dateStr?: string | Date) {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 16);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function TransactionComposer({
  transaction,
  onSuccess,
  onCancel,
  redirectToDashboard = true,
}: {
  transaction?: LedgerTransaction | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  redirectToDashboard?: boolean;
} = {}) {
  const router = useRouter();
  const [state, setState] = useState({
    accounts: [] as LedgerAccount[],
    categories: [] as LedgerCategory[],
    amount: transaction ? String(transaction.amount) : "",
    type: transaction ? transaction.transaction_type : "expense",
    status: transaction ? transaction.status : "posted",
    accountId: transaction ? transaction.account_id || "" : "",
    categoryId: transaction ? transaction.category_id || "" : "",
    description: transaction
      ? transaction.description || transaction.merchant_name || ""
      : "",
    when: toDateTimeLocalValue(transaction?.transaction_date),
    busy: false,
    tone: "idle" as "idle" | "error" | "ok",
    message: "",
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([listAccounts(), listCategories()])
      .then(([nextAccounts, nextCategories]) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          accounts: nextAccounts,
          categories: nextCategories,
          accountId: transaction ? prev.accountId : (prev.accountId || nextAccounts[0]?.id || ""),
        }));
      })
      .catch((error) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          tone: "error",
          message: getApiErrorMessage(error, "Unable to load ledger options"),
        }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(state.amount);
    if (!Number.isFinite(value) || value <= 0) {
      setState((prev) => ({
        ...prev,
        tone: "error",
        message: "Enter an amount greater than zero",
      }));
      return;
    }
    setState((prev) => ({ ...prev, busy: true, message: "" }));
    try {
      const payload = {
        amount: value,
        transaction_type: state.type,
        status: state.status,
        account_id: state.accountId || null,
        category_id: state.categoryId || null,
        description: state.description.trim() || undefined,
        merchant_name: state.description.trim() || undefined,
        transaction_date: new Date(state.when).toISOString(),
      };
      if (transaction?.id) {
        await updateTransaction(transaction.id, payload);
      } else {
        await createTransaction(payload);
      }
      invalidateDashboardCache();
      setState((prev) => ({
        ...prev,
        tone: "ok",
        message: transaction ? "Transaction updated" : "Transaction recorded",
        amount: "",
        description: "",
      }));
      if (onSuccess) {
        onSuccess();
      } else if (redirectToDashboard) {
        router.push("/dashboard");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        tone: "error",
        message: getApiErrorMessage(
          error,
          transaction
            ? "Unable to update the transaction"
            : "Unable to record the transaction"
        ),
      }));
    } finally {
      setState((prev) => ({ ...prev, busy: false }));
    }
  }

  return (
    <section className="cfo-panel dash-panel">
      <Corners accent />
      <div className="cfo-panel-head">
        <strong>{transaction ? "Edit transaction" : "Add a transaction"}</strong>
        {onCancel ? (
          <button
            type="button"
            className="dash-icon-btn"
            aria-label="Close dialog"
            onClick={onCancel}
          >
            ✕
          </button>
        ) : (
          <span>LEDGER</span>
        )}
      </div>
      {state.accounts.length === 0 && !state.busy && (
        <div style={{ margin: "1rem 1.25rem 0", padding: "0.75rem", background: "color-mix(in srgb, var(--cfo-accent) 10%, transparent)", border: "1px solid var(--cfo-accent)", fontSize: "0.78rem" }}>
          <p style={{ margin: 0, color: "var(--cfo-ink)", fontWeight: 500 }}>
            ⚠️ <strong>No accounts found.</strong> You must add a bank account with starting balance or record income before posting an expense.
          </p>
          <Link href="/settings?tab=accounts" style={{ display: "inline-block", marginTop: "0.4rem", color: "var(--cfo-accent)", fontWeight: 600 }}>
            Manage Accounts in Settings →
          </Link>
        </div>
      )}
      <form className="cfo-form dash-ledger-form" onSubmit={onSubmit}>
        <Field label="Amount (₹)">
          <input
            className="cfo-input"
            type="number"
            min="0.01"
            step="0.01"
            value={state.amount}
            onChange={(event) =>
              setState((prev) => ({ ...prev, amount: event.target.value }))
            }
            required
          />
        </Field>
        <Field label="Type">
          <select
            className="cfo-input"
            value={state.type}
            onChange={(event) =>
              setState((prev) => ({ ...prev, type: event.target.value }))
            }
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="loan_payment">Loan payment</option>
            <option value="fee">Fee</option>
            <option value="refund">Refund</option>
            <option value="interest">Interest</option>
            <option value="dividend">Dividend</option>
          </select>
        </Field>
        <Field label="Status">
          <select
            className="cfo-input"
            value={state.status}
            onChange={(event) =>
              setState((prev) => ({ ...prev, status: event.target.value }))
            }
          >
            <option value="posted">Posted</option>
            <option value="pending">Upcoming</option>
          </select>
        </Field>
        <Field label="Account">
          <select
            className="cfo-input"
            value={state.accountId}
            onChange={(event) =>
              setState((prev) => ({ ...prev, accountId: event.target.value }))
            }
          >
            {state.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select
            className="cfo-input"
            value={state.categoryId}
            onChange={(event) =>
              setState((prev) => ({ ...prev, categoryId: event.target.value }))
            }
          >
            <option value="">Uncategorized</option>
            {state.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="When">
          <input
            className="cfo-input"
            type="datetime-local"
            value={state.when}
            onChange={(event) =>
              setState((prev) => ({ ...prev, when: event.target.value }))
            }
          />
        </Field>
        <Field label="Description">
          <input
            className="cfo-input"
            value={state.description}
            onChange={(event) =>
              setState((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="Salary, rent, Swiggy…"
          />
        </Field>
        <FormStatus tone={state.tone} message={state.message} />
        <button type="submit" className="cfo-btn cfo-btn--ghost" disabled={state.busy}>
          {state.busy ? "Saving…" : transaction ? "Save changes" : "Record transaction"}
        </button>
      </form>
    </section>
  );
}

export function GoalComposer({
  goal = null,
  onSuccess,
  onCancel,
  redirectToDashboard = true,
}: {
  goal?: LedgerGoal | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  redirectToDashboard?: boolean;
} = {}) {
  const router = useRouter();
  const [name, setName] = useState(goal?.name ?? "");
  const [goalType, setGoalType] = useState(goal?.goal_type ?? "savings");
  const [target, setTarget] = useState(
    goal ? String(Number(goal.target_amount)) : ""
  );
  const [current, setCurrent] = useState(
    goal ? String(Number(goal.current_amount)) : ""
  );
  const [targetDate, setTargetDate] = useState(
    goal?.target_date ? goal.target_date.slice(0, 10) : ""
  );
  const [busy, setBusy] = useState(false);
  const [tone, setTone] = useState<"idle" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const targetAmount = Number(target);
    const currentAmount = Number(current);
    if (!name.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !targetDate) {
      setTone("error");
      setMessage("Name, target amount, and date are required");
      return;
    }
    if (currentAmount > targetAmount) {
      setTone("error");
      setMessage("Current amount cannot exceed the target amount");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const payload = {
        name: name.trim(),
        goal_type: goalType,
        target_amount: targetAmount,
        current_amount: Number.isFinite(currentAmount) ? currentAmount : 0,
        target_date: targetDate,
      };
      if (goal) {
        await updateGoal(goal.id, payload);
      } else {
        await createGoal(payload);
      }
      invalidateDashboardCache();
      setTone("ok");
      setMessage(goal ? "Goal updated" : "Goal saved");
      if (!goal) {
        setName("");
        setTarget("");
        setCurrent("");
        setTargetDate("");
      }
      if (onSuccess) {
        onSuccess();
      } else if (redirectToDashboard) {
        router.push("/dashboard");
      }
    } catch (error) {
      setTone("error");
      setMessage(
        getApiErrorMessage(
          error,
          goal ? "Unable to update the goal" : "Unable to save the goal"
        )
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cfo-panel dash-panel">
      <Corners accent />
      <div className="cfo-panel-head">
        <strong>{goal ? "Edit goal" : "Add a goal"}</strong>
        {onCancel ? (
          <button
            type="button"
            className="dash-icon-btn"
            aria-label="Close dialog"
            onClick={onCancel}
          >
            ✕
          </button>
        ) : (
          <span>TARGET</span>
        )}
      </div>
      <form className="cfo-form dash-ledger-form" onSubmit={onSubmit}>
        <Field label="Name">
          <input className="cfo-input" value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <Field label="Type">
          <select className="cfo-input" value={goalType} onChange={(event) => setGoalType(event.target.value)}>
            <option value="emergency_fund">Emergency fund</option>
            <option value="savings">Savings</option>
            <option value="education">Education</option>
            <option value="home">Home</option>
            <option value="vehicle">Vehicle</option>
            <option value="travel">Travel</option>
            <option value="investment">Investment</option>
            <option value="debt_payoff">Debt payoff</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Target (₹)">
          <input className="cfo-input" type="number" min="1" step="1" value={target} onChange={(event) => setTarget(event.target.value)} required />
        </Field>
        <Field label="Current (₹)">
          <input className="cfo-input" type="number" min="0" step="1" value={current} onChange={(event) => setCurrent(event.target.value)} />
        </Field>
        <Field label="Target date">
          <input className="cfo-input" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} required />
        </Field>
        <FormStatus tone={tone} message={message} />
        <button type="submit" className="cfo-btn cfo-btn--ghost" disabled={busy}>
          {busy ? "Saving…" : goal ? "Save changes" : "Save goal"}
        </button>
      </form>
    </section>
  );
}

export function BudgetComposer({
  budget = null,
  onSuccess,
  onCancel,
  redirectToDashboard = true,
}: {
  budget?: LedgerBudget | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  redirectToDashboard?: boolean;
} = {}) {
  const router = useRouter();
  const [categories, setCategories] = useState<LedgerCategory[]>([]);
  const [categoryId, setCategoryId] = useState(budget?.category_id ?? "");
  const [limit, setLimit] = useState(
    budget ? String(Number(budget.monthly_limit)) : ""
  );
  const [busy, setBusy] = useState(false);
  const [tone, setTone] = useState<"idle" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    listCategories()
      .then((nextCategories) => {
        if (cancelled) return;
        const spendCategories = nextCategories.filter((item) => item.name !== "Income");
        setCategories(spendCategories);
        setCategoryId((current) => current || spendCategories[0]?.id || "");
      })
      .catch((error) => {
        if (cancelled) return;
        setTone("error");
        setMessage(getApiErrorMessage(error, "Unable to load budgets"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const monthly = Number(limit);
    if (!categoryId || !Number.isFinite(monthly) || monthly <= 0) {
      setTone("error");
      setMessage("Choose a category and a limit greater than zero");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await upsertBudget({ category_id: categoryId, monthly_limit: monthly });
      invalidateDashboardCache();
      setTone("ok");
      setMessage("Budget saved");
      setLimit("");
      if (onSuccess) {
        onSuccess();
      } else if (redirectToDashboard) {
        router.push("/dashboard");
      }
    } catch (error) {
      setTone("error");
      setMessage(
        getApiErrorMessage(
          error,
          budget ? "Unable to update the budget" : "Unable to save the budget"
        )
      );
    } finally {
      setBusy(false);
    }
  }

  const categoryOptions =
    budget && !categories.some((item) => item.id === budget.category_id)
      ? [
          {
            id: budget.category_id,
            name: budget.category_name,
            is_system: true,
          },
          ...categories,
        ]
      : categories;

  return (
    <section className="cfo-panel dash-panel">
      <Corners accent />
      <div className="cfo-panel-head">
        <strong>{budget ? "Edit budget" : "Add a budget"}</strong>
        {onCancel ? (
          <button
            type="button"
            className="dash-icon-btn"
            aria-label="Close dialog"
            onClick={onCancel}
          >
            ✕
          </button>
        ) : (
          <span>BUDGET</span>
        )}
      </div>
      <form className="cfo-form dash-ledger-form" onSubmit={onSubmit}>
        <Field label="Category">
          <select
            className="cfo-input"
            value={categoryId}
            disabled={Boolean(budget)}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Monthly limit (₹)">
          <input className="cfo-input" type="number" min="1" step="1" value={limit} onChange={(event) => setLimit(event.target.value)} required />
        </Field>
        <FormStatus tone={tone} message={message} />
        <button type="submit" className="cfo-btn cfo-btn--ghost" disabled={busy}>
          {busy ? "Saving…" : budget ? "Save changes" : "Save budget"}
        </button>
      </form>
    </section>
  );
}

export function AccountComposer({
  account = null,
  defaultType = "bank",
  title = "Add an account",
  onSuccess,
  onCancel,
  redirectToDashboard = true,
}: {
  account?: LedgerAccount | null;
  defaultType?: string;
  title?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  redirectToDashboard?: boolean;
} = {}) {
  const router = useRouter();
  const [name, setName] = useState(account?.name ?? "");
  const [accountType, setAccountType] = useState(account?.account_type ?? defaultType);
  const [balance, setBalance] = useState(
    account ? String(Number(account.balance)) : ""
  );
  const [busy, setBusy] = useState(false);
  const [tone, setTone] = useState<"idle" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const opening = Number(balance);
    if (!name.trim()) {
      setTone("error");
      setMessage("Enter an account name");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const payload = {
        name: name.trim(),
        account_type: accountType,
        balance: Number.isFinite(opening) ? opening : 0,
      };
      if (account) {
        await updateAccount(account.id, payload);
      } else {
        await createAccount(payload);
      }
      invalidateDashboardCache();
      setTone("ok");
      setMessage(account ? "Account updated" : "Account created");
      if (!account) {
        setName("");
        setBalance("");
      }
      if (onSuccess) {
        onSuccess();
      } else if (redirectToDashboard) {
        router.push("/dashboard");
      }
    } catch (error) {
      setTone("error");
      setMessage(
        getApiErrorMessage(
          error,
          account ? "Unable to update the account" : "Unable to create the account"
        )
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cfo-panel dash-panel">
      <Corners accent />
      <div className="cfo-panel-head">
        <strong>{account ? "Edit account" : title}</strong>
        {onCancel ? (
          <button
            type="button"
            className="dash-icon-btn"
            aria-label="Close dialog"
            onClick={onCancel}
          >
            ✕
          </button>
        ) : (
          <span>ACCOUNT</span>
        )}
      </div>
      <form className="cfo-form dash-ledger-form" onSubmit={onSubmit}>
        <Field label="Name">
          <input className="cfo-input" value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <Field label="Type">
          <select className="cfo-input" value={accountType} onChange={(event) => setAccountType(event.target.value)}>
            <option value="bank">Bank</option>
            <option value="savings">Savings</option>
            <option value="cash">Cash</option>
            <option value="credit_card">Credit card</option>
            <option value="investment">Investment</option>
            <option value="loan">Loan</option>
          </select>
        </Field>
        <Field label={account ? "Current balance (₹)" : "Opening balance (₹)"}>
          <input className="cfo-input" type="number" min="0" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} />
        </Field>
        <FormStatus tone={tone} message={message} />
        <button type="submit" className="cfo-btn cfo-btn--ghost" disabled={busy}>
          {busy ? "Saving…" : account ? "Save changes" : "Create account"}
        </button>
      </form>
    </section>
  );
}
