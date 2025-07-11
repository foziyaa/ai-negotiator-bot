// File: app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Helper function to convert a Base64 string to the format Google's API needs
function base64ToGenerativePart(image: string, mimeType: string): Part {
  return {
    inlineData: {
      data: image.split(',')[1], // Remove the "data:image/jpeg;base64," part
      mimeType,
    },
  };
}

export async function POST(request: Request) {
  try {
    // THE FIX: We now expect `image` (the base64 string) instead of `fileUrl`.
    const { messages, image, mimeType } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const systemInstruction = {
      role: "system",
      parts: [{ text: `You are "FairFare Co-pilot", a friendly and expert negotiation assistant in a chat window. 
- If the user provides an image or audio, start by describing what you see or hear and comment on the item's apparent condition.
- Your primary goal is to help the user get a fair price.
- Be conversational. Ask clarifying questions if needed.
- Provide price ranges and sample negotiation messages when you have enough info.
- Keep responses concise and easy to read.`}]
    };

    const history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const lastUserMessage = messages[messages.length - 1];
    const userParts: Part[] = [{ text: lastUserMessage.content }];

    // THE FIX: We use the base64 `image` string to create an inlineData part.
    if (image && mimeType) {
      userParts.push(base64ToGenerativePart(image, mimeType));
    }

    const currentUserTurn = {
      role: 'user',
      parts: userParts,
    };
    
    const contents = [...history, currentUserTurn];

    const result = await model.generateContent({
      contents: contents,
      systemInstruction: systemInstruction,
    });

    const aiMessage = result.response.text();
    return NextResponse.json({ message: aiMessage });

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
