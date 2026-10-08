"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  Lock,
  Unlock,
  Sparkles,
  Clock,
  Landmark,
  ShieldCheck,
  Star,
  Zap,
  Edit2,
  Trash2,
} from "lucide-react";

import { formatINR, formatPercent } from "@/lib/format-money";
import type { CardItem, CardNetwork } from "@/lib/cards-api";
import { Progress } from "./ui";

function NetworkLogo({ network }: { network: CardNetwork }) {
  switch (network) {
    case "visa":
      return (
        <span className="cfo-card-network cfo-card-network--visa" aria-label="Visa">
          VISA
        </span>
      );
    case "mastercard":
      return (
        <span className="cfo-card-network cfo-card-network--mc" aria-label="Mastercard">
          <span className="cfo-mc-circle cfo-mc-circle--red" />
          <span className="cfo-mc-circle cfo-mc-circle--yellow" />
        </span>
      );
    case "rupay":
      return (
        <span className="cfo-card-network cfo-card-network--rupay" aria-label="RuPay">
          RuPay
        </span>
      );
    case "amex":
      return (
        <span className="cfo-card-network cfo-card-network--amex" aria-label="American Express">
          AMEX
        </span>
      );
    case "diners":
      return (
        <span className="cfo-card-network cfo-card-network--diners" aria-label="Diners Club">
          Diners
        </span>
      );
    default:
      return (
        <span className="cfo-card-network cfo-card-network--generic">
          CARD
        </span>
      );
  }
}

export function PhysicalCardVisual({
  card,
  showActions = false,
  onToggleFreeze,
}: {
  card: CardItem;
  showActions?: boolean;
  onToggleFreeze?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rawNumber = card.cardNumber;
    navigator.clipboard?.writeText(rawNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFrozen = card.status === "frozen";

  return (
    <div className={`cfo-fin-card cfo-fin-card--${card.theme} ${isFrozen ? "cfo-fin-card--frozen" : ""}`}>
      {/* Top row: Bank name + Badges */}
      <div className="cfo-fin-card-top">
        <div className="cfo-fin-card-bank">
          <Landmark size={13} className="cfo-fin-card-bank-icon" aria-hidden="true" />
          <span>{card.bankName}</span>
        </div>

        <div className="cfo-fin-card-badges">
          {card.isDefault && (
            <span className="cfo-fin-card-pill cfo-fin-card-pill--gold" title="Default Card">
              <Star size={9} aria-hidden="true" /> DEFAULT
            </span>
          )}
          {card.isVirtual && (
            <span className="cfo-fin-card-pill" title="Virtual Card">
              <Zap size={9} aria-hidden="true" /> VIRTUAL
            </span>
          )}
          <span className={`cfo-fin-card-pill ${card.cardType === "credit" ? "cfo-fin-card-pill--credit" : "cfo-fin-card-pill--debit"}`}>
            {card.cardType.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Chip & Contactless Icons */}
      <div className="cfo-fin-card-chip-row">
        <div className="cfo-fin-chip" aria-label="EMV Smart Chip">
          <div className="cfo-fin-chip-lines" />
        </div>
        <svg
          className="cfo-fin-contactless"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8.5 16.5a5 5 0 0 1 0-9" />
          <path d="M12 19a8.5 8.5 0 0 0 0-14" />
          <path d="M15.5 21.5a12 12 0 0 0 0-19" />
        </svg>
      </div>

      {/* Card Number & Copy */}
      <div className="cfo-fin-card-number-row">
        <div className="cfo-fin-card-number">
          <span>••••</span>
          <span>••••</span>
          <span>••••</span>
          <span className="cfo-fin-card-last4">{card.cardNumber ? card.cardNumber.slice(-4) : "••••"}</span>
        </div>
        <button
          type="button"
          className="cfo-fin-card-copy-btn"
          onClick={handleCopy}
          title="Copy digits"
          aria-label="Copy card number digits"
        >
          {copied ? <Check size={13} className="cfo-pos" /> : <Copy size={13} />}
        </button>
      </div>

      {/* Bottom row: Cardholder Name, Expiry, Network Logo */}
      <div className="cfo-fin-card-bottom">
        <div className="cfo-fin-card-holder">
          <span className="cfo-fin-card-label">CARDHOLDER</span>
          <strong className="cfo-fin-card-val">{card.cardholderName || "YOUR NAME"}</strong>
        </div>

        <div className="cfo-fin-card-expiry">
          <span className="cfo-fin-card-label">EXPIRES</span>
          <strong className="cfo-fin-card-val">
            {(card.expiryMonth || "12").padStart(2, "0")}/{(card.expiryYear || "28").slice(-2)}
          </strong>
        </div>

        <div className="cfo-fin-card-network-wrap">
          <NetworkLogo network={card.network} />
        </div>
      </div>

      {/* Frozen Overlay */}
      {isFrozen && (
        <div className="cfo-fin-card-frozen-overlay">
          <Lock size={20} />
          <span>CARD LOCKED</span>
          {showActions && onToggleFreeze && (
            <button
              type="button"
              className="cfo-btn cfo-btn--ghost cfo-fin-card-unfreeze-btn"
              onClick={onToggleFreeze}
            >
              <Unlock size={12} /> Unlock Card
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function CardItemCard({
  card,
  onEdit,
  onDelete,
  onToggleFreeze,
  onPayBill,
  onSetDefault,
}: {
  card: CardItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFreeze: () => void;
  onPayBill?: () => void;
  onSetDefault: () => void;
}) {
  const isCredit = card.cardType === "credit";
  const isFrozen = card.status === "frozen";

  const creditLimit = Number(card.creditLimit) || 0;
  const currentBalance = Number(card.currentBalance) || 0;
  const availableCredit = Math.max(0, creditLimit - currentBalance);
  const utilization = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;

  // Calculate bill due date urgency
  const today = new Date().getDate();
  const dueDay = card.dueDate || 1;
  let daysUntilDue = dueDay - today;
  if (daysUntilDue < 0) daysUntilDue += 30;

  const dueUrgent = isCredit && currentBalance > 0 && daysUntilDue <= 5;
  const dueSoon = isCredit && currentBalance > 0 && daysUntilDue <= 10;

  return (
    <article className="dash-single-card-box">
      {/* Physical Card Visual */}
      <div className="dash-single-card-visual">
        <PhysicalCardVisual
          card={card}
          showActions
          onToggleFreeze={onToggleFreeze}
        />
      </div>

      {/* Card Info & Summary */}
      <div className="dash-single-card-content">
        <div className="dash-single-card-header">
          <div className="dash-single-card-title-wrap">
            <h3 className="dash-single-card-title">{card.name}</h3>
            <p className="dash-single-card-sub">
              {card.bankName} · {card.network.toUpperCase()}
              {card.isDefault ? " · Primary" : ""}
            </p>
          </div>

          <button
            type="button"
            className={`dash-card-toggle-lock-btn ${isFrozen ? "dash-card-toggle-lock-btn--locked" : ""}`}
            onClick={onToggleFreeze}
            title={isFrozen ? "Unlock card" : "Freeze card"}
            aria-label={isFrozen ? "Unlock card" : "Freeze card"}
          >
            {isFrozen ? <Unlock size={13} /> : <Lock size={13} />}
            <span>{isFrozen ? "Unlock" : "Lock"}</span>
          </button>
        </div>

        {/* Financial Details */}
        {isCredit ? (
          <div className="dash-single-card-details">
            <div className="dash-single-card-metrics-grid">
              <div className="dash-sc-metric">
                <span className="dash-sc-metric-label">Outstanding</span>
                <strong className="dash-sc-metric-val dash-neg">
                  {formatINR(currentBalance)}
                </strong>
              </div>

              <div className="dash-sc-metric" style={{ textAlign: "right" }}>
                <span className="dash-sc-metric-label">Payment Due</span>
                <strong className={`dash-sc-metric-val ${dueUrgent ? "dash-neg" : dueSoon ? "dash-warn" : ""}`}>
                  {card.dueDate ? (
                    currentBalance > 0 ? `Day ${card.dueDate} (${daysUntilDue}d)` : "Paid / Zero"
                  ) : (
                    "—"
                  )}
                </strong>
              </div>
            </div>

            {/* Utilization Bar */}
            {creditLimit > 0 && (
              <div className="dash-sc-util-section">
                <div className="dash-sc-util-labels">
                  <span>Limit: {formatINR(creditLimit)}</span>
                  <span>{formatPercent(utilization, 1)} used (Avail: {formatINR(availableCredit)})</span>
                </div>
                <Progress
                  value={utilization}
                  tone={utilization > 60 ? "danger" : utilization > 30 ? "warn" : "ok"}
                />
              </div>
            )}

            {card.rewardSummary && (
              <div className="dash-sc-reward-pill">
                <Sparkles size={12} className="dash-accent" />
                <span>{card.rewardSummary}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="dash-single-card-details">
            <div className="dash-single-card-metrics-grid">
              <div className="dash-sc-metric">
                <span className="dash-sc-metric-label">Linked Account</span>
                <strong className="dash-sc-metric-val">
                  {card.linkedAccountName || "Primary Account"}
                </strong>
              </div>
              <div className="dash-sc-metric" style={{ textAlign: "right" }}>
                <span className="dash-sc-metric-label">Daily ATM Limit</span>
                <strong className="dash-sc-metric-val">
                  {card.dailyAtmLimit ? formatINR(card.dailyAtmLimit) : "Standard"}
                </strong>
              </div>
            </div>

            <div className="dash-sc-reward-pill">
              <ShieldCheck size={12} className="dash-pos" />
              <span>Contactless & Online Fraud Protection Active</span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="dash-single-card-footer">
          <div className="dash-sc-primary-actions">
            {isCredit && currentBalance > 0 && onPayBill ? (
              <button
                type="button"
                className="cfo-btn cfo-btn--ghost dash-sc-btn dash-sc-btn--pay"
                onClick={onPayBill}
              >
                Pay Bill
              </button>
            ) : !card.isDefault ? (
              <button
                type="button"
                className="cfo-btn cfo-btn--ghost dash-sc-btn"
                onClick={onSetDefault}
              >
                Set Default
              </button>
            ) : (
              <span className="dash-sc-default-tag">
                <Star size={11} /> Primary
              </span>
            )}
          </div>

          <div className="dash-sc-icon-actions">
            <button
              type="button"
              className="dash-sc-icon-btn"
              onClick={onEdit}
              title="Edit Card"
              aria-label="Edit Card"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              className="dash-sc-icon-btn dash-sc-icon-btn--danger"
              onClick={onDelete}
              title="Delete Card"
              aria-label="Delete Card"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
