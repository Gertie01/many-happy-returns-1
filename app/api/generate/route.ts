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
      messages: [...history, { role: "user", content: userContent }],
      maxOutputTokens: 2000,
    });

    // Resolve files
    const resolvedFiles = await result.files;

    // Normalize all possible Gemini file formats
    const images = resolvedFiles
      .map((f: any) => {
        // inlineData (Gemini 2.0)
        if (f.inlineData?.data && f.inlineData?.mimeType) {
          return {
            mimeType: f.inlineData.mimeType,
            data: f.inlineData.data,
          };
        }

        // fileUri (data:image/... base64)
        if (typeof f.fileUri === "string" && f.fileUri.startsWith("data:image/")) {
          const [header, base64] = f.fileUri.split(",");
          const mimeType = header.replace("data:", "").replace(";base64", "");
          return { mimeType, data: base64 };
        }

        // direct fields (some ai-sdk versions)
        if (f.data && f.mimeType?.startsWith("image/")) {
          return {
            mimeType: f.mimeType,
            data: f.data,
          };
        }

        return null;
      })
      .filter(Boolean);

    // Merge streamed text + final JSON
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    result.toTextStream().pipeTo(
      new WritableStream({
        write(chunk) {
          writer.write(chunk);
        },
        async close() {
          writer.write("\n" + JSON.stringify({ images }));
          writer.close();
        },
      })
    );

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
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
