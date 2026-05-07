"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { blinkService } from "@/lib/blinks";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Zap, Link as LinkIcon, Split } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    // Simulate upload/scan delay and real SDK call
    await new Promise(resolve => setTimeout(resolve, 2000));
    await blinkService.generateBlinkUrl(45.50, "BlinkSplitDemoUser");
    router.push("/split/new");
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 min-h-screen relative overflow-hidden bg-[#0A0A0A]">
      {/* Dynamic Background Decorations */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-accent/20 rounded-full blur-[150px] -z-10 mix-blend-screen" 
      />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10 opacity-10" />

      <div className="max-w-4xl w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8 z-10">
        
        {/* Left Column: Copy */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 space-y-8 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-primary font-medium mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md">
            <Zap className="w-4 h-4 fill-primary" />
            <span>Powered by Solana Blinks</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/40 font-brand leading-[1.1]">
            Split bills.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">In a blink.</span>
          </h1>
          
          <p className="text-xl text-text-secondary font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Snap a receipt. AI splits it. Drop a link in the group chat and collect USDC instantly. Zero app downloads required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="group relative w-full sm:w-auto px-8 py-4 bg-primary text-background font-bold text-lg rounded-full hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] disabled:opacity-80 disabled:cursor-wait overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {isScanning ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Scanning Receipt...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Try the Demo &rarr;
                </span>
              )}
            </button>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-full font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
              View Documentation
            </a>
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-6 pt-6 text-sm text-text-secondary/70">
            <div className="flex items-center gap-1.5"><Split className="w-4 h-4"/> AI Parsing</div>
            <div className="flex items-center gap-1.5"><Zap className="w-4 h-4"/> Instant USDC</div>
            <div className="flex items-center gap-1.5"><LinkIcon className="w-4 h-4"/> URL Sharing</div>
          </div>
        </motion.div>

        {/* Right Column: Animated Illustration */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex-1 w-full max-w-md relative perspective-1000"
        >
          {/* Glass Card Container */}
          <motion.div 
            animate={{ y: [-10, 10, -10], rotateX: [2, -2, 2], rotateY: [-2, 2, -2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative mx-auto w-full aspect-[3/4] bg-surface-elevated/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8 flex flex-col items-center overflow-hidden transform-gpu"
          >
            {/* Top decorative elements */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            <div className="w-16 h-1.5 bg-white/20 rounded-full mb-8" />
            
            {/* Receipt Content */}
            <div className="w-full space-y-6 relative z-10">
              {/* Header */}
              <div className="flex justify-center mb-8">
                <div className="h-6 w-32 bg-white/80 rounded" />
              </div>
              
              {/* Items */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center w-full">
                    <div className="flex gap-3 items-center">
                      <div className="h-4 w-4 bg-primary/40 rounded-sm" />
                      <div className={`h-2 bg-white/40 rounded ${i === 1 ? 'w-32' : i === 2 ? 'w-24' : 'w-28'}`} />
                    </div>
                    <div className="h-2 w-12 bg-white/60 rounded" />
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-8 border-t border-dashed border-white/20 pt-6 flex justify-between items-center w-full">
                <div className="h-4 w-20 bg-white/60 rounded" />
                <div className="h-6 w-24 bg-accent rounded" />
              </div>
            </div>
            
            {/* AI Scan Effect */}
            <AnimatePresence>
              {isScanning && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 pointer-events-none"
                >
                  <motion.div 
                    animate={{ y: ["0%", "400%", "0%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_20px_#06b6d4,0_0_40px_#06b6d4]" 
                  />
                  <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Ambient Glow */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/30 blur-[80px] rounded-full" />
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/30 blur-[80px] rounded-full" />
          </motion.div>
          
          {/* Floating Action Badges */}
          <motion.div 
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-6 top-1/4 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-xs text-white/60 font-medium">Network</div>
              <div className="text-sm text-white font-bold">Solana</div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -left-8 bottom-1/4 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-white/60 font-medium">Split via</div>
              <div className="text-sm text-white font-bold">Blinks</div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}
