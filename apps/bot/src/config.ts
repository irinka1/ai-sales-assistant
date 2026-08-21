import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(currentDir, "../../../.env") });

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBAPP_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  TELEGRAM_MANAGER_CHAT_ID: z.string().optional()
});

export const env = envSchema.parse(process.env);
