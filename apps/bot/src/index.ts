import { Bot, Keyboard } from "grammy";
import { z } from "zod";
import { env } from "./config.js";

const isHttpsUrl = (value: string) => /^https:\/\//i.test(value);
const webAppLeadSchema = z.object({
  type: z.literal("lead"),
  name: z.string().min(1),
  phone: z.string().min(1),
  service: z.string().optional(),
  message: z.string().min(1)
});

if (!env.TELEGRAM_BOT_TOKEN) {
  console.log("TELEGRAM_BOT_TOKEN is empty. Bot is disabled in this run.");
  setInterval(() => {}, 60_000);
} else {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);
  const canUseWebApp = isHttpsUrl(env.TELEGRAM_WEBAPP_URL);

  const mainKeyboard = new Keyboard().text("📝 Залишити заявку").text("💬 Поставити питання").row();
  if (canUseWebApp) {
    mainKeyboard.webApp("📱 Відкрити застосунок", env.TELEGRAM_WEBAPP_URL);
  } else {
    mainKeyboard.text("📱 Mini App (HTTPS потрібен)");
  }
  mainKeyboard.resized();

  bot.command("start", async (ctx) => {
    await ctx.reply("Привіт 👋\n\nЯк можемо допомогти?", { reply_markup: mainKeyboard });
  });

  bot.command("app", async (ctx) => {
    if (!canUseWebApp) {
      await ctx.reply(
        `Mini App потребує HTTPS URL. Поточний URL: ${env.TELEGRAM_WEBAPP_URL}. Підключіть HTTPS тунель (наприклад, Cloudflared) і оновіть TELEGRAM_WEBAPP_URL.`
      );
      return;
    }

    await ctx.reply("Відкрити Mini App", {
      reply_markup: new Keyboard().webApp("📱 Відкрити застосунок", env.TELEGRAM_WEBAPP_URL).resized()
    });
  });

  bot.hears("📝 Залишити заявку", async (ctx) => {
    if (!canUseWebApp) {
      await ctx.reply(
        `Для форми заявки потрібен HTTPS URL Mini App. Поточний URL: ${env.TELEGRAM_WEBAPP_URL}.`
      );
      return;
    }

    await ctx.reply("Натисніть кнопку, щоб відкрити форму заявки", {
      reply_markup: new Keyboard().webApp("📱 Відкрити застосунок", env.TELEGRAM_WEBAPP_URL).resized()
    });
  });

  bot.hears("📱 Mini App (HTTPS потрібен)", async (ctx) => {
    await ctx.reply(
      `Telegram WebApp працює тільки з HTTPS. Налаштуйте TELEGRAM_WEBAPP_URL на HTTPS адресу (наприклад, через Cloudflared).`
    );
  });

  bot.hears("💬 Поставити питання", async (ctx) => {
    await ctx.reply("Напишіть ваше питання у чат, менеджер відповість вам найближчим часом.");
  });

  bot.on("message:web_app_data", async (ctx) => {
    const raw = ctx.message.web_app_data.data;

    try {
      const payload = webAppLeadSchema.parse(JSON.parse(raw));
      const response = await fetch(`${env.API_BASE_URL}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: payload.name,
          phone: payload.phone,
          service: payload.service,
          message: payload.message,
          telegramId: String(ctx.from?.id ?? "")
        })
      });

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const createdLead = (await response.json()) as {
        id: string;
        name: string;
        phone: string;
        service?: string | null;
        message: string;
        aiScore?: number | null;
        aiSummary?: string | null;
      };

      await ctx.reply("Заявка відправлена. Менеджер скоро зв'яжеться з вами.");

      if (env.TELEGRAM_MANAGER_CHAT_ID) {
        try {
          const managerMessage = [
            "Нова заявка з Mini App",
            `ID: ${createdLead.id}`,
            `Ім'я: ${createdLead.name}`,
            `Телефон: ${createdLead.phone}`,
            `Послуга: ${createdLead.service || "Не вказано"}`,
            `Опис: ${createdLead.message}`,
            createdLead.aiScore != null ? `AI Score: ${createdLead.aiScore}` : null,
            createdLead.aiSummary ? `AI Аналіз: ${createdLead.aiSummary}` : null
          ]
            .filter(Boolean)
            .join("\n");

          await ctx.api.sendMessage(env.TELEGRAM_MANAGER_CHAT_ID, managerMessage);
        } catch (managerError) {
          console.error("Failed to notify manager", managerError);
        }
      }
    } catch (error) {
      console.error("Web app lead error", error);
      await ctx.reply("Не вдалося зберегти заявку. Спробуйте ще раз трохи пізніше.");
    }
  });

  bot.on("message:text", async (ctx, next) => {
    if (ctx.message.text.startsWith("/")) return next();

    if (env.TELEGRAM_MANAGER_CHAT_ID) {
      try {
        const from = ctx.from;
        const fullName = [from?.first_name, from?.last_name].filter(Boolean).join(" ") || "Невідомий користувач";
        const username = from?.username ? ` (@${from.username})` : "";

        await ctx.api.sendMessage(
          env.TELEGRAM_MANAGER_CHAT_ID,
          `Питання від ${fullName}${username}:\n\n${ctx.message.text}`
        );
      } catch (managerError) {
        console.error("Failed to forward question to manager", managerError);
      }
    }

    await ctx.reply("Дякуємо! Ми отримали ваше повідомлення і скоро відповімо.");
    return next();
  });

  bot.catch((err) => {
    console.error("Bot error", err.error);
  });

  bot.start();
  console.log("Telegram bot started");
}
