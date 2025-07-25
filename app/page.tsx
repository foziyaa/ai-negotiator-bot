// File: app/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import type { Session } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

// Types for our AI responses
type AiPlanType = {
  priceRange: string;
  reasoning: string;
  scripts: { title: string; content: string; }[];
};
// ✨ NEW: Type for our live vibe analysis
type VibeAnalysisType = {
  vibe: string;
  key_phrases: string[];
  strategy_tip: string;
  emoji: string;
};

// The main application component
function NegotiatorApp({ session }: { session: Session }) {
  const supabase = createClientComponentClient();
  const user = session.user;

  // Form state
  const [itemName, setItemName] = useState("");
  const [sellerDesc, setSellerDesc] = useState(""); // This now triggers the wow-factor
  // ... other form states
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [vibe, setVibe] = useState("Friendly");

  // Response states
  const [aiResponse, setAiResponse] = useState<AiPlanType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ✨ NEW: States for the Live Vibe Analysis
  const [vibeAnalysis, setVibeAnalysis] = useState<VibeAnalysisType | null>(null);
  const [isVibeLoading, setIsVibeLoading] = useState(false);

  // ✨ NEW: Debounce logic to prevent API calls on every keystroke
  useEffect(() => {
    // If description is cleared, reset the analysis
    if (sellerDesc.trim() === "") {
      setVibeAnalysis(null);
      return;
    }
    // Only trigger if text is long enough to be meaningful
    if (sellerDesc.trim().length < 50) {
      return;
    }

    setIsVibeLoading(true);
    const handler = setTimeout(() => {
      const fetchVibeAnalysis = async () => {
        try {
          const response = await fetch('/api/analyze-vibe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerDesc }),
          });
          const result = await response.json();
          if (result.analysis) {
            setVibeAnalysis(result.analysis);
          }
        } catch (e) {
          console.error("Vibe analysis failed:", e);
        } finally {
          setIsVibeLoading(false);
        }
      };
      fetchVibeAnalysis();
    }, 1000); // 1-second delay after user stops typing

    return () => {
      clearTimeout(handler); // Cleanup on re-render
    };
  }, [sellerDesc]);


  const handleSubmit = async () => { /* ... existing handleSubmit logic ... */ }; // This function doesn't need to change

  // ... other existing functions like handleSignOut ...
  
  // (We'll paste the full, unchanged handleSubmit and handleSignOut back in below for completeness)

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };
  
  return (
    <div className="w-full max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">FairFare</h1>
        <div className="flex items-center gap-4">
          <Link href="/history" className="bg-gray-600 hover:bg-gray-500 text-white text-sm font-bold py-2 px-4 rounded-md">History</Link>
          <button onClick={handleSignOut} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-md transition-all">Sign Out</button>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-2xl">
        {/* --- Form Inputs --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label htmlFor="itemName" className="block text-sm font-medium text-gray-300 mb-2">Item Name</label><input type="text" id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g., Used iPhone 11" className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"/></div>
            <div><label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">Category (Optional)</label><input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Electronics" className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"/></div>
            <div><label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">Location</label><input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Addis Ababa" className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"/></div>
            <div><label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">Seller's Price (ETB)</label><input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 27000" className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"/></div>
        </div>
        
        {/* --- Seller Description Textarea --- */}
        <div className="mt-6 col-span-1 md:col-span-2">
            <label htmlFor="sellerDesc" className="block text-sm font-medium text-gray-300 mb-2">Seller's Item Description</label>
            <textarea id="sellerDesc" rows={4} value={sellerDesc} onChange={(e) => setSellerDesc(e.target.value)} placeholder="Paste the seller's description here for a live vibe analysis!" className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"/>
        </div>

        {/* --- ✨ WOW FACTOR: LIVE VIBE ANALYSIS MODULE ✨ --- */}
        <div className="mt-4 min-h-[100px]">
          {isVibeLoading && (
            <div className="flex items-center justify-center p-4 text-sm text-gray-400">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Analyzing seller's vibe...
            </div>
          )}
          {vibeAnalysis && !isVibeLoading && (
            <div className="bg-gray-700/50 p-4 rounded-lg animate-fade-in border border-gray-600">
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-3xl">{vibeAnalysis.emoji}</span>
                    <h3 className="text-lg font-bold text-cyan-400">{vibeAnalysis.vibe}</h3>
                </div>
                <p className="text-sm text-gray-300 mb-3"><strong className="text-gray-100">AI Tip:</strong> {vibeAnalysis.strategy_tip}</p>
                <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
                    <span className="font-semibold">Key phrases detected:</span>
                    <span className="italic"> {vibeAnalysis.key_phrases.join(', ')}</span>
                </div>
            </div>
          )}
        </div>

        {/* --- Vibe Buttons and Submit --- */}
        <div className="mt-6"><label className="block text-sm font-medium text-gray-300 mb-3 text-center">Choose Your Negotiation Vibe</label><div className="grid grid-cols-3 gap-2 md:gap-4"><button onClick={() => setVibe('Friendly')} type="button" className={`p-3 rounded-md text-xs md:text-sm font-semibold transition-all duration-200 ${vibe === 'Friendly' ? 'bg-green-500 text-white ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'}`}>🤝 Friendly Pro</button><button onClick={() => setVibe('Direct')} type="button" className={`p-3 rounded-md text-xs md:text-sm font-semibold transition-all duration-200 ${vibe === 'Direct' ? 'bg-blue-500 text-white ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'}`}>🎯 Direct Closer</button><button onClick={() => setVibe('Analytical')} type="button" className={`p-3 rounded-md text-xs md:text-sm font-semibold transition-all duration-200 ${vibe === 'Analytical' ? 'bg-purple-500 text-white ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'}`}>🧠 Careful Analyst</button></div></div>
        <div className="mt-8"><button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={isLoading || !itemName || !price || !location}>{isLoading ? "Generating Full Plan..." : "Get Negotiation Advice"}</button></div>
      </div>
      
      {/* ... The rest of the component for displaying results ... */}
    </div>
  );
}

// The rest of the file remains the same, but for completeness, here it is:
// This is the main page component that decides whether to show the Login form or the App
export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900 text-white">
      {!session ? (
        <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-2xl">
          <h1 className="text-3xl font-bold text-center mb-2">FairFare AI Negotiator</h1>
          <p className="text-md text-gray-400 text-center mb-8">Sign in or create an account to start</p>
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} theme="dark" providers={[]} onlyThirdPartyProviders={false} />
        </div>
      ) : (
        <NegotiatorApp session={session} />
      )}
    </main>
  );
}
