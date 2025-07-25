// File: app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: Request) {
  try {
    // We expect a list of messages representing the conversation history
    const { messages } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // The new, conversational prompt. The AI's personality is set here.
    const systemPrompt = `You are "FairFare Co-pilot", a friendly and expert negotiation assistant in a chat window. 
- Your goal is to help the user get a fair price for an item they are buying or selling.
- Be conversational. Ask clarifying questions if needed (e.g., "What's the condition?", "Where is it located?").
- If you have enough information, provide a realistic price range and 1-2 sample negotiation messages.
- Keep your responses concise and easy to read in a chat format.`;
    
    // We combine the system prompt with the user's conversation history
    const fullPrompt = systemPrompt + "\n\nConversation History:\n" + messages.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');

    const result = await model.generateContent(fullPrompt);
    const aiMessage = result.response.text();

    return NextResponse.json({ message: aiMessage });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json({ error: 'Failed to get a response from the AI.' }, { status: 500 });
  }
}
