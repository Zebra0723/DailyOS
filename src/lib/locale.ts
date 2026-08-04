export type LocaleDef = {
  code: string;
  label: string;
  currency: string;
  symbol: string;
};

export const LOCALES: LocaleDef[] = [
  { code: "en-GB", label: "English (UK)", currency: "GBP", symbol: "£" },
  { code: "en-US", label: "English (US)", currency: "USD", symbol: "$" },
  { code: "es", label: "Español", currency: "EUR", symbol: "€" },
  { code: "fr", label: "Français", currency: "EUR", symbol: "€" },
  { code: "de", label: "Deutsch", currency: "EUR", symbol: "€" },
  { code: "it", label: "Italiano", currency: "EUR", symbol: "€" },
  { code: "pt-BR", label: "Português (Brasil)", currency: "BRL", symbol: "R$" },
  { code: "nl", label: "Nederlands", currency: "EUR", symbol: "€" },
  { code: "pl", label: "Polski", currency: "PLN", symbol: "zł" },
  { code: "sv", label: "Svenska", currency: "SEK", symbol: "kr" },
  { code: "no", label: "Norsk", currency: "NOK", symbol: "kr" },
  { code: "da", label: "Dansk", currency: "DKK", symbol: "kr" },
  { code: "fi", label: "Suomi", currency: "EUR", symbol: "€" },
  { code: "ja", label: "日本語", currency: "JPY", symbol: "¥" },
  { code: "ko", label: "한국어", currency: "KRW", symbol: "₩" },
  { code: "zh", label: "中文", currency: "CNY", symbol: "¥" },
  { code: "ar", label: "العربية", currency: "AED", symbol: "د.إ" },
  { code: "hi", label: "हिन्दी", currency: "INR", symbol: "₹" },
  { code: "tr", label: "Türkçe", currency: "TRY", symbol: "₺" },
  { code: "ru", label: "Русский", currency: "RUB", symbol: "₽" },
];

export const DEFAULT_LOCALE = LOCALES[0];

export function localeFor(code: string | undefined): LocaleDef {
  return LOCALES.find((l) => l.code === code) ?? DEFAULT_LOCALE;
}

export function formatAmount(amount: number, currency: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale ?? "en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
      maximumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
    }).format(amount);
  } catch {
    const def = LOCALES.find((l) => l.currency === currency);
    return `${def?.symbol ?? ""}${amount.toFixed(2)}`;
  }
}

export const SPEND_CATEGORIES = [
  { key: "food", label: "Food & Drink" },
  { key: "shopping", label: "Shopping" },
  { key: "transport", label: "Transport" },
  { key: "bills", label: "Bills" },
  { key: "entertainment", label: "Entertainment" },
  { key: "health", label: "Health" },
  { key: "education", label: "Education" },
  { key: "gifts", label: "Gifts" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "home", label: "Home" },
  { key: "travel", label: "Travel" },
  { key: "other", label: "Other" },
] as const;

export type SpendCategory = (typeof SPEND_CATEGORIES)[number]["key"];
