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

    console.log("API KEY:", process.env.GOOGLE_GENERATIVE_AI_API_KEY);

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

// Await the files
const resolvedFiles = await result.files;
console.log("FILES:", resolvedFiles);

// Convert Gemini file objects into usable images (type‑safe)
const images = resolvedFiles
  .map((f: any) => {
    // CASE 1: Gemini 2.0 inlineData
    if (f.inlineData?.data && f.inlineData?.mimeType) {
      return {
        mimeType: f.inlineData.mimeType,
        data: f.inlineData.data,
      };
    }

    // CASE 2: fileUri (data:image/... base64)
    if (typeof f.fileUri === "string" && f.fileUri.startsWith("data:image/")) {
      const [header, base64] = f.fileUri.split(",");
      const mimeType = header.replace("data:", "").replace(";base64", "");
      return { mimeType, data: base64 };
    }

    // CASE 3: direct fields (some ai-sdk versions)
    if (f.data && f.mimeType?.startsWith("image/")) {
      return {
        mimeType: f.mimeType,
        data: f.data,
      };
    }

    return null;
  })
  .filter(Boolean);


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
