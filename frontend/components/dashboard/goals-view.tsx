"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import { invalidateDashboardCache } from "@/lib/dashboard/use-dashboard";
import { formatDate, formatINR } from "@/lib/format-money";
import { deleteGoal, listGoals, type LedgerGoal } from "@/lib/ledger-api";

import { GoalComposer } from "./ledger-forms";
import { DeleteConfirmDialog, EditDeleteActions } from "./row-actions";
import { EmptyBlock, ErrorBlock, Panel, Skeleton } from "./ui";

export function GoalsView() {
  const [goals, setGoals] = useState<LedgerGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LedgerGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<LedgerGoal | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGoals();
      setGoals(data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load goals"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listGoals()
      .then((data) => {
        if (cancelled) return;
        setGoals(data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err, "Unable to load goals"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dialogOpen && !deletingGoal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (deletingGoal && !deleteBusy) {
        setDeletingGoal(null);
      } else if (dialogOpen) {
        setDialogOpen(false);
        setEditingGoal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen, deletingGoal, deleteBusy]);

  const handleDeleteConfirm = async () => {
    if (!deletingGoal) return;
    setDeleteBusy(true);
    try {
      await deleteGoal(deletingGoal.id);
      invalidateDashboardCache();
      setDeletingGoal(null);
      loadGoals();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to delete goal"));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="dash-content-inner">
      <div className="dash-subpage dash-subpage--wide">
        <div className="dash-page-header">
          <div>
            <p className="cfo-kicker">Targets</p>
            <h1>Financial Goals</h1>
            <p>Name the target, the amount, and the date. The dashboard tracks whether you are on pace.</p>
          </div>
          <button
            type="button"
            className="cfo-btn cfo-btn--ghost"
            onClick={() => {
              setEditingGoal(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={14} aria-hidden="true" /> Add Goal
          </button>
        </div>

        <Panel
          title="All Goals"
          meta={<span>{goals.length} TOTAL</span>}
          accent
        >
          {error ? (
            <ErrorBlock message={error} onRetry={loadGoals} />
          ) : loading ? (
            <Skeleton lines={6} />
          ) : goals.length === 0 ? (
            <EmptyBlock
              title="No goals yet"
              body="Add a goal to track your milestones and savings pace."
            />
          ) : (
            <>
              <div className="dash-tx-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Goal</th>
                      <th>Type</th>
                      <th>Target</th>
                      <th>Current</th>
                      <th>Target Date</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((goal) => (
                      <tr key={goal.id}>
                        <td>{goal.name}</td>
                        <td>
                          <span className="cfo-badge">
                            {goal.goal_type.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td>{formatINR(Number(goal.target_amount))}</td>
                        <td>{formatINR(Number(goal.current_amount))}</td>
                        <td>{formatDate(goal.target_date)}</td>
                        <td style={{ textAlign: "right" }}>
                          <EditDeleteActions
                            editLabel="Edit goal"
                            deleteLabel="Delete goal"
                            onEdit={() => {
                              setEditingGoal(goal);
                              setDialogOpen(true);
                            }}
                            onDelete={() => setDeletingGoal(goal)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dash-tx-cards">
                {goals.map((goal) => (
                  <article key={goal.id} className="cfo-card dash-tx-card">
                    <div className="dash-tx-card-head">
                      <span className="dash-tx-card-date">
                        Target: {formatDate(goal.target_date)}
                      </span>
                      <span className="dash-tx-card-amount">
                        {formatINR(Number(goal.target_amount))}
                      </span>
                    </div>
                    <div className="dash-tx-card-body">
                      <strong className="dash-tx-card-desc">{goal.name}</strong>
                      <p style={{ marginTop: "0.25rem", fontSize: "0.82rem", color: "var(--cfo-ink-dim)" }}>
                        Current: {formatINR(Number(goal.current_amount))} · <span className="cfo-badge" style={{ textTransform: "capitalize" }}>{goal.goal_type.replaceAll("_", " ")}</span>
                      </p>
                    </div>
                    <div className="dash-tx-card-footer">
                      <EditDeleteActions
                        className="dash-tx-card-actions"
                        editLabel="Edit goal"
                        deleteLabel="Delete goal"
                        onEdit={() => {
                          setEditingGoal(goal);
                          setDialogOpen(true);
                        }}
                        onDelete={() => setDeletingGoal(goal)}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </Panel>

        {/* Add / Edit Goal Modal with 1-second buttery smooth transition */}
        <AnimatePresence>
          {dialogOpen && (
            <>
              <motion.div
                key="goal-modal-backdrop"
                className="dash-modal-backdrop"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingGoal(null);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                aria-label="Close dialog backdrop"
              />
              <motion.div
                key="goal-modal-dialog"
                className="dash-modal"
                role="dialog"
                aria-modal="true"
                aria-label={editingGoal ? "Edit goal" : "Add a goal"}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  duration: 1.0,
                  ease: [0.16, 1, 0.3, 1], // 1-second buttery smooth Apple physics curve
                }}
              >
                <GoalComposer
                  key={editingGoal ? editingGoal.id : "new"}
                  goal={editingGoal}
                  onSuccess={() => {
                    setDialogOpen(false);
                    setEditingGoal(null);
                    loadGoals();
                  }}
                  onCancel={() => {
                    setDialogOpen(false);
                    setEditingGoal(null);
                  }}
                  redirectToDashboard={false}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {deletingGoal ? (
          <DeleteConfirmDialog
            titleId="delete-goal-title"
            title="Delete goal"
            busy={deleteBusy}
            onCancel={() => setDeletingGoal(null)}
            onConfirm={handleDeleteConfirm}
            description={
              <>
                Are you sure you want to delete the{" "}
                <strong>
                  {deletingGoal.name} goal (
                  {formatINR(Number(deletingGoal.target_amount))})
                </strong>
                ? This removes the goal target and cannot be undone.
              </>
            }
          />
        ) : null}
      </div>
    </div>
  );
}
