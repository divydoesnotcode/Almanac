"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import { invalidateDashboardCache } from "@/lib/dashboard/use-dashboard";
import { formatINR } from "@/lib/format-money";
import { deleteBudget, listBudgets, type LedgerBudget } from "@/lib/ledger-api";

import { BudgetComposer } from "./ledger-forms";
import { DeleteConfirmDialog, EditDeleteActions } from "./row-actions";
import { EmptyBlock, ErrorBlock, Panel, Skeleton } from "./ui";

export function BudgetsView() {
  const [budgets, setBudgets] = useState<LedgerBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<LedgerBudget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<LedgerBudget | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBudgets();
      setBudgets(data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load budgets"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listBudgets()
      .then((data) => {
        if (cancelled) return;
        setBudgets(data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err, "Unable to load budgets"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dialogOpen && !deletingBudget) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (deletingBudget && !deleteBusy) {
        setDeletingBudget(null);
      } else if (dialogOpen) {
        setDialogOpen(false);
        setEditingBudget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen, deletingBudget, deleteBusy]);

  const handleDeleteConfirm = async () => {
    if (!deletingBudget) return;
    setDeleteBusy(true);
    try {
      await deleteBudget(deletingBudget.id);
      invalidateDashboardCache();
      setDeletingBudget(null);
      loadBudgets();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to delete budget"));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="dash-content-inner">
      <div className="dash-subpage dash-subpage--wide">
        <div className="dash-page-header">
          <div>
            <p className="cfo-kicker">Limits</p>
            <h1>Budgets</h1>
            <p>Set monthly ceilings by category. Overruns surface as quiet warnings on the dashboard.</p>
          </div>
          <button
            type="button"
            className="cfo-btn cfo-btn--ghost"
            onClick={() => {
              setEditingBudget(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={14} aria-hidden="true" /> Add Budget
          </button>
        </div>

        <Panel
          title="Monthly limits"
          meta={<span>{budgets.length} TOTAL</span>}
          accent
        >
          {error ? (
            <ErrorBlock message={error} onRetry={loadBudgets} />
          ) : loading ? (
            <Skeleton lines={6} />
          ) : budgets.length === 0 ? (
            <EmptyBlock
              title="No monthly limits yet"
              body="Add a category ceiling to see how the month is tracking."
            />
          ) : (
            <>
              <div className="dash-tx-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Monthly limit</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((budget) => (
                      <tr key={budget.id}>
                        <td>{budget.category_name}</td>
                        <td>{formatINR(Number(budget.monthly_limit))}</td>
                        <td style={{ textAlign: "right" }}>
                          <EditDeleteActions
                            editLabel="Edit budget"
                            deleteLabel="Delete budget"
                            onEdit={() => {
                              setEditingBudget(budget);
                              setDialogOpen(true);
                            }}
                            onDelete={() => setDeletingBudget(budget)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dash-tx-cards">
                {budgets.map((budget) => (
                  <article key={budget.id} className="cfo-card dash-tx-card">
                    <div className="dash-tx-card-head">
                      <span className="dash-tx-card-date">Monthly limit</span>
                      <span className="dash-tx-card-amount">
                        {formatINR(Number(budget.monthly_limit))}
                      </span>
                    </div>
                    <div className="dash-tx-card-body">
                      <strong className="dash-tx-card-desc">{budget.category_name}</strong>
                    </div>
                    <div className="dash-tx-card-footer">
                      <EditDeleteActions
                        className="dash-tx-card-actions"
                        editLabel="Edit budget"
                        deleteLabel="Delete budget"
                        onEdit={() => {
                          setEditingBudget(budget);
                          setDialogOpen(true);
                        }}
                        onDelete={() => setDeletingBudget(budget)}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </Panel>

        {/* Add / Edit Budget Modal with 1-second buttery smooth transition */}
        <AnimatePresence>
          {dialogOpen && (
            <>
              <motion.div
                key="budget-modal-backdrop"
                className="dash-modal-backdrop"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingBudget(null);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                aria-label="Close dialog backdrop"
              />
              <motion.div
                key="budget-modal-dialog"
                className="dash-modal"
                role="dialog"
                aria-modal="true"
                aria-label={editingBudget ? "Edit budget" : "Add a budget"}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  duration: 1.0,
                  ease: [0.16, 1, 0.3, 1], // 1-second buttery smooth Apple physics curve
                }}
              >
                <BudgetComposer
                  key={editingBudget ? editingBudget.id : "new"}
                  budget={editingBudget}
                  onSuccess={() => {
                    setDialogOpen(false);
                    setEditingBudget(null);
                    loadBudgets();
                  }}
                  onCancel={() => {
                    setDialogOpen(false);
                    setEditingBudget(null);
                  }}
                  redirectToDashboard={false}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {deletingBudget ? (
          <DeleteConfirmDialog
            titleId="delete-budget-title"
            title="Delete budget"
            busy={deleteBusy}
            onCancel={() => setDeletingBudget(null)}
            onConfirm={handleDeleteConfirm}
            description={
              <>
                Are you sure you want to delete the{" "}
                <strong>
                  {deletingBudget.category_name} budget (
                  {formatINR(Number(deletingBudget.monthly_limit))})
                </strong>
                ? This removes the monthly ceiling and cannot be undone.
              </>
            }
          />
        ) : null}
      </div>
    </div>
  );
}
