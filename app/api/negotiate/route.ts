// File: app/api/negotiate/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// This automatically finds and uses the OPENAI_API_KEY from your .env.local
const openai = new OpenAI();

// This function will handle POST requests to /api/negotiate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemName, category, location, price } = body;

    // --- The NEW and IMPROVED Core AI Prompt ---
    // We now instruct the AI to validate the item first and respond in a specific JSON format.
    const prompt = `
      You are an expert price negotiator and a data validator. Your response MUST be in JSON format.

      A user wants advice on negotiating the price for an item.

      Item Details:
      - Item: "${itemName}"
      - Category: "${category}"
      - Location: "${location}"
      - Seller's Asking Price: ${price}

      Your Task (in two steps):
      1.  **Validation:** First, analyze the "Item". Is it a real, sellable product? A "Used iPhone 11" is VALID. Gibberish like "blah blah blah" or "lskdjf" or an unsellable concept like "happiness" is INVALID.

      2.  **Generate Response based on Validation:**
          *   **If the item is INVALID**, respond with the following JSON structure:
              {
                "isValid": false,
                "reason": "The item name provided does not seem to be a real product. Please enter a valid item."
              }
          *   **If the item is VALID**, proceed with the negotiation analysis and respond with the following JSON structure:
              {
                "isValid": true,
                "negotiationPlan": {
                  "recommendedRange": "...",
                  "reasoning": "...",
                  "scripts": [
                    { "type": "Initial Offer", "message": "..." },
                    { "type": "Follow-up", "message": "..." }
                  ]
                }
              }
              
      Fill out the "negotiationPlan" with your expert advice: provide a realistic price range, a brief reasoning, and 2-3 polite, short, and effective messages the user can copy and paste.
    `;

    // Make the API call to OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      // This is crucial: it forces the AI to output a JSON object.
      response_format: { type: "json_object" }, 
      messages: [{ role: 'user', content: prompt }],
    });

    // The AI's response is now a string of JSON. We parse it into a real object.
    const aiResponseObject = JSON.parse(completion.choices[0].message.content || '{}');

    // Send the structured AI response back to the frontend
    return NextResponse.json(aiResponseObject);

  } catch (error) {
    console.error("Error in API route:", error);
    // Send a generic error message if something goes wrong
    return NextResponse.json({ isValid: false, reason: 'An internal server error occurred. Please try again later.' }, { status: 500 });
  }
}
