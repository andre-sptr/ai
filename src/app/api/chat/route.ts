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

    const formattedMessages = messages.map((m: any) => {
      if (m.role === 'user' && m.imageUrl) {
        return {
          role: 'user',
          content: [
            { type: 'text', text: m.content },
            { type: 'image', image: m.imageUrl }
          ]
        };
      }
      return {
        role: m.role,
        content: m.content
      };
    });

    const lastMessage = messages[messages.length - 1];
    console.log(`📩 Menerima pesan dari user: "${lastMessage.content}"`);

    const result = streamText({
      model: google('gemini-2.5-flash'), 
      messages: formattedMessages,
      system: "Kamu adalah asisten coding yang ahli dan bisa melihat gambar. Jawablah dengan ringkas.",
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