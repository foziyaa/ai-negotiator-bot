// File: app/api/analyze-vibe/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { sellerDesc } = await request.json();

    if (!sellerDesc || sellerDesc.trim().length < 20) {
      // Don't run on very short text
      return NextResponse.json({ analysis: null });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
      Analyze the following seller's item description to understand their personality and negotiation stance.
      Description: "${sellerDesc}"

      Respond with ONLY a single, valid JSON object with the following structure:
      {
        "vibe": "A short, descriptive vibe title (e.g., 'Friendly & Eager', 'Firm but Fair', 'Corporate & Professional', 'Low-Effort Seller')",
        "key_phrases": ["A list of 2-3 specific phrases from the text that support your analysis"],
        "strategy_tip": "A one-sentence tip for the user on how to approach this seller.",
        "emoji": "A single emoji that best represents this vibe (e.g., '🤝', '🧐', '🔥', '💼')"
      }
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // A simple regex to find the JSON part, in case the model adds extra text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return valid JSON for vibe analysis.");
    }
    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ analysis });

  } catch (error) {
    console.error("Error in vibe analysis API:", error);
    return NextResponse.json({ error: 'Failed to analyze vibe.' }, { status: 500 });
  }
}
