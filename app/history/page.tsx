// File: app/history/page.tsx
// THIS IS THE CORRECTED VERSION

"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
// The line that imported 'Database' is now DELETED

// Define the type for a single negotiation record
type Negotiation = {
  id: number;
  created_at: string;
  item_name: string;
  initial_price: number;
  vibe: string;
  ai_response: {
    priceRange: string;
    reasoning: string;
    scripts: { title: string; content: string }[];
  };
};

export default function HistoryPage() {
  // The <Database> type has been REMOVED from this line
  const supabase = createClientComponentClient();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNegotiations = async () => {
      // First, get the current user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch only the negotiations that match the logged-in user's ID
        const { data, error } = await supabase
          .from('negotiations')
          .select('*')
          .eq('user_id', user.id) // This is the crucial security filter
          .order('created_at', { ascending: false }); // Show newest first

        if (error) {
          console.error('Error fetching negotiations:', error);
          setError('Failed to load negotiation history.');
        } else if (data) {
          setNegotiations(data as Negotiation[]);
        }
      }
      setLoading(false);
    };

    fetchNegotiations();
  }, [supabase]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-900 text-white">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Negotiation History</h1>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-md">
            ← Back to Co-pilot
          </Link>
        </div>

        {loading && <p>Loading history...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && negotiations.length === 0 && (
          <div className="text-center py-10 bg-gray-800 rounded-lg">
            <p className="text-gray-400">You have no saved negotiations yet.</p>
            <p className="text-gray-500 text-sm">Go back and get some advice to start building your history!</p>
          </div>
        )}

        {!loading && negotiations.length > 0 && (
          <div className="space-y-6">
            {negotiations.map((item) => (
              <div key={item.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-green-400">{item.item_name}</h2>
                    <p className="text-sm text-gray-400">
                      Initial Price: {item.initial_price} | Vibe: {item.vibe}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <h3 className="font-semibold text-blue-400 mb-2">AI Recommended Range:</h3>
                  <p className="text-sm text-gray-300 mb-4">{item.ai_response.priceRange}</p>
                  <h3 className="font-semibold text-purple-400 mb-2">Final Script Suggestion:</h3>
                  <p className="text-sm text-gray-300 bg-gray-700 p-3 rounded-md italic">
                    "{item.ai_response.scripts[item.ai_response.scripts.length - 1].content}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}