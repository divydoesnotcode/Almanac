"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CreditCard, Landmark, Sparkles, X } from "lucide-react";

import { useAuth } from "@/lib/use-auth";
import {
  createCard,
  updateCard,
  detectCardNetwork,
  type CardCreatePayload,
  type CardItem,
  type CardNetwork,
  type CardTheme,
  type CardType,
} from "@/lib/cards-api";
import { listAccounts, type LedgerAccount } from "@/lib/ledger-api";
import { PhysicalCardVisual } from "./card-item";

const POPULAR_BANKS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "American Express",
  "IDFC FIRST Bank",
  "IndusInd Bank",
  "Standard Chartered",
  "Federal Bank",
  "HSBC",
  "RBL Bank",
  "Citibank",
  "Chase",
];

const THEME_OPTIONS: { id: CardTheme; label: string; color: string }[] = [
  { id: "obsidian", label: "Obsidian", color: "#1f1f1f" },
  { id: "gold", label: "Gold", color: "#b8973d" },
  { id: "sapphire", label: "Sapphire", color: "#224d85" },
  { id: "emerald", label: "Emerald", color: "#1f5f43" },
  { id: "ruby", label: "Ruby", color: "#8a242d" },
  { id: "titanium", label: "Titanium", color: "#545b63" },
  { id: "violet", label: "Violet", color: "#5a2d80" },
  { id: "cyberpunk", label: "Amber", color: "#c45c26" },
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

export function CardComposer({
  card = null,
  defaultType = "credit",
  onSuccess,
  onCancel,
}: {
  card?: CardItem | null;
  defaultType?: CardType;
  onSuccess?: (savedCard: CardItem) => void;
  onCancel?: () => void;
}) {
  const { user } = useAuth();
  const isEditing = Boolean(card);
  const fallbackHolder = user?.name ? user.name.toUpperCase() : "";

  // Form state
  const [cardType, setCardType] = useState<CardType>(card?.cardType ?? defaultType);
  const [name, setName] = useState(card?.name ?? "");
  const [bankName, setBankName] = useState(card?.bankName ?? "HDFC Bank");
  const [customBank, setCustomBank] = useState("");
  const [network, setNetwork] = useState<CardNetwork>(card?.network ?? "visa");
  const [cardNumber, setCardNumber] = useState(card?.cardNumber ?? "");
  const [cardholderName, setCardholderName] = useState(card?.cardholderName ?? fallbackHolder);
  const [expiryMonth, setExpiryMonth] = useState(card?.expiryMonth ?? "12");
  const [expiryYear, setExpiryYear] = useState(
    card?.expiryYear ?? String((new Date().getFullYear() + 3) % 100).padStart(2, "0")
  );
  const [theme, setTheme] = useState<CardTheme>(card?.theme ?? "gold");
  const [isDefault, setIsDefault] = useState(card?.isDefault ?? false);
  const [isVirtual, setIsVirtual] = useState(card?.isVirtual ?? false);

  // Credit fields
  const [creditLimit, setCreditLimit] = useState(card?.creditLimit ? String(card.creditLimit) : "");
  const [currentBalance, setCurrentBalance] = useState(
    card?.currentBalance !== undefined ? String(card.currentBalance) : "0"
  );
  const [statementDate, setStatementDate] = useState(card?.statementDate ? String(card.statementDate) : "15");
  const [dueDate, setDueDate] = useState(card?.dueDate ? String(card.dueDate) : "5");
  const [annualFee] = useState(card?.annualFee ? String(card.annualFee) : "0");
  const [rewardSummary, setRewardSummary] = useState(card?.rewardSummary ?? "");

  // Debit fields
  const [linkedAccounts, setLinkedAccounts] = useState<LedgerAccount[]>([]);
  const [linkedAccountName, setLinkedAccountName] = useState(card?.linkedAccountName ?? "");
  const [dailyAtmLimit, setDailyAtmLimit] = useState(card?.dailyAtmLimit ? String(card.dailyAtmLimit) : "");
  const [dailyPosLimit, setDailyPosLimit] = useState(card?.dailyPosLimit ? String(card.dailyPosLimit) : "");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Load accounts once (previously re-fetched on every account change)
  useEffect(() => {
    let cancelled = false;
    listAccounts()
      .then((accs) => {
        if (cancelled) return;
        const list = accs || [];
        setLinkedAccounts(list);
        if (!card && list.length > 0) {
          setLinkedAccountName((prev) => prev || list[0].name);
        }
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [card]);

  // Escape closes the sheet
  useEffect(() => {
    if (!onCancel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);

  // Bring validation errors into view (matters on small screens)
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [error]);

  // Expiry years start from the current year; keep an existing card's year selectable
  const yearOptions = useMemo(() => {
    const start = new Date().getFullYear() % 100;
    const years = Array.from({ length: 12 }, (_, i) => String(start + i).padStart(2, "0"));
    if (expiryYear && !years.includes(expiryYear)) years.unshift(expiryYear);
    return years;
  }, [expiryYear]);

  // Keep an existing linked account selectable even if it isn't in the list
  const accountNames = useMemo(() => {
    const names = linkedAccounts.map((a) => a.name);
    if (linkedAccountName && !names.includes(linkedAccountName)) names.unshift(linkedAccountName);
    return names;
  }, [linkedAccounts, linkedAccountName]);

  const handleCardNumberChange = (raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 16);
    setCardNumber(clean);
    if (clean.length >= 2 && !card) {
      const detected = detectCardNetwork(clean);
      if (detected !== "other") setNetwork(detected);
    }
  };

  const finalBankName = bankName === "Other" ? customBank.trim() || "Bank" : bankName;
  const holderForSave = cardholderName.trim().toUpperCase() || fallbackHolder || "YOUR NAME";

  const previewCard: CardItem = {
    id: card?.id ?? "preview-id",
    name: name || (cardType === "credit" ? "New Credit Card" : "New Debit Card"),
    cardType,
    bankName: finalBankName,
    network,
    cardNumber: cardNumber || "••••",
    cardholderName: holderForSave,
    expiryMonth: expiryMonth || "12",
    expiryYear: expiryYear || "28",
    theme,
    status: card?.status ?? "active",
    isDefault,
    isVirtual,
    creditLimit: Number(creditLimit) || 0,
    currentBalance: Number(currentBalance) || 0,
    statementDate: Number(statementDate) || 1,
    dueDate: Number(dueDate) || 1,
    rewardSummary,
    linkedAccountName: linkedAccountName || "Savings Account",
    dailyAtmLimit: Number(dailyAtmLimit) || 0,
    dailyPosLimit: Number(dailyPosLimit) || 0,
    createdAt: card?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (!name.trim()) return setError("Please provide a card name or nickname");
    if (bankName === "Other" && !customBank.trim()) return setError("Please specify the issuing bank name");
    if (!cardNumber.trim()) return setError("Please enter the card digits (last 4 or full 16)");

    setBusy(true);
    setError(null);

    try {
      const payload: CardCreatePayload = {
        name: name.trim(),
        cardType,
        bankName: finalBankName,
        network,
        cardNumber: cardNumber.trim(),
        cardholderName: holderForSave,
        expiryMonth,
        expiryYear,
        theme,
        status: card?.status ?? "active",
        isDefault,
        isVirtual,
        ...(cardType === "credit"
          ? {
            creditLimit: Number(creditLimit) || 0,
            currentBalance: Number(currentBalance) || 0,
            statementDate: Number(statementDate) || 1,
            dueDate: Number(dueDate) || 1,
            annualFee: Number(annualFee) || 0,
            rewardSummary: rewardSummary.trim() || undefined,
          }
          : {
            linkedAccountName: linkedAccountName.trim() || "Primary Account",
            dailyAtmLimit: Number(dailyAtmLimit) || 0,
            dailyPosLimit: Number(dailyPosLimit) || 0,
          }),
      };

      const saved = card ? await updateCard(card.id, payload) : await createCard(payload);
      onSuccess?.(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save card");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dash-composer-sheet" role="dialog" aria-modal="true" aria-label={isEditing ? "Edit card" : "Add new card"}>
      {/* Sticky header */}
      <div className="dash-composer-sticky-head">
        <div className="dash-composer-head-title">
          <CreditCard size={15} className="dash-accent" aria-hidden="true" />
          <h3>{card ? `Edit ${card.name}` : "Add New Card"}</h3>
        </div>
        {onCancel && (
          <button type="button" className="dash-sheet-close-btn" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Scrollable body: preview + form (side-by-side when the sheet is wide) */}
      <div className="dash-composer-scroll-body">
        <div className="dash-composer-layout">
          <div className="dash-composer-preview-wrap">
            <div className="dash-composer-preview-inner">
              <PhysicalCardVisual card={previewCard} />
            </div>
          </div>

          <form id="card-composer-form" className="cfo-form dash-composer-form" onSubmit={handleSubmit} noValidate={false}>
            {error && (
              <div ref={errorRef} className="dash-onboarding-error" role="alert">
                {error}
              </div>
            )}

            {/* Card type */}
            <div className="cfo-field" role="group" aria-label="Card type">
              <span className="cfo-label">Card Type</span>
              <div className="dash-type-segmented-control">
                <button
                  type="button"
                  aria-pressed={cardType === "credit"}
                  className={`dash-type-seg-btn ${cardType === "credit" ? "dash-type-seg-btn--active" : ""}`}
                  onClick={() => {
                    setCardType("credit");
                    if (theme === "titanium" || theme === "emerald") setTheme("gold");
                  }}
                >
                  <CreditCard size={14} aria-hidden="true" />
                  <span>Credit Card</span>
                </button>
                <button
                  type="button"
                  aria-pressed={cardType === "debit"}
                  className={`dash-type-seg-btn ${cardType === "debit" ? "dash-type-seg-btn--active" : ""}`}
                  onClick={() => {
                    setCardType("debit");
                    if (theme === "gold") setTheme("sapphire");
                  }}
                >
                  <Landmark size={14} aria-hidden="true" />
                  <span>Debit Card</span>
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="cfo-field" role="group" aria-label="Card theme">
              <span className="cfo-label">Card Theme Color</span>
              <div className="dash-theme-swatches-grid">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={theme === t.id}
                    className={`dash-theme-btn ${theme === t.id ? "dash-theme-btn--active" : ""}`}
                    onClick={() => setTheme(t.id)}
                    title={t.label}
                  >
                    <span className="dash-theme-dot" style={{ backgroundColor: t.color }} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <label className="cfo-field">
              <span className="cfo-label">Card Name / Nickname *</span>
              <input
                className="cfo-input"
                type="text"
                autoComplete="off"
                placeholder={cardType === "credit" ? "e.g. HDFC Regalia Gold" : "e.g. Salary Account Debit"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            {/* Bank + network */}
            <div className="dash-form-row">
              <label className="cfo-field dash-field-grow">
                <span className="cfo-label">Bank / Issuer *</span>
                <select className="cfo-input" value={bankName} onChange={(e) => setBankName(e.target.value)}>
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Other">Other Bank...</option>
                </select>
              </label>

              <label className="cfo-field dash-field-grow">
                <span className="cfo-label">Network</span>
                <select
                  className="cfo-input"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value as CardNetwork)}
                >
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="rupay">RuPay</option>
                  <option value="amex">American Express</option>
                  <option value="diners">Diners Club</option>
                  <option value="discover">Discover</option>
                </select>
              </label>
            </div>

            {bankName === "Other" && (
              <label className="cfo-field">
                <span className="cfo-label">Specify Bank Name *</span>
                <input
                  className="cfo-input"
                  type="text"
                  placeholder="Enter bank name"
                  value={customBank}
                  onChange={(e) => setCustomBank(e.target.value)}
                  required
                />
              </label>
            )}

            {/* Digits + holder */}
            <div className="dash-form-row">
              <label className="cfo-field dash-field-grow">
                <span className="cfo-label">Card Digits (Last 4 or 16) *</span>
                <input
                  className="cfo-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="4829"
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  maxLength={16}
                  required
                />
              </label>

              <label className="cfo-field dash-field-grow">
                <span className="cfo-label">Cardholder Name</span>
                <input
                  className="cfo-input"
                  type="text"
                  autoComplete="cc-name"
                  placeholder="YOUR NAME"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                />
              </label>
            </div>

            {/* Expiry */}
            <div className="cfo-field" role="group" aria-label="Expiry date">
              <span className="cfo-label">Expiry Date (MM / YY)</span>
              <div className="dash-form-row dash-form-row--tight">
                <select
                  className="cfo-input dash-field-grow"
                  aria-label="Expiry month"
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value)}
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  className="cfo-input dash-field-grow"
                  aria-label="Expiry year"
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value)}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      20{y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type-specific */}
            {cardType === "credit" ? (
              <div className="dash-form-section-box">
                <span className="dash-form-section-title">
                  <Sparkles size={12} className="dash-accent" aria-hidden="true" /> Limits &amp; Billing
                </span>

                <div className="dash-form-row">
                  <label className="cfo-field dash-field-grow">
                    <span className="cfo-label">Total Limit (₹) *</span>
                    <input
                      className="cfo-input"
                      type="number"
                      inputMode="decimal"
                      min="1000"
                      step="500"
                      placeholder="e.g. 200000"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      required
                    />
                  </label>

                  <label className="cfo-field dash-field-grow">
                    <span className="cfo-label">Current Balance (₹)</span>
                    <input
                      className="cfo-input"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="100"
                      placeholder="0"
                      value={currentBalance}
                      onChange={(e) => setCurrentBalance(e.target.value)}
                    />
                  </label>
                </div>

                <div className="dash-form-row">
                  <label className="cfo-field dash-field-grow">
                    <span className="cfo-label">Statement Day</span>
                    <select className="cfo-input" value={statementDate} onChange={(e) => setStatementDate(e.target.value)}>
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          Day {d}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="cfo-field dash-field-grow">
                    <span className="cfo-label">Payment Due Day</span>
                    <select className="cfo-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)}>
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          Day {d}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="cfo-field">
                  <span className="cfo-label">Rewards / Key Perks (Optional)</span>
                  <input
                    className="cfo-input"
                    type="text"
                    placeholder="e.g. 5% cashback on groceries & dining"
                    value={rewardSummary}
                    onChange={(e) => setRewardSummary(e.target.value)}
                  />
                </label>
              </div>
            ) : (
              <div className="dash-form-section-box">
                <span className="dash-form-section-title">
                  <Landmark size={12} className="dash-accent" aria-hidden="true" /> Account &amp; Daily Limits
                </span>

                <label className="cfo-field">
                  <span className="cfo-label">Linked Bank Account</span>
                  {accountNames.length > 0 ? (
                    <select
                      className="cfo-input"
                      value={linkedAccountName}
                      onChange={(e) => setLinkedAccountName(e.target.value)}
                    >
                      {accountNames.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                      {!accountNames.includes("Primary Savings") && (
                        <option value="Primary Savings">Primary Savings Account</option>
                      )}
                    </select>
                  ) : (
                    <input
                      className="cfo-input"
                      type="text"
                      placeholder="e.g. Salary Account"
                      value={linkedAccountName}
                      onChange={(e) => setLinkedAccountName(e.target.value)}
                    />
                  )}
                </label>

                <div className="dash-form-row">
                  <label className="cfo-field dash-field-grow">
                    <span className="cfo-label">Daily ATM Limit (₹)</span>
                    <input
                      className="cfo-input"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="5000"
                      placeholder="50000"
                      value={dailyAtmLimit}
                      onChange={(e) => setDailyAtmLimit(e.target.value)}
                    />
                  </label>

                  <label className="cfo-field dash-field-grow">
                    <span className="cfo-label">Daily POS Limit (₹)</span>
                    <input
                      className="cfo-input"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="5000"
                      placeholder="100000"
                      value={dailyPosLimit}
                      onChange={(e) => setDailyPosLimit(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Toggles */}
            <div className="dash-composer-options">
              <label className="dash-touch-check-row">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                <span>Set as primary / default {cardType} card</span>
              </label>

              <label className="dash-touch-check-row">
                <input type="checkbox" checked={isVirtual} onChange={(e) => setIsVirtual(e.target.checked)} />
                <span>Digital / Virtual-only card</span>
              </label>
            </div>
          </form>
        </div>
      </div>

      {/* Sticky actions */}
      <div className="dash-composer-sticky-foot">
        {onCancel && (
          <button
            type="button"
            className="cfo-btn cfo-btn--ghost dash-sheet-btn"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          form="card-composer-form"
          className="cfo-btn cfo-btn--fill dash-sheet-btn dash-sheet-btn--submit"
          disabled={busy}
        >
          {busy ? "Saving…" : isEditing ? "Save Changes" : "Add Card"}
        </button>
      </div>
    </div>
  );
}