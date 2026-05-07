"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { blinkService } from "@/lib/blinks";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { Receipt, Zap, Link as LinkIcon, Split, Camera, Bot, Send, Shield, Smartphone, Coins } from "lucide-react";

function FeatureCard({ children, className = "", highlight = "rgba(6,182,212,0.15)" }: { children: React.ReactNode, className?: string, highlight?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`relative group overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              ${highlight},
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </div>
  );
}

function TiltCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      <div style={{ transform: "translateZ(50px)" }} className="w-full h-full relative">
        {children}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(() => false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string;

          // Call parse-receipt API
          const parseRes = await fetch("/api/parse-receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Image }),
          });

          if (!parseRes.ok) throw new Error("Failed to parse receipt");
          const receiptData = await parseRes.json();

          // Create new split session
          const splitRes = await fetch("/api/splits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ receipt: receiptData }),
          });

          if (!splitRes.ok) throw new Error("Failed to create split session");
          const splitSession = await splitRes.json();

          // Redirect directly to the split UI
          router.push(`/split/${splitSession.id}`);
        } catch (error) {
          console.error("Error processing receipt inside onloadend:", error);
          setIsScanning(false);
          alert("Failed to parse receipt. Please try again or use the demo flow if API keys are missing.");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file:", error);
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-mesh text-white overflow-hidden selection:bg-primary/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-brand font-bold text-xl tracking-tight">
            <img src="/logo.svg" alt="BlinkSplit Logo" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            BlinkSplit
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="https://github.com/edycutjong/blinksplit" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Docs</a>
          </div>
          <button onClick={triggerFileInput} className="px-4 py-2 text-sm font-bold bg-white text-black rounded-full hover:bg-white/90 transition-colors">
            Launch App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Dynamic Background Decorations */}
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-accent/20 rounded-full blur-[150px] -z-10 mix-blend-screen" 
        />

        {/* CSS Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8 z-10">
          
          {/* Left Column: Copy */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-primary font-medium mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md">
              <Zap className="w-4 h-4 fill-primary" />
              <span>Powered by Solana Blinks</span>
            </div>
            
            <motion.h1 
              initial="hidden" animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } }}
              className="text-5xl lg:text-7xl font-bold tracking-tighter font-brand leading-[1.1]"
            >
              <motion.span variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.8 } } }} className="block bg-clip-text text-transparent bg-linear-to-br from-white via-white/90 to-white/40 pb-2">Split bills.</motion.span>
              <motion.span variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.8 } } }} className="block text-transparent bg-clip-text bg-linear-to-r from-primary to-accent pb-2">In a blink.</motion.span>
            </motion.h1>
            
            <p className="text-xl text-white/60 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Snap a receipt. AI parses the items. Drop a link in the group chat and collect USDC instantly. Zero app downloads required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button
                onClick={triggerFileInput}
                disabled={isScanning}
                className="btn-shine group relative w-full sm:w-auto px-8 py-4 bg-primary text-background font-bold text-lg rounded-full hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] disabled:opacity-80 disabled:cursor-wait overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {isScanning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Scanning Receipt...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Camera className="w-5 h-5" />
                    Scan Receipt &rarr;
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Right Column: Animated Illustration */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex-1 w-full max-w-md relative perspective-1000"
          >
            <TiltCard>
            {/* Glass Card Container */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative mx-auto w-full aspect-3/4 bg-[#111]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8 flex flex-col items-center overflow-hidden transform-gpu"
            >
              {/* Top decorative elements */}
              <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-primary via-accent to-primary" />
              <div className="w-16 h-1.5 bg-white/20 rounded-full mb-8" />
              
              {/* Receipt Content */}
              <div className="w-full space-y-6 relative z-10">
                <div className="flex justify-center mb-8">
                  <div className="h-6 w-32 bg-white/80 rounded" />
                </div>
                
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

                <div className="mt-8 border-t border-dashed border-white/20 pt-6 flex justify-between items-center w-full">
                  <div className="h-4 w-20 bg-white/60 rounded" />
                  <div className="h-6 w-24 bg-accent rounded" />
                </div>
              </div>
              
              {/* AI Scan Effect */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 pointer-events-none">
                    <motion.div animate={{ y: ["0%", "400%", "0%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_20px_#06b6d4,0_0_40px_#06b6d4]" />
                    <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Ambient Glow */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/30 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/30 blur-[80px] rounded-full pointer-events-none" />
            </motion.div>
            </TiltCard>
            
            {/* Floating Action Badges */}
            <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute -right-6 top-1/4 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center"><Zap className="w-5 h-5 text-accent" /></div>
              <div><div className="text-xs text-white/60 font-medium">Network</div><div className="text-sm text-white font-bold">Solana</div></div>
            </motion.div>

            <motion.div animate={{ y: [5, -5, 5] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute -left-8 bottom-1/4 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><Receipt className="w-5 h-5 text-primary" /></div>
              <div><div className="text-xs text-white/60 font-medium">Split via</div><div className="text-sm text-white font-bold">Blinks</div></div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* How it Works Section */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        id="how-it-works" className="py-24 px-6 border-t border-white/5 bg-black/50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold font-brand tracking-tight">How it Works</h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">Three simple steps to settle the bill without downloading another app.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard highlight="rgba(6,182,212,0.15)" className="p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] group-hover:bg-primary/20 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 text-primary relative z-10">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 relative z-10">1. Snap Receipt</h3>
              <p className="text-white/60 relative z-10">Take a photo of your dinner receipt. No manual entry needed.</p>
            </FeatureCard>
            
            <FeatureCard highlight="rgba(139,92,246,0.15)" className="p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group hover:border-accent/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[50px] group-hover:bg-accent/20 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6 text-accent relative z-10">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 relative z-10">2. AI Parsing</h3>
              <p className="text-white/60 relative z-10">Our AI instantly breaks down line items, taxes, and tips automatically.</p>
            </FeatureCard>

            <FeatureCard highlight="rgba(6,182,212,0.15)" className="p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] group-hover:bg-primary/20 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 text-primary relative z-10">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 relative z-10">3. Share Blink</h3>
              <p className="text-white/60 relative z-10">Drop the Solana Blink URL in the group chat. They click to pay USDC directly.</p>
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold font-brand tracking-tight">The ultimate frictionless experience.</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Smartphone className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-lg font-bold">No App Required</h4>
                    <p className="text-white/60 mt-1">Unlike Venmo or Splitwise, your friends just click the link in Telegram or X and sign the transaction.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Shield className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-lg font-bold">Instant Settlement</h4>
                    <p className="text-white/60 mt-1">No holding periods. Funds go directly to your Phantom wallet instantly via the Solana network.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Coins className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-lg font-bold">USDC Native</h4>
                    <p className="text-white/60 mt-1">Keep it simple. All payments settle in USDC, meaning zero price volatility risk for your dinner tab.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative aspect-square md:aspect-auto md:h-[600px] rounded-3xl bg-[#111] border border-white/10 overflow-hidden flex items-center justify-center">
              {/* Decorative Abstract Art */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="w-64 h-64 border border-primary/30 rounded-full border-dashed" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute w-80 h-80 border border-accent/30 rounded-full border-dashed" />
              <div className="absolute w-32 h-32 bg-linear-to-tr from-primary to-accent rounded-full blur-2xl opacity-50" />
              <img src="/logo.svg" alt="BlinkSplit Logo" className="absolute w-20 h-20 drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]" />
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 px-6 border-t border-white/5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-linear-to-tr from-primary/20 to-accent/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold font-brand tracking-tight mb-6">
            Stop tracking down your friends for $12.
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Scan your first receipt in seconds. No sign-ups. No apps. Just connect your Solana wallet and split.
          </p>
          <button
            onClick={triggerFileInput}
            disabled={isScanning}
            className="px-10 py-5 bg-white text-black font-bold text-xl rounded-full hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 disabled:opacity-80 disabled:cursor-wait"
          >
            {isScanning ? "Scanning Receipt..." : "Scan a Receipt Now"}
          </button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-brand font-bold text-lg">
            <img src="/logo.svg" alt="BlinkSplit Logo" className="w-6 h-6" />
            BlinkSplit
          </div>
          <div className="text-white/40 text-sm">
            Built for the Colosseum Frontier Hackathon
          </div>
          <div className="flex gap-4">
            <a href="https://x.com/edycutjong" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg></a>
            <a href="https://github.com/edycutjong/blinksplit" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg></a>
          </div>
        </div>
      </footer>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
