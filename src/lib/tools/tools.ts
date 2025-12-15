import { ToolDefinition } from './types'

// =============== TOOL DEFINITIONS ===============
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'calculator',
    description: 'Melakukan perhitungan matematika. Mendukung operasi: +, -, *, /, ^, sqrt, sin, cos, tan, log',
    parameters: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'Ekspresi matematika' }
      },
      required: ['expression']
    }
  },
  {
    name: 'get_current_time',
    description: 'Mendapatkan waktu saat ini di timezone tertentu',
    parameters: {
      type: 'object',
      properties: {
        timezone: { type: 'string', description: 'Timezone (contoh: Asia/Jakarta)' }
      },
      required: ['timezone']
    }
  },
  {
    name: 'generate_todo_list',
    description: 'Membuat daftar TODO terstruktur',
    parameters: {
      type: 'object',
      properties: {
        project_description: {
          type: 'string',
          description: ''
        },
        priority: {
          type: 'string', enum: ['high', 'medium', 'low'],
          description: ''
        }
      },
      required: ['project_description']
    }
  },
  {
    name: 'search_definition',
    description: 'Mencari definisi istilah',
    parameters: {
      type: 'object',
      properties: {
        term: {
          type: 'string',
          description: ''
        },
        language: {
          type: 'string', enum: ['id', 'en'],
          description: ''
        }
      },
      required: ['term']
    }
  },
  {
    name: 'get_weather',
    description: 'Mendapatkan perkiraan cuaca untuk kota tertentu',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'Nama kota (contoh: Jakarta, Bandung)' }
      },
      required: ['city']
    }
  },
  {
    name: 'convert_currency',
    description: 'Konversi mata uang asing',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Jumlah uang' },
        from: { type: 'string', description: 'Kode mata uang asal (USD, IDR, EUR)' },
        to: { type: 'string', description: 'Kode mata uang tujuan (USD, IDR, EUR)' }
      },
      required: ['amount', 'from', 'to']
    }
  },
  {
    name: 'convert_unit',
    description: 'Konversi satuan (panjang, berat, suhu)',
    parameters: {
      type: 'object',
      properties: {
        value: { type: 'number', description: 'Nilai satuan' },
        from: { type: 'string', description: 'Satuan asal (cm, m, km, kg, lbs, c, f)' },
        to: { type: 'string', description: 'Satuan tujuan' }
      },
      required: ['value', 'from', 'to']
    }
  },
  {
    name: 'scrape_website',
    description: 'Mengambil teks konten dari sebuah URL website (Web Scraper)',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL website lengkap dengan https://' }
      },
      required: ['url']
    }
  },
  {
    name: 'analyze_data',
    description: 'Menganalisis data CSV atau JSON sederhana',
    parameters: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'Raw string data CSV atau JSON' },
        format: {
          type: 'string', enum: ['csv', 'json'],
          description: ''
        }
      },
      required: ['data', 'format']
    }
  },
  {
    name: 'generate_colors',
    description: 'Membuat palet warna hex codes',
    parameters: {
      type: 'object',
      properties: {
        base_color: { type: 'string', description: 'Warna dasar (opsional, nama atau hex)' },
        count: { type: 'number', description: 'Jumlah warna (default 5)' }
      },
      required: []
    }
  },
  {
    name: 'validate_email',
    description: 'Memvalidasi format dan domain email',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Alamat email yang akan dicek' }
      },
      required: ['email']
    }
  },
  {
    name: 'generate_password',
    description: 'Membuat password acak yang aman',
    parameters: {
      type: 'object',
      properties: {
        length: { type: 'number', description: 'Panjang password (default 12)' },
        use_symbols: {
          type: 'boolean',
          description: ''
        },
        use_numbers: {
          type: 'boolean',
          description: ''
        }
      },
      required: []
    }
  },
  {
    name: 'search_web',
    description: 'Mencari informasi terkini atau fakta spesifik di internet (Google Search)',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Kata kunci pencarian (query)' }
      },
      required: ['query']
    }
  },
]

// =============== TOOL EXECUTORS ===============

export async function executeCalculator(args: { expression: string }): Promise<any> {
  try {
    const expr = args.expression.toLowerCase()
      .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
      .replace(/sin\(([^)]+)\)/g, 'Math.sin($1 * Math.PI / 180)')
      .replace(/cos\(([^)]+)\)/g, 'Math.cos($1 * Math.PI / 180)')
      .replace(/tan\(([^)]+)\)/g, 'Math.tan($1 * Math.PI / 180)')
      .replace(/log\(([^)]+)\)/g, 'Math.log10($1)')
      .replace(/\^/g, '**')
    if (!/^[0-9+\-*/.()^\s\w]+$/.test(expr)) throw new Error('Invalid expression')
    const result = Function('"use strict"; return (' + expr + ')')()
    return { success: true, formatted: `${args.expression} = ${result}`, result }
  } catch (e: any) { return { success: false, error: e.message } }
}

export async function executeGetCurrentTime(args: { timezone: string }): Promise<any> {
  try {
    const now = new Date()
    const fmt = new Intl.DateTimeFormat('id-ID', { timeZone: args.timezone, dateStyle: 'full', timeStyle: 'long' })
    return { success: true, datetime: fmt.format(now), timezone: args.timezone }
  } catch (e) { return { success: false, error: 'Invalid timezone' } }
}

export async function executeGenerateTodoList(args: { project_description: string, priority?: string }): Promise<any> {
  return {
    success: true,
    tasks: [
      { id: 1, task: 'Analisis kebutuhan: ' + args.project_description, status: 'pending' },
      { id: 2, task: 'Desain arsitektur sistem', status: 'pending' },
      { id: 3, task: 'Implementasi fitur utama', status: 'pending' },
      { id: 4, task: 'Testing & QA', status: 'pending' }
    ],
    priority: args.priority || 'medium'
  }
}

export async function executeSearchDefinition(args: { term: string, language?: string }): Promise<any> {
  return {
    success: true,
    term: args.term,
    definition: `Definisi untuk ${args.term} (Simulasi database lokal). Dalam konteks pemrograman, ini biasanya merujuk pada konsep teknis spesifik.`
  }
}

export async function executeGetWeather(args: { city: string }): Promise<any> {
  const conditions = ['Cerah ☀️', 'Berawan ☁️', 'Hujan Ringan 🌦️', 'Hujan Petir ⛈️']
  const randomCond = conditions[Math.floor(Math.random() * conditions.length)]
  const randomTemp = Math.floor(Math.random() * (34 - 24) + 24)
  
  return {
    success: true,
    city: args.city,
    condition: randomCond,
    temperature: `${randomTemp}°C`,
    humidity: `${Math.floor(Math.random() * 40 + 50)}%`,
    wind: `${Math.floor(Math.random() * 20 + 5)} km/h`,
    formatted: `Cuaca di ${args.city}: ${randomCond}, Suhu ${randomTemp}°C`
  }
}

export async function executeCurrencyConverter(args: { amount: number, from: string, to: string }): Promise<any> {
  const rates: Record<string, number> = {
    'USD': 1, 'IDR': 15800, 'EUR': 0.92, 'SGD': 1.35, 'JPY': 150
  }
  
  const fromRate = rates[args.from.toUpperCase()]
  const toRate = rates[args.to.toUpperCase()]

  if (!fromRate || !toRate) {
    return { success: false, error: 'Mata uang tidak didukung. Coba USD, IDR, EUR, SGD, JPY.' }
  }

  const result = (args.amount / fromRate) * toRate
  
  return {
    success: true,
    amount: args.amount,
    from: args.from.toUpperCase(),
    to: args.to.toUpperCase(),
    result: result.toFixed(2),
    formatted: `${args.amount} ${args.from.toUpperCase()} = ${result.toLocaleString('id-ID')} ${args.to.toUpperCase()}`
  }
}

export async function executeUnitConverter(args: { value: number, from: string, to: string }): Promise<any> {
  const v = args.value
  let res = 0
  let formula = ''

  const f = args.from.toLowerCase()
  const t = args.to.toLowerCase()

  if (f === 'cm' && t === 'inch') { res = v / 2.54; formula = '/ 2.54' }
  else if (f === 'inch' && t === 'cm') { res = v * 2.54; formula = '* 2.54' }
  else if (f === 'kg' && t === 'lbs') { res = v * 2.20462; formula = '* 2.20462' }
  else if (f === 'lbs' && t === 'kg') { res = v / 2.20462; formula = '/ 2.20462' }
  else if (f === 'c' && t === 'f') { res = (v * 9/5) + 32; formula = '(x * 9/5) + 32' }
  else if (f === 'f' && t === 'c') { res = (v - 32) * 5/9; formula = '(x - 32) * 5/9' }
  else {
    return { success: false, error: 'Konversi satuan tidak didukung. Coba: cm-inch, kg-lbs, c-f' }
  }

  return {
    success: true,
    from: f, to: t, original: v, result: res.toFixed(2), formula
  }
}

export async function executeWebScraper(args: { url: string }): Promise<any> {
  try {
    const response = await fetch(args.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RekaAI/1.0)' }
    })
    
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
    
    const html = await response.text()
    
    const textContent = html
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000)

    return {
      success: true,
      url: args.url,
      preview: textContent + '...',
      length: html.length
    }
  } catch (e: any) {
    return { success: false, error: `Gagal scrape: ${e.message}` }
  }
}

export async function executeDataAnalyzer(args: { data: string, format: 'csv' | 'json' }): Promise<any> {
  try {
    let result: any = {}
    
    if (args.format === 'json') {
      const json = JSON.parse(args.data)
      const isArray = Array.isArray(json)
      result = {
        type: 'json',
        is_array: isArray,
        count: isArray ? json.length : Object.keys(json).length,
        keys: isArray && json.length > 0 ? Object.keys(json[0]) : Object.keys(json)
      }
    } else {
      const rows = args.data.trim().split('\n')
      const headers = rows[0].split(',')
      result = {
        type: 'csv',
        rows: rows.length,
        columns: headers.length,
        headers: headers
      }
    }

    return { success: true, analysis: result }
  } catch (e: any) {
    return { success: false, error: 'Data invalid' }
  }
}

export async function executeColorGenerator(args: { count?: number }): Promise<any> {
  const count = args.count || 5
  const colors = []
  
  for (let i = 0; i < count; i++) {
    colors.push('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'))
  }

  return {
    success: true,
    colors: colors,
    formatted: `Palet Warna: ${colors.join(', ')}`
  }
}

export async function executeEmailValidator(args: { email: string }): Promise<any> {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = regex.test(args.email)
  
  return {
    success: true,
    email: args.email,
    is_valid: isValid,
    domain: isValid ? args.email.split('@')[1] : null
  }
}

export async function executePasswordGenerator(args: { length?: number, use_symbols?: boolean, use_numbers?: boolean }): Promise<any> {
  const len = args.length || 12
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const nums = '0123456789'
  const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  let validChars = chars
  if (args.use_numbers !== false) validChars += nums
  if (args.use_symbols !== false) validChars += syms
  
  let pass = ''
  for (let i = 0; i < len; i++) {
    pass += validChars.charAt(Math.floor(Math.random() * validChars.length))
  }
  
  return { success: true, password: pass, length: len }
}

export async function executeSearchWeb(args: { query: string }): Promise<any> {
  try {
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return { success: false, error: 'Server Error: TAVILY_API_KEY is missing.' }
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: args.query,
        search_depth: "basic",
        include_answer: true, 
        max_results: 5
      })
    })

    if (!response.ok) {
      throw new Error(`Tavily API Error: ${response.statusText}`)
    }

    const data = await response.json()
    
    const context = data.results.map((item: any) => 
      `- [${item.title}](${item.url}): ${item.content}`
    ).join('\n\n')

    return {
      success: true,
      query: args.query,
      answer: data.answer, 
      context: context  
    }
  } catch (e: any) {
    console.error("Search Error:", e)
    return { success: false, error: `Gagal mencari: ${e.message}` }
  }
}

// =============== MAIN EXECUTOR ===============
export async function executeTool(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'calculator': return executeCalculator(args)
    case 'get_current_time': return executeGetCurrentTime(args)
    case 'generate_todo_list': return executeGenerateTodoList(args)
    case 'search_definition': return executeSearchDefinition(args)
    case 'get_weather': return executeGetWeather(args)
    case 'convert_currency': return executeCurrencyConverter(args)
    case 'convert_unit': return executeUnitConverter(args)
    case 'scrape_website': return executeWebScraper(args)
    case 'analyze_data': return executeDataAnalyzer(args)
    case 'generate_colors': return executeColorGenerator(args)
    case 'validate_email': return executeEmailValidator(args)
    case 'generate_password': return executePasswordGenerator(args)
    case 'search_web': return executeSearchWeb(args)
    
    default:
      return { success: false, error: `Unknown tool: ${toolName}` }
  }
}