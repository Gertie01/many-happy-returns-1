'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Upload, Send, Image as ImageIcon, Loader2, Eraser } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function ChatInterface() {
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/generate',
    body: { apiKey },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => setAttachedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attachedImage) {
        // In a real multimodal AI SDK call, we'd include image in the request
        // Here we simulate the context for the model
        handleSubmit(e, {
            data: { image: attachedImage }
        });
        setAttachedImage(null);
    } else {
        handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] w-full max-w-4xl mx-auto glass-panel rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h1 className="font-bold text-xl flex items-center gap-2">
          <ImageIcon className="text-blue-400" /> Gemini 2.0 Flash Image Lab
        </h1>
        <input 
            type="password"
            placeholder="Enter Google API Key (Optional if Env set)"
            className="bg-black/40 border border-white/10 px-3 py-1 rounded text-xs w-64 focus:outline-none focus:border-blue-500 transition-all"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
            <ImageIcon size={48} className="mb-4" />
            <p>Start a conversation to generate or edit images.</p>
            <p className="text-sm italic">"A futuristic cyberpunk city in neon rain"</p>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-blue-600' : 'bg-zinc-800 border border-white/5 shadow-lg'}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 p-4 rounded-2xl animate-pulse flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          {/* Drag & Drop Slot */}
          <div 
            {...getRootProps()} 
            className={`relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer ${
                isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <input {...getInputProps()} />
            {attachedImage ? (
              <div className="flex items-center gap-4">
                <img src={attachedImage} className="h-12 w-12 object-cover rounded shadow-md" alt="preview" />
                <span className="text-sm text-zinc-300">Image ready for editing. Ask Gemini to change it.</span>
                <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setAttachedImage(null); }}
                    className="ml-auto p-1 bg-red-500/20 hover:bg-red-500/40 rounded"
                >
                    <Eraser size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-zinc-400">
                <Upload size={18} />
                <p className="text-sm">Drop image here for editing context</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Describe an image or ask for an edit..."
              className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !attachedImage)}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors rounded-lg px-6 py-3 font-medium flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              Generate
            </button>
          </div>
        </form>
        <p className="text-[10px] text-zinc-600 mt-3 text-center uppercase tracking-widest">
          Powered by Gemini 2.0 Flash • Infinite Generations • No Limits
        </p>
      </div>
    </div>
  );
}