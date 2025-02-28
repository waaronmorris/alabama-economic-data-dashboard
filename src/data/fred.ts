import { csvFormat } from "d3-dsv";
import FredAPI from "../services/fredAPI";

const api = new FredAPI();

// Define interfaces for our data structures
interface Indicator {
  id: string;
  title: string;
  description: string;
  units: string;
}

interface Observation {
  value: string;
  date: string;
}

interface Stats {
  latest: number;
  min: number;
  max: number;
  avg: number;
  change: number;
}

// Define key economic indicators
export const INDICATORS: Record<string, Indicator> = {
  GDP: {
    id: "GDPC1",
    title: "Real Gross Domestic Product",
    description: "Quarterly, Seasonally Adjusted Annual Rate",
    units: "Billions of Chained 2012 Dollars"
  },
  UNEMPLOYMENT: {
    id: "UNRATE",
    title: "Unemployment Rate",
    description: "Monthly, Seasonally Adjusted",
    units: "Percent"
  },
  INFLATION: {
    id: "CPIAUCSL",
    title: "Consumer Price Index",
    description: "Monthly, Seasonally Adjusted",
    units: "Index 1982-1984=100"
  },
  INTEREST_RATE: {
    id: "FEDFUNDS",
    title: "Federal Funds Rate",
    description: "Monthly, Not Seasonally Adjusted",
    units: "Percent"
  }
};

// Data loading functions with type annotations
export async function loadSeries(seriesId: string, params: Record<string, any> = {}): Promise<any> {
  const response = await api.getSeries(seriesId);
  return response.seriess?.[0];
}

export async function loadObservations(seriesId: string, params: Record<string, any> = {}): Promise<Observation[]> {
  const response = await api.getSeriesObservations(seriesId, {
    sort_order: "desc",
    limit: 100,
    ...params
  });
  
  return response.observations || [];
}

export async function loadCategories(seriesId: string): Promise<any[]> {
  const response = await api.getSeriesCategories(seriesId);
  return response.categories || [];
}

// Computed data transformations
export function computeStats(observations: Observation[]): Stats {
  const values = observations.map((obs) => parseFloat(obs.value)).filter((val) => !isNaN(val));

  return {
    latest: values[0],
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    change: values.length > 1 ? ((values[0] - values[1]) / values[1]) * 100 : 0
  };
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

export function formatValue(value: number | string, decimals: number = 2): string {
  return parseFloat(value.toString()).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

process.stdout.write(csvFormat(INDICATORS));
