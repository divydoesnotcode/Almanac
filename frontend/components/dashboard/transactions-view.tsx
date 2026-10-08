"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, X } from "lucide-react";

import { getApiErrorMessage } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/format-money";
import {
  deleteTransaction,
  getTransaction,
  listTransactions,
  type LedgerTransaction,
} from "@/lib/ledger-api";

import { TransactionComposer } from "./ledger-forms";
import { DeleteConfirmDialog, EditDeleteActions } from "./row-actions";
import { Corners, EmptyBlock, ErrorBlock, Panel, Skeleton } from "./ui";

function isCredit(type: string) {
  return type === "income" || type === "refund" || type === "dividend";
}

export function TransactionsView() {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<LedgerTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<LedgerTransaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<LedgerTransaction | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTransactions(100);
      setTransactions(data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load transactions"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0;
      if (isCredit(tx.transaction_type)) {
        income += amount;
        incomeCount += 1;
      } else {
        expense += amount;
        expenseCount += 1;
      }
    }

    const netCashflow = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    return {
      income,
      expense,
      netCashflow,
      savingsRate,
      incomeCount,
      expenseCount,
      totalCount: transactions.length,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType === "income" && !isCredit(tx.transaction_type)) return false;
      if (filterType === "expense" && isCredit(tx.transaction_type)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const desc = (tx.description || tx.merchant_name || "").toLowerCase();
      const cat = (tx.category_name || "").toLowerCase();
      const acc = (tx.account_name || "").toLowerCase();
      const amt = String(tx.amount);
      return desc.includes(q) || cat.includes(q) || acc.includes(q) || amt.includes(q);
    });
  }, [transactions, filterType, searchQuery]);

  useEffect(() => {
    if (!dialogOpen && !deletingTransaction && !viewingTransaction) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deletingTransaction && !deleteBusy) {
          setDeletingTransaction(null);
        } else if (viewingTransaction) {
          setViewingTransaction(null);
        } else if (dialogOpen) {
          setDialogOpen(false);
          setEditingTransaction(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen, deletingTransaction, viewingTransaction, deleteBusy]);

  const handleRowClick = async (tx: LedgerTransaction) => {
    setViewingTransaction(tx);
    try {
      const freshData = await getTransaction(tx.id);
      if (freshData) {
        setViewingTransaction(freshData);
      }
    } catch {
      // Keep existing row data if getTransaction fails
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    setDeleteBusy(true);
    try {
      await deleteTransaction(deletingTransaction.id);
      setDeletingTransaction(null);
      loadTransactions();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to delete transaction"));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="dash-content-inner">
      <div className="dash-subpage dash-subpage--wide" style={{ maxWidth: "100%", width: "100%" }}>
        <div className="dash-page-header">
          <div>
            <p className="cfo-kicker">Ledger</p>
            <h1>Transactions</h1>
            <p>
              Posted movements feed cash flow, spending, and health. Upcoming
              (pending) items appear on the dashboard until they post.
            </p>
          </div>
          <button
            type="button"
            className="cfo-btn cfo-btn--ghost"
            onClick={() => {
              setEditingTransaction(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={14} aria-hidden="true" /> Add Transaction
          </button>
        </div>

        {/* Responsive Income, Expense & Cashflow KPI Row */}
        <section className="dash-cards-kpi-summary-grid" aria-label="Transaction Summary Metrics">
          <div className="dash-kpi-block">
            <span className="dash-kpi-block-lbl">Total Income</span>
            <strong className="dash-kpi-block-val dash-pos">
              +{formatINR(metrics.income)}
            </strong>
            <span className="dash-kpi-block-sub">
              {metrics.incomeCount} Inflow{metrics.incomeCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="dash-kpi-block">
            <span className="dash-kpi-block-lbl">Total Expense</span>
            <strong className="dash-kpi-block-val dash-neg">
              -{formatINR(metrics.expense)}
            </strong>
            <span className="dash-kpi-block-sub">
              {metrics.expenseCount} Outflow{metrics.expenseCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="dash-kpi-block">
            <span className="dash-kpi-block-lbl">Net Cashflow</span>
            <strong className={`dash-kpi-block-val ${metrics.netCashflow >= 0 ? "dash-pos" : "dash-neg"}`}>
              {metrics.netCashflow >= 0 ? "+" : ""}{formatINR(metrics.netCashflow)}
            </strong>
            <span className="dash-kpi-block-sub">
              {metrics.income > 0
                ? `${metrics.savingsRate >= 0 ? "+" : ""}${metrics.savingsRate.toFixed(0)}% Savings Rate`
                : "Net Movement"}
            </span>
          </div>

          <div className="dash-kpi-block">
            <span className="dash-kpi-block-lbl">Total Movements</span>
            <strong className="dash-kpi-block-val">
              {metrics.totalCount}
            </strong>
            <span className="dash-kpi-block-sub">
              {metrics.incomeCount} In · {metrics.expenseCount} Out
            </span>
          </div>
        </section>

        <Panel
          title="All Transactions"
          meta={<span>{filteredTransactions.length} of {transactions.length} TOTAL</span>}
          accent
          className="w-full"
        >
          {error ? (
            <ErrorBlock message={error} onRetry={loadTransactions} />
          ) : loading ? (
            <Skeleton lines={6} />
          ) : transactions.length === 0 ? (
            <EmptyBlock
              title="No transactions yet"
              body="Add your first movement to start building your ledger."
            />
          ) : (
            <>
              {/* Search & Filter Toolbar */}
              <div className="dash-cards-filter-bar" style={{ marginBottom: "0.85rem" }}>
                <div className="dash-cards-search-wrap">
                  <Search size={14} className="dash-cards-search-icon" aria-hidden="true" />
                  <input
                    type="search"
                    className="dash-cards-search-input"
                    placeholder="Search transactions, categories, accounts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="dash-cards-segment-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={filterType === "all"}
                    className={`dash-cards-tab-pill ${filterType === "all" ? "dash-cards-tab-pill--active" : ""}`}
                    onClick={() => setFilterType("all")}
                  >
                    All ({transactions.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={filterType === "income"}
                    className={`dash-cards-tab-pill ${filterType === "income" ? "dash-cards-tab-pill--active" : ""}`}
                    onClick={() => setFilterType("income")}
                  >
                    Income ({metrics.incomeCount})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={filterType === "expense"}
                    className={`dash-cards-tab-pill ${filterType === "expense" ? "dash-cards-tab-pill--active" : ""}`}
                    onClick={() => setFilterType("expense")}
                  >
                    Expense ({metrics.expenseCount})
                  </button>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="dash-empty" style={{ padding: "1.5rem" }}>
                  <p>No transactions match your search or filter.</p>
                  <button
                    type="button"
                    className="cfo-btn cfo-btn--ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("all");
                    }}
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="dash-tx-table-wrap" style={{ width: "100%", maxWidth: "100%" }}>
                    <table className="dash-table" style={{ width: "100%", maxWidth: "100%" }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Account</th>
                          <th>Category</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th className="dash-tx-amount" style={{ textAlign: "right" }}>
                            Amount
                          </th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((tx) => {
                          const credit = isCredit(tx.transaction_type);
                          const amountNum = Number(tx.amount);
                          const signedVal = credit ? amountNum : -amountNum;
                          return (
                            <tr
                              key={tx.id}
                              className="dash-tx-row"
                              onClick={() => handleRowClick(tx)}
                            >
                              <td>{formatDate(tx.transaction_date)}</td>
                              <td title={tx.description || tx.merchant_name || undefined}>
                                <strong>{tx.description || tx.merchant_name || "—"}</strong>
                              </td>
                              <td>{tx.account_name || "Cash"}</td>
                              <td>{tx.category_name || "Uncategorized"}</td>
                              <td>
                                <span className={`cfo-badge ${credit ? "cfo-badge--ok" : "cfo-badge--danger"}`}>
                                  {tx.transaction_type.replaceAll("_", " ")}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`cfo-badge ${tx.status === "posted"
                                    ? "cfo-badge--ok"
                                    : "cfo-badge--warn"
                                    }`}
                                >
                                  {tx.status}
                                </span>
                              </td>
                              <td
                                className={`dash-tx-amount ${credit ? "dash-pos" : "dash-neg"
                                  }`}
                                style={{ textAlign: "right" }}
                              >
                                {formatINR(signedVal, true)}
                              </td>
                              <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                <EditDeleteActions
                                  className="dash-tx-actions"
                                  editLabel="Edit transaction"
                                  deleteLabel="Delete transaction"
                                  onEdit={() => {
                                    setEditingTransaction(tx);
                                    setDialogOpen(true);
                                  }}
                                  onDelete={() => setDeletingTransaction(tx)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile-Optimized Cards View */}
                  <div className="dash-tx-cards">
                    {filteredTransactions.map((tx) => {
                      const credit = isCredit(tx.transaction_type);
                      const amountNum = Number(tx.amount);
                      const signedVal = credit ? amountNum : -amountNum;
                      return (
                        <article
                          key={tx.id}
                          className="cfo-card dash-tx-card dash-tx-card--clickable"
                          onClick={() => handleRowClick(tx)}
                        >
                          <div className="dash-tx-card-head">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", minWidth: 0 }}>
                              <span className={`cfo-badge ${credit ? "cfo-badge--ok" : "cfo-badge--danger"}`}>
                                {tx.transaction_type.replaceAll("_", " ")}
                              </span>
                              <span className="dash-tx-card-date">
                                {formatDate(tx.transaction_date)}
                              </span>
                            </div>
                            <strong
                              className={`dash-tx-card-amount ${credit ? "dash-pos" : "dash-neg"
                                }`}
                            >
                              {formatINR(signedVal, true)}
                            </strong>
                          </div>
                          <div className="dash-tx-card-body">
                            <strong className="dash-tx-card-desc">
                              {tx.description || tx.merchant_name || "Untitled"}
                            </strong>
                            <div className="dash-tx-card-meta">
                              <span>{tx.account_name || "Cash"}</span>
                              <span className="cfo-dim">·</span>
                              <span>{tx.category_name || "Uncategorized"}</span>
                            </div>
                          </div>
                          <div className="dash-tx-card-footer">
                            <span
                              className={`cfo-badge ${tx.status === "posted"
                                ? "cfo-badge--ok"
                                : "cfo-badge--warn"
                                }`}
                            >
                              {tx.status}
                            </span>
                            <div onClick={(e) => e.stopPropagation()}>
                              <EditDeleteActions
                                className="dash-tx-card-actions"
                                editLabel="Edit transaction"
                                deleteLabel="Delete transaction"
                                onEdit={() => {
                                  setEditingTransaction(tx);
                                  setDialogOpen(true);
                                }}
                                onDelete={() => setDeletingTransaction(tx)}
                              />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </Panel>

        {/* Transaction Details Modal */}
        <AnimatePresence>
          {viewingTransaction && (
            <>
              <motion.div
                key="tx-details-backdrop"
                className="dash-modal-backdrop"
                onClick={() => setViewingTransaction(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                aria-label="Close transaction details backdrop"
              />
              <motion.div
                key="tx-details-modal"
                className="cfo-panel dash-modal dash-details-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tx-details-title"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <Corners accent />
                <div className="cfo-panel-head">
                  <strong id="tx-details-title">Transaction Details</strong>
                  <button
                    type="button"
                    className="dash-icon-btn"
                    aria-label="Close dialog"
                    onClick={() => setViewingTransaction(null)}
                  >
                    ✕
                  </button>
                </div>

                {/* Hero Amount & Badges */}
                <div className="dash-details-hero">
                  <div
                    className={`dash-details-amount ${isCredit(viewingTransaction.transaction_type)
                      ? "dash-pos"
                      : "dash-neg"
                      }`}
                  >
                    {formatINR(
                      isCredit(viewingTransaction.transaction_type)
                        ? Number(viewingTransaction.amount)
                        : -Number(viewingTransaction.amount),
                      true
                    )}
                  </div>
                  <div className="dash-details-badges">
                    <span
                      className={`cfo-badge ${isCredit(viewingTransaction.transaction_type)
                        ? "cfo-badge--ok"
                        : "cfo-badge--danger"
                        }`}
                    >
                      {viewingTransaction.transaction_type.replaceAll("_", " ")}
                    </span>
                    <span
                      className={`cfo-badge ${viewingTransaction.status === "posted"
                        ? "cfo-badge--ok"
                        : "cfo-badge--warn"
                        }`}
                    >
                      {viewingTransaction.status}
                    </span>
                    {viewingTransaction.currency ? (
                      <span className="cfo-badge cfo-dim">
                        {viewingTransaction.currency}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="dash-details-grid">
                  <div className="dash-details-item dash-details-item--full">
                    <span className="dash-details-label">Description / Merchant</span>
                    <strong className="dash-details-val">
                      {viewingTransaction.description ||
                        viewingTransaction.merchant_name ||
                        "—"}
                    </strong>
                  </div>

                  <div className="dash-details-item">
                    <span className="dash-details-label">Date & Time</span>
                    <span className="dash-details-val">
                      {new Date(viewingTransaction.transaction_date).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>

                  <div className="dash-details-item">
                    <span className="dash-details-label">Account</span>
                    <span className="dash-details-val">
                      {viewingTransaction.account_name || "Cash"}
                    </span>
                  </div>

                  <div className="dash-details-item">
                    <span className="dash-details-label">Category</span>
                    <span className="dash-details-val">
                      {viewingTransaction.category_name || "Uncategorized"}
                    </span>
                  </div>

                  <div className="dash-details-item">
                    <span className="dash-details-label">Status</span>
                    <span className="dash-details-val" style={{ textTransform: "capitalize" }}>
                      {viewingTransaction.status}
                    </span>
                  </div>

                  <div className="dash-details-item dash-details-item--full">
                    <span className="dash-details-label">Transaction ID</span>
                    <span className="dash-details-val cfo-mono" style={{ fontSize: "0.75rem" }}>
                      {viewingTransaction.id}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="dash-modal-actions" style={{ marginTop: "1.5rem" }}>
                  <EditDeleteActions
                    variant="labeled"
                    editLabel="Edit transaction"
                    deleteLabel="Delete transaction"
                    onEdit={() => {
                      const tx = viewingTransaction;
                      setViewingTransaction(null);
                      setEditingTransaction(tx);
                      setDialogOpen(true);
                    }}
                    onDelete={() => {
                      const tx = viewingTransaction;
                      setViewingTransaction(null);
                      setDeletingTransaction(tx);
                    }}
                  />
                  <button
                    type="button"
                    className="cfo-btn cfo-btn--ghost"
                    onClick={() => setViewingTransaction(null)}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Edit / Add Modal with 1-second buttery smooth transition */}
        <AnimatePresence>
          {dialogOpen && (
            <>
              <motion.div
                key="tx-composer-backdrop"
                className="dash-modal-backdrop"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingTransaction(null);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                aria-label="Close dialog backdrop"
              />
              <motion.div
                key="tx-composer-modal"
                className="dash-modal"
                role="dialog"
                aria-modal="true"
                aria-label={editingTransaction ? "Edit transaction" : "Add a transaction"}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  duration: 1.0,
                  ease: [0.16, 1, 0.3, 1], // 1-second buttery smooth Apple physics curve
                }}
              >
                <TransactionComposer
                  key={editingTransaction ? editingTransaction.id : "new"}
                  transaction={editingTransaction}
                  onSuccess={() => {
                    setDialogOpen(false);
                    setEditingTransaction(null);
                    loadTransactions();
                  }}
                  onCancel={() => {
                    setDialogOpen(false);
                    setEditingTransaction(null);
                  }}
                  redirectToDashboard={false}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {deletingTransaction ? (
          <DeleteConfirmDialog
            titleId="delete-dialog-title"
            title="Delete transaction"
            busy={deleteBusy}
            onCancel={() => setDeletingTransaction(null)}
            onConfirm={handleDeleteConfirm}
            description={
              <>
                Are you sure you want to delete this transaction{" "}
                <strong>
                  &ldquo;{deletingTransaction.description || deletingTransaction.merchant_name || "Untitled"}&rdquo; (
                  {formatINR(Number(deletingTransaction.amount))})
                </strong>
                ? This will update your account balance and cannot be undone.
              </>
            }
          />
        ) : null}
      </div>
    </div>
  );
}
