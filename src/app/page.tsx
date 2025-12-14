'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Sparkles, Zap, ArrowRight, User, Trash2, Check, Copy, RotateCw, Image as ImageIcon, X, Pencil, XCircle, Volume2, StopCircle, ChevronDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const models = [
    // --- Gemini 3.0 (Next-Gen Preview) ---
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Reasoning & Agentic Paling Canggih' },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro (Image)', desc: 'Generasi Gambar & Teks High-Fidelity' },
    // --- Gemini 2.5 (Current High-End) ---
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Reasoning Kompleks & Coding' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Cepat & Cerdas (Recommended)' },
    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash (Image)', desc: 'Pembuatan & Edit Aset Visual' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', desc: 'Ringan & Hemat Biaya' },
    // --- Gemini 2.0 (Stable) ---
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Versi Stabil Sebelumnya' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', desc: 'Efisien untuk Tugas Sederhana' },
    // --- Alias / Versi Terbaru Otomatis ---
    { id: 'gemini-flash-latest', name: 'Gemini Flash', desc: 'Versi Flash Paling Baru' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash-Lite', desc: 'Versi Lite Paling Baru' },
    // --- Media Generation (Imagen & Veo) ---
    { id: 'imagen-4.0-generate-001', name: 'Imagen 4.0 (Image)', desc: 'Generasi Gambar Kualitas Tinggi' },
    { id: 'imagen-4.0-ultra-generate-001', name: 'Imagen 4.0 Ultra (Image)', desc: 'Detail Gambar Ultra Realistis' },
    { id: 'imagen-4.0-fast-generate-001', name: 'Imagen 4.0 Fast (Image)', desc: 'Generasi Gambar Cepat' },
    { id: 'veo-2.0-generate-001', name: 'Veo 2.0 (Video)', desc: 'Generasi Video Sinematik' },
    // --- Specialized ---
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
          model: selectedModel
        }),
      })

      if (!response.ok) throw new Error("Gagal menghubungi AI")

      const assistantId = (Date.now() + 1).toString()
      let assistantContent = ""
      
      setMessages(prev => [
        ...prev,
        { id: assistantId, role: 'assistant', content: "" }
      ])

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
      console.error("Error:", error)
      alert("Terjadi kesalahan saat menghubungi AI.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if ((!input.trim() && !selectedImage) || isLoading) return

    const userText = input
    const currentImage = selectedImage
    
    setInput('')
    setSelectedImage(null)
    
    const newMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userText,
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
    <main className={`relative min-h-screen selection:bg-cyan-500/30 overflow-hidden font-sans flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-800'}`}>
      
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <div className={`absolute inset-0 ${isDark ? 'bg-grid-white' : 'bg-grid-black'} bg-[size:50px_50px]`} />
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/80' : 'bg-gradient-to-t from-slate-100 via-slate-100/50 to-slate-100/80'}`} />
      </div>

      <header className={`sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b shadow-sm transition-colors duration-300 
        ${isDark 
          ? 'bg-slate-950/80 backdrop-blur-md border-white/5' 
          : 'bg-slate-100/80 backdrop-blur-md border-slate-200'
        }`}
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

      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-10 pb-40">
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
              </p>
            </motion.div>
          )}

          <AnimatePresence mode='popLayout'>
            {messages.map((msg, index) => (
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
                      className="w-7.5 h-7.5"
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
                        : 'bg-slate-200 border-slate-400 text-slate-900 rounded-br-none' 
                    : isDark 
                        ? 'bg-slate-950/50 border-white/10 text-slate-300 rounded-bl-none prose-headings:text-cyan-200 prose-strong:text-cyan-400' 
                        : 'bg-white border-slate-400 text-slate-900 rounded-bl-none prose-headings:text-cyan-700 prose-strong:text-cyan-600'
                  }`}
                >

                  <div className={`prose max-w-none text-sm md:text-base leading-relaxed ${isDark ? 'prose-invert' : 'prose-slate'}`}>
                    <ReactMarkdown 
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        pre: ({ children }) => <>{children}</>, 
                        code: ({ node, className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '')
                          const isCodeBlock = !!match;
                          
                          if (isCodeBlock) {
                            return (
                              <CodeBlock className={className} {...props}>
                                {children}
                              </CodeBlock>
                            )
                          }
                          
                          return (
                            <code className={`${className} px-1.5 py-0.5 rounded font-mono text-sm ${isDark ? 'bg-slate-800 text-cyan-200' : 'bg-slate-300 text-cyan-800'}`} {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {msg.role === 'assistant' && !isLoading && (
                     <div className={`mt-3 pt-3 flex flex-wrap items-center gap-4 ${isDark ? 'border-t border-white/10' : 'border-t border-slate-400'}`}>
                      
                        <button 
                           onClick={() => handleSpeak(msg.content, msg.id)}
                           className={`flex items-center gap-1.5 text-xs transition-colors ${speakingId === msg.id 
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
                           className={`flex items-center gap-1.5 text-xs transition-colors 
                           ${isDark 
                              ? 'text-slate-400 hover:text-white' 
                              : 'text-slate-600 hover:text-slate-900' 
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

                        {index === messages.length - 1 && (
                          <button 
                             onClick={handleRegenerate}
                             className={`flex items-center gap-1.5 text-xs transition-colors 
                             ${isDark 
                                ? 'text-slate-400 hover:text-white' 
                                : 'text-slate-600 hover:text-slate-900' 
                             }`}
                             title="Ulangi respon"
                          >
                             <RotateCw className="w-3.5 h-3.5" />
                             <span>Ulangi</span>
                          </button>
                        )}
                     </div>
                  )}

                  {msg.role === 'user' && !isLoading && (
                    <div className={`mt-2 pt-2 flex items-center justify-end gap-4 ${isDark ? 'border-t border-slate-700/50' : 'border-t border-slate-400'}`}>
                       <button
                           onClick={() => handleCopyContent(msg.content, msg.id)}
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
            ))}
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
               <div className="bg-slate-950/50 border border-white/10 rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
                 <span className="text-sm text-slate-400">Menunggu respon...</span>
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

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mb-3 ml-2 p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
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
    </main>
  )
}