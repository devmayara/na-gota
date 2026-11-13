const ESTADOS = new Set([
  "acre",
  "alagoas",
  "amapa",
  "amazonas",
  "bahia",
  "ceara",
  "distrito federal",
  "espirito santo",
  "goias",
  "maranhao",
  "mato grosso",
  "mato grosso do sul",
  "minas gerais",
  "para",
  "paraiba",
  "parana",
  "pernambuco",
  "piaui",
  "rio de janeiro",
  "rio grande do norte",
  "rio grande do sul",
  "rondonia",
  "roraima",
  "santa catarina",
  "sao paulo",
  "sergipe",
  "tocantins",
]);

const SIGLAS = new Set([
  "ac",
  "al",
  "ap",
  "am",
  "ba",
  "ce",
  "df",
  "es",
  "go",
  "ma",
  "mt",
  "ms",
  "mg",
  "pa",
  "pb",
  "pr",
  "pe",
  "pi",
  "rj",
  "rn",
  "rs",
  "ro",
  "rr",
  "sc",
  "sp",
  "se",
  "to",
]);

const PAISES = new Set(["brasil", "brazil"]);

function normalizar(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function ehEstadoOuPais(part: string): boolean {
  const norm = normalizar(part);
  return PAISES.has(norm) || ESTADOS.has(norm) || SIGLAS.has(norm);
}

function semEstadoNoFim(part: string): string | null {
  const match = part.match(/^(.*?)(?:\s*[-–]\s*)([^-–]+)$/);
  if (!match) return null;
  const local = match[1].trim();
  if (!local || !ehEstadoOuPais(match[2])) return null;
  return local;
}

/** Local, endereço e cidade. Remove estado, país, região e CEP. */
export function formatEnderecoExibicao(raw: string): string {
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .filter((part) => !/^regi[aã]o\s+/i.test(part))
    .filter((part) => !/^\d{5}-?\d{0,3}$/.test(part));

  while (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (ehEstadoOuPais(last)) {
      parts.pop();
      continue;
    }

    const shortened = semEstadoNoFim(last);
    if (shortened) {
      parts[parts.length - 1] = shortened;
      continue;
    }

    break;
  }

  return parts.join(", ");
}
