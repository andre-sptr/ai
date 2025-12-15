import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText, experimental_generateImage as generateImage } from 'ai'
import { executeTool } from '@/lib/tools/tools'

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

TOOLS YANG TERSEDIA (Ketika tools mode aktif):
Kamu bisa menggunakan tools berikut dengan format JSON:

1. **Calculator** - Untuk perhitungan matematika
   Format: {"tool": "calculator", "expression": "2 + 2"}
   
2. **Get Current Time** - Untuk waktu di timezone tertentu
   Format: {"tool": "get_current_time", "timezone": "Asia/Jakarta"}
   
3. **Generate TODO** - Untuk membuat daftar tugas
   Format: {"tool": "generate_todo_list", "project_description": "...", "priority": "medium"}
   
4. **Search Definition** - Untuk mencari definisi
   Format: {"tool": "search_definition", "term": "react", "language": "id"}

CARA MENGGUNAKAN TOOLS:
- Jika user bertanya sesuatu yang memerlukan tool, GUNAKAN tool tersebut
- Tulis JSON tool call di awal responsenya
- Jelaskan hasil tool dengan bahasa natural
- Contoh: 
  User: "Hitung 25 * 4 + sqrt(81)"
  You: {"tool": "calculator", "expression": "25 * 4 + sqrt(81)"}
       
       Setelah saya menghitung, hasilnya adalah 109.

PANDUAN MENJAWAB:
1. **Gaya Kode:** Tulis kode yang bersih, modern, dan efisien. Gunakan TypeScript.
2. **Styling:** Selalu gunakan Tailwind CSS untuk styling.
3. **Icons:** Gunakan 'lucide-react' untuk ikon jika diperlukan.
4. **Fitur Preview:** HTML murni untuk preview, bukan JSX.

Jawablah dengan ringkas dan fokus pada solusi kode.
`;

const SYSTEM_PROMPT_NO_TOOLS = `
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
2. **Styling:** Selalu gunakan Tailwind CSS untuk styling.
3. **Icons:** Gunakan 'lucide-react' untuk ikon jika diperlukan.
4. **Fitur Preview:** HTML murni untuk preview, bukan JSX.

Jawablah dengan ringkas dan fokus pada solusi kode.
`;

function parseToolCalls(text: string): { toolCalls: any[], cleanText: string } {
  const toolCalls: any[] = []
  let cleanText = text

  const jsonRegex = /\{"tool":\s*"([^"]+)"[^}]*\}/g
  let match

  while ((match = jsonRegex.exec(text)) !== null) {
    try {
      const jsonStr = match[0]
      const toolCall = JSON.parse(jsonStr)
      
      if (toolCall.tool) {
        toolCalls.push({
          id: `tool_${Date.now()}_${toolCalls.length}`,
          name: toolCall.tool,
          arguments: { ...toolCall }
        })
        
        cleanText = cleanText.replace(jsonStr, '').trim()
      }
    } catch (e) {
    }
  }

  return { toolCalls, cleanText }
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ ERROR: API Key belum dipasang di .env.local");
      return new Response("API Key not found", { status: 500 });
    }

    const { messages, model, useTools } = await req.json();
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

    // ============= TOOLS MODE =============
    if (useTools) {
      try {
        const result = await generateText({
          model: google(selectedModel),
          messages: formattedMessages,
          system: SYSTEM_PROMPT,
        })

        const responseText = result.text || ''
        const { toolCalls, cleanText } = parseToolCalls(responseText)

        if (toolCalls.length > 0) {
          const toolResults = await Promise.all(
            toolCalls.map(async (tc: any) => {
              const { tool, ...args } = tc.arguments
              const result = await executeTool(tc.name, args)
              return {
                toolCallId: tc.id,
                toolName: tc.name,
                result
              }
            })
          )

          return new Response(JSON.stringify({
            text: cleanText || '🔧 Menggunakan tools...',
            toolCalls,
            toolResults
          }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({
          text: responseText
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('Tools error:', error)
        return new Response(JSON.stringify({
          text: 'Maaf, terjadi kesalahan saat menggunakan tools. Silakan coba lagi atau matikan tools.',
          error: String(error)
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        })
      }
    }

    // ============= STREAMING MODE (No Tools) =============
    const result = streamText({
      model: google(selectedModel),
      messages: formattedMessages,
      system: SYSTEM_PROMPT_NO_TOOLS,
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