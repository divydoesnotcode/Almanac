"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  FileText,
  Repeat,
  ShieldCheck,
} from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import {
  listAccounts,
  listTransactions,
  type LedgerAccount,
  type LedgerTransaction,
} from "@/lib/ledger-api";

import { ComparisonReport } from "./comparison-report";
import { LifestyleReport } from "./lifestyle-report";
import { StatementReport } from "./statement-report";
import { TaxReport } from "./tax-report";
import { PersistedTab, ResponsiveTabs, usePersistedTab } from "../responsive-tabs";
import { ErrorBlock, Skeleton } from "../ui";

export type ReportTab = "statement" | "comparison" | "tax" | "lifestyle";

interface ReportTabItem {
  id: ReportTab;
  label: string;
  icon: typeof FileText;
}

const REPORT_TABS: ReportTabItem[] = [
  { id: "statement", label: "Monthly Statement (P&L)", icon: FileText },
  { id: "comparison", label: "Historical Comparison", icon: BarChart3 },
  { id: "tax", label: "Tax & Deductions", icon: ShieldCheck },
  { id: "lifestyle", label: "Subscriptions & Leaks", icon: Repeat },
];

export function ReportsView() {
  const { active, seen, select } = usePersistedTab<ReportTab>("statement");
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txs, accs] = await Promise.all([
        listTransactions(1000),
        listAccounts(),
      ]);
      setTransactions(txs || []);
      setAccounts(accs || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load financial data for reports"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listTransactions(1000), listAccounts()])
      .then(([txs, accs]) => {
        if (cancelled) return;
        setTransactions(txs || []);
        setAccounts(accs || []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err, "Unable to load financial data for reports"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dash-content-inner">
      <div className="dash-subpage dash-subpage--wide">
        <div className="dash-page-header no-print">
          <div>
            <p className="cfo-kicker">Review &amp; Intelligence</p>
            <h1>Financial Reports</h1>
            <p>
              Formal statements, historical comparisons, tax deduction audit, and subscription leak analysis.
            </p>
          </div>
        </div>

        <ResponsiveTabs
          tabs={REPORT_TABS}
          activeTab={active}
          onChange={select}
          ariaLabel="Reports navigation"
        />

        {loading ? (
          <Skeleton lines={8} />
        ) : error ? (
          <ErrorBlock message={error} onRetry={loadData} />
        ) : (
          <div className="dash-report-content dash-tab-stack">
            <PersistedTab seen={seen.includes("statement")} shown={active === "statement"}>
              <StatementReport transactions={transactions} accounts={accounts} />
            </PersistedTab>
            <PersistedTab seen={seen.includes("comparison")} shown={active === "comparison"}>
              <ComparisonReport transactions={transactions} />
            </PersistedTab>
            <PersistedTab seen={seen.includes("tax")} shown={active === "tax"}>
              <TaxReport transactions={transactions} />
            </PersistedTab>
            <PersistedTab seen={seen.includes("lifestyle")} shown={active === "lifestyle"}>
              <LifestyleReport transactions={transactions} />
            </PersistedTab>
          </div>
        )}
      </div>
    </div>
  );
}
