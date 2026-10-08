"use client";

export type CardType = "credit" | "debit";

export type CardNetwork =
  | "visa"
  | "mastercard"
  | "rupay"
  | "amex"
  | "diners"
  | "discover"
  | "other";

export type CardTheme =
  | "obsidian"
  | "sapphire"
  | "emerald"
  | "ruby"
  | "gold"
  | "titanium"
  | "violet"
  | "cyberpunk";

export type CardStatus = "active" | "frozen" | "expired";

export type CardItem = {
  id: string;
  name: string;
  cardType: CardType;
  bankName: string;
  network: CardNetwork;
  cardNumber: string; // Last 4 digits or masked format e.g. "4590"
  cardholderName: string;
  expiryMonth: string; // "01" - "12"
  expiryYear: string;  // "26" - "35"
  theme: CardTheme;
  status: CardStatus;
  isDefault: boolean;
  isVirtual: boolean;

  // Credit Card specific fields
  creditLimit?: number;
  currentBalance?: number;
  statementDate?: number; // 1 - 31
  dueDate?: number;       // 1 - 31
  interestRate?: number;  // APR %
  annualFee?: number;
  rewardSummary?: string;

  // Debit Card specific fields
  linkedAccountId?: string;
  linkedAccountName?: string;
  dailyAtmLimit?: number;
  dailyPosLimit?: number;

  createdAt: string;
  updatedAt: string;
};

export type CardCreatePayload = Omit<CardItem, "id" | "createdAt" | "updatedAt">;

const STORAGE_KEY = "The Almanac_user_cards_v2";

export const DEFAULT_CARDS: CardItem[] = [];

export function detectCardNetwork(numberStr: string): CardNetwork {
  const clean = numberStr.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^(60|65|81|82|508)/.test(clean) || clean.startsWith("608") || clean.startsWith("6521")) return "rupay";
  if (/^3(?:0[0-5]|[68])/.test(clean)) return "diners";
  if (/^6(?:011|5)/.test(clean)) return "discover";
  return "other";
}

function getStoredCards(): CardItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveStoredCards(cards: CardItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    window.dispatchEvent(new CustomEvent("The Almanac_cards_updated", { detail: cards }));
  } catch (err) {
    console.error("Failed to save cards to localStorage", err);
  }
}

export async function listCards(): Promise<CardItem[]> {
  // Simulate short async resolution for smooth UI transitions
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStoredCards());
    }, 150);
  });
}

export async function getCard(id: string): Promise<CardItem | null> {
  const cards = getStoredCards();
  return cards.find((c) => c.id === id) || null;
}

export async function createCard(payload: CardCreatePayload): Promise<CardItem> {
  const cards = getStoredCards();
  const id = `crd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  // If new card is default, uncheck previous default for the same card type
  const updatedCards = payload.isDefault
    ? cards.map((c) => (c.cardType === payload.cardType ? { ...c, isDefault: false } : c))
    : [...cards];

  const newCard: CardItem = {
    ...payload,
    id,
    createdAt: now,
    updatedAt: now,
  };

  updatedCards.unshift(newCard);
  saveStoredCards(updatedCards);
  return newCard;
}

export async function updateCard(id: string, payload: Partial<CardCreatePayload>): Promise<CardItem> {
  const cards = getStoredCards();
  const index = cards.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error("Card not found");
  }

  const existing = cards[index];
  const targetType = payload.cardType ?? existing.cardType;

  let updatedCards = [...cards];
  if (payload.isDefault) {
    updatedCards = updatedCards.map((c) =>
      c.cardType === targetType && c.id !== id ? { ...c, isDefault: false } : c
    );
  }

  const updated: CardItem = {
    ...existing,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  updatedCards[index] = updated;
  saveStoredCards(updatedCards);
  return updated;
}

export async function deleteCard(id: string): Promise<boolean> {
  const cards = getStoredCards();
  const filtered = cards.filter((c) => c.id !== id);
  saveStoredCards(filtered);
  return true;
}

export async function toggleCardFreeze(id: string): Promise<CardItem> {
  const cards = getStoredCards();
  const target = cards.find((c) => c.id === id);
  if (!target) throw new Error("Card not found");

  const newStatus: CardStatus = target.status === "frozen" ? "active" : "frozen";
  return updateCard(id, { status: newStatus });
}

export async function setDefaultCard(id: string): Promise<CardItem> {
  return updateCard(id, { isDefault: true });
}

export async function recordCardPayment(id: string, amount: number): Promise<CardItem> {
  const card = await getCard(id);
  if (!card || card.cardType !== "credit") {
    throw new Error("Invalid credit card for payment");
  }

  const currentBal = Number(card.currentBalance || 0);
  const newBal = Math.max(0, currentBal - amount);
  return updateCard(id, { currentBalance: newBal });
}

export function calculateCardMetrics(cards: CardItem[]) {
  const creditCards = cards.filter((c) => c.cardType === "credit");
  const debitCards = cards.filter((c) => c.cardType === "debit");

  const totalCreditLimit = creditCards.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0);
  const totalCreditBalance = creditCards.reduce((sum, c) => sum + (Number(c.currentBalance) || 0), 0);
  const totalAvailableCredit = Math.max(0, totalCreditLimit - totalCreditBalance);

  const overallUtilization = totalCreditLimit > 0
    ? (totalCreditBalance / totalCreditLimit) * 100
    : 0;

  const upcomingBills = creditCards
    .filter((c) => (c.currentBalance || 0) > 0 && c.dueDate)
    .map((c) => {
      const today = new Date().getDate();
      const dueDay = c.dueDate || 1;
      let daysRemaining = dueDay - today;
      if (daysRemaining < 0) daysRemaining += 30; // Approx next cycle
      return {
        card: c,
        daysRemaining,
        amount: c.currentBalance || 0,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  return {
    creditCardsCount: creditCards.length,
    debitCardsCount: debitCards.length,
    totalCards: cards.length,
    totalCreditLimit,
    totalCreditBalance,
    totalAvailableCredit,
    overallUtilization,
    upcomingBills,
  };
}
