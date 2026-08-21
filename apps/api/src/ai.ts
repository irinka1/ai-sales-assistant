import OpenAI from "openai";
import { env } from "./config.js";

type AnalyzeInput = {
  message: string;
  name: string;
  phone: string;
  service?: string;
};

type AnalyzeResult = {
  aiScore: number;
  aiSummary: string;
  aiRecommendation: string;
};

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export async function analyzeLead(input: AnalyzeInput): Promise<AnalyzeResult> {
  if (!client) {
    return {
      aiScore: 55,
      aiSummary: "No OpenAI key configured. Fallback summary based on message length and intent keywords.",
      aiRecommendation: "Validate contact details and call customer today to qualify needs."
    };
  }

  const prompt = `Analyze sales lead and return JSON with keys: aiScore (0-100), aiSummary, aiRecommendation.\nName: ${input.name}\nPhone: ${input.phone}\nService: ${input.service ?? "n/a"}\nMessage: ${input.message}`;

  const response = await client.responses.create({
    model: env.OPENAI_MODEL,
    input: prompt,
    text: { format: { type: "json_object" } }
  });

  const raw = response.output_text || "{}";
  const parsed = JSON.parse(raw) as Partial<AnalyzeResult>;

  return {
    aiScore: Math.min(100, Math.max(0, Number(parsed.aiScore ?? 0))),
    aiSummary: String(parsed.aiSummary ?? "No summary"),
    aiRecommendation: String(parsed.aiRecommendation ?? "Follow up with the client.")
  };
}

export async function generateReply(context: { name: string; message: string; aiSummary?: string | null }) {
  if (!client) {
    return `Добрий день, ${context.name}! Дякую за звернення. Ми вже переглянули вашу заявку і скоро зв'яжемося з вами.`;
  }

  const prompt = `Generate a concise and polite Ukrainian sales manager reply to the client.\nName: ${context.name}\nClient message: ${context.message}\nAI summary: ${context.aiSummary ?? "n/a"}`;
  const response = await client.responses.create({ model: env.OPENAI_MODEL, input: prompt });
  return response.output_text || "Дякуємо за звернення! Скоро надамо деталі.";
}
