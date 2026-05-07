"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { blinkService } from "@/lib/blinks";

export default function Home() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    // Simulate upload/scan delay and real SDK call
    await blinkService.generateBlinkUrl(45.50, "BlinkSplitDemoUser");
    router.push("/split/new");
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10 mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] -z-10 mix-blend-screen" />

      <div className="max-w-2xl w-full text-center space-y-12 z-10">
        
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary font-brand">
            BlinkSplit
          </h1>
          <p className="text-xl md:text-3xl text-text-secondary font-medium">
            Split the bill. Drop the link. Get paid.
          </p>
        </div>

        {/* receipt illustration */}
        <div className="relative mx-auto w-64 h-80 bg-surface-elevated border border-border rounded-lg shadow-2xl p-6 flex flex-col items-center justify-start transform rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden">
          <div className="w-16 h-1 bg-border rounded-full mb-8" />
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center w-full">
              <div className="h-2 w-24 bg-border rounded" />
              <div className="h-2 w-8 bg-border rounded" />
            </div>
            <div className="flex justify-between items-center w-full">
              <div className="h-2 w-32 bg-border rounded" />
              <div className="h-2 w-10 bg-border rounded" />
            </div>
            <div className="flex justify-between items-center w-full">
              <div className="h-2 w-20 bg-border rounded" />
              <div className="h-2 w-12 bg-border rounded" />
            </div>
            <div className="mt-8 border-t border-dashed border-border pt-4 flex justify-between items-center w-full">
              <div className="h-3 w-16 bg-primary/50 rounded" />
              <div className="h-3 w-16 bg-primary/50 rounded" />
            </div>
          </div>
          
          {isScanning && (
            <>
              <div className="absolute top-0 left-0 right-0 h-1 bg-accent shadow-[0_0_15px_#8b5cf6] animate-[scanline_2s_linear_infinite] z-20" />
              <div className="absolute inset-0 bg-accent/10 mix-blend-overlay animate-[pulse-glow_1.5s_ease-in-out_infinite] z-10" />
            </>
          )}
        </div>

        <button
          onClick={handleScan}
          disabled={isScanning}
          className="relative group px-8 py-4 bg-primary text-background font-bold text-lg rounded-full hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] disabled:opacity-80 disabled:cursor-wait"
        >
          {isScanning ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              Scanning Receipt...
            </span>
          ) : (
            <span>Scan Receipt &rarr;</span>
          )}
        </button>
      </div>
    </main>
  );
}
