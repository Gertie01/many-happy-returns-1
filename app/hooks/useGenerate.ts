import { useState } from "react";

export function useGenerate() {
  const [streamedText, setStreamedText] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function generate({ prompt, image }) {
    setStreamedText("");
    setImages([]);
    setLoading(true);

    const response = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, image }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      setStreamedText((prev) => prev + chunk);
      buffer += chunk;
    }

    try {
      const jsonStart = buffer.lastIndexOf("{");
      const jsonString = buffer.slice(jsonStart);
      const finalPayload = JSON.parse(jsonString);

      if (finalPayload.images) {
        setImages(finalPayload.images);
      }
    } catch (err) {
      console.warn("No final JSON payload found", err);
    }

    setLoading(false);
  }

  return { streamedText, images, loading, generate };
}
