import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const op = searchParams.get('op')
  if (!op) return NextResponse.json({ error: 'missing op' }, { status: 400 })

  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

  const statusRes = await fetch(`${baseUrl}/${op}`, {
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! },
  })

  if (!statusRes.ok) {
    const err = await statusRes.text()
    return new NextResponse(err, { status: 500 })
  }

  const statusJson = await statusRes.json()
  if (!statusJson.done) return NextResponse.json({ done: false })

  const videoUri =
    statusJson?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri

  if (!videoUri) {
    return NextResponse.json({ done: true, error: 'video uri not found', raw: statusJson })
  }

  const videoRes = await fetch(videoUri, {
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! },
  })
  const buf = Buffer.from(await videoRes.arrayBuffer())

  const videoUrl = `data:video/mp4;base64,${buf.toString('base64')}`
  return NextResponse.json({ done: true, videoUrl })
}
