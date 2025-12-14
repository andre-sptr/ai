'use server'

import { GoogleGenerativeAI, Content } from "@google/generative-ai";

export type Message = {
  role: "user" | "model";
  parts: { text: string }[];
};

export async function generateChatResponse(history: Message[], prompt: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("API Key belum dipasang!");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 8192,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content:", error);
    return "Maaf, terjadi kesalahan pada AI. Silakan coba lagi.";
  }
}