"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";

interface Payer {
  personId: string;
  paymentStatus: "paid" | "pending";
  name: string;
  wallet: string;
  totalOwed: number;
  itemsTotal: number;
  taxShare: number;
  tipShare: number;
}

export default function PaymentTracker({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [payers, setPayers] = useState<Payer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(() => null);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(() => null);

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyWallet = (personId: string, wallet: string) => {
    navigator.clipboard.writeText(wallet);
    setCopiedWallet(personId);
    setTimeout(() => setCopiedWallet(null), 1500);
  };

  useEffect(() => {
    fetch(`/api/splits/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPayers(data.blinks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Simulate real-time payment coming in sequentially
  useEffect(() => {
    if (payers.length === 0) return;
    if (payers.every(p => p.paymentStatus === "paid")) return;

    const timers: NodeJS.Timeout[] = [];
    payers.forEach((p, idx) => {
      const t = setTimeout(() => {
        setPayers(prev => prev.map(payer => 
          payer.personId === p.personId ? { ...payer, paymentStatus: "paid" } : payer
        ));
      }, 2000 + idx * 2500);
      timers.push(t);
    });
    
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payers.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const paidCount = payers.filter(p => p.paymentStatus === "paid").length;
  const totalCount = payers.length;
  const progressPercent = totalCount === 0 ? 0 : (paidCount / totalCount) * 100;
  const isAllPaid = totalCount > 0 && paidCount === totalCount;
  
  const totalSessionAmount = payers.reduce((sum, p) => sum + p.totalOwed, 0);

  return (
    <div className="min-h-screen bg-background text-text-primary p-4 md:p-12 overflow-hidden relative">
      {/* Confetti / Success background glow if all paid */}
      <AnimatePresence>
        {isAllPaid && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-success/5 pointer-events-none z-0"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-success/20 blur-[120px] rounded-full pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        
        {/* Header & Progress */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <motion.h1 
            className="text-4xl font-brand font-bold"
            animate={isAllPaid ? { scale: [1, 1.05, 1], color: ["#fff", "#22c55e", "#fff"] } : {}}
            transition={{ duration: 0.5 }}
          >
            {isAllPaid ? "Settlement Complete!" : "Payment Tracker"}
          </motion.h1>
          <p className="text-text-secondary text-lg">Total: ${totalSessionAmount.toFixed(2)}</p>
          
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm font-medium mb-2">
              <motion.span 
                key={paidCount}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={isAllPaid ? "text-success font-bold" : "text-text-primary"}
              >
                {paidCount} of {totalCount} paid
              </motion.span>
              <span className="text-primary">{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-4 w-full bg-surface-elevated rounded-full overflow-hidden border border-border shadow-inner relative">
              <motion.div 
                className={`h-full relative ${isAllPaid ? 'bg-success' : 'bg-primary'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, type: "spring", bounce: 0.2 }}
              >
                {/* Shine effect on progress bar */}
                <motion.div 
                  className="absolute top-0 bottom-0 left-0 right-0 bg-linear-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Grid of BlinkCards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {payers.map((payer, idx) => (
              <motion.div 
                key={payer.personId} 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5, type: "spring" }}
                className={`bg-surface rounded-2xl border overflow-hidden hover:shadow-[0_0_20px_rgba(26,26,46,0.8)] transition-all group relative ${payer.paymentStatus === 'paid' ? 'border-success/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'border-border'}`}
              >
                {payer.paymentStatus === "paid" && (
                  <motion.div 
                    layoutId={`glow-${payer.personId}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-linear-to-b from-success/10 to-transparent pointer-events-none"
                  />
                )}
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <AnimatePresence mode="wait">
                    {payer.paymentStatus === "paid" ? (
                      <motion.span 
                        key="paid"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-success/20 text-success border border-success/50 shadow-[0_0_10px_rgba(34,197,94,0.3)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        Paid
                      </motion.span>
                    ) : (
                      <motion.span 
                        key="pending"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-warning/20 text-warning border border-warning/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <span className="w-2 h-2 bg-warning rounded-full" />
                        Pending
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-6 pt-10 flex flex-col items-center text-center space-y-4 relative z-10">
                  <motion.div 
                    animate={payer.paymentStatus === "paid" ? { 
                      scale: [1, 1.2, 1],
                      borderColor: ["#334155", "#22c55e", "#22c55e"]
                    } : {}}
                    transition={{ duration: 0.5 }}
                    className={`w-16 h-16 rounded-full bg-surface-elevated border-2 flex items-center justify-center text-2xl font-brand font-bold ${payer.paymentStatus === 'paid' ? 'text-success border-success' : 'text-text-primary border-border'}`}
                  >
                    {payer.name[0]}
                  </motion.div>
                  
                  <div>
                    <h3 className="text-xl font-bold">{payer.name}</h3>
                    <button
                      onClick={() => copyWallet(payer.personId, payer.wallet)}
                      className="flex items-center gap-1.5 text-sm text-text-muted font-mono tracking-wide hover:text-primary transition-colors group/wallet"
                      title={payer.wallet}
                    >
                      <span>{payer.wallet.slice(0, 4)}...{payer.wallet.slice(-4)}</span>
                      {copiedWallet === payer.personId ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-40 group-hover/wallet:opacity-100 transition-opacity" />
                      )}
                    </button>
                  </div>

                  <motion.div 
                    animate={payer.paymentStatus === "paid" ? { color: ["#0ea5e9", "#22c55e"] } : {}}
                    className="text-4xl font-mono font-bold text-primary my-4"
                  >
                    ${payer.totalOwed.toFixed(2)}
                  </motion.div>

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

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCopy(payer.personId)}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      copiedId === payer.personId 
                        ? "bg-success text-white" 
                        : "bg-surface-elevated text-text-primary hover:bg-border"
                    }`}
                  >
                    {copiedId === payer.personId ? "Copied!" : "Copy Blink URL"}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isAllPaid && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
              className="flex justify-center mt-12 relative z-10"
            >
              <button
                onClick={() => router.push("/")}
                className="px-8 py-4 bg-surface-elevated text-text-primary border border-border rounded-xl font-bold hover:bg-surface hover:text-primary hover:border-primary/50 transition-all flex items-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Split Another Bill
                <span className="text-xl">→</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
