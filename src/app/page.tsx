'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Wand2 } from 'lucide-react'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  const handleGenerate = async () => {
    if (!inputText.trim()) return
    
    setIsLoading(true)
    setResult(null)
    
    // Simulate AI processing
    setTimeout(() => {
      setResult(
        `Based on your input "${inputText}", here's a creative AI-generated response that demonstrates the power of modern artificial intelligence. This is a mock response showcasing the UI design and animation capabilities of your interface.`
      )
      setIsLoading(false)
    }, 2000)
  }

  return (
    <main className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10"
          animate={{
            scale: [1, 1.4, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Dim overlay when input is focused */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 z-10"
            onClick={() => setIsFocused(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-cyan-400 mr-2" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              Unlock Your Creativity
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Enter your ideas and watch AI bring them to life
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`w-full max-w-3xl transition-all duration-300 ${
            isFocused ? 'relative z-30' : ''
          }`}
        >
          <div
            className={`
              backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 
              p-6 transition-all duration-300
              ${isFocused ? 'shadow-[0_0_50px_rgba(6,182,212,0.5)] scale-105' : 'shadow-lg'}
            `}
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Describe your creative vision..."
              className="w-full bg-transparent text-white placeholder-slate-500 
                         text-lg resize-none focus:outline-none min-h-[120px]
                         scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent"
              disabled={isLoading}
            />

            {/* Generate Button */}
            {!isLoading ? (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={!inputText.trim()}
                className="w-full mt-4 py-4 px-6 rounded-xl font-semibold text-white
                           bg-gradient-to-r from-cyan-500 to-indigo-600 
                           hover:from-cyan-400 hover:to-indigo-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-300 flex items-center justify-center
                           shadow-lg shadow-cyan-500/30"
              >
                <Wand2 className="w-5 h-5 mr-2" />
                Generate
              </motion.button>
            ) : (
              <div className="w-full mt-4 py-4 flex items-center justify-center">
                <div className="flex space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 bg-cyan-400 rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Result Card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full max-w-3xl mt-8"
            >
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-lg">
                <div className="flex items-start mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center mr-3">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">AI Generated Result</h3>
                    <p className="text-slate-400 text-sm">Powered by advanced AI</p>
                  </div>
                </div>
                <p className="text-slate-200 leading-relaxed">{result}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
