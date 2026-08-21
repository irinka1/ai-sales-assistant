import Fastify from "fastify";
import cors from "@fastify/cors";
import { LeadStatus } from "@prisma/client";
import { z } from "zod";
import { env } from "./config.js";
import { prisma } from "./db.js";
import { analyzeLead, generateReply } from "./ai.js";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const authSchema = z.object({ telegramId: z.string(), role: z.enum(["manager", "client"]) });
const createLeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  telegramId: z.string().optional(),
  message: z.string().min(1),
  service: z.string().optional()
});

const statusSchema = z.object({ status: z.nativeEnum(LeadStatus) });

app.post("/auth", async (request) => {
  const payload = authSchema.parse(request.body);
  return { token: `mock-${payload.role}-${payload.telegramId}` };
});

app.get("/leads", async () => prisma.lead.findMany({ orderBy: { createdAt: "desc" } }));

app.get("/leads/:id", async (request, reply) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return reply.code(404).send({ error: "Lead not found" });
  return lead;
});

app.post("/leads", async (request, reply) => {
  const payload = createLeadSchema.parse(request.body);
  const ai = await analyzeLead(payload);

  const lead = await prisma.lead.create({
    data: {
      ...payload,
      aiScore: ai.aiScore,
      aiSummary: ai.aiSummary,
      aiRecommendation: ai.aiRecommendation
    }
  });

  app.log.info({ leadId: lead.id, managerChatId: env.TELEGRAM_MANAGER_CHAT_ID }, "New lead created");
  return reply.code(201).send(lead);
});

app.patch("/leads/:id/status", async (request, reply) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const payload = statusSchema.parse(request.body);

  const updated = await prisma.lead.update({ where: { id: params.id }, data: { status: payload.status } }).catch(() => null);
  if (!updated) return reply.code(404).send({ error: "Lead not found" });
  return updated;
});

app.post("/leads/:id/generate-reply", async (request, reply) => {
  const params = z.object({ id: z.string() }).parse(request.params);
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return reply.code(404).send({ error: "Lead not found" });
  const text = await generateReply({ name: lead.name, message: lead.message, aiSummary: lead.aiSummary });
  return { reply: text };
});

app.get("/health", async () => ({ ok: true }));

const start = async () => {
  try {
    await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
