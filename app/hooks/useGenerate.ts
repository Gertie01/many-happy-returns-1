"use client";

import { useState } from "react";

export function useGenerate() {
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [images, setImages] = useState([]);

  async function generate({ prompt, image = null, history = [] }) {
    setLoading(true);
    setStreamedText("");
    setImages([]);

    const response = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, image, history }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // Parse SSE-style events
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data:")) {
          const json = JSON.parse(line.replace("data:", "").trim());

          // Streamed text
          if (json.type === "text-delta") {
            setStreamedText((t) => t + json.text);
          }

          // Final images
          if (json.type === "completion") {
            setImages(json.data.images || []);
          }
        }
      }
    }

    setLoading(false);
  }

  return { generate, loading, streamedText, images };
}
