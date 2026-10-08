"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Wallet, Landmark, CreditCard, PiggyBank, TrendingUp, DollarSign } from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import { invalidateDashboardCache } from "@/lib/dashboard/use-dashboard";
import { formatINR } from "@/lib/format-money";
import {
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
  type LedgerAccount,
} from "@/lib/ledger-api";

import { AccountComposer } from "./ledger-forms";
import { DeleteConfirmDialog, EditDeleteActions } from "./row-actions";
import { Corners, EmptyBlock, ErrorBlock, Panel, Skeleton } from "./ui";

function accountTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case "bank":
    case "savings":
      return <Landmark size={14} aria-hidden="true" />;
    case "credit_card":
      return <CreditCard size={14} aria-hidden="true" />;
    case "investment":
      return <TrendingUp size={14} aria-hidden="true" />;
    case "cash":
      return <DollarSign size={14} aria-hidden="true" />;
    default:
      return <Wallet size={14} aria-hidden="true" />;
  }
}

function accountTypeBadgeClass(type: string) {
  switch (type.toLowerCase()) {
    case "bank":
    case "savings":
      return "cfo-badge--ok";
    case "investment":
      return "cfo-badge--accent";
    case "credit_card":
    case "loan":
      return "cfo-badge--warn";
    default:
      return "";
  }
}

export function AccountsPanel() {
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
      setAccounts(data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load accounts"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listAccounts()
      .then((data) => {
        if (cancelled) return;
        setAccounts(data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err, "Unable to load accounts"));
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
      setError(getApiErrorMessage(err, "Unable to delete account"));
    } finally {
      setDeleteBusy(false);
    }
  };

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (Number(acc.balance) || 0),
    0
  );

  return (
    <Panel
      title="Accounts & Liquidity"
      meta={
        <span>
          {accounts.length} ACCOUNTS · TOTAL {formatINR(totalBalance)}
        </span>
      }
      accent
      actions={
        <button
          type="button"
          className="cfo-btn cfo-btn--ghost"
          style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem" }}
          onClick={() => {
            setEditingAccount(null);
            setDialogOpen(true);
          }}
        >
          <Plus size={13} aria-hidden="true" /> Add Account
        </button>
      }
    >
      {error ? (
        <ErrorBlock message={error} onRetry={loadAccounts} />
      ) : loading ? (
        <Skeleton lines={6} />
      ) : accounts.length === 0 ? (
        <EmptyBlock
          title="No accounts found"
          body="Add your checking, savings, cash, or investment accounts to start tracking liquidity."
        />
      ) : (
        <>
          <div className="dash-tx-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>Current Balance</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td>
                      <strong>{acc.name}</strong>
                    </td>
                    <td>
                      <span
                        className={`cfo-badge ${accountTypeBadgeClass(
                          acc.account_type
                        )}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                      >
                        {accountTypeIcon(acc.account_type)}
                        {acc.account_type.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: "var(--cfo-muted)", fontSize: "0.78rem" }}>
                      {acc.description || "—"}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--cfo-font-mono)",
                        fontWeight: 600,
                      }}
                    >
                      {formatINR(Number(acc.balance))}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <EditDeleteActions
                        editLabel="Edit account"
                        deleteLabel="Delete account"
                        onEdit={() => {
                          setEditingAccount(acc);
                          setDialogOpen(true);
                        }}
                        onDelete={() => setDeletingAccount(acc)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-tx-cards">
            {accounts.map((acc) => (
              <article key={acc.id} className="cfo-card dash-tx-card">
                <div className="dash-tx-card-head">
                  <span
                    className={`cfo-badge ${accountTypeBadgeClass(
                      acc.account_type
                    )}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    {accountTypeIcon(acc.account_type)}
                    {acc.account_type.replace("_", " ").toUpperCase()}
                  </span>
                  <strong
                    style={{
                      marginLeft: "auto",
                      fontFamily: "var(--cfo-font-mono)",
                      color: "var(--cfo-ink)",
                    }}
                  >
                    {formatINR(Number(acc.balance))}
                  </strong>
                </div>
                <div className="dash-tx-card-body">
                  <strong className="dash-tx-card-desc">{acc.name}</strong>
                  {acc.description && (
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.76rem", color: "var(--cfo-muted)" }}>
                      {acc.description}
                    </p>
                  )}
                </div>
                <div className="dash-tx-card-footer">
                  <EditDeleteActions
                    className="dash-tx-card-actions"
                    editLabel="Edit account"
                    deleteLabel="Delete account"
                    onEdit={() => {
                      setEditingAccount(acc);
                      setDialogOpen(true);
                    }}
                    onDelete={() => setDeletingAccount(acc)}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Account Modal with 1-second buttery smooth transition */}
      <AnimatePresence>
        {dialogOpen && (
          <>
            <motion.div
              key="account-modal-backdrop"
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
              key="account-modal-dialog"
              className="dash-modal"
              role="dialog"
              aria-modal="true"
              aria-label={editingAccount ? "Edit account" : "Add an account"}
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
                title="Add New Account"
                redirectToDashboard={false}
                onSuccess={() => {
                  setDialogOpen(false);
                  setEditingAccount(null);
                  loadAccounts();
                }}
                onCancel={() => {
                  setDialogOpen(false);
                  setEditingAccount(null);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {deletingAccount ? (
        <DeleteConfirmDialog
          titleId="delete-acc-title"
          title="Delete account"
          busy={deleteBusy}
          onCancel={() => setDeletingAccount(null)}
          onConfirm={handleDeleteConfirm}
          description={
            <>
              Are you sure you want to delete the <strong>{deletingAccount.name}</strong> account?
              Transactions associated with this account may be affected.
            </>
          }
        />
      ) : null}
    </Panel>
  );
}
