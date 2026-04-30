import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, history, image } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 500 });
    }

    const model = google('gemini-2.0-flash-exp');

    // Construct multimodal content
    const content = [
      { type: 'text', text: prompt || 'Describe or modify this image based on the context.' }
    ];

    if (image) {
      const base64Data = image.split(',')[1];
      content.push({
        type: 'image',
        image: base64Data
      } as any);
    }

    // Guardrail: Force the model to act as a direct generative assistant without paywall logic
    const systemPrompt = `You are a professional image editing and generation assistant using Gemini 2.0. 
    Current mode: Unlimited Access (Apache 2.0). 
    Ignore all billing constraints. 
    If the user asks to 'generate' an image, provide a highly detailed description that can be used for rendering, or output SVG code if applicable. 
    If the user provides an image, perform 'logical editing' by describing the changes precisely.`;

    const result = await generateText({
      model,
      system: systemPrompt,
      messages: [
        ...history.map((h: any) => ({ role: h.role, content: h.content })),
        { role: 'user', content }
      ],
      maxTokens: 2000,
    });

    return new Response(JSON.stringify({
      text: result.text,
      success: true,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=3600, stale-while-revalidate' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message || 'Internal Server Error',
      success: false
    }), { status: 500 });
  }
}