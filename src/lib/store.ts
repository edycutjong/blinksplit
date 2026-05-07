/**
 * In-memory store for BlinkSplit demo.
 * In production, this would be backed by Supabase.
 * Uses a simple Map for split sessions with deterministic IDs.
 */

export interface ReceiptItem {
  id: number;
  name: string;
  price: number;
}

export interface Receipt {
  restaurant: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

export interface Person {
  id: string;
  name: string;
  wallet: string;
  color: string;
}

export interface BlinkCard {
  personId: string;
  name: string;
  wallet: string;
  items: { name: string; price: number; splitWith: number }[];
  itemsTotal: number;
  taxShare: number;
  tipShare: number;
  totalOwed: number;
  blinkUrl: string;
  paymentStatus: "pending" | "paid" | "failed";
  paidAt?: string;
}

export interface SplitSession {
  id: string;
  receipt: Receipt;
  people: Person[];
  assignments: Record<number, string[]>; // itemId -> personId[]
  blinks: BlinkCard[];
  createdAt: string;
  status: "assigning" | "generated" | "complete";
}

// In-memory store (server-side singleton)
const splits = new Map<string, SplitSession>();

// Seed the demo split
const DEMO_RECEIPT: Receipt = {
  restaurant: "The Golden Dragon",
  items: [
    { id: 1, name: "Pad Thai", price: 14.95 },
    { id: 2, name: "Green Curry", price: 16.50 },
    { id: 3, name: "Spring Rolls (2x)", price: 8.00 },
    { id: 4, name: "Mango Sticky Rice", price: 9.25 },
    { id: 5, name: "Thai Iced Tea", price: 5.50 },
  ],
  subtotal: 54.20,
  tax: 4.88,
  tip: 10.00,
  total: 69.08,
};

const DEMO_PEOPLE: Person[] = [
  { id: "p1", name: "Alice", wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", color: "bg-pink-500" },
  { id: "p2", name: "Bob", wallet: "HN7cABqLq46Es1jh92dQQisAi5YqV7p8w7FX7KwMbTka", color: "bg-blue-500" },
  { id: "p3", name: "Charlie", wallet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", color: "bg-emerald-500" },
];

export function getStore() {
  return splits;
}

export function getSplit(id: string): SplitSession | undefined {
  return splits.get(id);
}

export function createSplit(receipt: Receipt): SplitSession {
  const id = generateId();
  const session: SplitSession = {
    id,
    receipt,
    people: [...DEMO_PEOPLE],
    assignments: {},
    blinks: [],
    createdAt: new Date().toISOString(),
    status: "assigning",
  };
  splits.set(id, session);
  return session;
}

export function updateAssignments(
  splitId: string,
  assignments: Record<number, string[]>,
  people: Person[]
): SplitSession | null {
  const session = splits.get(splitId);
  if (!session) return null;
  session.assignments = assignments;
  session.people = people;
  splits.set(splitId, session);
  return session;
}

export function generateBlinks(splitId: string, baseUrl: string): SplitSession | null {
  const session = splits.get(splitId);
  if (!session) return null;

  const { receipt, assignments, people } = session;
  const taxRate = receipt.tax / receipt.subtotal;
  const tipRate = receipt.tip / receipt.subtotal;

  const blinks: BlinkCard[] = people.map((person) => {
    let itemsTotal = 0;
    const itemDetails: BlinkCard["items"] = [];

    Object.entries(assignments).forEach(([itemIdStr, assignees]) => {
      if (assignees.includes(person.id)) {
        const item = receipt.items.find((i) => i.id === parseInt(itemIdStr));
        if (item) {
          const share = item.price / assignees.length;
          itemsTotal += share;
          itemDetails.push({
            name: item.name,
            price: share,
            splitWith: assignees.length,
          });
        }
      }
    });

    const taxShare = parseFloat((itemsTotal * taxRate).toFixed(2));
    const tipShare = parseFloat((itemsTotal * tipRate).toFixed(2));
    const totalOwed = parseFloat((itemsTotal + taxShare + tipShare).toFixed(2));

    const paymentId = `${splitId}_${person.id}`;
    const blinkUrl = `${baseUrl}/api/actions/pay/${paymentId}`;

    return {
      personId: person.id,
      name: person.name,
      wallet: person.wallet,
      items: itemDetails,
      itemsTotal: parseFloat(itemsTotal.toFixed(2)),
      taxShare,
      tipShare,
      totalOwed,
      blinkUrl: `solana-action:${blinkUrl}`,
      paymentStatus: "pending",
    };
  });

  session.blinks = blinks;
  session.status = "generated";
  splits.set(splitId, session);
  return session;
}

export function markPaid(splitId: string, personId: string): SplitSession | null {
  const session = splits.get(splitId);
  if (!session) return null;

  const blink = session.blinks.find((b) => b.personId === personId);
  if (blink) {
    blink.paymentStatus = "paid";
    blink.paidAt = new Date().toISOString();
  }

  // Check if all paid
  if (session.blinks.every((b) => b.paymentStatus === "paid")) {
    session.status = "complete";
  }

  splits.set(splitId, session);
  return session;
}

export function getAllSplits(): SplitSession[] {
  return Array.from(splits.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getDemoReceipt(): Receipt {
  return { ...DEMO_RECEIPT, items: DEMO_RECEIPT.items.map((i) => ({ ...i })) };
}

export function getDemoPeople(): Person[] {
  return DEMO_PEOPLE.map((p) => ({ ...p }));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
