"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  Plus,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { formatINR, formatPercent } from "@/lib/format-money";
import {
  listCards,
  deleteCard,
  toggleCardFreeze,
  setDefaultCard,
  recordCardPayment,
  calculateCardMetrics,
  type CardItem,
  type CardType,
} from "@/lib/cards-api";

import { CardItemCard } from "./card-item";
import { CardComposer } from "./card-composer";
import { DeleteConfirmDialog, EditDeleteActions } from "./row-actions";
import { EmptyBlock, ErrorBlock, Skeleton } from "./ui";

export function CardsView() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | CardType | "frozen">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal dialog states
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);
  const [deletingCard, setDeletingCard] = useState<CardItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Pay bill modal states
  const [payingCard, setPayingCard] = useState<CardItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCards();
      setCards(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load cards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();

    const handleCardsUpdated = () => {
      listCards().then(setCards).catch(() => {});
    };
    window.addEventListener("almanac_cards_updated", handleCardsUpdated);
    return () => window.removeEventListener("almanac_cards_updated", handleCardsUpdated);
  }, [loadCards]);

  useEffect(() => {
    if (!composerOpen && !deletingCard && !payingCard) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (deletingCard && !deleteBusy) setDeletingCard(null);
      else if (payingCard && !payBusy) setPayingCard(null);
      else if (composerOpen) {
        setComposerOpen(false);
        setEditingCard(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [composerOpen, deletingCard, payingCard, deleteBusy, payBusy]);

  const handleDeleteConfirm = async () => {
    if (!deletingCard) return;
    setDeleteBusy(true);
    try {
      await deleteCard(deletingCard.id);
      setDeletingCard(null);
      loadCards();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to delete card");
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleToggleFreeze = async (card: CardItem) => {
    try {
      await toggleCardFreeze(card.id);
      loadCards();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update card status");
    }
  };

  const handleSetDefault = async (card: CardItem) => {
    try {
      await setDefaultCard(card.id);
      loadCards();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to set default card");
    }
  };

  const handleOpenPayBill = (card: CardItem) => {
    setPayingCard(card);
    setPayAmount(String(card.currentBalance || 0));
    setPaySuccess(false);
  };

  const handlePayBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCard) return;
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    setPayBusy(true);
    try {
      await recordCardPayment(payingCard.id, amount);
      setPaySuccess(true);
      setTimeout(() => {
        setPayingCard(null);
        setPaySuccess(false);
        loadCards();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to process payment");
    } finally {
      setPayBusy(false);
    }
  };

  const metrics = calculateCardMetrics(cards);

  const filteredCards = cards.filter((card) => {
    if (filterType === "credit" && card.cardType !== "credit") return false;
    if (filterType === "debit" && card.cardType !== "debit") return false;
    if (filterType === "frozen" && card.status !== "frozen") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = card.name.toLowerCase().includes(q);
      const matchBank = card.bankName.toLowerCase().includes(q);
      const matchDigits = card.cardNumber.includes(q);
      const matchHolder = card.cardholderName.toLowerCase().includes(q);
      const matchNetwork = card.network.toLowerCase().includes(q);
      return matchName || matchBank || matchDigits || matchHolder || matchNetwork;
    }

    return true;
  });

  return (
    <div className="dash-content-inner dash-cards-page">
      <div className="dash-subpage dash-subpage--wide">
        {/* Mobile-Friendly Header */}
        <header className="dash-page-header dash-cards-main-header">
          <div className="dash-cards-header-copy">
            <p className="cfo-kicker">Liquidity & Lines</p>
            <h1>Cards & Credit Lines</h1>
            <p className="dash-cards-lead">
              Manage your credit and debit cards, monitor limits & credit utilization, and track due dates.
            </p>
          </div>
          <button
            type="button"
            className="cfo-btn cfo-btn--ghost dash-cards-primary-add"
            onClick={() => {
              setEditingCard(null);
              setComposerOpen(true);
            }}
          >
            <Plus size={15} aria-hidden="true" /> Add Card
          </button>
        </header>

        {error && <ErrorBlock message={error} onRetry={loadCards} />}

        {/* Responsive KPI Metrics Row */}
        <section className="dash-cards-kpi-summary-grid" aria-label="Card Metrics">
          <div className="dash-kpi-block">
            <span className="dash-kpi-block-lbl">Credit Used</span>
            <strong className="dash-kpi-block-val dash-neg">
              {formatINR(metrics.totalCreditBalance)}
            </strong>
            <span className="dash-kpi-block-sub">
              of {formatINR(metrics.totalCreditLimit)} Limit
            </span>
          </div>

          <div className="dash-kpi-block">
            <span className="dash-kpi-block-lbl">Utilization</span>
            <strong className={`dash-kpi-block-val ${metrics.overallUtilization > 50 ? "dash-warn" : "dash-pos"}`}>
              {formatPercent(metrics.overallUtilization, 1)}
            </strong>
            <span className="dash-kpi-block-sub">
              {metrics.overallUtilization <= 30 ? "Optimal (<30%)" : "High"}
            </span>
          </div>

          <div className="dash-kpi-block">
            <span className="dash-kpi-block-lbl">Available Credit</span>
            <strong className="dash-kpi-block-val dash-pos">
              {formatINR(metrics.totalAvailableCredit)}
            </strong>
            <span className="dash-kpi-block-sub">
              {metrics.creditCardsCount} Credit Line{metrics.creditCardsCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="dash-kpi-block">
            <span className="dash-kpi-block-lbl">Total Cards</span>
            <strong className="dash-kpi-block-val">
              {cards.length}
            </strong>
            <span className="dash-kpi-block-sub">
              {metrics.creditCardsCount} Credit · {metrics.debitCardsCount} Debit
            </span>
          </div>
        </section>

        {/* Compact AI CFO Tip */}
        <aside className="dash-cards-ai-tip" aria-label="AI CFO Advisory">
          <div className="dash-cards-ai-tip-head">
            <Sparkles size={13} className="dash-accent" />
            <span>AI CFO Intelligence</span>
          </div>
          <div className="dash-cards-ai-tip-body">
            {cards.length === 0 ? (
              <p>
                Add your cards to track credit utilization, billing cycles, and automated payment reminders.
              </p>
            ) : metrics.upcomingBills.length > 0 ? (
              <p>
                <b>Upcoming Due:</b> {metrics.upcomingBills[0].card.name} payment of{" "}
                <b className="dash-neg">{formatINR(metrics.upcomingBills[0].amount)}</b> is due in{" "}
                <b>{metrics.upcomingBills[0].daysRemaining} days</b> (Day {metrics.upcomingBills[0].card.dueDate}).
              </p>
            ) : (
              <p>
                <b>Credit Health:</b> Aggregate utilization is at{" "}
                <b>{formatPercent(metrics.overallUtilization, 1)}</b>. Maintaining it below 30% boosts your credit score.
              </p>
            )}
          </div>
        </aside>

        {/* Main Cards Section */}
        <section className="dash-cards-section-container">
          {/* Controls Bar: Search, Filters & View Toggle */}
          <div className="dash-cards-filter-bar">
            <div className="dash-cards-search-wrap">
              <Search size={14} className="dash-cards-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="dash-cards-search-input"
                placeholder="Search cards, banks, digits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="dash-cards-filter-row">
              <div className="dash-cards-segment-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterType === "all"}
                  className={`dash-cards-tab-pill ${filterType === "all" ? "dash-cards-tab-pill--active" : ""}`}
                  onClick={() => setFilterType("all")}
                >
                  All ({cards.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterType === "credit"}
                  className={`dash-cards-tab-pill ${filterType === "credit" ? "dash-cards-tab-pill--active" : ""}`}
                  onClick={() => setFilterType("credit")}
                >
                  Credit ({metrics.creditCardsCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterType === "debit"}
                  className={`dash-cards-tab-pill ${filterType === "debit" ? "dash-cards-tab-pill--active" : ""}`}
                  onClick={() => setFilterType("debit")}
                >
                  Debit ({metrics.debitCardsCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterType === "frozen"}
                  className={`dash-cards-tab-pill ${filterType === "frozen" ? "dash-cards-tab-pill--active" : ""}`}
                  onClick={() => setFilterType("frozen")}
                >
                  Locked ({cards.filter((c) => c.status === "frozen").length})
                </button>
              </div>

              <div className="dash-cards-view-mode">
                <button
                  type="button"
                  className={`dash-view-btn ${viewMode === "grid" ? "dash-view-btn--active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid Gallery"
                  aria-label="Grid Gallery View"
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  type="button"
                  className={`dash-view-btn ${viewMode === "table" ? "dash-view-btn--active" : ""}`}
                  onClick={() => setViewMode("table")}
                  title="Table View"
                  aria-label="Table View"
                >
                  <TableIcon size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Card Stream / Table Content */}
          {loading ? (
            <Skeleton lines={4} />
          ) : cards.length === 0 ? (
            <EmptyBlock
              title="No cards added yet"
              body="Add your credit and debit cards to track balances, limits, and due dates."
            />
          ) : filteredCards.length === 0 ? (
            <div className="dash-empty" style={{ padding: "1.5rem" }}>
              <p>No cards match your search or filter.</p>
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
          ) : viewMode === "grid" ? (
            /* Stream of Cards (Fluid 1-col on mobile, 2-3 col on desktop) */
            <div className="dash-cards-fluid-grid">
              {filteredCards.map((card) => (
                <CardItemCard
                  key={card.id}
                  card={card}
                  onEdit={() => {
                    setEditingCard(card);
                    setComposerOpen(true);
                  }}
                  onDelete={() => setDeletingCard(card)}
                  onToggleFreeze={() => handleToggleFreeze(card)}
                  onSetDefault={() => handleSetDefault(card)}
                  onPayBill={card.cardType === "credit" ? () => handleOpenPayBill(card) : undefined}
                />
              ))}
            </div>
          ) : (
            /* Table View with Mobile Fallback */
            <>
              <div className="dash-tx-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Card / Issuer</th>
                      <th>Type</th>
                      <th>Card Number</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Balance / Limit</th>
                      <th style={{ textAlign: "right" }}>Due Date</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCards.map((card) => {
                      const isCredit = card.cardType === "credit";
                      const isFrozen = card.status === "frozen";

                      return (
                        <tr key={card.id}>
                          <td>
                            <strong>{card.name}</strong>
                            <div style={{ fontSize: "0.72rem", color: "var(--cfo-ink-dim)" }}>
                              {card.bankName} · {card.network.toUpperCase()}
                              {card.isDefault && " · Primary"}
                            </div>
                          </td>
                          <td>
                            <span className={`cfo-badge ${isCredit ? "cfo-badge--warn" : "cfo-badge--ok"}`}>
                              {card.cardType.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontFamily: "var(--cfo-mono)", fontSize: "0.82rem" }}>
                            •••• {card.cardNumber.slice(-4)}
                          </td>
                          <td>
                            <span className={`cfo-badge ${isFrozen ? "cfo-badge--danger" : ""}`}>
                              {isFrozen ? "LOCKED" : "ACTIVE"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", fontFamily: "var(--cfo-mono)" }}>
                            {isCredit ? (
                              <div>
                                <span className="dash-neg" style={{ fontWeight: 600 }}>
                                  {formatINR(Number(card.currentBalance || 0))}
                                </span>
                                <div style={{ fontSize: "0.7rem", color: "var(--cfo-ink-dim)" }}>
                                  Limit: {formatINR(Number(card.creditLimit || 0))}
                                </div>
                              </div>
                            ) : (
                              <span>ATM: {card.dailyAtmLimit ? formatINR(card.dailyAtmLimit) : "Standard"}</span>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {isCredit && card.dueDate ? `Day ${card.dueDate}` : "—"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <EditDeleteActions
                              editLabel="Edit card"
                              deleteLabel="Delete card"
                              onEdit={() => {
                                setEditingCard(card);
                                setComposerOpen(true);
                              }}
                              onDelete={() => setDeletingCard(card)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Table View Fallback */}
              <div className="dash-tx-cards">
                {filteredCards.map((card) => {
                  const isCredit = card.cardType === "credit";

                  return (
                    <article key={card.id} className="cfo-card dash-tx-card">
                      <div className="dash-tx-card-head">
                        <span className={`cfo-badge ${isCredit ? "cfo-badge--warn" : "cfo-badge--ok"}`}>
                          {card.cardType.toUpperCase()} · •••• {card.cardNumber.slice(-4)}
                        </span>
                        {isCredit ? (
                          <strong className="dash-neg" style={{ fontFamily: "var(--cfo-mono)" }}>
                            {formatINR(Number(card.currentBalance || 0))}
                          </strong>
                        ) : (
                          <span style={{ fontFamily: "var(--cfo-mono)", fontSize: "0.78rem" }}>
                            ATM: {card.dailyAtmLimit ? formatINR(card.dailyAtmLimit) : "Standard"}
                          </span>
                        )}
                      </div>
                      <div className="dash-tx-card-body">
                        <div>
                          <strong>{card.name}</strong>
                          <p style={{ margin: "0.15rem 0 0", fontSize: "0.74rem", color: "var(--cfo-ink-dim)" }}>
                            {card.bankName} · {card.network.toUpperCase()}
                            {card.isDefault && " · Default"}
                          </p>
                        </div>
                      </div>
                      <div className="dash-tx-card-footer">
                        <EditDeleteActions
                          className="dash-tx-card-actions"
                          editLabel="Edit card"
                          deleteLabel="Delete card"
                          onEdit={() => {
                            setEditingCard(card);
                            setComposerOpen(true);
                          }}
                          onDelete={() => setDeletingCard(card)}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Card Composer Bottom Sheet / Modal */}
        <AnimatePresence>
          {composerOpen && (
            <>
              <motion.div
                key="composer-backdrop"
                className="dash-modal-backdrop"
                onClick={() => {
                  setComposerOpen(false);
                  setEditingCard(null);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                aria-label="Close dialog backdrop"
              />
              <motion.div
                key="composer-modal"
                className="dash-modal dash-card-composer-modal"
                role="dialog"
                aria-modal="true"
                aria-label={editingCard ? `Edit ${editingCard.name}` : "Add New Card"}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  duration: 1.0,
                  ease: [0.16, 1, 0.3, 1], // 1-second buttery smooth Apple physics curve
                }}
              >
                <CardComposer
                  key={editingCard ? editingCard.id : "new-card"}
                  card={editingCard}
                  onSuccess={() => {
                    setComposerOpen(false);
                    setEditingCard(null);
                    loadCards();
                  }}
                  onCancel={() => {
                    setComposerOpen(false);
                    setEditingCard(null);
                  }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Delete Card Confirmation Modal */}
        {deletingCard && (
          <DeleteConfirmDialog
            titleId="delete-card-title"
            title="Delete Card"
            busy={deleteBusy}
            onCancel={() => setDeletingCard(null)}
            onConfirm={handleDeleteConfirm}
            description={
              <>
                Are you sure you want to remove <strong>{deletingCard.name}</strong>?
              </>
            }
          />
        )}

        {/* Quick Pay Bill Modal */}
        <AnimatePresence>
          {payingCard && (
            <>
              <motion.div
                key="pay-backdrop"
                className="dash-modal-backdrop"
                onClick={() => {
                  if (!payBusy) setPayingCard(null);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                aria-label="Close dialog backdrop"
              />
              <motion.div
                key="pay-modal"
                className="dash-modal dash-pay-bill-sheet"
                role="dialog"
                aria-modal="true"
                aria-label="Pay Credit Card Bill"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  duration: 1.0,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="dash-composer-sheet">
                  <div className="dash-composer-sticky-head">
                    <div className="dash-composer-head-title">
                      <CreditCard size={15} className="dash-accent" />
                      <h3>Pay Card Bill</h3>
                    </div>
                    <button
                      type="button"
                      className="dash-sheet-close-btn"
                      onClick={() => setPayingCard(null)}
                      disabled={payBusy}
                      aria-label="Close modal"
                    >
                      ✕
                    </button>
                  </div>

                  {paySuccess ? (
                    <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                      <CheckCircle2 size={32} className="dash-pos" style={{ margin: "0 auto 0.5rem" }} />
                      <h3>Payment Recorded</h3>
                      <p style={{ color: "var(--cfo-ink-dim)", fontSize: "0.82rem" }}>
                        Card balance updated successfully.
                      </p>
                    </div>
                  ) : (
                    <form className="cfo-form" onSubmit={handlePayBillSubmit} style={{ padding: "1rem" }}>
                      <div style={{ marginBottom: "0.85rem" }}>
                        <strong style={{ fontSize: "0.92rem" }}>{payingCard.name}</strong>
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--cfo-ink-dim)" }}>
                          Current Outstanding: <b>{formatINR(Number(payingCard.currentBalance || 0))}</b>
                        </p>
                      </div>

                      <label className="cfo-field">
                        <span className="cfo-label">Payment Amount (₹)</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          className="cfo-input"
                          min="1"
                          max={Number(payingCard.currentBalance || 0)}
                          step="1"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          required
                          autoFocus
                        />
                      </label>

                      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                        <button
                          type="button"
                          className="cfo-btn cfo-btn--ghost"
                          style={{ fontSize: "0.75rem", padding: "0.35rem 0.6rem", flex: 1 }}
                          onClick={() => setPayAmount(String(payingCard.currentBalance || 0))}
                        >
                          Full ({formatINR(Number(payingCard.currentBalance || 0))})
                        </button>
                        <button
                          type="button"
                          className="cfo-btn cfo-btn--ghost"
                          style={{ fontSize: "0.75rem", padding: "0.35rem 0.6rem" }}
                          onClick={() =>
                            setPayAmount(String(Math.round(Number(payingCard.currentBalance || 0) * 0.05)))
                          }
                        >
                          Min 5%
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
                        <button
                          type="button"
                          className="cfo-btn cfo-btn--ghost"
                          style={{ flex: 1 }}
                          onClick={() => setPayingCard(null)}
                          disabled={payBusy}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="cfo-btn cfo-btn--fill"
                          style={{ flex: 1.5 }}
                          disabled={payBusy || !payAmount || Number(payAmount) <= 0}
                        >
                          {payBusy ? "Recording…" : "Confirm"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
