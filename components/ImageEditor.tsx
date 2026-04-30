'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Send, Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageEditor() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [response, setResponse] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt && !image) return;

    setLoading(true);
    try {
      const t = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          image,
          history
        })
      });

      const data = await t.json();
      
      if (data.success) {
        setResponse(data.text);
        setHistory(prev => [...prev, 
          { role: 'user', content: prompt || 'Modified Image' },
          { role: 'assistant', content: data.text }
        ]);
        setPrompt('');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Failed to generate:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setImage(null);
    setHistory([]);
    setResponse('');
    setPrompt('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div 
          {...getRootProps()} 
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[400px] ${
            isDragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50'
          }`}
        >
          <input {...getInputProps()} />
          
          <AnimatePresence mode="wait">
            {image ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full h-full flex justify-center"
              >
                <img src={image} alt="Upload" className="max-h-[350px] object-contain rounded-lg shadow-2xl" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setImage(null); }}
                  className="absolute top-2 right-2 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 bg-neutral-800 rounded-full inline-block">
                  <Upload className="text-neutral-400" />
                </div>
                <div>
                  <p className="text-lg font-medium">Drag image here</p>
                  <p className="text-neutral-500 text-sm">or click to browse from device</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe changes or generate something new..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[120px] resize-none"
          />
          <button
            disabled={loading || (!prompt && !image)}
            className="absolute bottom-4 right-4 p-3 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>

      <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
            <ImageIcon size={16} />
            Generation Output
          </h2>
          <button onClick={clearAll} className="text-xs text-neutral-500 hover:text-white flex items-center gap-1">
            <RefreshCcw size={12} />
            Reset Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-neutral-800">
          {history.length === 0 && !loading && (
            <div className="h-full flex items-center justify-center text-neutral-600 italic text-center px-8">
              Enter a prompt or upload an image to start the Gemini 2.0 iterative cycle.
            </div>
          )}
          
          {history.map((msg, i) => (
            <div key={i} className={`p-4 rounded-xl ${msg.role === 'user' ? 'bg-neutral-800/50 ml-8 text-neutral-300' : 'bg-emerald-500/5 border border-emerald-500/10 mr-8 text-white'}`}>
              <p className="text-xs font-bold mb-1 opacity-50 uppercase">{msg.role}</p>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-emerald-500 animate-pulse">
              <Loader2 className="animate-spin" size={16} />
              <span>Gemini 2.0 is processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}