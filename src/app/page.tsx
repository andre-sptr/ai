'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Download, Sun, Moon, Sparkles, Zap, ArrowRight, User, Trash2, Check, Copy, RotateCw, Image as ImageIcon, X, Pencil, XCircle, Volume2, StopCircle, ChevronDown, Paperclip } from 'lucide-react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import mermaid from 'mermaid'

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  videoOp?: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: any;
  }>;
  toolCallId?: string;
  toolName?: string;
  result?: any;
}

const extractCodeText = (children: any): string => {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractCodeText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractCodeText(children.props.children)
  }
  return ''
}

const PreviewFrame = ({ code }: { code: string }) => {
  const isDark = document.documentElement.classList.contains('dark')
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { color: white; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
        </style>
      </head>
      <body class="p-4">
        ${code}
      </body>
    </html>
  `
  return (
    <iframe
      srcDoc={srcDoc}
      title="Preview"
      className="w-full h-full min-h-[400px] bg-white/5 rounded-b-lg"
      sandbox="allow-scripts"
    />
  )
}

const CodeBlock = ({ children, className, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false)
  const [view, setView] = useState<'code' | 'preview'>('code')
  const preRef = useRef<HTMLPreElement>(null)
  const codeContent = extractCodeText(children).replace(/\n$/, '')
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  const isPreviewable = ['html', 'xml', 'jsx', 'tsx'].includes(language)
  const isDark = document.documentElement.classList.contains('dark')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Gagal menyalin:', err)
    }
  }

  return (
    <div className="relative group my-6 rounded-xl overflow-hidden border border-slate-700 bg-[#0d1117] shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        {isPreviewable ? (
          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
            <button
              onClick={() => setView('code')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                view === 'code' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setView('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                view === 'preview' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Preview
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
            {language || 'text'}
          </span>
        )}

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-xs"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{isCopied ? 'Disalin' : 'Salin'}</span>
        </button>
      </div>

      <div className="relative">
        {view === 'code' ? (
          <pre ref={preRef} {...props} className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
            {children}
          </pre>
        ) : (
          <PreviewFrame code={codeContent} />
        )}
      </div>
    </div>
  )
}

const MermaidBlock = ({ 
  code, 
  theme, 
  onExpand 
}: { 
  code: string; 
  theme: 'light' | 'dark';
  onExpand: (svgContent: string) => void; 
}) => {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(false)
  const id = useRef(`mermaid-${Math.random().toString(36).slice(2)}`).current

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    })

    const renderChart = async () => {
      try {
        const { svg } = await mermaid.render(id, code)
        setSvg(svg)
        setError(false)
      } catch (err) {
        console.error('Mermaid Error:', err)
        setError(true)
      }
    }

    renderChart()
  }, [code, theme, id])

  if (error) {
    return (
      <div className="p-4 my-4 border border-red-500/50 bg-red-500/10 rounded-lg text-red-400 text-xs font-mono">
        Gagal merender diagram. Syntax mungkin tidak valid.
      </div>
    )
  }

  if (!svg) return <div className="animate-pulse h-32 bg-slate-800/20 rounded-xl my-4" />

  return (
    <div 
      className="relative group my-4 cursor-zoom-in transition-all"
      onClick={() => onExpand(svg)}
    >
      <div className={`p-4 rounded-xl overflow-hidden max-h-[300px] relative ${
        theme === 'dark' ? 'bg-slate-900/50 border border-white/10' : 'bg-white border border-slate-200'
      }`}>
        <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />
        
        <div className={`absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t ${
           theme === 'dark' ? 'from-slate-900 via-slate-900/50' : 'from-white via-white/50'
        } to-transparent pointer-events-none`} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px] rounded-xl">
        <span className="px-4 py-2 rounded-full bg-slate-900/90 text-white text-xs font-medium border border-white/20 shadow-xl flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Klik untuk memperbesar
        </span>
      </div>
    </div>
  )
}

const ToolCallDisplay = ({ toolCalls, theme }: { 
  toolCalls: Array<{ id: string; name: string; arguments: any }>;
  theme: 'light' | 'dark';
}) => {
  const isDark = theme === 'dark'
  
  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'calculator': return '🧮'
      case 'get_current_time': return '🕐'
      case 'generate_todo_list': return '📋'
      case 'search_definition': return '📖'
      default: return '🔧'
    }
  }

  const getToolDisplayName = (toolName: string) => {
    return toolName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="my-3 space-y-2">
      {toolCalls.map((call, index) => (
        <motion.div 
          key={call.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            isDark 
              ? 'bg-cyan-950/20 border-cyan-500/30 shadow-lg shadow-cyan-500/5' 
              : 'bg-cyan-50 border-cyan-300 shadow-sm'
          }`}
        >
          <span className="text-2xl">{getToolIcon(call.name)}</span>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-2 ${
              isDark ? 'text-cyan-400' : 'text-cyan-700'
            }`}>
              <Zap className="w-3.5 h-3.5" />
              {getToolDisplayName(call.name)}
            </div>
            <div className={`text-xs ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <div className="flex flex-wrap gap-2">
                {Object.entries(call.arguments).map(([key, value]) => (
                  <div key={key} className={`px-2 py-1 rounded ${
                    isDark ? 'bg-slate-800/50' : 'bg-white'
                  }`}>
                    <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>
                      {key}:
                    </span>
                    {' '}
                    <span className={`font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                      {typeof value === 'string' ? `"${value}"` : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

const ToolResultDisplay = ({ toolName, result, theme }: {
  toolName: string;
  result: any;
  theme: 'light' | 'dark';
}) => {
  const isDark = theme === 'dark'
  const isSuccess = result.success !== false

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'calculator': return '🧮'
      case 'get_current_time': return '🕐'
      case 'generate_todo_list': return '📋'
      case 'search_definition': return '📖'
      default: return '🔧'
    }
  }

  const getToolDisplayName = (toolName: string) => {
    return toolName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatResult = (result: any) => {
    if (result.formatted) return result.formatted
    if (result.datetime) return result.datetime
    if (result.definition) return result.definition
    if (result.tasks) {
      return result.tasks.map((t: any, i: number) => 
        `${i + 1}. ${t.task}`
      ).join('\n')
    }
    return JSON.stringify(result, null, 2)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`my-3 p-4 rounded-lg border ${
        isSuccess 
          ? isDark 
            ? 'bg-green-950/20 border-green-500/30 shadow-lg shadow-green-500/5' 
            : 'bg-green-50 border-green-300 shadow-sm'
          : isDark
            ? 'bg-red-950/20 border-red-500/30 shadow-lg shadow-red-500/5'
            : 'bg-red-50 border-red-300 shadow-sm'
      }`}
    >
      <div className={`flex items-center gap-2 mb-3 ${
        isSuccess 
          ? isDark ? 'text-green-400' : 'text-green-700'
          : isDark ? 'text-red-400' : 'text-red-700'
      }`}>
        <span className="text-xl">{getToolIcon(toolName)}</span>
        <span className="text-sm font-semibold">
          {isSuccess ? '✓' : '✗'} {getToolDisplayName(toolName)}
        </span>
      </div>

      <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        {isSuccess ? (
          <div className="space-y-2">
            {result.formatted && (
              <div className={`font-mono text-base p-3 rounded ${
                isDark ? 'bg-slate-800/50' : 'bg-white'
              }`}>
                {result.formatted}
              </div>
            )}
            
            {result.datetime && (
              <div className={`p-3 rounded ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
                <div className="text-xs text-slate-500 mb-1">📍 {result.timezone}</div>
                <div className="font-medium">{result.datetime}</div>
              </div>
            )}

            {result.definition && (
              <div className={`p-3 rounded ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
                <div className="text-xs text-slate-500 mb-1">📖 {result.term}</div>
                <div>{result.definition}</div>
              </div>
            )}

            {result.answer && (
              <div className={`p-3 rounded ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
                <div className="text-xs text-slate-500 mb-2 font-semibold flex items-center gap-1">
                  🔍 Rangkuman Pencarian:
                </div>
                <div className="leading-relaxed">{result.answer}</div>
                
                <div className="mt-3 pt-2 border-t border-slate-600/20 text-xs text-slate-500">
                  Sumber: Tavily Search API
                </div>
              </div>
            )}

            {result.tasks && (
              <div className={`p-3 rounded ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
                <div className="text-xs text-slate-500 mb-2">
                  📋 {result.total_tasks} tasks • {result.priority} priority • ~{result.estimated_days} days
                </div>
                <ol className="space-y-1.5 ml-4">
                  {result.tasks.map((task: any, i: number) => (
                    <li key={i} className="text-sm">
                      {task.task}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {!result.formatted && !result.datetime &&  !result.definition &&  !result.tasks &&  !result.answer && !result.colors && !result.analysis &&
             (
              <pre className={`text-xs font-mono overflow-x-auto p-3 rounded ${
                isDark ? 'bg-slate-800/50' : 'bg-white'
              }`}>
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <div className={`p-3 rounded ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
            <div className="font-medium mb-1">Error:</div>
            <div className="text-sm opacity-90">{result.error}</div>
            {result.suggestion && (
              <div className="text-xs mt-2 opacity-75">💡 {result.suggestion}</div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

const ZoomableMedia = ({ children }: { children: React.ReactNode }) => {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation()
    const delta = e.deltaY * -0.001
    const newScale = Math.min(Math.max(0.5, scale + delta), 5)
    setScale(newScale)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#0d1117]/50 rounded-xl">
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-xl">
        <button onClick={() => setScale(s => Math.min(s + 0.5, 5))} className="p-2 hover:bg-white/10 rounded text-white" title="Zoom In">
          <ChevronDown className="w-5 h-5 rotate-180" />
        </button>
        <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded text-white font-mono text-xs" title="Reset">
          {Math.round(scale * 100)}%
        </button>
        <button onClick={() => setScale(s => Math.max(s - 0.5, 0.5))} className="p-2 hover:bg-white/10 rounded text-white" title="Zoom Out">
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      <div
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="w-full h-full flex items-center justify-center"
      >
        {children}
      </div>
    </div>
  )
}

export default function Home() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [useTools, setUseTools] = useState(false)
  const [docContext, setDocContext] = useState<{ name: string; content: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition()
  const docInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  type LightboxState =
  | { kind: 'image' | 'video'; src: string; filename: string }
  | { kind: 'mermaid'; content: string; filename: string }
  | null

  const [lightbox, setLightbox] = useState<LightboxState>(null)

  useEffect(() => {
    if (!lightbox) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }

    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [lightbox])

  useEffect(() => {
    if (transcript) {
      setInput(prev => (prev ? `${prev} ${transcript}` : transcript))
      setTranscript('')
    }
  }, [transcript, setTranscript])

  const models = [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Reasoning & Agentic Paling Canggih' },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro (Image)', desc: 'Generasi Gambar & Teks High-Fidelity' },

    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Reasoning Kompleks & Coding' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Cepat & Cerdas (Recommended)' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', desc: 'Ringan & Hemat Biaya' },
    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash (Image)', desc: 'Pembuatan & Edit Aset Visual' },

    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Versi Stabil Sebelumnya' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', desc: 'Efisien untuk Tugas Sederhana' },

    { id: 'gemini-flash-latest', name: 'Gemini Flash', desc: 'Versi Flash Paling Baru' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash-Lite', desc: 'Versi Lite Paling Baru' },

    { id: 'imagen-4.0-fast-generate-001', name: 'Imagen 4.0 Fast (Image)', desc: 'Generasi Gambar Cepat' },
    { id: 'imagen-4.0-generate-001', name: 'Imagen 4.0 (Image)', desc: 'Generasi Gambar Kualitas Tinggi' },
    { id: 'imagen-4.0-ultra-generate-001', name: 'Imagen 4.0 Ultra (Image)', desc: 'Detail Gambar Ultra Realistis' },
    { id: 'veo-2.0-generate-001', name: 'Veo 2.0 (Video)', desc: 'Generasi Video Sinematik' },

    { id: 'gemini-robotics-er-1.5-preview', name: 'Gemini Robotics 1.5', desc: 'Model Eksperimental Robotika' },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  const handleClearChat = () => {
    window.speechSynthesis.cancel()
    setSpeakingId(null)
    setMessages([])
    setInput('')
    setSelectedImage(null)
    setEditingIndex(null)
  }

  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Browser Anda tidak mendukung fitur suara.")
      return
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel()
      setSpeakingId(null)
      return
    }

    window.speechSynthesis.cancel()

    const cleanText = text
      .replace(/```[\s\S]*?```/g, "Kode program.") 
      .replace(/[#*`_]/g, "") 

    const utterance = new SpeechSynthesisUtterance(cleanText)
    
    utterance.lang = 'id-ID' 
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onend = () => setSpeakingId(null)
    utterance.onerror = () => setSpeakingId(null)

    setSpeakingId(id)
    window.speechSynthesis.speak(utterance)
  }

  const handleCopyContent = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
    } catch (err) {
      console.error("Gagal menyalin pesan:", err)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Mohon pilih file gambar.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
  }

  const handleEditMessage = (index: number) => {
    if (isLoading) return

    const msgToEdit = messages[index]
    
    setInput(msgToEdit.content)
    if (msgToEdit.imageUrl) {
        setSelectedImage(msgToEdit.imageUrl)
    }

    setEditingIndex(index)
    setTimeout(() => {
        textareaRef.current?.focus()
    }, 100)
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setInput('')
    setSelectedImage(null)
  }

  const pollVideo = async (op: string, assistantId: string) => {
    while (true) {
      await new Promise(r => setTimeout(r, 10000))

      const r = await fetch(`/api/video/status?op=${encodeURIComponent(op)}`)
      const j = await r.json()

      if (!j.done) continue

      if (j.videoUrl) {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
          ? {
              ...m,
              videoUrl: j.videoUrl,
              videoOp: undefined,
              content: '🎬 Video sudah selesai dibuat',
            }
          : m
        ))
      } else {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: (m.content || '') + '\n\n❌ Gagal membuat video.', videoOp: undefined }
            : m
        ))
      }
      break
    }
  }

  const handleDocSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)

      setDocContext({
        name: data.filename,
        content: data.text
      })
      
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsUploading(false)
      if (docInputRef.current) docInputRef.current.value = ''
    }
  }

  const handleRemoveDoc = () => {
    setDocContext(null)
  }

  const generateResponse = async (currentMessages: Message[]) => {
    setIsLoading(true)
    window.speechSynthesis.cancel()
    setSpeakingId(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages,
          model: selectedModel,
          useTools: useTools,
        }),
      })

      if (!response.ok) {
        const ct = response.headers.get('content-type') || ''
        let errMsg = `Error ${response.status}`

        try {
          if (ct.includes('application/json')) {
            const j = await response.json()
            errMsg = j?.text || j?.error?.message || j?.message || errMsg
          } else {
            errMsg = await response.text()
          }
        } catch {}

        setMessages(prev => [
          ...prev,
          { id: (Date.now()+1).toString(), role: 'assistant', content: `❌ ${errMsg}` },
        ])

        return
      }

      const contentType = response.headers.get('content-type') || ''
      const assistantId = (Date.now() + 1).toString()

      // ============= HANDLE JSON RESPONSE (Tools or Special) =============
      if (contentType.includes('application/json')) {
        const data = await response.json()

        if (data.toolCalls && data.toolCalls.length > 0) {
          const assistantMsg: Message = {
            id: assistantId,
            role: 'assistant',
            content: data.text || '🔧 Menggunakan tools...',
            toolCalls: data.toolCalls
          }

          setMessages(prev => [...prev, assistantMsg])

          if (data.toolResults && data.toolResults.length > 0) {
            setTimeout(() => {
              setMessages(prev => {
                const newMessages = [...prev]
                
                data.toolResults.forEach((tr: any) => {
                  newMessages.push({
                    id: `${Date.now()}-${tr.toolCallId}`,
                    role: 'tool',
                    content: '',
                    toolCallId: tr.toolCallId,
                    toolName: tr.toolName,
                    result: tr.result
                  })
                })

                return newMessages
              })
            }, 300)
          }

          return
        }

        setMessages(prev => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: data.text ?? '',
            imageUrl: data.imageUrl,
            videoUrl: data.videoUrl,
            videoOp: data.videoOp,
          },
        ])

        if (data.videoOp) {
          pollVideo(data.videoOp, assistantId)
        }
        return
      }

      // ============= HANDLE STREAMING RESPONSE (No Tools) =============
      let assistantContent = ''

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          assistantContent += text

          setMessages(prev => {
            const updated = [...prev]
            const lastMsg = updated[updated.length - 1]
            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = assistantContent
            }
            return updated
          })
        }
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan saat menghubungi AI.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if ((!input.trim() && !selectedImage && !docContext) || isLoading || isUploading) return

    const userText = input
    const currentImage = selectedImage
    const currentDoc = docContext
    
    setInput('')
    setSelectedImage(null)
    setDocContext(null)

    let finalContent = userText

    if (currentDoc) {
      finalContent = `[KONTEKS DOKUMEN: ${currentDoc.name}]\n${currentDoc.content}\n\n[PERTANYAAN USER]:\n${userText}`
    }
    
    const newMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: finalContent,
      imageUrl: currentImage || undefined
    }

    let newHistory: Message[] = []

    if (editingIndex !== null) {
      newHistory = [
        ...messages.slice(0, editingIndex),
        newMessage
      ]
      setEditingIndex(null)
    } else {
      newHistory = [
        ...messages,
        newMessage
      ]
    }

    setMessages(newHistory)
    await generateResponse(newHistory)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleRegenerate = async () => {
    if (isLoading || messages.length === 0) return

    let newHistory = [...messages]
    const lastMsg = newHistory[newHistory.length - 1]

    if (lastMsg.role === 'assistant') {
       newHistory.pop() 
    }
    
    setMessages(newHistory)
    await generateResponse(newHistory)
  }

  const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf('user')
  const isDark = theme === 'dark'

  return (
    <main className={`relative h-screen overflow-hidden selection:bg-cyan-500/30 font-sans flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-800'}`}>
      
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <div className={`absolute inset-0 ${isDark ? 'bg-grid-white' : 'bg-grid-black'} bg-[size:50px_50px]`} />
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/80' : 'bg-gradient-to-t from-slate-200 via-slate-200/50 to-slate-200/80'}`} />
      </div>

      <header className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 border-b shadow-sm transition-colors duration-300 
        ${isDark ? 'bg-slate-950/80 backdrop-blur-md border-white/5' : 'bg-slate-200/80 backdrop-blur-md border-slate-300'}`}
      >
        
        <div className="flex items-center gap-3">
          <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
          <span className={`font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500`}>
            Reka AI
          </span>
        </div>

        <div className="flex items-center gap-3">
            <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors 
                  ${isDark 
                    ? 'text-cyan-400 hover:bg-slate-800' 
                    : 'text-slate-600 hover:bg-slate-200'
                  }`}
                title={isDark ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
            >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <label className={`flex items-center gap-1 text-xs cursor-pointer px-3 py-1.5 rounded-full border transition-all ${
              useTools 
                ? isDark 
                  ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-400' 
                  : 'bg-cyan-100 border-cyan-500 text-cyan-700'
                : isDark
                  ? 'bg-slate-900 border-white/10 hover:border-cyan-500/50 text-slate-300'
                  : 'bg-white border-slate-300 hover:border-cyan-500/50 text-slate-700'
            }`}>
              <input
                type="checkbox"
                checked={useTools}
                onChange={(e) => setUseTools(e.target.checked)}
                className="w-3.5 h-3.5 rounded"
              />
              <Zap className="w-3.5 h-3.5" />
              <span>Tools</span>
            </label>
            
            <div className="relative">
                <button
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs sm:text-sm
                        ${isDark 
                          ? 'bg-slate-900 border-white/10 hover:border-cyan-500/50 text-slate-300' 
                          : 'bg-white border-slate-300 hover:border-cyan-500/50 text-slate-700'
                        }`}
                >
                    <span className="truncate max-w-[150px]">
                      {models.find(m => m.id === selectedModel)?.name}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showModelDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowModelDropdown(false)}
                    />
                    
                    <div className={`absolute right-0 top-full mt-2 w-72 backdrop-blur-xl border rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col 
                      ${isDark 
                        ? 'bg-slate-900/95 border-white/10' 
                        : 'bg-white/95 border-slate-300'
                      }`}
                    >
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-300/50 bg-slate-100'}`}>
                        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                          Pilih Model AI
                        </span>
                      </div>

                      <div className="p-1.5 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
                        {models.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id)
                              setShowModelDropdown(false)
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex flex-col gap-0.5 group ${
                              selectedModel === model.id 
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm' 
                                : isDark 
                                  ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`font-medium truncate ${selectedModel === model.id ? 'text-cyan-300' : isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-900 group-hover:text-slate-900'}`}>
                                {model.name}
                              </span>
                              {selectedModel === model.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                            </div>
                            <span className={`text-xs opacity-70 line-clamp-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{model.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
            </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-24 pb-40">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="inline-flex items-center justify-center px-3 py-1 mb-4 border border-cyan-500/30 rounded-full bg-cyan-950/30 backdrop-blur-sm">
                <Zap className="w-3 h-3 text-cyan-400 mr-2" />
                <span className="text-xs font-medium text-cyan-300 tracking-wide uppercase">Realtime</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                  Reka AI
                </span>
              </h1>
              <p className="text-slate-400 text-lg">
                Mulai percakapan dengan Reka. Ubah ide menjadi kode secara realtime.
                {useTools && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="block mt-3 text-sm font-medium text-cyan-400 bg-cyan-950/30 border border-cyan-500/20 py-2 px-4 rounded-lg backdrop-blur-md"
                  >
                    ⚡ <strong className="text-cyan-300">Active Tools:</strong> Calculator, Time, Weather, Currency, Unit Converter, Scraper, Data Analysis, Colors, Email Validator, Password Generator, Diagram, Flowchart, Web Search 🌐
                  </motion.span>
                )}
              </p>
            </motion.div>
          )}

          <AnimatePresence mode='popLayout'>
            {messages.map((msg, index) => {
              if (msg.role === 'tool') return null

              let displayContent = msg.content
              let attachedDocName = null
              
              if (msg.role === 'user' && displayContent.includes('[KONTEKS DOKUMEN:')) {
                const nameMatch = displayContent.match(/\[KONTEKS DOKUMEN: (.*?)\]/)
                if (nameMatch) {
                  attachedDocName = nameMatch[1]
                }

                const parts = displayContent.split('[PERTANYAAN USER]:\n')
                if (parts.length > 1) {
                  displayContent = parts[1]
                }
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0 flex items-center justify-center shadow-lg mt-1">
                      <img
                        src="/favicon.ico"
                        alt="Logo Reka"
                        className={`w-7.5 h-7.5 ${msg.videoOp && !msg.videoUrl ? 'animate-spin' : ''}`}
                      />
                    </div>
                  )}

                  <div className={`relative max-w-[85%] rounded-2xl p-4 shadow-xl backdrop-blur-sm border 
                    ${editingIndex === index 
                        ? isDark 
                            ? 'ring-2 ring-cyan-500/50 border-cyan-500/30 bg-slate-800' 
                            : 'ring-2 ring-cyan-600/60 border-cyan-600/60 bg-slate-200' 
                        : ''
                    } 
                    ${msg.role === 'user' 
                      ? isDark 
                          ? 'bg-slate-800/80 border-slate-700 text-slate-100 rounded-br-none' 
                          : 'bg-white border-slate-300 text-slate-900 rounded-br-none'
                      : isDark 
                          ? 'bg-slate-950/50 border-white/10 text-slate-300 rounded-bl-none prose-headings:text-cyan-200 prose-strong:text-cyan-400' 
                          : 'bg-white border-slate-400 text-slate-900 rounded-bl-none prose-headings:text-cyan-700 prose-strong:text-cyan-600'
                    }`}
                  >

                    <div className={`prose max-w-none text-sm md:text-base leading-relaxed ${isDark ? 'prose-invert' : 'prose-slate'}`}>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Generated"
                          className="mb-3 max-h-80 w-auto rounded-xl border border-white/10 object-cover cursor-zoom-in"
                          onClick={() =>
                            setLightbox({
                              kind: 'image',
                              src: msg.imageUrl!,
                              filename: `reka-image-${msg.id}.png`,
                            })
                          }
                        />
                      )}

                      {msg.videoUrl && (
                        <div
                          className="mb-3 w-full rounded-xl border border-white/10 overflow-hidden cursor-zoom-in"
                          onClick={() =>
                            setLightbox({
                              kind: 'video',
                              src: msg.videoUrl!,
                              filename: `reka-video-${msg.id}.mp4`,
                            })
                          }
                        >
                          <video
                            src={msg.videoUrl}
                            muted
                            playsInline
                            className="w-full block pointer-events-none"
                          />
                        </div>
                      )}

                      {msg.videoOp && !msg.videoUrl && (
                        <div className="text-xs text-slate-400 mt-2">⏳ Rendering video…</div>
                      )}

                      {attachedDocName && (
                        <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-xs font-medium border w-fit ${
                          isDark 
                            ? 'bg-slate-900/50 border-white/10 text-cyan-200' 
                            : 'bg-slate-50 border-slate-300 text-cyan-700'
                        }`}>
                          <Paperclip className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[200px]">{attachedDocName}</span>
                        </div>
                      )}

                      {/* ============= SHOW TOOL CALLS ============= */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <ToolCallDisplay toolCalls={msg.toolCalls} theme={theme} />
                      )}

                      {/* ============= SHOW TOOL RESULTS ============= */}
                      {msg.role === 'assistant' && (() => {
                        const nextMessages = messages.slice(index + 1)
                        const toolResults = nextMessages.filter(m => 
                          m.role === 'tool' && 
                          msg.toolCalls?.some(tc => tc.id === m.toolCallId)
                        )
                        
                        return toolResults.length > 0 ? (
                          <div className="space-y-2">
                            {toolResults.map(toolMsg => (
                              <ToolResultDisplay
                                key={toolMsg.id}
                                toolName={toolMsg.toolName || 'unknown'}
                                result={toolMsg.result}
                                theme={theme}
                              />
                            ))}
                          </div>
                        ) : null
                      })()}

                      {/* ============= SHOW CONTENT ============= */}
                      {msg.content && (
                        <ReactMarkdown
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            pre: ({ children }) => <>{children}</>,
                            code: ({ className, children, ...props }) => {
                              const match = /language-(\w+)/.exec(className || '')
                              const language = match ? match[1] : ''
                              const codeContent = extractCodeText(children).replace(/\n$/, '')

                              if (language === 'mermaid') {
                                return (
                                  <MermaidBlock 
                                    code={codeContent} 
                                    theme={theme} 
                                    onExpand={(svgContent) => {
                                      setLightbox({
                                        kind: 'mermaid',
                                        content: svgContent,
                                        filename: `diagram-${Date.now()}.svg`
                                      })
                                    }}
                                  />
                                )
                              }

                              if (language) {
                                return (
                                  <CodeBlock className={className} {...props}>
                                    {children}
                                  </CodeBlock>
                                )
                              }

                              return (
                                <code
                                  className={`${className} px-1.5 py-0.5 rounded font-mono text-sm ${
                                    isDark ? 'bg-slate-800 text-cyan-200' : 'bg-slate-300 text-cyan-800'
                                  }`}
                                  {...props}
                                >
                                  {children}
                                </code>
                              )
                            },
                          }}
                        >
                          {displayContent}
                        </ReactMarkdown>
                      )}
                    </div>

                    {/* ============= MESSAGE ACTIONS ============= */}
                    {msg.role === 'assistant' && !isLoading && (() => {
                      const hasMedia = !!msg.imageUrl || !!msg.videoUrl
                      const hasTools = !!msg.toolCalls && msg.toolCalls.length > 0

                      return (
                        <div className={`mt-3 pt-3 flex flex-wrap items-center gap-4 ${isDark ? 'border-t border-white/10' : 'border-t border-slate-400'}`}>

                          {!hasMedia && !hasTools && (
                            <>
                              <button
                                onClick={() => handleSpeak(msg.content, msg.id)}
                                className={`flex items-center gap-1.5 text-xs transition-colors ${
                                  speakingId === msg.id
                                    ? 'text-cyan-600 animate-pulse'
                                    : isDark
                                      ? 'text-slate-400 hover:text-white'
                                      : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title={speakingId === msg.id ? "Berhenti bicara" : "Bacakan respon"}
                              >
                                {speakingId === msg.id ? (
                                  <>
                                    <StopCircle className="w-3.5 h-3.5" />
                                    <span>Stop</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>Baca</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleCopyContent(msg.content, msg.id)}
                                className={`flex items-center gap-1.5 text-xs transition-colors ${
                                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Salin respon"
                              >
                                {copiedMessageId === msg.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-green-400" />
                                    <span className="text-green-400">Disalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Salin</span>
                                  </>
                                )}
                              </button>
                            </>
                          )}

                          {hasMedia && (
                            <>
                              {msg.imageUrl && (
                                <a
                                  href={msg.imageUrl}
                                  download={`reka-image-${msg.id}.png`}
                                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                  title="Download gambar"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              )}

                              {msg.videoUrl && (
                                <a
                                  href={msg.videoUrl}
                                  download={`reka-video-${msg.id}.mp4`}
                                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                  title="Download video"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              )}
                            </>
                          )}

                          {index === messages.length - 1 && (
                            <button
                              onClick={handleRegenerate}
                              className={`flex items-center gap-1.5 text-xs transition-colors ${
                                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Ulangi respon"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>Ulangi</span>
                            </button>
                          )}
                        </div>
                      )
                    })()}

                    {msg.role === 'user' && !isLoading && (
                      <div className={`mt-2 pt-2 flex items-center justify-end gap-4 ${isDark ? 'border-t border-slate-700/50' : 'border-t border-slate-400'}`}>
                        <button
                            onClick={() => handleCopyContent(displayContent, msg.id)}
                            className={`flex items-center gap-1.5 text-xs transition-colors 
                            ${isDark 
                                ? 'text-slate-400 hover:text-white' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Salin pesan"
                        >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-green-400" />
                                <span className="text-green-400">Disalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin</span>
                              </>
                            )}
                        </button>

                        {index === lastUserMessageIndex && (
                            editingIndex === index ? (
                              <span className="text-xs text-cyan-400 italic animate-pulse">Sedang mengedit...</span>
                            ) : (
                              <button
                                onClick={() => handleEditMessage(index)}
                                className={`flex items-center gap-1.5 text-xs transition-colors 
                                ${isDark 
                                    ? 'text-slate-400 hover:text-white' 
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Edit pesan"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            )
                        )}
                      </div>
                    )}

                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0 flex items-center justify-center shadow-lg mt-1">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 justify-start">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0 flex items-center justify-center shadow-lg mt-1">
                  <img
                    src="/favicon.ico"
                    alt="Logo Reka"
                    className="w-7.5 h-7.5 animate-spin"
                  />
               </div>
               <div className={`border rounded-2xl rounded-bl-none p-4 flex items-center gap-2 transition-colors ${
                 isDark 
                   ? 'bg-slate-950/50 border-white/10' 
                   : 'bg-white border-slate-300 shadow-sm'
               }`}>
                 <span className={`text-sm ${
                   isDark ? 'text-slate-400' : 'text-slate-600'
                 }`}>Menunggu respon...</span>
               </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="relative z-20 p-4 sm:p-6 lg:p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        <div className="max-w-3xl mx-auto relative group">
          {messages.length > 0 && (
            <button onClick={handleClearChat} className="absolute -top-12 right-0 text-xs flex items-center text-slate-500 hover:text-red-400 transition-colors" title="Reset chat">
              <Trash2 className="w-3 h-3 mr-1" /> Reset
            </button>
          )}

          <div className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500 ${isFocused ? 'opacity-80 blur-md' : ''}`} />
          
          <form onSubmit={handleSubmit} className="relative bg-slate-900 ring-1 ring-white/10 rounded-2xl p-2 shadow-2xl">
            {editingIndex !== null && (
               <div className="px-3 pb-2 flex items-center justify-between text-xs text-cyan-400 border-b border-white/10 mb-2">
                  <span>✏️ Mengedit pesan sebelumnya...</span>
                  <button type="button" onClick={handleCancelEdit} className="flex items-center hover:text-red-400 transition-colors">
                    <XCircle className="w-3 h-3 mr-1" /> Batal
                  </button>
               </div>
            )}

            {selectedImage && (
              <div className="px-3 pt-3 pb-1">
                <div className="relative inline-block">
                  <img 
                    src={selectedImage} 
                    alt="Preview" 
                    className="h-16 w-auto rounded-lg border border-slate-700/50 object-cover" 
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-1.5 -right-1.5 bg-slate-800 rounded-full p-0.5 border border-slate-600 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {docContext && (
              <div className="px-3 pt-3 pb-1">
                <div className="relative inline-flex items-center gap-2 bg-slate-800/50 border border-cyan-500/30 rounded-lg px-3 py-1.5 pr-8">
                  <span className="text-xs text-cyan-300 truncate max-w-[200px]">
                    📄 {docContext.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveDoc}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:text-red-400 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-0 mb-1">
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className={`p-2 rounded-lg transition-colors ${
                  isUploading ? 'text-cyan-400 animate-pulse' : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
                }`}
                disabled={isUploading}
                title="Upload Dokumen (PDF/Text)"
              >
                <Paperclip className="w-5 h-5" /> 
              </button>

              <input 
                type="file" 
                ref={docInputRef} 
                onChange={handleDocSelect}
                className="hidden" 
                accept=".pdf,.txt,.md,.json,.js,.ts,.tsx"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-all active:scale-95"
                title="Upload gambar"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect}
                className="hidden" 
                accept="image/*"
              />

              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-2 rounded-lg transition-all active:scale-95 ${
                  isListening 
                    ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30' // Style saat merekam
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800' // Style normal
                }`}
                title={isListening ? "Klik untuk berhenti" : "Klik untuk bicara (Bahasa Indonesia)"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={selectedImage ? "Tambahkan pesan untuk gambar ini..." : "Kirim pesan..."}
                className="w-full max-h-32 bg-transparent text-white placeholder-slate-500 text-base resize-none focus:outline-none p-3 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent"
                rows={1}
                style={{ minHeight: '50px' }}
              />
              
              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className={`mb-1 mr-1 p-3 rounded-xl transition-all duration-200 ${(!input.trim() && !selectedImage) || isLoading ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95'}`}
              >
                {isLoading ? <Sparkles className="w-5 h-5 animate-spin" /> : editingIndex !== null ? <Pencil className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </form>
          
          <p className="text-center text-xs text-slate-600 mt-2">
            &copy; {new Date().getFullYear()} Andre Saputra
          </p>
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              className="relative w-full max-w-5xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-white font-medium text-sm flex items-center gap-2">
                  {lightbox.kind === 'mermaid' ? '📊 Diagram View' : 'Media View'}
                </h3>
                
                <div className="flex items-center gap-2">
                  <a
                    href={lightbox.kind === 'mermaid' 
                      ? `data:image/svg+xml;base64,${typeof window !== 'undefined' ? btoa(lightbox.content) : ''}`
                      : lightbox.src
                    }
                    download={lightbox.filename}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    Download {lightbox.kind === 'mermaid' ? 'SVG' : 'File'}
                  </a>

                  <button
                    onClick={() => setLightbox(null)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white/70 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col relative">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px] pointer-events-none" />

                <ZoomableMedia>
                  {lightbox.kind === 'image' && (
                    <img
                      src={lightbox.src}
                      alt="Preview"
                      className="max-h-none max-w-none object-contain shadow-2xl pointer-events-none select-none"
                      style={{ maxHeight: '85vh', maxWidth: '90vw' }}
                    />
                  )}
                  
                  {lightbox.kind === 'video' && (
                    <video
                      src={lightbox.src}
                      controls
                      autoPlay
                      className="max-h-[85vh] max-w-[90vw] object-contain bg-black rounded-lg shadow-2xl"
                      onMouseDown={(e) => e.stopPropagation()} 
                    />
                  )}

                  {lightbox.kind === 'mermaid' && (
                    <div 
                      className="pointer-events-none select-none p-10"
                      dangerouslySetInnerHTML={{ __html: lightbox.content }}
                    />
                  )}
                </ZoomableMedia>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

function pollVideo(videoOp: any, assistantId: string) {
  throw new Error('Function not implemented.')
}
