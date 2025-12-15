import { ToolDefinition } from './types'

// =============== TOOL DEFINITIONS ===============
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'calculator',
    description: 'Melakukan perhitungan matematika. Mendukung operasi: +, -, *, /, ^, sqrt, sin, cos, tan, log',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Ekspresi matematika yang akan dihitung, contoh: "2 + 2", "sqrt(16)", "sin(45)"'
        }
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
        timezone: {
          type: 'string',
          description: 'Timezone dalam format IANA, contoh: "Asia/Jakarta", "America/New_York", "UTC"',
        }
      },
      required: ['timezone']
    }
  },
  {
    name: 'generate_todo_list',
    description: 'Membuat daftar TODO yang terstruktur dari deskripsi proyek atau tugas',
    parameters: {
      type: 'object',
      properties: {
        project_description: {
          type: 'string',
          description: 'Deskripsi proyek atau tugas yang akan dibuatkan TODO list'
        },
        priority: {
          type: 'string',
          description: 'Tingkat prioritas: high, medium, atau low',
          enum: ['high', 'medium', 'low']
        }
      },
      required: ['project_description']
    }
  },
  {
    name: 'search_definition',
    description: 'Mencari definisi atau penjelasan dari suatu istilah',
    parameters: {
      type: 'object',
      properties: {
        term: {
          type: 'string',
          description: 'Istilah atau kata yang akan dicari definisinya'
        },
        language: {
          type: 'string',
          description: 'Bahasa untuk hasil pencarian: id (Indonesia) atau en (English)',
          enum: ['id', 'en']
        }
      },
      required: ['term']
    }
  }
]

// =============== TOOL EXECUTORS ===============
export async function executeCalculator(args: { expression: string }): Promise<any> {
  try {
    const expr = args.expression.toLowerCase()

    const safeEval = (expression: string): number => {
      let processed = expression
        .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
        .replace(/sin\(([^)]+)\)/g, 'Math.sin($1 * Math.PI / 180)')
        .replace(/cos\(([^)]+)\)/g, 'Math.cos($1 * Math.PI / 180)')
        .replace(/tan\(([^)]+)\)/g, 'Math.tan($1 * Math.PI / 180)')
        .replace(/log\(([^)]+)\)/g, 'Math.log10($1)')
        .replace(/\^/g, '**')
      
      if (!/^[0-9+\-*/.()^\s\w]+$/.test(processed)) {
        throw new Error('Invalid expression')
      }
      
      return Function('"use strict"; return (' + processed + ')')()
    }
    
    const result = safeEval(expr)
    
    return {
      success: true,
      expression: args.expression,
      result: result,
      formatted: `${args.expression} = ${result}`
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Gagal menghitung ekspresi',
      expression: args.expression
    }
  }
}

export async function executeGetCurrentTime(args: { timezone: string }): Promise<any> {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: args.timezone,
      dateStyle: 'full',
      timeStyle: 'long'
    })
    
    const formattedTime = formatter.format(now)
    
    return {
      success: true,
      timezone: args.timezone,
      datetime: formattedTime,
      timestamp: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000)
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Timezone tidak valid: ${args.timezone}`,
      available_timezones_example: [
        'Asia/Jakarta',
        'Asia/Singapore', 
        'America/New_York',
        'Europe/London',
        'UTC'
      ]
    }
  }
}

export async function executeGenerateTodoList(args: { 
  project_description: string
  priority?: string 
}): Promise<any> {
  try {
    const description = args.project_description
    const priority = args.priority || 'medium'
    const tasks: string[] = []
    
    if (description.toLowerCase().includes('website') || description.toLowerCase().includes('web')) {
      tasks.push('Setup project structure')
      tasks.push('Design UI/UX mockups')
      tasks.push('Implement frontend components')
      tasks.push('Setup backend API')
      tasks.push('Database integration')
      tasks.push('Testing & debugging')
      tasks.push('Deploy to production')
    } else if (description.toLowerCase().includes('app') || description.toLowerCase().includes('mobile')) {
      tasks.push('Define app requirements')
      tasks.push('Create wireframes')
      tasks.push('Setup development environment')
      tasks.push('Develop core features')
      tasks.push('Implement UI/UX')
      tasks.push('Testing on multiple devices')
      tasks.push('Publish to app store')
    } else {
      tasks.push('Analisis requirements')
      tasks.push('Planning & design')
      tasks.push('Implementation')
      tasks.push('Testing')
      tasks.push('Review & refinement')
      tasks.push('Documentation')
      tasks.push('Completion & delivery')
    }
    
    return {
      success: true,
      project: description,
      priority: priority,
      total_tasks: tasks.length,
      tasks: tasks.map((task, index) => ({
        id: index + 1,
        task: task,
        status: 'pending',
        priority: priority
      })),
      estimated_days: Math.ceil(tasks.length * 1.5)
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function executeSearchDefinition(args: { 
  term: string
  language?: string 
}): Promise<any> {
  try {
    const definitions: Record<string, { id: string, en: string }> = {
      'react': {
        id: 'Library JavaScript untuk membangun user interface yang interaktif dan component-based.',
        en: 'A JavaScript library for building interactive and component-based user interfaces.'
      },
      'typescript': {
        id: 'Superset dari JavaScript yang menambahkan static typing dan fitur modern lainnya.',
        en: 'A superset of JavaScript that adds static typing and other modern features.'
      },
      'nextjs': {
        id: 'Framework React untuk production yang menyediakan server-side rendering dan static site generation.',
        en: 'A React framework for production that provides server-side rendering and static site generation.'
      },
      'api': {
        id: 'Application Programming Interface - Antarmuka yang memungkinkan komunikasi antar aplikasi.',
        en: 'Application Programming Interface - An interface that enables communication between applications.'
      },
      'jsx': {
        id: 'JavaScript XML - Sintaks extension untuk JavaScript yang memungkinkan menulis HTML dalam React.',
        en: 'JavaScript XML - A syntax extension for JavaScript that allows writing HTML in React.'
      },
      'tailwind': {
        id: 'Framework CSS utility-first untuk membuat design modern dengan cepat.',
        en: 'A utility-first CSS framework for rapidly building modern designs.'
      },
      'gemini': {
        id: 'Model AI multimodal dari Google yang mampu memproses teks, gambar, audio, dan video.',
        en: 'A multimodal AI model from Google capable of processing text, images, audio, and video.'
      }
    }
    
    const term = args.term.toLowerCase()
    const lang = args.language || 'id'
    
    if (definitions[term]) {
      return {
        success: true,
        term: args.term,
        definition: lang === 'id' ? definitions[term].id : definitions[term].en,
        language: lang,
        source: 'Reka Knowledge Base'
      }
    } else {
      return {
        success: false,
        term: args.term,
        message: `Definisi untuk "${args.term}" tidak ditemukan dalam database lokal.`,
        suggestion: 'Coba gunakan istilah yang lebih umum atau tanyakan langsung kepada Reka.'
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// =============== MAIN EXECUTOR ===============
export async function executeTool(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'calculator':
      return executeCalculator(args)
    case 'get_current_time':
      return executeGetCurrentTime(args)
    case 'generate_todo_list':
      return executeGenerateTodoList(args)
    case 'search_definition':
      return executeSearchDefinition(args)
    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`
      }
  }
}