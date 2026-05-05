"use client";

import { useState } from "react";
import { useGenerate } from "../hooks/useGenerate";

export default function ChatUI() {
  const [prompt, setPrompt] = useState("");
  const { messages, isLoading, generate } = useGenerate();

  async function handleSubmit(e) {
    e.preventDefault();
    await generate({ prompt });
    setPrompt(""); // clear input
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          className="flex-1 border p-2 rounded"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Gemini to generate or edit an image"
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={isLoading}
        >
          Go
        </button>
      </form>

      {/* Chat messages */}
      <div className="space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className="border-b pb-4">
            {/* Text */}
            {msg.text && (
              <div className="whitespace-pre-wrap text-gray-900 mb-2">
                {msg.text}
              </div>
            )}

            {/* Images */}
            {msg.images?.length > 0 && (
              <div className="space-y-4">
                {msg.images.map((img, j) => (
                  <img
                    key={j}
                    src={img.dataUrl}
                    alt="Generated"
                    className="rounded shadow"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
