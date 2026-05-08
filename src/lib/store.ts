import { supabase } from "./supabase";

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

const RESTAURANTS = ["The Golden Dragon", "Luigi's Trattoria", "Sushi Zen", "Burger Joint", "Taco Fiesta"];
const ITEMS = [
  { name: "Pad Thai", price: [12.95, 14.95, 16.95] },
  { name: "Green Curry", price: [14.50, 16.50, 18.50] },
  { name: "Spring Rolls (2x)", price: [6.00, 8.00, 10.00] },
  { name: "Mango Sticky Rice", price: [7.25, 9.25, 11.25] },
  { name: "Thai Iced Tea", price: [4.50, 5.50, 6.50] },
  { name: "Spicy Tuna Roll", price: [10.00, 12.00, 14.00] },
  { name: "Margherita Pizza", price: [16.00, 18.00, 20.00] },
  { name: "Cheeseburger", price: [12.00, 14.00, 16.00] },
  { name: "Tacos (3x)", price: [11.00, 13.00, 15.00] },
  { name: "Nachos", price: [9.00, 11.00, 13.00] },
];

const ALL_PEOPLE: Person[] = [
  { id: "p1", name: "Alice", wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", color: "bg-pink-500" },
  { id: "p2", name: "Bob", wallet: "HN7cABqLq46Es1jh92dQQisAi5YqV7p8w7FX7KwMbTka", color: "bg-blue-500" },
  { id: "p3", name: "Charlie", wallet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", color: "bg-emerald-500" },
  { id: "p4", name: "Diana", wallet: "7RzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", color: "bg-purple-500" },
  { id: "p5", name: "Eve", wallet: "2N7cABqLq46Es1jh92dQQisAi5YqV7p8w7FX7KwMbTka", color: "bg-yellow-500" },
  { id: "p6", name: "Frank", wallet: "8zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", color: "bg-orange-500" },
];

export async function getSplit(id: string): Promise<SplitSession | undefined> {
  const { data, error } = await supabase
    .from("splits")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return undefined;

  return {
    id: data.id,
    receipt: data.receipt as Receipt,
    people: data.people as Person[],
    assignments: data.assignments as Record<number, string[]>,
    blinks: data.blinks as BlinkCard[],
    createdAt: data.created_at,
    status: data.status as SplitSession["status"],
  };
}

export async function createSplit(receipt: Receipt): Promise<SplitSession> {
  const id = generateId();
  const session: SplitSession = {
    id,
    receipt,
    people: getDemoPeople(),
    assignments: {},
    blinks: [],
    createdAt: new Date().toISOString(),
    status: "assigning",
  };

  const { error } = await supabase.from("splits").insert({
    id: session.id,
    receipt: session.receipt,
    people: session.people,
    assignments: session.assignments,
    blinks: session.blinks,
    status: session.status,
    created_at: session.createdAt,
  });

  if (error) {
    console.error("Error creating split:", error);
    throw new Error("Failed to create split");
  }

  return session;
}

export async function updateAssignments(
  splitId: string,
  assignments: Record<number, string[]>,
  people: Person[]
): Promise<SplitSession | null> {
  const { error } = await supabase
    .from("splits")
    .update({ assignments, people })
    .eq("id", splitId);

  if (error) {
    console.error("Error updating assignments:", error);
    return null;
  }

  return (await getSplit(splitId)) || null;
}

export async function generateBlinks(splitId: string, baseUrl: string): Promise<SplitSession | null> {
  const session = await getSplit(splitId);
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

  const { error } = await supabase
    .from("splits")
    .update({ blinks, status: "generated" })
    .eq("id", splitId);

  if (error) {
    console.error("Error generating blinks:", error);
    return null;
  }

  return (await getSplit(splitId)) || null;
}

export async function markPaid(splitId: string, personId: string): Promise<SplitSession | null> {
  const session = await getSplit(splitId);
  if (!session) return null;

  const blink = session.blinks.find((b) => b.personId === personId);
  if (blink) {
    blink.paymentStatus = "paid";
    blink.paidAt = new Date().toISOString();
  }

  let newStatus = session.status;
  if (session.blinks.every((b) => b.paymentStatus === "paid")) {
    newStatus = "complete";
  }

  const { error } = await supabase
    .from("splits")
    .update({ blinks: session.blinks, status: newStatus })
    .eq("id", splitId);

  if (error) {
    console.error("Error marking paid:", error);
    return null;
  }

  return (await getSplit(splitId)) || null;
}

export async function getAllSplits(): Promise<SplitSession[]> {
  const { data, error } = await supabase
    .from("splits")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((d) => ({
    id: d.id,
    receipt: d.receipt as Receipt,
    people: d.people as Person[],
    assignments: d.assignments as Record<number, string[]>,
    blinks: d.blinks as BlinkCard[],
    createdAt: d.created_at,
    status: d.status as SplitSession["status"],
  }));
}

export function getDemoReceipt(): Receipt {
  const restaurant = RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
  
  const numItems = Math.floor(Math.random() * 4) + 3; // 3 to 6 items
  const shuffledItems = [...ITEMS].sort(() => 0.5 - Math.random());
  const selectedItems = shuffledItems.slice(0, numItems);

  let subtotal = 0;
  const items = selectedItems.map((item, index) => {
    const price = item.price[Math.floor(Math.random() * item.price.length)];
    subtotal += price;
    return {
      id: index + 1,
      name: item.name,
      price: price
    };
  });

  const tax = parseFloat((subtotal * 0.09).toFixed(2));
  const tip = parseFloat((subtotal * 0.18).toFixed(2));
  const total = parseFloat((subtotal + tax + tip).toFixed(2));

  return {
    restaurant,
    items,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax,
    tip,
    total,
  };
}

export function getDemoPeople(): Person[] {
  const numPeople = Math.floor(Math.random() * 5) + 2; // 2 to 6 people
  const shuffledPeople = [...ALL_PEOPLE].sort(() => 0.5 - Math.random());
  return shuffledPeople.slice(0, numPeople).map((p, idx) => ({ ...p, id: `p${idx + 1}` }));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
