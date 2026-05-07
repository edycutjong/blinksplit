"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SplitSummary {
  id: string;
  receipt: { restaurant: string; total: number };
  blinks: { name: string; totalOwed: number; paymentStatus: string }[];
  createdAt: string;
  status: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [splits, setSplits] = useState<SplitSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/splits")
      .then((r) => r.json())
      .then((d) => { setSplits(d.splits || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background text-text-primary p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl mb-8 flex items-center gap-4">
        <button onClick={() => router.push("/")} className="text-text-muted hover:text-text-primary transition-colors">← Home</button>
        <h1 className="text-2xl font-brand font-bold flex-1">Split History</h1>
      </div>

      {splits.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="text-6xl opacity-30">🧾</div>
          <p className="text-text-muted">No splits yet. Scan a receipt to get started!</p>
          <button onClick={() => router.push("/")} className="px-6 py-3 bg-primary text-background rounded-full font-medium hover:bg-primary/90 transition-colors">
            Scan Receipt
          </button>
        </div>
      ) : (
        <div className="w-full max-w-3xl space-y-4">
          {splits.map((s) => {
            const paidCount = s.blinks?.filter((b) => b.paymentStatus === "paid").length || 0;
            const totalCount = s.blinks?.length || 0;
            return (
              <button key={s.id} onClick={() => router.push(s.blinks?.length ? `/split/${s.id}/blinks` : `/split/${s.id}`)}
                className="w-full text-left bg-surface rounded-2xl border border-border p-6 hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-elevated rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🧾
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{s.receipt.restaurant}</div>
                    <div className="text-sm text-text-muted">
                      {new Date(s.createdAt).toLocaleDateString()} • ${s.receipt.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.status === "complete" ? "bg-success/20 text-success" : s.status === "generated" ? "bg-warning/20 text-warning" : "bg-surface-elevated text-text-muted"}`}>
                      {s.status === "complete" ? "✅ All Paid" : s.status === "generated" ? `${paidCount}/${totalCount} Paid` : "In Progress"}
                    </span>
                  </div>
                </div>
                {totalCount > 0 && (
                  <div className="mt-3 w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.status === "complete" ? "bg-success" : "bg-primary"}`}
                      style={{ width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
