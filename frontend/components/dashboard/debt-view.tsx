"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import { invalidateDashboardCache } from "@/lib/dashboard/use-dashboard";
import { formatINR } from "@/lib/format-money";
import { deleteAccount, listAccounts, type LedgerAccount } from "@/lib/ledger-api";

import { AccountComposer } from "./ledger-forms";
import { DeleteConfirmDialog, EditDeleteActions } from "./row-actions";
import { EmptyBlock, ErrorBlock, Panel, Skeleton } from "./ui";

const LIABILITY_TYPES = new Set(["credit_card", "loan"]);

export function DebtView() {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<LedgerAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<LedgerAccount | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAccounts();
      const liabilityAccounts = (data || []).filter((acc) =>
        LIABILITY_TYPES.has(acc.account_type)
      );
      setAccounts(liabilityAccounts);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load debts"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listAccounts()
      .then((data) => {
        if (cancelled) return;
        const liabilityAccounts = (data || []).filter((acc) =>
          LIABILITY_TYPES.has(acc.account_type)
        );
        setAccounts(liabilityAccounts);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err, "Unable to load debts"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dialogOpen && !deletingAccount) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (deletingAccount && !deleteBusy) {
        setDeletingAccount(null);
      } else if (dialogOpen) {
        setDialogOpen(false);
        setEditingAccount(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen, deletingAccount, deleteBusy]);

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    setDeleteBusy(true);
    try {
      await deleteAccount(deletingAccount.id);
      invalidateDashboardCache();
      setDeletingAccount(null);
      loadAccounts();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to delete liability"));
    } finally {
      setDeleteBusy(false);
    }
  };

  const totalOutstanding = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance || 0),
    0
  );

  return (
    <div className="dash-content-inner">
      <div className="dash-subpage dash-subpage--wide">
        <div className="dash-page-header">
          <div>
            <p className="cfo-kicker">Liabilities</p>
            <h1>Debt</h1>
            <p>
              Add a credit card or loan so outstanding balances and payments can
              appear on the dashboard.
            </p>
          </div>
          <button
            type="button"
            className="cfo-btn cfo-btn--ghost"
            onClick={() => {
              setEditingAccount(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={14} aria-hidden="true" /> Add Liability
          </button>
        </div>

        <Panel
          title="Outstanding Liabilities"
          meta={
            <span>
              {accounts.length} TOTAL · {formatINR(totalOutstanding)}
            </span>
          }
          accent
        >
          {error ? (
            <ErrorBlock message={error} onRetry={loadAccounts} />
          ) : loading ? (
            <Skeleton lines={6} />
          ) : accounts.length === 0 ? (
            <EmptyBlock
              title="No liabilities yet"
              body="Add a loan or credit card account to track outstanding debt and repayments."
            />
          ) : (
            <>
              <div className="dash-tx-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Liability / Account</th>
                      <th>Type</th>
                      <th style={{ textAlign: "right" }}>Outstanding Balance</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id}>
                        <td>{account.name}</td>
                        <td>
                          <span className="cfo-badge">
                            {account.account_type.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "var(--cfo-mono)" }}>
                          {formatINR(Number(account.balance))}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <EditDeleteActions
                            editLabel="Edit liability"
                            deleteLabel="Delete liability"
                            onEdit={() => {
                              setEditingAccount(account);
                              setDialogOpen(true);
                            }}
                            onDelete={() => setDeletingAccount(account)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dash-tx-cards">
                {accounts.map((account) => (
                  <article key={account.id} className="cfo-card dash-tx-card">
                    <div className="dash-tx-card-head">
                      <span className="dash-tx-card-date">
                        {account.account_type.replaceAll("_", " ")}
                      </span>
                      <span className="dash-tx-card-amount dash-neg">
                        {formatINR(Number(account.balance))}
                      </span>
                    </div>
                    <div className="dash-tx-card-body">
                      <strong className="dash-tx-card-desc">{account.name}</strong>
                    </div>
                    <div className="dash-tx-card-footer">
                      <EditDeleteActions
                        className="dash-tx-card-actions"
                        editLabel="Edit liability"
                        deleteLabel="Delete liability"
                        onEdit={() => {
                          setEditingAccount(account);
                          setDialogOpen(true);
                        }}
                        onDelete={() => setDeletingAccount(account)}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </Panel>

        {/* Add / Edit Liability Modal with 1-second buttery smooth transition */}
        <AnimatePresence>
          {dialogOpen && (
            <>
              <motion.div
                key="debt-modal-backdrop"
                className="dash-modal-backdrop"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingAccount(null);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                aria-label="Close dialog backdrop"
              />
              <motion.div
                key="debt-modal-dialog"
                className="dash-modal"
                role="dialog"
                aria-modal="true"
                aria-label={editingAccount ? "Edit liability" : "Add a liability"}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  duration: 1.0,
                  ease: [0.16, 1, 0.3, 1], // 1-second buttery smooth Apple physics curve
                }}
              >
                <AccountComposer
                  key={editingAccount ? editingAccount.id : "new"}
                  account={editingAccount}
                  defaultType="loan"
                  title="Add a liability"
                  onSuccess={() => {
                    setDialogOpen(false);
                    setEditingAccount(null);
                    loadAccounts();
                  }}
                  onCancel={() => {
                    setDialogOpen(false);
                    setEditingAccount(null);
                  }}
                  redirectToDashboard={false}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {deletingAccount ? (
          <DeleteConfirmDialog
            titleId="delete-debt-title"
            title="Delete liability"
            busy={deleteBusy}
            onCancel={() => setDeletingAccount(null)}
            onConfirm={handleDeleteConfirm}
            description={
              <>
                Are you sure you want to delete the{" "}
                <strong>
                  {deletingAccount.name} liability (
                  {formatINR(Number(deletingAccount.balance))})
                </strong>
                ? This removes the liability account and cannot be undone.
              </>
            }
          />
        ) : null}
      </div>
    </div>
  );
}
