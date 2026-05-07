"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Seed Data
const receipt = {
  restaurant: "The Golden Dragon",
  items: [
    { id: 1, name: "Pad Thai", price: 14.95 },
    { id: 2, name: "Green Curry", price: 16.50 },
    { id: 3, name: "Spring Rolls (2x)", price: 8.00 },
    { id: 4, name: "Mango Sticky Rice", price: 9.25 },
    { id: 5, name: "Thai Iced Tea", price: 5.50 }
  ],
  subtotal: 54.20,
  tax: 4.88,
  tip: 10.00,
  total: 69.08
};

const initialPeople = [
  { id: "p1", name: "Alice", wallet: "Alice...xyz", color: "bg-pink-500" },
  { id: "p2", name: "Bob", wallet: "Bob...xyz", color: "bg-blue-500" },
  { id: "p3", name: "Charlie", wallet: "Charlie...xyz", color: "bg-emerald-500" },
];

export default function SplitAssigner() {
  const router = useRouter();
  const [people, setPeople] = useState(initialPeople);
  const [assignments, setAssignments] = useState<Record<number, string[]>>({}); // itemId -> personId[]
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleAssignment = (itemId: number, personId: string) => {
    setAssignments(prev => {
      const itemAssignees = prev[itemId] || [];
      if (itemAssignees.includes(personId)) {
        return { ...prev, [itemId]: itemAssignees.filter(id => id !== personId) };
      } else {
        return { ...prev, [itemId]: [...itemAssignees, personId] };
      }
    });
  };

  // Calculate totals per person
  const getPersonTotal = (personId: string) => {
    let itemTotal = 0;
    Object.entries(assignments).forEach(([itemId, assignees]) => {
      if (assignees.includes(personId)) {
        const item = receipt.items.find(i => i.id === parseInt(itemId));
        if (item) {
          itemTotal += item.price / assignees.length;
        }
      }
    });

    const taxRate = receipt.tax / receipt.subtotal;
    const tipRate = receipt.tip / receipt.subtotal;
    
    const taxShare = itemTotal * taxRate;
    const tipShare = itemTotal * tipRate;
    
    return itemTotal + taxShare + tipShare;
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      router.push("/split/123/blinks");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Receipt */}
        <div className="flex-1 bg-surface rounded-2xl border border-border overflow-hidden flex flex-col shadow-xl">
          <div className="bg-surface-elevated p-6 border-b border-border text-center">
            <h2 className="text-xl font-brand font-bold">{receipt.restaurant}</h2>
            <p className="text-text-muted text-sm mt-1">Receipt extracted successfully</p>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {receipt.items.map(item => {
                const assignees = assignments[item.id] || [];
                return (
                  <div key={item.id} className="flex flex-col gap-2 p-3 rounded-lg hover:bg-surface-elevated transition-colors border border-transparent hover:border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-text-primary">{item.name}</span>
                      <span className="font-mono text-primary">${item.price.toFixed(2)}</span>
                    </div>
                    
                    {/* Assignment Tags */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {people.map(person => {
                        const isAssigned = assignees.includes(person.id);
                        return (
                          <button
                            key={person.id}
                            onClick={() => toggleAssignment(item.id, person.id)}
                            className={`text-xs px-2 py-1 rounded-full font-medium transition-all ${
                              isAssigned 
                                ? `${person.color} text-white` 
                                : 'bg-surface-elevated text-text-muted hover:text-text-primary'
                            }`}
                          >
                            {person.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-dashed border-border space-y-2 text-sm text-text-secondary">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">${receipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-mono">${receipt.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tip</span>
                <span className="font-mono">${receipt.tip.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 text-text-primary font-bold text-lg border-t border-border mt-2">
                <span>Total</span>
                <span className="font-mono">${receipt.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: People & Generation */}
        <div className="w-full md:w-96 flex flex-col gap-6">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xl flex-1">
            <h3 className="text-lg font-bold mb-4">Payers</h3>
            
            <div className="space-y-4">
              {people.map(person => {
                const total = getPersonTotal(person.id);
                return (
                  <div key={person.id} className="flex items-center gap-4 p-3 bg-surface-elevated rounded-xl border border-border">
                    <div className={`w-10 h-10 rounded-full ${person.color} flex items-center justify-center text-white font-bold`}>
                      {person.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{person.name}</div>
                      <div className="text-xs text-text-muted truncate w-24">{person.wallet}</div>
                    </div>
                    <div className="font-mono font-bold text-primary text-lg">
                      ${total.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="w-full mt-4 py-3 border border-dashed border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors text-sm font-medium">
              + Add Person
            </button>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-5 bg-primary text-background font-bold text-lg rounded-2xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] disabled:opacity-80"
          >
            {isGenerating ? "Generating Blinks..." : "Generate Blinks"}
          </button>
        </div>

      </div>
    </div>
  );
}
