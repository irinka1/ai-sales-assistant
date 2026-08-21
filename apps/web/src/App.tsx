import { useMemo, useState } from "react";
import type { FormEvent } from "react";

const serviceOptions = [
  "Ремонт скла",
  "Тонування",
  "Видалення вм'ятин",
  "Хімчистка"
];

type LeadFormState = {
  name: string;
  phone: string;
  service: string;
  message: string;
};

type LeadPayload = LeadFormState & {
  type: "lead";
};

type TelegramWebApp = {
  initDataUnsafe?: {
    user?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
  expand?: () => void;
  ready?: () => void;
  sendData?: (data: string) => void;
  showAlert?: (message: string) => void;
};

const initialForm: LeadFormState = {
  name: "",
  phone: "",
  service: "",
  message: ""
};

export default function App() {
  const telegram = (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
  const [form, setForm] = useState<LeadFormState>(initialForm);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [pendingLead, setPendingLead] = useState<LeadPayload | null>(null);
  const isTelegram = Boolean(telegram?.sendData);

  useMemo(() => {
    telegram?.ready?.();
    telegram?.expand?.();

    const user = telegram?.initDataUnsafe?.user;
    if (!user) return;

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    if (!fullName) return;

    setForm((current) => (current.name ? current : { ...current, name: fullName }));
  }, [telegram]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: LeadPayload = {
      type: "lead",
      name: form.name.trim(),
      phone: form.phone.trim(),
      service: form.service.trim(),
      message: form.message.trim()
    };

    if (!payload.name || !payload.phone || !payload.message) {
      setStatusMessage("Заповніть ім'я, телефон і опис запиту.");
      return;
    }

    setPendingLead(payload);
    setStatusMessage("Перевірте дані заявки та підтвердьте відправку.");
  };

  const handleConfirmSend = () => {
    if (!pendingLead) return;

    if (!isTelegram) {
      setStatusMessage("Форма підтверджена. Відкрийте її з Telegram, щоб відправити заявку в бот.");
      setPendingLead(null);
      return;
    }

    telegram?.sendData?.(JSON.stringify(pendingLead));
    setStatusMessage("Заявка відправлена.");
    telegram?.showAlert?.("Заявка відправлена");
    setPendingLead(null);
    setForm((current) => ({ ...initialForm, name: current.name }));
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 md:px-8">
      <header className="mb-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">AI Sales Assistant</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Заповніть форму, перевірте дані та підтвердіть заявку.</p>
      </header>

      {pendingLead ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-700">Підтвердження</p>
              <h2 className="mt-2 text-2xl font-bold text-emerald-950">Заявка готова до відправки</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-emerald-700">
              {pendingLead.service || "Без послуги"}
            </span>
          </div>

          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-slate-500">Ім'я</p>
              <p className="mt-1 font-medium">{pendingLead.name}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-slate-500">Телефон</p>
              <p className="mt-1 font-medium">{pendingLead.phone}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm md:col-span-2">
              <p className="text-slate-500">Опис</p>
              <p className="mt-1 font-medium">{pendingLead.message}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleConfirmSend}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Підтвердити та надіслати
            </button>
            <button
              type="button"
              onClick={() => setPendingLead(null)}
              className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Повернутися до редагування
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Форма заявки</p>
            <h2 className="mt-2 text-2xl font-bold">Залишити заявку</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Заповніть коротку форму, і бот передасть заявку менеджеру разом із AI-аналізом.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            {isTelegram ? "Відкрито в Telegram" : "Режим перегляду"}
          </span>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Ім'я</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Іван Петренко"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Телефон</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="+380..."
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Послуга</span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
              value={form.service}
              onChange={(event) => setForm((current) => ({ ...current, service: event.target.value }))}
            >
              <option value="">Оберіть послугу</option>
              {serviceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Опис</span>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              placeholder="Опишіть, що саме потрібно, бажаний бюджет або терміни"
            />
          </label>

          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Перевірити заявку
            </button>
            <p className="text-sm text-slate-600">
              {statusMessage || "Після підтвердження бот отримає заявку в чаті."}
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
