// File: app/page.tsx
"use client";

import { useState } from 'react';

// Define a type for our structured AI response for better code safety
type NegotiationPlan = {
  recommendedRange: string;
  reasoning: string;
  scripts: { type: string; message: string }[];
};

export default function HomePage() {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  
  // State to hold the successful negotiation plan
  const [negotiationPlan, setNegotiationPlan] = useState<NegotiationPlan | null>(null);
  // State to hold any error or invalid reason messages
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setNegotiationPlan(null); // Clear previous plan
    setErrorMessage("");    // Clear previous error

    try {
      const response = await fetch('/api/negotiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemName, category, location, price }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.isValid) {
          setNegotiationPlan(data.negotiationPlan);
        } else {
          // The AI determined the item was invalid
          setErrorMessage(data.reason);
        }
      } else {
        setErrorMessage(`Error: ${data.reason || 'An unknown error occurred.'}`);
      }
    } catch (error) {
      setErrorMessage("Failed to connect to the server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-900 text-white">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-2">AI Vendor Price Negotiator</h1>
        <p className="text-lg text-gray-400 text-center mb-10">
          Negotiate smarter, not harder — AI that helps you find the right price.
        </p>

        <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
          {/* The form remains the same as before */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-300 mb-2">Item Name</label>
              <input
                type="text" id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Used iPhone 11"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">Category (Optional)</label>
              <input
                type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Electronics"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">Your Location</label>
              <input
                type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Addis Ababa"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">Seller's Initial Price (ETB)</label>
              <input
                type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 27000"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:bg-gray-500"
              disabled={isLoading || !itemName || !price || !location}>
              {isLoading ? "Thinking..." : "Get Negotiation Advice"}
            </button>
          </div>
        </div>

        {/* --- NEW RESPONSE AREA --- */}
        <div className="mt-10">
          {isLoading && <p className="text-center">Contacting the negotiation expert...</p>}

          {/* Display error message if it exists */}
          {errorMessage && !isLoading && (
            <div className="bg-red-900 border border-red-700 text-red-200 p-6 rounded-lg shadow-lg animate-fade-in">
              <h2 className="text-xl font-bold mb-2">Validation Error</h2>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Display negotiation plan if it exists */}
          {negotiationPlan && !isLoading && (
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg animate-fade-in space-y-6">
              <h2 className="text-2xl font-bold">AI Recommendations</h2>
              <div>
                <h3 className="font-semibold text-lg text-blue-400">Recommended Price Range</h3>
                <p className="text-gray-300">{negotiationPlan.recommendedRange}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-blue-400">Reasoning</h3>
                <p className="text-gray-300">{negotiationPlan.reasoning}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-blue-400">Negotiation Scripts</h3>
                <div className="space-y-4 mt-2">
                  {negotiationPlan.scripts.map((script, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-md">
                      <p className="font-medium text-gray-200">{script.type}</p>
                      <p className="text-gray-300 italic">"{script.message}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
