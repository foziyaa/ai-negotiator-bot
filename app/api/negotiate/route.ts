import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Get the new sellerDesc from the body
    const { itemName, category, location, price, vibe, sellerDesc } = body;

    if (!itemName || !location || !price || !vibe) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // --- AI CHAIN STEP A: ANALYZE THE SELLER'S VIBE ---
    let sellerAnalysis = "No description provided by user.";

    // Only run this if the user actually provided a description
    if (sellerDesc && sellerDesc.trim() !== "") {
      const analysisModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const analysisPrompt = `
        Analyze the following seller's item description to understand their personality and negotiation stance.
        Description: "${sellerDesc}"
        Based on the text, provide a one-sentence summary of the seller's likely vibe. For example: "The seller seems firm and direct, using phrases like 'no lowballers'." or "The seller seems friendly and eager to sell."
      `;
      
      const analysisResult = await analysisModel.generateContent(analysisPrompt);
      sellerAnalysis = analysisResult.response.text();
    }

    // --- AI CHAIN STEP B: GENERATE THE NEGOTIATION PLAN (USING THE ANALYSIS) ---

    const vibeInstructions: { [key: string]: string } = {
        Friendly: "You are a friendly but savvy negotiator. Your tone should be warm, collaborative, and build rapport. Use smiley faces and positive language.",
        Direct: "You are a direct, no-nonsense negotiator. Your goal is to get to the point quickly and efficiently. Your tone is firm, professional, but not rude. Be concise.",
        Analytical: "You are a detail-oriented, analytical negotiator. You rely on data and logic. Your tone is inquisitive and well-reasoned. Mention market facts and potential product flaws (e.g., battery health for phones) as leverage.",
    };

    // We now include the sellerAnalysis in our main prompt!
    const strategyPrompt = `
        You are an expert price negotiator. A user needs advice.

        **1. User's Chosen Vibe:** ${vibe}
        - Instructions for this Vibe: ${vibeInstructions[vibe]}

        **2. AI Analysis of the Seller:** ${sellerAnalysis}
        - IMPORTANT: Use this analysis to make your reasoning and scripts even more effective. If the seller is firm, your script should acknowledge that. If they seem friendly, match their tone.

        **3. Item Details:**
        - Item: "${itemName}", Category: "${category || 'N/A'}", Location: "${location}", Asking Price: ${price}

        **Your Task:** Generate a negotiation plan based on all the information above.
        **Output Format:** Respond with ONLY a single, valid JSON object. Do not include any text before or after the JSON.
        The JSON object must have this exact structure:
        {
          "priceRange": "a string with the recommended price range",
          "reasoning": "a string explaining the logic for the price range, fully adjusted for the user's vibe AND the seller's analyzed vibe",
          "scripts": [
            { "title": "Message 1 (Initial Offer)", "content": "The first negotiation message text, written in the selected vibe and considering the seller's vibe" },
            { "title": "Message 2 (Follow-up)", "content": "The second negotiation message text" },
            { "title": "Message 3 (Final Offer, if needed)", "content": "The third negotiation message text" }
          ]
        }
    `;

    const strategyModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await strategyModel.generateContent(strategyPrompt);
    const response = await result.response;
    const jsonText = response.text();

    return NextResponse.json({ data: JSON.parse(jsonText) });

  } catch (error) {
    console.error("Error in /api/negotiate:", error);
    return NextResponse.json({ error: 'Failed to get a response from the AI service.' }, { status: 500 });
  }
}
