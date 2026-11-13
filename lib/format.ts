const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function currencyDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Máscara de centavos: "709" e "7,09" viram "7,09". */
export function maskCurrencyInput(raw: string): string {
  const digits = currencyDigits(raw).replace(/^0+/, "");
  if (!digits) return "";

  const padded = digits.padStart(3, "0");
  const fraction = padded.slice(-2);
  const integer = padded
    .slice(0, -2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${integer},${fraction}`;
}

export function formatCurrencyInputFromNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "";
  return maskCurrencyInput(String(Math.round(value * 100)));
}

/** Valor já salvo (ex.: "5.89" ou "5,89") para o campo mascarado. */
export function currencyDisplayFromStored(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.includes(",")) return maskCurrencyInput(trimmed);

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return "";
  return formatCurrencyInputFromNumber(value);
}

export function parseCurrencyInput(raw: string): number | null {
  const digits = currencyDigits(raw);
  if (!digits) return null;
  return Number(digits) / 100;
}

export function formatNumber(value: number, fractionDigits?: number): string {
  if (fractionDigits !== undefined) {
    return new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: fractionDigits,
    }).format(value);
  }

  return numberFormatter.format(value);
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}
