import { api } from "./api";

export interface AccountDraft {
  id?: string;
  name: string;
  account_type: string;
  balance: string | number;
  description?: string;
}

export interface IncomeDraft {
  income_source: string;
  monthly_income: string | number;
  record_initial_income: boolean;
  account_id?: string;
}

export interface PolicyDraft {
  savings_target: number;
  emergency_months: number;
  risk_tolerance: "conservative" | "moderate" | "aggressive";
}

export interface BudgetDraft {
  category_id: string;
  category_name?: string;
  monthly_limit: string | number;
}

export interface OnboardingStatusData {
  is_first_time?: boolean;
  show_getting_started?: boolean;
  step: 1 | 2 | 3 | 4 | 5;
  completed: boolean;
  accounts: Array<{
    id: string;
    name: string;
    account_type: "bank" | "savings" | "cash" | "investment";
    balance: string;
    description: string;
  }>;
  income: {
    income_source: string;
    monthly_income: string;
    record_initial_income: boolean;
  };
  policy: {
    savings_target: number;
    emergency_months: number;
    risk_tolerance: "conservative" | "moderate" | "aggressive";
  };
  budgets: Array<{
    category_id: string;
    category_name: string;
    monthly_limit: string;
  }>;
}

type Envelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function fetchGettingStartedStatus(): Promise<OnboardingStatusData> {
  const response = await api.get<Envelope<OnboardingStatusData>>("/api/getting-started/status");
  return response.data.data;
}

export async function fetchOnboardingStatus(): Promise<OnboardingStatusData> {
  const response = await api.get<Envelope<OnboardingStatusData>>("/api/getting-started/status");
  return response.data.data;
}

export async function submitStep1Accounts(accounts: AccountDraft[]) {
  const response = await api.post("/api/onboarding/step-1", {
    accounts: accounts.map((a) => ({
      name: a.name.trim(),
      account_type: a.account_type,
      balance: parseFloat(String(a.balance)) || 0,
      description: a.description?.trim() || undefined,
    })),
  });
  return response.data;
}

export async function submitStep2Income(income: IncomeDraft) {
  const response = await api.post("/api/onboarding/step-2", {
    income_source: income.income_source.trim(),
    monthly_income: parseFloat(String(income.monthly_income)) || 0,
    record_initial_income: income.record_initial_income,
    account_id: income.account_id || undefined,
  });
  return response.data;
}

export async function submitStep3Policy(policy: PolicyDraft) {
  const response = await api.post("/api/onboarding/step-3", {
    savings_target: policy.savings_target,
    emergency_months: policy.emergency_months,
    risk_tolerance: policy.risk_tolerance,
  });
  return response.data;
}

export async function submitStep4Budgets(budgets: Array<{ category_id: string; category_name?: string; limit: string | number }>) {
  const response = await api.post("/api/onboarding/step-4", {
    budgets: budgets
      .filter((b) => (parseFloat(String(b.limit)) || 0) > 0)
      .map((b) => ({
        category_id: b.category_id,
        category_name: b.category_name,
        monthly_limit: parseFloat(String(b.limit)) || 0,
      })),
  });
  return response.data;
}

export async function deleteOnboardingAccount(accountId: string) {
  const response = await api.delete(`/api/onboarding/accounts/${accountId}`);
  return response.data;
}

export async function deleteAllOnboardingAccounts() {
  const response = await api.delete("/api/onboarding/accounts");
  return response.data;
}

export async function deleteOnboardingBudget(categoryId: string) {
  const response = await api.delete(`/api/onboarding/budgets/${categoryId}`);
  return response.data;
}

export async function deleteAllOnboardingBudgets() {
  const response = await api.delete("/api/onboarding/budgets");
  return response.data;
}

export async function submitCompleteOnboarding() {
  const response = await api.post("/api/onboarding/complete", {});
  return response.data;
}


