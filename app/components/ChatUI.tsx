"use client";

import { useState } from "react";
import { useGenerate } from "../hooks/useGenerate";

export default function ChatUI() {
  const [prompt, setPrompt] = useState("");
  const { streamedText, images, loading, generate } = useGenerate();

  async function handleSubmit(e) {
    e.preventDefault();
    await generate({ prompt });
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
          disabled={loading}
        >
          Go
        </button>
      </form>

      <div className="whitespace-pre-wrap text-gray-900 mb-4">
        {streamedText}
      </div>

      {images.length > 0 && (
        <div className="space-y-4">
          {images.map((img, i) => (
            <img
              key={i}
              src={`data:${img.mimeType};base64,${img.data}`}
              alt="Generated"
              className="rounded shadow"
            />
          ))}
        </div>
      )}
    </div>
  );
}
