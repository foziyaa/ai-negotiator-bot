// File: app/components/ChatInterface.tsx
"use client";

import { useState, FormEvent, useEffect, useRef } from 'react';

// Define the structure for a single message in our chat
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Helper function to convert a file to a Base64 string
const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};


export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your FairFare Co-pilot. Tell me about the item you're negotiating, or upload a picture!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // NEW: State to hold the selected image file
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref to trigger the file input

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !imageFile) return;

    const userMessageContent = input.trim() || (imageFile ? `What do you think of this ${imageFile.name}?` : "");
    const userMessage: Message = { role: 'user', content: userMessageContent };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let base64Image: string | null = null;
    let mimeType: string | null = null;

    if (imageFile) {
      base64Image = await toBase64(imageFile);
      mimeType = imageFile.type;
      setImageFile(null); // Clear image after processing
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage], // Send history
          image: base64Image, // Send the image data
          mimeType: mimeType, // Send the image type
        }),
      });

      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "Something went wrong."); }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      const errorMessage: Message = { role: 'assistant', content: `Sorry, an error occurred: ${error.message}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] w-full bg-gray-800 rounded-lg shadow-2xl">
      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg px-4 py-2 rounded-lg text-white ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && ( <div className="flex justify-start"><div className="max-w-lg px-4 py-2 rounded-lg bg-gray-700 animate-pulse"><p>Thinking...</p></div></div> )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t border-gray-700">
        {/* NEW: Image Preview */}
        {imageFile && (
          <div className="mb-2 p-2 bg-gray-700 rounded-md relative w-fit">
            <img src={URL.createObjectURL(imageFile)} alt="preview" className="h-20 w-20 object-cover rounded"/>
            <button onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">X</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          {/* NEW: File Upload Button */}
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors" title="Attach Image">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
            className="hidden"
            accept="image/*" // Accept only images
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the item or ask a question..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md disabled:bg-gray-500">Send</button>
        </form>
      </div>
    </div>
  );
}
