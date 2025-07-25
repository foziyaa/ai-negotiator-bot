// File: app/api/negotiate/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client from your environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemName, category, location, price, vibe, sellerDesc } = body;

    // --- AI CHAIN STEP A: ANALYZE THE SELLER'S VIBE ---
    let sellerAnalysis = "No seller description was provided by the user.";
    if (sellerDesc && sellerDesc.trim() !== "") {
      const analysisModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const analysisPrompt = `Analyze the following seller's item description to understand their personality and negotiation stance. Description: "${sellerDesc}". Based on the text, provide a one-sentence summary of the seller's likely vibe. For example: "The seller seems firm and direct..." or "The seller seems friendly and eager to sell."`;
      const analysisResult = await analysisModel.generateContent(analysisPrompt);
      sellerAnalysis = analysisResult.response.text();
    }

    // --- AI CHAIN STEP B: VALIDATE ITEM AND GENERATE NEGOTIATION PLAN ---

    const vibeInstructions: { [key: string]: string } = {
        Friendly: "You are a friendly but savvy negotiator. Your tone should be warm, collaborative, and build rapport. Use smiley faces and positive language.",
        Direct: "You are a direct, no-nonsense negotiator. Your goal is to get to the point quickly and efficiently. Your tone is firm, professional, but not rude. Be concise.",
        Analytical: "You are a detail-oriented, analytical negotiator. You rely on data and logic. Your tone is inquisitive and well-reasoned. Mention market facts and potential product flaws.",
    };

    // KEY CHANGE: The prompt is now much smarter.
    const strategyPrompt = `
        You are an expert price negotiator and data validator. Your response MUST be a single, valid JSON object.

        **FIRST, VALIDATE THE ITEM:**
        Analyze the "Item Name": "${itemName}". Is this a real, sellable product? 
        - A "Used iPhone 11" is VALID. 
        - Gibberish like "blah blah blah", "asdfghjkl", or a non-physical concept like "my happiness" is INVALID.

        **SECOND, GENERATE YOUR RESPONSE BASED ON THE VALIDATION:**

        **IF THE ITEM IS INVALID:** Respond with this exact JSON structure:
        {
          "isValid": false,
          "reason": "The item you entered doesn't seem to be a real product. Please enter a valid item name and try again."
        }

        **IF THE ITEM IS VALID:** Proceed with the full analysis and respond with this exact JSON structure:
        {
          "isValid": true,
          "plan": {
            "priceRange": "a string with the recommended price range",
            "reasoning": "a string explaining the logic for the price range, fully adjusted for the user's vibe AND the seller's analyzed vibe",
            "scripts": [
              { "title": "Message 1 (Initial Offer)", "content": "The first negotiation message text, written in the selected vibe and considering the seller's vibe" },
              { "title": "Message 2 (Follow-up)", "content": "The second negotiation message text" },
              { "title": "Message 3 (Final Offer, if needed)", "content": "The third negotiation message text" }
            ]
          }
        }
        
        **CONTEXT FOR YOUR ANALYSIS (if valid):**
        - User's Chosen Vibe: ${vibe} (Instructions: ${vibeInstructions[vibe]})
        - AI Analysis of Seller: ${sellerAnalysis} (Use this to tailor your scripts!)
        - Item Details: Category: "${category || 'N/A'}", Location: "${location}", Asking Price: ${price}
    `;

    const strategyModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await strategyModel.generateContent(strategyPrompt);
    const response = await result.response;
    const jsonText = response.text();

    // We now send the whole object, which includes `isValid`
    return NextResponse.json({ data: JSON.parse(jsonText) });

  } catch (error) {
    console.error("Error in /api/negotiate:", error);
    return NextResponse.json({ error: 'Failed to get a response from the AI service.' }, { status: 500 });
  }
}
