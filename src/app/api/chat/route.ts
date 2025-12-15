import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText, experimental_generateImage as generateImage } from 'ai'
import { executeTool } from '@/lib/tools/tools'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 30;

const SYSTEM_PROMPT = `
PERAN & IDENTITAS:
Kamu adalah "Reka", Asisten Coding AI Senior yang ahli dalam:
- Html
- Python
- C/C++
- PHP
- TypeScript
- Tailwind CSS

GAYA KOMUNIKASI:
- Profesional, to-the-point, namun ramah.
- Fokus pada solusi kode yang bersih (clean code) dan modern.
- Jangan bertele-tele.

⚠️ ATURAN KRUSIAL PENGGUNAAN TOOLS (WAJIB PATUH) ⚠️:

1. **JANGAN MENEBAK** data real-time, hitungan, atau konten web. WAJIB GUNAKAN TOOL.
2. **FORMAT JSON:** Outputkan JSON di baris pertama.
3. **HASIL TOOL ADALAH FAKTA MUTLAK.** Jangan ubah angka/hasil dari tool.

DAFTAR TOOLS (FORMAT JSON):

1. **Calculator**: {"tool": "calculator", "expression": "25 * 4"}
2. **Time**: {"tool": "get_current_time", "timezone": "Asia/Jakarta"}
3. **Todo**: {"tool": "generate_todo_list", "project_description": "..."}
4. **Definisi**: {"tool": "search_definition", "term": "react"}-
5. **Cuaca**: {"tool": "get_weather", "city": "Bandung"}
6. **Kurs**: {"tool": "convert_currency", "amount": 100, "from": "USD", "to": "IDR"}
7. **Unit**: {"tool": "convert_unit", "value": 10, "from": "cm", "to": "inch"} (Support: cm, inch, kg, lbs, c, f)
8. **Scraper**: {"tool": "scrape_website", "url": "https://example.com"}
9. **Analisis Data**: {"tool": "analyze_data", "data": "...", "format": "json"} (Format data harus raw string)
10. **Warna**: {"tool": "generate_colors", "count": 5}
11. **Cek Email**: {"tool": "validate_email", "email": "test@example.com"}
12. **Password**: {"tool": "generate_password", "length": 16, "use_symbols": true}

CONTOH INTERAKSI YANG BENAR (TIU):
User: "Jam berapa di London?"
You: {"tool": "get_current_time", "timezone": "Europe/London"}

(System memberikan hasil tool...)

User: "Hitung 50 pangkat 2"
You: {"tool": "calculator", "expression": "50^2"}

User: "Apa itu Python?"
You: {"tool": "search_definition", "term": "python", "language": "id"}

User: "Buatkan password aman 12 karakter"
You: {"tool": "generate_password", "length": 12, "use_symbols": true}

User: "Berapa 100 USD ke IDR?"
You: {"tool": "convert_currency", "amount": 100, "from": "USD", "to": "IDR"}

User: "Apa isi web google.com?"
You: {"tool": "scrape_website", "url": "https://google.com"}

PANDUAN KODE:
- Gunakan Tailwind CSS v4 untuk styling.
- Gunakan lucide-react untuk ikon.
- Tulis kode dalam blok \`\`\`tsx atau \`\`\`typescript.

INSTRUKSI:
Fokus pada request terakhir user. Jika user minta sesuatu yang bisa diselesaikan dengan tool di atas, LANGSUNG panggil toolnya.
`;

const SYSTEM_PROMPT_NO_TOOLS = `
Kamu adalah "Reka", Asisten Coding AI Senior.
Spesialisasi: Html, Python, C/C++, PHP, TypeScript, Tailwind CSS.

Tugasmu membantu user menulis kode. Berikan jawaban yang ringkas, tepat, dan menggunakan praktik terbaik (best practices).
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
      console.error("Error parsing tool JSON:", e)
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

    const isGeminiImageModel = selectedModel === 'gemini-2.5-flash-image' || selectedModel === 'gemini-3-pro-image-preview'
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
        return new Response(JSON.stringify({ text: result.text ?? '', imageUrl: null }), { headers: { 'Content-Type': 'application/json' } })
      }
      const base64 = Buffer.from(imgFile.uint8Array).toString('base64')
      const imageUrl = `data:${imgFile.mediaType};base64,${base64}`
      return new Response(JSON.stringify({ text: result.text ?? '', imageUrl }), { headers: { 'Content-Type': 'application/json' } })
    }

    if (selectedModel.startsWith('veo-')) {
      const lastUser = [...messages].reverse().find((m: any) => m.role === 'user')
      const prompt = (lastUser?.content || '').trim() || 'Generate a short video.'
      const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
      const startRes = await fetch(`${baseUrl}/models/${selectedModel}:predictLongRunning`, {
        method: 'POST',
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [{ prompt }], parameters: { aspectRatio: '16:9' } }),
      })
      if (!startRes.ok) {
        const errText = await startRes.text()
        return new Response(errText, { status: startRes.status, headers: { 'Content-Type': startRes.headers.get('content-type') || 'application/json' } })
      }
      const startJson = await startRes.json()
      return new Response(JSON.stringify({ text: '🎬 Oke, aku sedang membuat videonya…', videoOp: startJson.name }), { headers: { 'Content-Type': 'application/json' } })
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

      if (m.role === 'tool') {
        return {
          role: 'user', 
          content: `[Tool Result for ${m.toolName || 'unknown'}]: ${JSON.stringify(m.result)}`
        }
      }

      return { role: m.role, content: m.content }
    })

    if (useTools && formattedMessages.length > 0) {
      const lastMsgIndex = formattedMessages.length - 1
      const lastMsg = formattedMessages[lastMsgIndex]
      
      if (lastMsg.role === 'user' && typeof lastMsg.content === 'string') {
        lastMsg.content += `\n\n(SYSTEM NOTE: Jika pertanyaan ini butuh data realtime/hitungan, JANGAN MENJAWAB LANGSUNG. Gunakan JSON tool yang sesuai terlebih dahulu.)`
      }
    }

    if (useTools && formattedMessages.length > 0) {
      const lastMsgIndex = formattedMessages.length - 1
      const lastMsg = formattedMessages[lastMsgIndex]
      
      if (lastMsg.role === 'user' && typeof lastMsg.content === 'string') {
        lastMsg.content += `\n\n(SYSTEM NOTE: Jika pertanyaan ini butuh data realtime/hitungan, JANGAN MENJAWAB LANGSUNG. Gunakan JSON tool yang sesuai terlebih dahulu.)`
      }
    }

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