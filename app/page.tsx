// File: app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import type { Session } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

// KEY CHANGE: This type now reflects the 'plan' object inside the AI response.
type AiPlanType = {
  priceRange: string;
  reasoning: string;
  scripts: { title: string; content: string; }[];
};

// The main application component, shown only to logged-in users
function NegotiatorApp({ session }: { session: Session }) {
  const supabase = createClientComponentClient();
  const user = session.user;

  // Form state
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [vibe, setVibe] = useState("Friendly");
  const [sellerDesc, setSellerDesc] = useState("");
  
  // Response state
  const [aiResponse, setAiResponse] = useState<AiPlanType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // UI polish state
  const [loadingMessage, setLoadingMessage] = useState("AI Co-pilot is thinking...");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      const messages = ["Analyzing market data...", "Calibrating for your vibe...", "Reading the seller's tone...", "Crafting negotiation scripts...", "Finding the perfect price..."];
      let messageIndex = 0;
      setLoadingMessage(messages[messageIndex]);
      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setLoadingMessage(messages[messageIndex]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // KEY CHANGE: The handleSubmit function is now smarter.
  const handleSubmit = async () => {
    setIsLoading(true);
    setAiResponse(null);
    setError("");

    try {
      const response = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName, category, location, price, vibe, sellerDesc }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Check the new 'isValid' flag from the AI
      if (result.data.isValid) {
        const responseData: AiPlanType = result.data.plan;
        setAiResponse(responseData);

        // Save the successful negotiation to Supabase
        if (user) {
          await supabase.from('negotiations').insert({
            user_id: user.id, item_name: itemName, initial_price: parseFloat(price),
            location, vibe, ai_response: responseData,
          });
        }
      } else {
        // If isValid is false, show the AI's reason as an error
        setError(result.data.reason || "The AI determined the input was invalid.");
      }

    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label htmlFor="itemName" className="block text-sm font-medium text-gray-300 mb-2">Item Name</label><input type="text" id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g., Used iPhone 11" className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"/></div>
            <div><label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">Category (Optional)</label><input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Electronics" className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"/></div>
            <div><label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">Location</label><input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Addis Ababa" className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"/></div>
            <div><label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">Seller's Price (ETB)</label><input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 27000" className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"/></div>
        </div>
        <div className="mt-6 col-span-1 md:col-span-2"><label htmlFor="sellerDesc" className="block text-sm font-medium text-gray-300 mb-2">Seller's Item Description (Optional)</label><textarea id="sellerDesc" rows={3} value={sellerDesc} onChange={(e) => setSellerDesc(e.target.value)} placeholder="Paste the seller's description here. The AI will analyze their vibe!" className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"/></div>
        <div className="mt-8"><label className="block text-sm font-medium text-gray-300 mb-3 text-center">Choose Your Negotiation Vibe</label><div className="grid grid-cols-3 gap-2 md:gap-4"><button onClick={() => setVibe('Friendly')} type="button" className={`p-3 rounded-md text-xs md:text-sm font-semibold transition-all duration-200 ${vibe === 'Friendly' ? 'bg-green-500 text-white ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'}`}>🤝 Friendly Pro</button><button onClick={() => setVibe('Direct')} type="button" className={`p-3 rounded-md text-xs md:text-sm font-semibold transition-all duration-200 ${vibe === 'Direct' ? 'bg-blue-500 text-white ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'}`}>🎯 Direct Closer</button><button onClick={() => setVibe('Analytical')} type="button" className={`p-3 rounded-md text-xs md:text-sm font-semibold transition-all duration-200 ${vibe === 'Analytical' ? 'bg-purple-500 text-white ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'}`}>🧠 Careful Analyst</button></div></div>
        <div className="mt-8"><button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={isLoading || !itemName || !price || !location}>{isLoading ? loadingMessage : "Get Negotiation Advice"}</button></div>
      </div>
      
      {isLoading && <div className="mt-10 text-center text-gray-400 transition-opacity duration-500">{loadingMessage}</div>}
      {error && <div className="mt-10 p-4 bg-red-900 border border-red-700 text-white rounded-md">{error}</div>}
      
      {aiResponse && !isLoading && (
        <div className="mt-10 bg-gray-800 p-6 md:p-8 rounded-lg shadow-2xl w-full animate-fade-in">
          <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-3">AI Recommendations</h2>
          <div className="mb-6"><h3 className="text-lg font-semibold text-green-400 mb-2">Recommended Price Range</h3><p className="text-gray-300">{aiResponse.priceRange}</p></div>
          <div className="mb-6"><h3 className="text-lg font-semibold text-blue-400 mb-2">Reasoning</h3><p className="text-gray-300">{aiResponse.reasoning}</p></div>
          <div><h3 className="text-lg font-semibold text-purple-400 mb-4">Negotiation Scripts</h3><div className="space-y-4">
            {aiResponse.scripts.map((script, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-md transition-all hover:bg-gray-600">
                <div className="flex justify-between items-center mb-2"><h4 className="font-bold text-gray-200">{script.title}</h4><button onClick={() => { navigator.clipboard.writeText(script.content); setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); }} className={`text-xs text-white font-semibold py-1 px-3 rounded-md transition-all active:scale-95 ${copiedIndex === index ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'}`}>{copiedIndex === index ? 'Copied!' : 'Copy'}</button></div>
                <p className="text-gray-300 text-sm">{script.content}</p>
              </div>
            ))}
          </div></div>
        </div>
      )}
    </div>
  );
}

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
