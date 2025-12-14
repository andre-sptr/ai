'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Wand2, Zap, ArrowRight, User, Trash2, Check, Copy, RotateCw, Image as ImageIcon, X, Pencil, XCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

const CodeBlock = ({ children, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  const handleCopy = async () => {
    if (preRef.current) {
      const codeText = preRef.current.innerText
      try {
        await navigator.clipboard.writeText(codeText)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (err) {
        console.error('Gagal menyalin:', err)
      }
    }
  }

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-slate-700">
      <div className="absolute right-2 top-2 flex items-center justify-end">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md bg-slate-800/50 hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-600"
          title="Salin kode"
        >
          {isCopied ? (
            <div className="flex items-center gap-1 text-green-400">
              <Check className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Disalin!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-200">
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Copy</span>
            </div>
          )}
        </button>
      </div>
      <pre ref={preRef} {...props} className="bg-[#0d1117] p-4 pt-10 overflow-x-auto text-sm font-mono">
        {children}
      </pre>
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleClearChat = () => {
    setMessages([])
    setInput('')
    setSelectedImage(null)
    setEditingIndex(null)
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages }),
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
            {messages.map((msg, index) => (
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

                <div className={`relative max-w-[85%] rounded-2xl p-4 shadow-xl backdrop-blur-sm border 
                  ${editingIndex === index ? 'ring-2 ring-cyan-500/50 border-cyan-500/30 bg-slate-800' : ''} 
                  ${msg.role === 'user' ? 'bg-slate-800/80 border-slate-700 text-slate-100 rounded-br-none' : 'bg-slate-950/50 border-white/10 text-slate-300 rounded-bl-none prose-headings:text-cyan-200 prose-strong:text-cyan-400'}`}>
                  
                  {msg.role === 'user' && msg.imageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-slate-600/50">
                      <img 
                        src={msg.imageUrl} 
                        alt="Uploaded content" 
                        className="max-w-full h-auto max-h-64 object-cover"
                      />
                    </div>
                  )}

                  <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed">
                    <ReactMarkdown 
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        pre: ({ node, ...props }) => (
                          <CodeBlock {...props} />
                        ),
                        code: ({ node, ...props }) => (
                          <code {...props} className="font-mono text-sm" />
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {msg.role === 'assistant' && !isLoading && (
                     <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4">
                        <button 
                           onClick={() => handleCopyContent(msg.content, msg.id)}
                           className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                           title="Salin seluruh respon"
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

                        {index === messages.length - 1 && (
                          <button 
                             onClick={handleRegenerate}
                             className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                             <RotateCw className="w-3 h-3" />
                             <span>Ulangi</span>
                          </button>
                        )}
                     </div>
                  )}

                  {msg.role === 'user' && index === lastUserMessageIndex && !isLoading && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-end">
                       {editingIndex === index ? (
                         <span className="text-xs text-cyan-400 italic animate-pulse">Sedang mengedit...</span>
                       ) : (
                         <button
                           onClick={() => handleEditMessage(index)}
                           className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                         >
                           <Pencil className="w-3 h-3" />
                           <span>Edit</span>
                         </button>
                       )}
                    </div>
                  )}

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
                placeholder={selectedImage ? "Tambahkan pesan untuk gambar ini..." : "Kirim pesan... (Enter untuk kirim)"}
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
            AI dapat membuat kesalahan. Periksa info penting.
          </p>
        </div>
      </div>
    </main>
  )
}