'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Send, Loader2, Image as ImageIcon, Sparkles, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt && !uploadedImage) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: prompt, imageUrl: uploadedImage || undefined };
    setHistory(prev => [...prev, userMsg]);
    setLoading(true);
    setPrompt('');

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMsg.content,
          imageData: userMsg.imageUrl,
          history: history.slice(-5).map(m => ({ role: m.role, text: m.content }))
        })
      });

      const data = await res.json();
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.description || "Image generated successfully.",
        imageUrl: data.generated_image_url
      };

      setHistory(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Generation failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-500 w-8 h-8 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight uppercase">Gemini 2.0 Flash Lite Editor</h1>
        </div>
        <div className="flex gap-4 text-xs font-mono text-gray-500">
          <span>FREE UNLIMITED GENERATIONS</span>
          <span className="text-green-500">● ACTIVE</span>
        </div>
      </header>

      <div className="w-full max-w-5xl flex flex-col gap-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
          
          {/* LEFT: Input and Controls */}
          <div className="flex flex-col gap-4">
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={cn(
                "relative h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300",
                isDragging ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5",
                uploadedImage && "border-none overflow-hidden"
              )}
            >
              {uploadedImage ? (
                <>
                  <img src={uploadedImage} alt="Upload" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 p-2 bg-black/60 rounded-full hover:bg-black transition"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-center p-6">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-400">Drag & drop image to edit or click to upload</p>
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Gemini to generate or edit anything..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
              <button
                disabled={loading || (!prompt && !uploadedImage)}
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> GENERATE</>}
              </button>
            </form>
          </div>

          {/* RIGHT: Feed / Output */}
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[80vh] pr-4 scrollbar-thin scrollbar-thumb-white/10">
            <AnimatePresence mode='popLayout'>
              {history.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p>No activity yet. Try generating a landscape!</p>
                </div>
              )}
              {history.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-2xl glass-panel",
                    msg.role === 'user' ? "ml-12 border-blue-500/20" : "mr-12 border-white/10 bg-white/[0.02]"
                  )}
                >
                  <p className="text-xs font-mono text-gray-400 mb-2 uppercase">{msg.role}</p>
                  <p className="text-sm mb-4">{msg.content}</p>
                  {msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden shadow-2xl">
                      <img src={msg.imageUrl} alt="Content" className="w-full h-auto object-cover" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-2xl bg-white/5 animate-pulse"
                >
                    <div className="h-4 w-24 bg-white/10 rounded mb-4"></div>
                    <div className="h-64 w-full bg-white/10 rounded-xl"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <footer className="mt-auto pt-12 pb-4 text-[10px] text-gray-600 tracking-widest">
        POWERED BY GEMINI 2.0 FLASH LITE • NO LIMITS • APACHE 2.0
      </footer>
    </main>
  );
}