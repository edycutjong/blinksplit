"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface ReceiptItem { id: number; name: string; price: number; }
interface Person { id: string; name: string; wallet: string; color: string; }
interface SplitSession {
  id: string;
  receipt: { restaurant: string; items: ReceiptItem[]; subtotal: number; tax: number; tip: number; total: number; };
  people: Person[];
  assignments: Record<number, string[]>;
  status: string;
}

const COLORS = ["bg-pink-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-teal-500", "bg-indigo-500"];

export default function SplitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<SplitSession | null>(() => null);
  const [assignments, setAssignments] = useState<Record<number, string[]>>(() => ({}));
  const [people, setPeople] = useState<Person[]>(() => []);
  const [isGenerating, setIsGenerating] = useState(() => false);
  const [loading, setLoading] = useState(() => true);
  const [newName, setNewName] = useState(() => "");
  const [newWallet, setNewWallet] = useState(() => "");
  const [showAdd, setShowAdd] = useState(() => false);

  useEffect(() => {
    fetch(`/api/splits/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSession(data);
        setAssignments(data.assignments || {});
        setPeople(data.people || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const toggleAssignment = (itemId: number, personId: string) => {
    setAssignments((prev) => {
      const curr = prev[itemId] || [];
      const next = curr.includes(personId) ? curr.filter((x) => x !== personId) : [...curr, personId];
      return { ...prev, [itemId]: next };
    });
  };

  const getPersonTotal = (personId: string) => {
    if (!session) return 0;
    let itemTotal = 0;
    Object.entries(assignments).forEach(([itemId, assignees]) => {
      if (assignees.includes(personId)) {
        const item = session.receipt.items.find((i) => i.id === parseInt(itemId));
        if (item) itemTotal += item.price / assignees.length;
      }
    });
    const taxRate = session.receipt.tax / session.receipt.subtotal;
    const tipRate = session.receipt.tip / session.receipt.subtotal;
    return itemTotal + itemTotal * taxRate + itemTotal * tipRate;
  };

  const addPerson = () => {
    if (!newName.trim()) return;
    const p: Person = {
      id: `p${Date.now()}`,
      name: newName.trim(),
      wallet: newWallet.trim() || `${newName.trim()}...wallet`,
      color: COLORS[people.length % COLORS.length],
    };
    setPeople((prev) => [...prev, p]);
    setNewName("");
    setNewWallet("");
    setShowAdd(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Save assignments
      await fetch(`/api/splits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments, people }),
      });
      // Generate blinks
      await fetch(`/api/splits/${id}/generate-blinks`, { method: "POST" });
      router.push(`/split/${id}/blinks`);
    } catch (_err) {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-text-muted">Split session not found</p>
        <button onClick={() => router.push("/")} className="text-primary hover:underline">Go Home</button>
      </div>
    );
  }

  const { receipt } = session;
  const assignedTotal = people.reduce((sum, p) => sum + getPersonTotal(p.id), 0);
  const allAssigned = receipt.items.every((item) => (assignments[item.id]?.length || 0) > 0);

  return (
    <div className="min-h-screen bg-background text-text-primary p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-5xl mb-6 flex items-center gap-4">
        <button onClick={() => router.push("/")} className="text-text-muted hover:text-text-primary transition-colors">
          ← Back
        </button>
        <h1 className="text-2xl font-brand font-bold flex-1">Assign Items</h1>
        <span className="text-text-muted text-sm">Step 2 of 3</span>
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
        {/* Left: Receipt */}
        <div className="flex-1 bg-surface rounded-2xl border border-border overflow-hidden flex flex-col shadow-xl">
          <div className="bg-surface-elevated p-6 border-b border-border text-center">
            <h2 className="text-xl font-brand font-bold">{receipt.restaurant}</h2>
            <p className="text-text-muted text-sm mt-1">Tap names to assign items to people</p>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="space-y-3">
              {receipt.items.map((item) => {
                const assignees = assignments[item.id] || [];
                const isAssigned = assignees.length > 0;
                return (
                  <div key={item.id} className={`flex flex-col gap-2 p-3 rounded-lg transition-colors border ${isAssigned ? "border-primary/30 bg-primary/5" : "border-transparent hover:bg-surface-elevated hover:border-border"}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.name}</span>
                      <span className="font-mono text-primary">${item.price.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {people.map((p) => {
                        const active = assignees.includes(p.id);
                        return (
                          <button key={p.id} onClick={() => toggleAssignment(item.id, p.id)}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${active ? `${p.color} text-white shadow-md` : "bg-surface-elevated text-text-muted hover:text-text-primary"}`}>
                            {p.name}{assignees.length > 1 && active ? ` (1/${assignees.length})` : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 pt-4 border-t border-dashed border-border space-y-2 text-sm text-text-secondary">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">${receipt.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span className="font-mono">${receipt.tax.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tip</span><span className="font-mono">${receipt.tip.toFixed(2)}</span></div>
              <div className="flex justify-between pt-2 text-text-primary font-bold text-lg border-t border-border mt-2">
                <span>Total</span><span className="font-mono">${receipt.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: People & Generate */}
        <div className="w-full md:w-96 flex flex-col gap-6">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xl flex-1">
            <h3 className="text-lg font-bold mb-4">Payers</h3>
            <div className="space-y-3">
              {people.map((p) => {
                const total = getPersonTotal(p.id);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-surface-elevated rounded-xl border border-border">
                    <div className={`w-10 h-10 rounded-full ${p.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-text-muted truncate">{p.wallet}</div>
                    </div>
                    <div className="font-mono font-bold text-primary">${total.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>

            {showAdd ? (
              <div className="mt-4 space-y-2 p-3 bg-surface-elevated rounded-xl border border-border">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary focus:outline-none" />
                <input value={newWallet} onChange={(e) => setNewWallet(e.target.value)} placeholder="Wallet address (optional)"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary focus:outline-none" />
                <div className="flex gap-2">
                  <button onClick={addPerson} className="flex-1 py-2 bg-primary text-background rounded-lg text-sm font-medium">Add</button>
                  <button onClick={() => setShowAdd(false)} className="flex-1 py-2 bg-surface border border-border rounded-lg text-sm text-text-muted">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAdd(true)} className="w-full mt-4 py-3 border border-dashed border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors text-sm font-medium">
                + Add Person
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="bg-surface rounded-2xl border border-border p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-muted">Assigned</span>
              <span className="font-mono text-primary">${assignedTotal.toFixed(2)} / ${receipt.total.toFixed(2)}</span>
            </div>
            <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${Math.min((assignedTotal / receipt.total) * 100, 100)}%` }} />
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating || !allAssigned}
            className="w-full py-5 bg-primary text-background font-bold text-lg rounded-2xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed">
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                Generating Blinks...
              </span>
            ) : allAssigned ? "⚡ Generate Blinks" : "Assign all items first"}
          </button>
        </div>
      </div>
    </div>
  );
}
