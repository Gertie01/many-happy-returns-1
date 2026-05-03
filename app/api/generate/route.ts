import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { prompt, history = [], image } = await req.json();

    const userContent: any[] = [];

    if (prompt) {
      userContent.push({ type: "text", text: prompt });
    }

    if (image) {
      const base64 = image.split(",")[1];
      userContent.push({
        type: "image",
        data: base64,
        mimeType: "image/png",
      });
    }

    const systemPrompt = `
You are a professional image generation and editing assistant using Gemini 2.0 Flash Experimental.
You may output text, image bytes, or both.
If the user provides an image, perform logical editing or transformation.
Always respond clearly and directly.
    `.trim();

    const result = await streamText({
      model: google("gemini-2.0-flash-exp"),
      providerOptions: {
        google: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      },
      system: systemPrompt,
      messages: [
        ...history,
        { role: "user", content: userContent },
      ],
      maxOutputTokens: 2000,
    });

    // IMPORTANT: result.files is a Promise — must await it
    const resolvedFiles = await result.files;

    const images = resolvedFiles
      .filter((f) => f.mimeType.startsWith("image/"))
      .map((f) => ({
        mimeType: f.mimeType,
        data: f.data,
      }));

    // Stream text, then send images after completion
    return result.toTextStreamResponse({
      async onCompletion() {
        return { images };
      },
    });

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || "Internal Server Error",
        success: false,
      }),
      { status: 500 }
    );
  }
}
