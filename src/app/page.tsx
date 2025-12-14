'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Wand2, Zap, ArrowRight, User, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleClearChat = () => {
    setMessages([])
    setInput('')
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isLoading) return

    const userText = input
    setInput('')
    setIsLoading(true)

    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: 'user', content: userText }
    ]
    setMessages(newMessages)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
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
            if (lastMsg.role === 'assistant') {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <main className="relative min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30 overflow-hidden font-sans flex flex-col">
      
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/80" />
      </div>

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
                  Chat With Context
                </span>
              </h1>
              <p className="text-slate-400 text-lg">
                Mulai percakapan. AI akan merespons secara realtime.
              </p>
            </motion.div>
          )}

          <AnimatePresence mode='popLayout'>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0 flex items-center justify-center shadow-lg mt-1">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`relative max-w-[85%] rounded-2xl p-4 shadow-xl backdrop-blur-sm border ${msg.role === 'user' ? 'bg-slate-800/80 border-slate-700 text-slate-100 rounded-br-none' : 'bg-slate-950/50 border-white/10 text-slate-300 rounded-bl-none prose-headings:text-cyan-200 prose-strong:text-cyan-400'}`}>
                  <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed">
                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex-shrink-0 flex items-center justify-center shadow-lg mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 justify-start">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0 flex items-center justify-center shadow-lg mt-1">
                  <Sparkles className="w-4 h-4 text-white animate-spin" />
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
            <button onClick={handleClearChat} className="absolute -top-12 right-0 text-xs flex items-center text-slate-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-3 h-3 mr-1" /> Reset Chat
            </button>
          )}

          <div className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500 ${isFocused ? 'opacity-80 blur-md' : ''}`} />
          
          <form onSubmit={handleSubmit} className="relative bg-slate-900 ring-1 ring-white/10 rounded-2xl p-2 flex items-end shadow-2xl">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Kirim pesan... (Enter untuk kirim)"
              className="w-full max-h-32 bg-transparent text-white placeholder-slate-500 text-base resize-none focus:outline-none p-3 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent"
              rows={1}
              style={{ minHeight: '50px' }}
            />
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`mb-1 mr-1 p-3 rounded-xl transition-all duration-200 ${!input.trim() || isLoading ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95'}`}
            >
              {isLoading ? <Sparkles className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
          
          <p className="text-center text-xs text-slate-600 mt-2">
            AI dapat membuat kesalahan. Periksa info penting.
          </p>
        </div>
      </div>
    </main>
  )
}