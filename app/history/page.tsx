// File: app/history/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { User } from '@supabase/auth-helpers-nextjs';

// Define the structure of a single negotiation record from your database
type Negotiation = {
  id: string;
  created_at: string;
  item_name: string;
  initial_price: number;
  location: string;
  vibe: string;
  ai_response: {
    priceRange: string;
    reasoning: string;
    scripts: { title: string; content: string }[];
  } | null;
};

// ===================================================================
// ✨ NEW: Interactive Card Component for Each History Item
// ===================================================================
const HistoryItemCard = ({ item }: { item: Negotiation }) => {
  const [isOpen, setIsOpen] = useState(false); // Manages the expand/collapse state
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300">
      {/* --- Main Clickable Header --- */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-700/50 flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h2 className="text-lg font-bold text-blue-400">{item.item_name}</h2>
          <p className="text-xs text-gray-400">
            {new Date(item.created_at).toLocaleString()}
          </p>
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* --- Expandable Details Section with Animation --- */}
      <div 
        className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-4 border-t border-gray-700 space-y-4">
          {/* --- Key Info Grid --- */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-4">
            <div><strong>Initial Price:</strong> <span className="text-gray-300">{item.initial_price}</span></div>
            <div><strong>Location:</strong> <span className="text-gray-300">{item.location}</span></div>
            <div><strong>Your Vibe:</strong> <span className="text-gray-300">{item.vibe}</span></div>
            <div><strong>AI Range:</strong> <span className="text-gray-300">{item.ai_response?.priceRange || 'N/A'}</span></div>
          </div>
          
          {/* --- AI Reasoning --- */}
          <div className="pt-2">
            <h3 className="font-semibold text-gray-200">AI Reasoning:</h3>
            <p className="text-sm text-gray-400 italic">"{item.ai_response?.reasoning || 'No reasoning available.'}"</p>
          </div>

          {/* --- AI Scripts with Copy Buttons --- */}
          <div className="pt-2">
            <h3 className="font-semibold text-gray-200">AI Scripts:</h3>
            <div className="space-y-3 mt-2">
              {item.ai_response?.scripts.map((script, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm text-gray-300">{script.title}</h4>
                    <button 
                      onClick={() => handleCopy(script.content, index)}
                      className={`text-xs text-white font-semibold py-1 px-3 rounded-md transition-all active:scale-95 ${copiedIndex === index ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                    >
                      {copiedIndex === index ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">{script.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// ===================================================================
// ✨ Main History Page Component (No major changes here)
// ===================================================================
export default function HistoryPage() {
  const supabase = createClientComponentClient();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDataAndNegotiations = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('negotiations')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setNegotiations(data || []);
        } catch (e: any) {
          setError("Failed to load negotiation history.");
          console.error("Error fetching history:", e);
        }
      } else {
        setError("You must be logged in to view your history.");
      }
      setLoading(false);
    };
    fetchUserDataAndNegotiations();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        <p>Loading your negotiation history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white text-center p-4">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
          Go to Main Page
        </Link>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-gray-900 text-white">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Negotiation History</h1>
          <Link href="/" className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
            ← Back to App
          </Link>
        </div>

        {negotiations.length === 0 ? (
          <div className="text-center bg-gray-800 p-8 rounded-lg">
            <h2 className="text-xl font-semibold">No History Found</h2>
            <p className="text-gray-400 mt-2">You haven't made any negotiations yet. Go back to the app to start!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {negotiations.map((item) => (
              // Here we use our new interactive component!
              <HistoryItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
