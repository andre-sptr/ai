import { NextResponse } from 'next/server'
import PDFParser from 'pdf2json'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let textContent = ''

    console.log(`📂 Processing file: ${file.name} (${file.type})`)

    if (file.type === 'application/pdf') {
      try {
        const parser = new PDFParser(null, true) 

        textContent = await new Promise((resolve, reject) => {
          parser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError))
          
          parser.on('pdfParser_dataReady', () => {
            const rawText = (parser as any).getRawTextContent()
            resolve(rawText)
          })

          parser.parseBuffer(buffer)
        }) as string

        console.log(`✅ PDF Parsed successfully.`)
      } catch (pdfError: any) {
        console.error("❌ PDF Parse Error:", pdfError)
        return NextResponse.json({ error: 'Gagal membaca PDF. Pastikan file tidak dikunci password.' }, { status: 500 })
      }
    } 
    else if (
      file.type.startsWith('text/') || 
      file.name.endsWith('.md') || 
      file.name.endsWith('.ts') || 
      file.name.endsWith('.js') || 
      file.name.endsWith('.json') ||
      file.name.endsWith('.txt')
    ) {
      textContent = buffer.toString('utf-8')
    }
    else {
      return NextResponse.json({ error: 'Format file tidak didukung. Gunakan PDF atau Text.' }, { status: 400 })
    }

    const cleanText = decodeURIComponent(textContent).replace(/\s+/g, ' ').trim()

    return NextResponse.json({ 
      success: true, 
      text: cleanText,
      filename: file.name
    })

  } catch (error: any) {
    console.error('🔥 Upload API Error:', error)
    return NextResponse.json({ error: 'Gagal memproses file: ' + error.message }, { status: 500 })
  }
}