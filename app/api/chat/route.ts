// File: app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// This uses the exact same setup as your other API route.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Helper function to convert a Base64 string to the format Google's API needs
function base64ToGenerativePart(image: string, mimeType: string) {
  return {
    inlineData: {
      data: image.split(',')[1], // Remove the "data:image/jpeg;base64," part
      mimeType,
    },
  };
}

export async function POST(request: Request) {
  try {
    const { messages, image, mimeType } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // The system prompt sets the AI's personality.
    const systemPrompt = `You are "FairFare Co-pilot", a friendly and expert negotiation assistant in a chat window. 
- If the user provides an image, start by describing what you see and comment on the item's apparent condition.
- Your primary goal is to help the user get a fair price.
- Be conversational. Ask clarifying questions if needed.
- Provide price ranges and sample negotiation messages when you have enough info.
- Keep responses concise and easy to read.`;

    // We build the prompt "parts" for the Gemini API.
    const lastUserMessage = messages[messages.length - 1];
    const promptParts = [
      // The instruction for the AI
      `${systemPrompt}\n\n## Conversation History:\n${messages.slice(0, -1).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}\n\n## Current User Message:\nuser: ${lastUserMessage.content}`,
    ];

    // If an image was sent, add it to the prompt parts!
    if (image && mimeType) {
      const imagePart = base64ToGenerativePart(image, mimeType);
      promptParts.push(imagePart as any);
    }
    
    const result = await model.generateContent({ contents: [{ role: 'user', parts: promptParts }] });
    const aiMessage = result.response.text();

    return NextResponse.json({ message: aiMessage });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
