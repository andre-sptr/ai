import { useState, useEffect, useRef } from 'react'

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.lang = 'id-ID'
        recognitionRef.current.interimResults = false

        recognitionRef.current.onstart = () => setIsListening(true)
        recognitionRef.current.onend = () => setIsListening(false)
        
        recognitionRef.current.onresult = (event: any) => {
          const text = event.results[0][0].transcript
          setTranscript(text)
        }
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (e) {
        console.error("Mic error:", e)
      }
    } else {
      alert("Browser kamu tidak mendukung fitur suara.")
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  return { isListening, transcript, startListening, stopListening, setTranscript }
}