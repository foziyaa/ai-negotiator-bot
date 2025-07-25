// File: app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: Request) {
  try {
    // Now we expect fileUrl instead of base64 image data
    const { messages, fileUrl, mimeType } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const systemInstruction = {
      role: "system",
      parts: [{ text: `You are "FairFare Co-pilot"... (rest of your system prompt)` }]
    };

    const history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const lastUserMessage = messages[messages.length - 1];
    const userParts: Part[] = [{ text: lastUserMessage.content }];

    // --- THE KEY CHANGE IS HERE ---
    // If a file URL was sent, add it to the prompt parts using fileData
    if (fileUrl && mimeType) {
      userParts.push({
        fileData: {
          mimeType: mimeType,
          fileUri: fileUrl,
        },
      });
    }
    // --- END OF KEY CHANGE ---

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
