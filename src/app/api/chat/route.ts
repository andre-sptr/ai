import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ ERROR: API Key belum dipasang di .env.local");
      return new Response("API Key not found", { status: 500 });
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    console.log(`📩 Menerima pesan dari user: "${lastMessage.content}"`);

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages,
    });

    console.log("✅ Berhasil terhubung ke Google AI, mulai streaming...");
    
    return result.toTextStreamResponse();

  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);
    return new Response(JSON.stringify({ error: "Gagal memproses pesan" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}