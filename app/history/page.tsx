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
  // This is the important part: the AI response is a nested object
  ai_response: {
    priceRange: string;
    reasoning: string;
    scripts: { title: string; content: string }[];
  } | null; // It can be null if something went wrong
};

export default function HistoryPage() {
  const supabase = createClientComponentClient();
  
  // THE FIX IS HERE: We initialize `negotiations` as an empty array `[]`
  // This prevents the `.map is not a function` error.
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserDataAndNegotiations = async () => {
      // First, get the current user
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // If we have a user, fetch their negotiations
        try {
          const { data, error } = await supabase
            .from('negotiations')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false }); // Show newest first

          if (error) {
            throw error;
          }
          
          setNegotiations(data || []);

        } catch (e: any) {
          setError("Failed to load negotiation history. Please try again.");
          console.error("Error fetching history:", e);
        }

      } else {
        // Handle case where user is not logged in
        setError("You must be logged in to view your history.");
      }
      
      setLoading(false);
    };

    fetchUserDataAndNegotiations();
  }, [supabase]);

  // UI for the loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        <p>Loading your negotiation history...</p>
      </div>
    );
  }

  // UI for an error state
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

        {/* UI for when there's no history */}
        {negotiations.length === 0 ? (
          <div className="text-center bg-gray-800 p-8 rounded-lg">
            <h2 className="text-xl font-semibold">No History Found</h2>
            <p className="text-gray-400 mt-2">You haven't made any negotiations yet. Go back to the app to start!</p>
          </div>
        ) : (
          // UI to display the list of past negotiations
          <div className="space-y-6">
            {negotiations.map((item) => (
              <div key={item.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-700 pb-3 mb-4">
                  <h2 className="text-xl font-bold text-blue-400">{item.item_name}</h2>
                  <p className="text-sm text-gray-400 mt-1 sm:mt-0">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Initial Price:</strong> {item.initial_price}</div>
                  <div><strong>Location:</strong> {item.location}</div>
                  <div><strong>Your Vibe:</strong> {item.vibe}</div>
                  {/* Safely access nested property */}
                  <div><strong>AI Recommended Range:</strong> {item.ai_response?.priceRange || 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
