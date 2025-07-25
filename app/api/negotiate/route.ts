// File: app/api/negotiate/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI(); 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemName, category, location, price } = body;

    // --- THE NEW "GATEKEEPER" PROMPT ---
    const prompt = `
      You are a two-stage AI assistant. Your FIRST and MOST IMPORTANT job is to validate user input. Your second job is to act as an expert negotiator.

      **Stage 1: Input Validation**
      Analyze the user's item. Does the "Item Name" seem like a real, tangible product? Or is it nonsensical gibberish (e.g., "asdfghjkl"), a random string of letters, or something that cannot be bought or sold?

      - **IF the input is invalid or nonsensical:**
        Your ONLY response MUST be a polite but firm rejection. Respond with the following exact message:
        "I'm sorry, I couldn't recognize that as a valid product. Please enter a real-world item like 'Used iPhone 11' or 'Toyota Yaris' for a negotiation analysis."

      - **IF the input appears to be a valid product:**
        Proceed to Stage 2.

      **Stage 2: Expert Negotiation Advice (Only run if Stage 1 passes)**
      Provide a concise and actionable negotiation plan based on the user's item.

      **User's Item:**
      - Item Name: "${itemName}"
      - Category (if provided): "${category}"
      - Location: "${location}"
      - Seller's Asking Price: ${price}

      **Your Three-Part Task:**
      1.  **Key Negotiation Points:** Provide 2-3 specific, bullet-pointed questions or checks the user MUST perform, tailored to the product type (e.g., for phones, ask about battery health; for cars, ask for service history).
      2.  **Recommended Price Range:** Suggest a realistic price range for this item in the given location.
      3.  **Negotiation Scripts:** Provide 2 polite, short, and effective messages the user can copy and paste for their negotiation.

      Structure your final response clearly with bold headings.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4, // Keep temperature low for consistency
    });

    const aiMessage = completion.choices[0].message.content;

    return NextResponse.json({ message: aiMessage });

  } catch (error) {
    console.error("Error in /api/negotiate:", error);
    return NextResponse.json({ message: 'The AI advisor is currently unavailable. Please try again later.' }, { status: 500 });
  }
}
