// File: app/components/ChatInterface.tsx
"use client";

import { useState, FormEvent, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Define the structure for a single message in our chat
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// NEW: Helper function to convert a file to a Base64 string
const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export function ChatInterface() {
  const supabase = createClientComponentClient();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your FairFare Co-pilot. Tell me about the item you're negotiating, or upload a picture, audio, or short video!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // The 'uploading' state is no longer needed for this flow.
  // We will just use the general 'isLoading' state.

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartRecording = async () => { /* This function is correct and does not need changes */ 
    setFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        setFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Microphone access was denied.");
    }
  };

  const handleStopRecording = () => { /* This function is correct and does not need changes */
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    setIsLoading(true);

    let base64Image: string | null = null; // Changed from fileUrl
    let mimeType: string | null = null;

    // THE FIX: Convert file to Base64 instead of uploading to Supabase
    if (file) {
      mimeType = file.type;
      try {
        base64Image = await toBase64(file);
      } catch (error) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Error: Failed to read file." }]);
        setIsLoading(false);
        return;
      }
      setFile(null);
    }

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
          image: base64Image, // Sending the base64 string
          mimeType: mimeType,
        }),
      });

      if (!response.ok) { 
        const err = await response.json(); 
        throw new Error(err.error || "Something went wrong."); 
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, an error occurred: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // The JSX part with responsive classes
  return (
    <div className="flex flex-col h-[75vh] w-full bg-gray-800 rounded-lg shadow-2xl">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-2 rounded-lg text-white ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (<div className="flex justify-start"><div className="max-w-lg px-4 py-2 rounded-lg bg-gray-700 animate-pulse"><p>AI is thinking...</p></div></div>)}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        {isRecording && <div className="text-sm text-red-400 mb-2 animate-pulse">🔴 Recording audio...</div>}
        {file && (
          <div className="mb-2 p-2 bg-gray-700 rounded-md relative w-fit">
            <p className="text-xs text-gray-300">File attached: <span className="font-semibold">{file.name}</span></p>
            <button onClick={() => setFile(null)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">X</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="w-full sm:flex-1 order-2 sm:order-1">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe the item or ask..." className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500" disabled={isLoading || isRecording}/>
          </div>
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors disabled:opacity-50" title="Attach file" disabled={isRecording}>📎</button>
            <input type="file" ref={fileInputRef} onChange={(e) => { setFile(e.target.files ? e.target.files[0] : null); if(e.target) e.target.value = ''; }} className="hidden" accept="image/*,audio/*"/>
            {!isRecording ? (
              <button type="button" onClick={handleStartRecording} className="p-3 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors" title="Record Audio"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path d="M5.5 10.5a.5.5 0 01.5-.5h8a.5.5 0 010 1h-8a.5.5 0 01-.5-.5z" /><path d="M10 18a7 7 0 100-14 7 7 0 000 14zM10 3a1 1 0 100 2 1 1 0 000-2z" /></svg></button>
            ) : (
              <button type="button" onClick={handleStopRecording} className="p-3 bg-red-600 rounded-full hover:bg-red-500 animate-pulse" title="Stop Recording"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
            )}
            <button type="submit" disabled={isLoading || isRecording} className="flex-grow sm:flex-grow-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md disabled:bg-gray-500">Send</button>
          </div>
        </form>
      </div>
    </div>
  );
}
