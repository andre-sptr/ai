import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText, experimental_generateImage as generateImage } from 'ai'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 30;

const SYSTEM_PROMPT = `
Kamu adalah "Reka", Asisten Coding AI yang canggih dan ahli dalam:
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- TypeScript

IDENTITAS & GAYA:
1. **Nama:** Perkenalkan dirimu sebagai "Reka" jika ditanya.
2. **Filosofi:** Nama "Reka" berarti "rekayasa" atau merancang. Tugasmu adalah membantu pengguna merancang kode menjadi kenyataan visual.
3. **Gaya Bicara:** Profesional, to the point, namun ramah dan suportif (seperti senior developer).

PANDUAN MENJAWAB:
1. **Gaya Kode:** Tulis kode yang bersih, modern, dan efisien. Gunakan TypeScript.
2. **Styling:** Selalu gunakan Tailwind CSS untuk styling. Jangan gunakan CSS module atau style tag manual kecuali diminta.
3. **Icons:** Gunakan 'lucide-react' untuk ikon jika diperlukan.
4. **Fitur Preview (PENTING):** - Jika user meminta untuk "membuat desain", "membuat UI", atau "meniru gambar" yang bersifat visual, berikan output dalam format **HTML MURNI** (bukan JSX/React Component) dengan class Tailwind lengkap.
   - Alasannya: Aplikasi ini memiliki fitur "Live Preview" yang hanya bisa merender HTML statis.
   - Contoh: Jangan berikan \`export default function Card()...\`, tapi berikan \`<div class="bg-white...">...</div>\`.
5. **React Components:**
   - Jika user secara spesifik meminta Component React/Next.js (bukan sekadar tampilan UI), berikan kode JSX/TSX.
   - Jangan lupa tambahkan directive 'use client' di baris paling atas jika komponen menggunakan hooks (useState, useEffect, dll).
6. **Analisis Gambar:** Kamu memiliki kemampuan melihat gambar. Jika user mengupload screenshot UI, analisislah struktur layout, warna, dan tipografi.

Jawablah dengan ringkas dan fokus pada solusi kode.
`;

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ ERROR: API Key belum dipasang di .env.local");
      return new Response("API Key not found", { status: 500 });
    }

    const { messages, model } = await req.json();
    const selectedModel = model || 'gemini-2.5-flash';

    if (selectedModel.startsWith('imagen-')) {
      const lastUser = [...messages].reverse().find((m: any) => m.role === 'user')
      const prompt = (lastUser?.content || '').trim() || 'Generate an image.'

      const { image } = await generateImage({
        model: google.image(selectedModel),
        prompt,
        aspectRatio: '1:1',
      })

      const imageUrl = `data:${image.mediaType};base64,${image.base64}`

      return new Response(JSON.stringify({ text: '', imageUrl }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const isGeminiImageModel =
      selectedModel === 'gemini-2.5-flash-image' ||
      selectedModel === 'gemini-3-pro-image-preview'

    if (isGeminiImageModel) {
      const lastUser = [...messages].reverse().find((m: any) => m.role === 'user')
      const prompt = (lastUser?.content || '').trim() || 'Generate an image.'

      const result = await generateText({
        model: google(selectedModel),
        prompt,
        providerOptions: {
          google: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio: '1:1' },
          },
        },
      })

      const imgFile = result.files?.find(f => f.mediaType?.startsWith('image/'))
      if (!imgFile) {
        return new Response(JSON.stringify({ text: result.text ?? '', imageUrl: null }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const base64 = Buffer.from(imgFile.uint8Array).toString('base64')
      const imageUrl = `data:${imgFile.mediaType};base64,${base64}`

      return new Response(JSON.stringify({ text: result.text ?? '', imageUrl }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (selectedModel.startsWith('veo-')) {
      const lastUser = [...messages].reverse().find((m: any) => m.role === 'user')
      const prompt = (lastUser?.content || '').trim() || 'Generate a short video.'
      const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
      const startRes = await fetch(
        `${baseUrl}/models/${selectedModel}:predictLongRunning`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              aspectRatio: '16:9',
            },
          }),
        }
      )

      if (!startRes.ok) {
        const errText = await startRes.text()
        return new Response(errText, {
          status: startRes.status,
          headers: { 'Content-Type': startRes.headers.get('content-type') || 'application/json' },
        })
      }

      const startJson = await startRes.json()
      return new Response(
        JSON.stringify({
          text: '🎬 Oke, aku sedang membuat videonya…',
          videoOp: startJson.name,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const formattedMessages = messages.map((m: any) => {
      if (m.role === 'user' && m.imageUrl) {
        return {
          role: 'user',
          content: [
            { type: 'text', text: m.content },
            { type: 'image', image: m.imageUrl },
          ],
        }
      }
      return { role: m.role, content: m.content }
    })

    const result = streamText({
      model: google(selectedModel),
      messages: formattedMessages,
      system: SYSTEM_PROMPT,
    })
    
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);
    return new Response(JSON.stringify({ error: "Gagal memproses pesan" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}