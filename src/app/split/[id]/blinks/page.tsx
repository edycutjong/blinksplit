"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Hardcoded for demo/hackathon purposes matching SEED_DATA.md calculated_shares
const initialPayers = [
  { id: "p1", name: "Alice", wallet: "Alice...xyz", itemsTotal: 18.95, taxShare: 1.71, tipShare: 3.49, totalOwed: 24.15, status: "pending" },
  { id: "p2", name: "Bob", wallet: "Bob...xyz", itemsTotal: 20.50, taxShare: 1.85, tipShare: 3.78, totalOwed: 26.13, status: "paid" },
  { id: "p3", name: "Charlie", wallet: "Charlie...xyz", itemsTotal: 14.75, taxShare: 1.33, tipShare: 2.72, totalOwed: 18.80, status: "pending" },
];

export default function PaymentTracker() {
  const router = useRouter();
  const [payers, setPayers] = useState(() => initialPayers);
  const [copiedId, setCopiedId] = useState<string | null>(() => null);

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simulate real-time payment coming in
  useEffect(() => {
    const timer = setTimeout(() => {
      setPayers(prev => prev.map(p => p.id === "p1" ? { ...p, status: "paid" } : p));
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const paidCount = payers.filter(p => p.status === "paid").length;
  const totalCount = payers.length;
  const progressPercent = (paidCount / totalCount) * 100;

  return (
    <div className="min-h-screen bg-background text-text-primary p-4 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header & Progress */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-brand font-bold">Payment Tracker</h1>
          <p className="text-text-secondary text-lg">The Golden Dragon • Total: $69.08</p>
          
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-text-primary">{paidCount} of {totalCount} paid</span>
              <span className="text-primary">{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-3 w-full bg-surface-elevated rounded-full overflow-hidden border border-border">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Grid of BlinkCards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payers.map(payer => (
            <div key={payer.id} className="bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-[0_0_15px_rgba(26,26,46,0.5)] transition-all group relative">
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                {payer.status === "paid" ? (
                  <span className="bg-success/20 text-success border border-success/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    Paid
                  </span>
                ) : (
                  <span className="bg-warning/20 text-warning border border-warning/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 bg-warning rounded-full" />
                    Pending
                  </span>
                )}
              </div>

              <div className="p-6 pt-10 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-surface-elevated border-2 border-border flex items-center justify-center text-2xl font-brand font-bold text-text-primary">
                  {payer.name[0]}
                </div>
                
                <div>
                  <h3 className="text-xl font-bold">{payer.name}</h3>
                  <p className="text-sm text-text-muted">{payer.wallet}</p>
                </div>

                <div className="text-4xl font-mono font-bold text-primary my-4">
                  ${payer.totalOwed.toFixed(2)}
                </div>

                <div className="w-full space-y-2 text-sm text-text-secondary bg-background/50 rounded-lg p-3 border border-border/50">
                  <div className="flex justify-between">
                    <span>Items</span>
                    <span className="font-mono">${payer.itemsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax & Tip</span>
                    <span className="font-mono">${(payer.taxShare + payer.tipShare).toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleCopy(payer.id)}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    copiedId === payer.id 
                      ? "bg-success text-white" 
                      : "bg-surface-elevated text-text-primary hover:bg-border"
                  }`}
                >
                  {copiedId === payer.id ? "Copied!" : "Copy Blink URL"}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
