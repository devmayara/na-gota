import { formatEnderecoExibicao } from "@/lib/endereco";
import type { PlaceSuggestion, RotaResultado } from "@/types/viagem";

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";
const OSRM_ROUTE = "https://router.project-osrm.org/route/v1/driving";

const USER_AGENT =
  "CalculaCustoViagem/0.1 (https://github.com/local; contato@local)";

type NominatimAddress = {
  amenity?: string;
  shop?: string;
  tourism?: string;
  building?: string;
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  city?: string;
  town?: string;
  municipality?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  region?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  [key: string]: string | undefined;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
};

type OsrmResponse = {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
  }>;
};

/**
 * Local, endereço e cidade.
 * "Estádio Rei Pelé, Maceió" ou "Senador Nilo Coelho, Arapiraca"
 */
export function formatPlaceLabel(
  item: Pick<NominatimResult, "name" | "display_name" | "address">
): string {
  const address = item.address;
  if (!address) {
    return cleanDisplayName(item.display_name);
  }

  const placeName =
    item.name ||
    address.amenity ||
    address.shop ||
    address.tourism ||
    address.building ||
    undefined;

  const street = address.road || address.pedestrian;
  const city =
    address.city ||
    address.town ||
    address.municipality ||
    address.village ||
    address.hamlet;

  const parts: string[] = [];

  if (placeName) {
    parts.push(placeName);
  }

  if (street && street !== placeName) {
    parts.push(street);
  }

  if (city && city !== placeName && city !== street) {
    parts.push(city);
  }

  if (parts.length > 0) {
    return formatEnderecoExibicao(parts.join(", "));
  }

  return cleanDisplayName(item.display_name);
}

function cleanDisplayName(displayName: string): string {
  return formatEnderecoExibicao(displayName);
}

function cidadeDoEndereco(address: NominatimAddress): string | undefined {
  return (
    address.city ||
    address.town ||
    address.municipality ||
    address.village ||
    address.hamlet
  );
}

/** Rua (com número, se houver) ou bairro, mais a cidade. */
function formatLocalizacaoLabel(
  item: Pick<NominatimResult, "display_name" | "address">
): string {
  const address = item.address;
  if (!address) return cleanDisplayName(item.display_name);

  const city = cidadeDoEndereco(address);
  const street = address.road || address.pedestrian;
  const number = address.house_number;
  const neighborhood = [
    address.neighbourhood,
    address.suburb,
    address.quarter,
    address.residential,
  ].find((part) => part && part !== city && part !== street);

  const reference = street
    ? number
      ? `${street}, ${number}`
      : street
    : neighborhood;

  const parts: string[] = [];
  if (reference) parts.push(reference);
  if (city && city !== reference) parts.push(city);

  if (parts.length > 0) {
    return formatEnderecoExibicao(parts.join(", "));
  }

  return cleanDisplayName(item.display_name);
}

async function reverseGeocodeOnce(
  lat: number,
  lng: number,
  layer?: string
): Promise<(NominatimResult & { error?: string }) | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    addressdetails: "1",
    zoom: "18",
  });
  if (layer) params.set("layer", layer);

  const response = await nominatimFetch(`${NOMINATIM_REVERSE}?${params}`);
  if (!response.ok) return null;

  const data = (await response.json()) as NominatimResult & { error?: string };
  if (data.error || !data.lat || !data.lon) return null;
  return data;
}

async function nominatimFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: 0 },
  });
}

export async function buscarPlacesNominatim(
  input: string
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: input.trim(),
    format: "json",
    addressdetails: "1",
    countrycodes: "br",
    limit: "6",
  });

  const response = await nominatimFetch(`${NOMINATIM_SEARCH}?${params}`);

  if (!response.ok) {
    throw new Error("Falha ao consultar lugares (OpenStreetMap)");
  }

  const data = (await response.json()) as NominatimResult[];

  return (data ?? []).map((item) => ({
    placeId: `osm:${item.place_id}`,
    description: formatPlaceLabel(item),
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}

export async function reverseGeocodeNominatim(
  lat: number,
  lng: number
): Promise<{ lat: number; lng: number; label: string } | null> {
  const addressed = await reverseGeocodeOnce(lat, lng, "address");
  const addressedLabel = addressed ? formatLocalizacaoLabel(addressed) : "";
  const addressedCity = addressed?.address
    ? cidadeDoEndereco(addressed.address)
    : undefined;
  const hasStreetOrNeighborhood =
    Boolean(addressedLabel) && addressedLabel !== addressedCity;

  const data = hasStreetOrNeighborhood
    ? addressed
    : (await reverseGeocodeOnce(lat, lng)) ?? addressed;

  if (!data) {
    throw new Error("Falha ao obter endereço da localização atual");
  }

  return {
    lat: Number(data.lat),
    lng: Number(data.lon),
    label: formatLocalizacaoLabel(data),
  };
}

export async function geocodeNominatim(
  address: string
): Promise<{ lat: number; lng: number; label: string } | null> {
  const results = await buscarPlacesNominatim(address);
  const first = results[0];
  if (!first || first.lat == null || first.lng == null) return null;
  return { lat: first.lat, lng: first.lng, label: first.description };
}

export async function calcularDistanciaOsrm(
  origem: { lat: number; lng: number },
  destino: { lat: number; lng: number }
): Promise<RotaResultado> {
  const path = `${origem.lng},${origem.lat};${destino.lng},${destino.lat}`;
  const params = new URLSearchParams({
    overview: "false",
    alternatives: "false",
  });

  const response = await fetch(`${OSRM_ROUTE}/${path}?${params}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error("Falha ao calcular rota (OSRM)");
  }

  const data = (await response.json()) as OsrmResponse;

  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error(
      data.message || "Não foi possível traçar rota entre origem e destino"
    );
  }

  const route = data.routes[0];
  const distanciaKm = Math.round((route.distance / 1000) * 10) / 10;

  return {
    distanciaKm,
    duracaoSegundos: Math.round(route.duration),
  };
}
