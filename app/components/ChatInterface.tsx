// File: app/components/ChatInterface.tsx
"use client";

import { useState, FormEvent, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Import Supabase client

// Define the structure for a single message in our chat
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatInterface() {
  const supabase = createClientComponentClient(); // Initialize Supabase client
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your FairFare Co-pilot. Tell me about the item, or upload a picture, audio, or short video!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  // NEW: State for tracking upload progress
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    let fileUrl: string | null = null;
    let mimeType: string | null = null;
    
    setIsLoading(true);

    // --- NEW: UPLOAD LOGIC ---
    if (file) {
      setUploading(true); // Show the uploading indicator
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Error: You must be logged in to upload files." }]);
        setIsLoading(false);
        return;
      }
      
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      mimeType = file.type;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Storage Error: ${error.message}` }]);
        setIsLoading(false);
        setUploading(false);
        return;
      }

      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);
      
      fileUrl = publicUrl;
      setFile(null); // Clear the file after successful upload
      setUploading(false);
    }
    // --- END OF UPLOAD LOGIC ---

    const userMessageContent = input.trim() || `What do you think of this file?`;
    const userMessage: Message = { role: 'user', content: userMessageContent };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          // Send the URL instead of the file data
          fileUrl: fileUrl, 
          mimeType: mimeType,
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Messages rendering is the same */}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg px-4 py-2 rounded-lg text-white ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && !uploading && (<div className="flex justify-start"><div className="max-w-lg px-4 py-2 rounded-lg bg-gray-700 animate-pulse"><p>AI is thinking...</p></div></div>)}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700">
        {/* NEW: File Preview and Uploading state */}
        {uploading && <div className="text-sm text-yellow-400 mb-2 animate-pulse">Uploading file... please wait.</div>}
        {file && !uploading && (
          <div className="mb-2 p-2 bg-gray-700 rounded-md relative w-fit">
            <p className="text-xs text-gray-300">File attached: <span className="font-semibold">{file.name}</span></p>
            <button onClick={() => setFile(null)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">X</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          {/* UPGRADED: File Upload Button */}
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors" title="Attach file">
            📎 {/* Paperclip Icon */}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
            className="hidden"
            // Accept images, audio, and video
            accept="image/*,audio/*,video/*" 
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
