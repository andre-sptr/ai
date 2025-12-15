export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = []
  
  const cleanText = text.replace(/\s+/g, ' ').trim()
  
  if (cleanText.length <= chunkSize) {
    return [cleanText]
  }

  let start = 0
  while (start < cleanText.length) {
    const end = Math.min(start + chunkSize, cleanText.length)
    
    let actualEnd = end
    if (end < cleanText.length) {
      const lastSpace = cleanText.lastIndexOf(' ', end)
      const lastDot = cleanText.lastIndexOf('.', end)
      
      if (lastDot > start + chunkSize * 0.5) {
        actualEnd = lastDot + 1
      } else if (lastSpace > start + chunkSize * 0.5) {
        actualEnd = lastSpace
      }
    }

    const chunk = cleanText.slice(start, actualEnd).trim()
    if (chunk) chunks.push(chunk)
    
    start = actualEnd - overlap
    if (start >= actualEnd) start = actualEnd
  }

  return chunks
}

function textToVector(text: string): Map<string, number> {
  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  const vec = new Map<string, number>()
  
  for (const word of words) {
    if (word.length < 3) continue 
    vec.set(word, (vec.get(word) || 0) + 1)
  }
  return vec
}

function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (const [word, countA] of vecA) {
    const countB = vecB.get(word) || 0
    dotProduct += countA * countB
    normA += countA * countA
  }

  for (const countB of vecB.values()) {
    normB += countB * countB
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function findRelevantChunks(query: string, chunks: string[], topK: number = 3): string[] {
  if (!query || chunks.length === 0) return []

  const queryVector = textToVector(query)
  
  const scoredChunks = chunks.map(chunk => {
    const chunkVector = textToVector(chunk)
    const score = cosineSimilarity(queryVector, chunkVector)
    return { chunk, score }
  })

  scoredChunks.sort((a, b) => b.score - a.score)

  return scoredChunks
    .filter(item => item.score > 0.1)
    .slice(0, topK)
    .map(item => item.chunk)
}