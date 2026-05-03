import { NextResponse } from 'next/server';
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { prompt, history = [], image } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API Key missing" }),
        { status: 500 }
      );
    }

    // Build multimodal user content
    const userContent: any[] = [];

    if (prompt) {
      userContent.push({
        type: "text",
        text: prompt,
      });
    }

    if (image) {
      const base64 = image.split(",")[1];
      userContent.push({
        type: "image",
        data: base64,
        mimeType: "image/png",
      });
    }

    // System behavior
    const systemPrompt = `
You are a professional image generation and editing assistant using Gemini 2.0 Flash Experimental.
You may output text, image bytes, or both.
If the user provides an image, perform logical editing or transformation.
Always respond clearly and directly.
    `.trim();

    // Stream response (TEXT + IMAGE)
    const result = await streamText({
      model: google("gemini-2.0-flash-exp"),
      providerOptions: {
        google: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      },
      system: systemPrompt,
      messages: [
        ...history.map((h: any) => ({
          role: h.role,
          content: h.content,
        })),
        {
          role: "user",
          content: userContent,
        },
      ],
      maxOutputTokens: 2000,
    });

    return result.toTextStreamResponse();

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
