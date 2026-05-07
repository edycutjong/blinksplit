"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Receipt, CheckCircle2, Clock, ChevronRight, Split } from "lucide-react";

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
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Safe date formatter for client
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden relative selection:bg-primary/30">
      {/* Dynamic Background Decorations */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] -z-10 mix-blend-screen" 
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/2 -right-1/4 w-[800px] h-[800px] bg-accent/20 rounded-full blur-[150px] -z-10 mix-blend-screen" 
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10" />

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-brand font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Split className="w-4 h-4 text-white" />
            </div>
            BlinkSplit
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <button onClick={() => router.push("/")} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <h1 className="text-4xl md:text-5xl font-brand font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
            Split History
          </h1>
        </div>

        {splits.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6 py-24 text-center bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm"
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Receipt className="w-10 h-10 text-primary opacity-80" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">No active splits</h2>
              <p className="text-white/50 max-w-sm">You haven't split any bills yet. Scan your first receipt to see it here.</p>
            </div>
            <button onClick={() => router.push("/")} className="px-8 py-4 bg-primary text-background rounded-full font-bold hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              Scan Receipt &rarr;
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {splits.map((s, index) => {
              const paidCount = s.blinks?.filter((b) => b.paymentStatus === "paid").length || 0;
              const totalCount = s.blinks?.length || 0;
              const isComplete = s.status === "complete" || (totalCount > 0 && paidCount === totalCount);
              const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

              return (
                <motion.button 
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={() => router.push(s.blinks?.length ? `/split/${s.id}/blinks` : `/split/${s.id}`)}
                  className="w-full text-left bg-white/[0.03] rounded-3xl border border-white/10 p-6 md:p-8 hover:bg-white/[0.06] hover:border-primary/40 transition-all group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${isComplete ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-primary/10 border-primary/20 text-primary"}`}>
                      {isComplete ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                    </div>
                    
                    <div className="flex-1 w-full">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                        <h3 className="text-xl font-bold truncate">{s.receipt.restaurant}</h3>
                        <div className="font-mono text-lg font-medium text-primary">
                          ${s.receipt.total.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
                        <span>{formatDate(s.createdAt)}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{s.people?.length || 0} People</span>
                      </div>

                      {totalCount > 0 ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-medium text-white/60">
                            <span>{paidCount} of {totalCount} Paid</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.2 + (index * 0.05) }}
                              className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-accent"}`}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/5 text-xs text-white/70">
                          Draft (Needs Assignment)
                        </div>
                      )}
                    </div>

                    <div className="hidden md:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors shrink-0">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
