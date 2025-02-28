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
const INDICATORS: Record<string, Indicator> = {
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
    title: "Consumer Price Index (CPI)",
    description: "Monthly, Seasonally Adjusted",
    units: "Index 1982-1984=100"
  },
  INTEREST_RATE: {
    id: "FEDFUNDS",
    title: "Federal Funds Rate",
    description: "Monthly, Not Seasonally Adjusted",
    units: "Percent"
  },
  M2: {
    id: "BORROW",
    title: "Total Borrowings from the Federal Reserve",
    description: "Monthly, Seasonally Adjusted",
    units: "Millions of Dollars, Not Seasonally Adjusted"
  },
  ALUR: {
    id: "ALUR",
    title: "Unemployment Rate - Alabama",
    description: "Monthly, Seasonally Adjusted",
    units: "Percent, Seasonally Adjusted"
  },
  MEHOINUSALA646N: {
    id: "MEHOINUSALA646N",
    title: "Median Household Income - Alabama",
    description: "Monthly, Seasonally Adjusted",
    units: "Dollars"
  }
};

async function loadObservations(
  seriesId: string,
  params: Record<string, any> = {},
  metadata: Record<string, any> = {}
): Promise<Observation[]> {
  const response = await api.getSeriesObservations(seriesId, {
    sort_order: "desc",
    limit: 100,
    ...params
  });
  const obs = response.observations || [];
  return obs.map((obs) => ({
    ...metadata,
    value: obs.value,
    date: new Date(obs.date),
    [obs.units]: obs.value
  }));
}

async function loadCategories(seriesId: string): Promise<any[]> {
  const response = await api.getSeriesCategories(seriesId);
  return response.categories || [];
}

// load all indicators
const indicators = Object.values(INDICATORS);

// load all observations
const observations = await Promise.all(indicators.map((indicator) => loadObservations(indicator.id, {}, indicator)));

// print all observations
process.stdout.write(JSON.stringify(observations));
