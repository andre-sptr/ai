import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'highlight.js/styles/github-dark.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Reka AI - Asisten Coding',
  description: 'Reka AI: Ubah ide menjadi kode. Asisten AI modern dengan kemampuan coding Next.js 16, React 19, dan Tailwind CSS v4, tanpa perlu login.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
