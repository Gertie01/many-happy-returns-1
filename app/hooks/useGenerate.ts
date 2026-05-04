import { useState, useCallback } from "react";

export function useGenerate() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const generate = useCallback(async ({ prompt, image, history }) => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt, image, history }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate response");
      }

      // Stream text response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }

      // Parse final JSON block containing images
      const lastJsonStart = text.lastIndexOf("{");
      const json = JSON.parse(text.slice(lastJsonStart));

      const images = json.images?.map((img) => ({
        mimeType: img.mimeType,
        dataUrl: `data:${img.mimeType};base64,${img.data}`,
      })) || [];

      // Add message to UI
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text,
          images,
        },
      ]);

      return { text, images };
    } catch (err) {
      console.error("Generation error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    generate,
  };
}
