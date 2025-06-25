// Simple FRED API implementation for data loader
const FRED_API_KEY = process.env.FRED_API_KEY || "1ab81b4a114ce8409d7536c8eb36049e";
const BASE_URL = "https://api.stlouisfed.org/fred";

class SimpleFredAPI {
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private apiKey: string;

  private async fetchFromFred(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const queryParams = new URLSearchParams({
      api_key: this.apiKey,
      file_type: "json",
      ...params
    });

    const url = `${BASE_URL}${endpoint}?${queryParams}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`FRED API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getSeriesObservations(
    seriesId: string,
    params: Record<string, any> = {}
  ): Promise<{ observations: Array<{ date: string; value: string }> }> {
    return this.fetchFromFred(`/series/observations`, {
      series_id: seriesId,
      ...params
    });
  }
}

const api = new SimpleFredAPI(FRED_API_KEY);

// Define interfaces for our data structures
interface Indicator {
  id: string;
  title: string;
  description: string;
  units: string;
  group: string;
  params?: Record<string, any>;
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
    units: "Billions of Chained 2012 Dollars",
    group: "National",
    params: {
      frequency: "q"
    }
  },
  UNEMPLOYMENT: {
    id: "UNRATE",
    title: "Unemployment Rate",
    description: "Monthly, Seasonally Adjusted",
    units: "Percent",
    group: "National"
  },
  INFLATION: {
    id: "CPIAUCSL",
    title: "Consumer Price Index (CPI)",
    description: "Monthly, Seasonally Adjusted",
    units: "Percent",
    group: "National",
    params: {
      units: "pch"
    }
  },
  INTEREST_RATE: {
    id: "FEDFUNDS",
    title: "Federal Funds Rate",
    description: "Monthly, Not Seasonally Adjusted",
    units: "Percent",
    group: "National"
  },
  MEDIAN_INCOME: {
    id: "MEHOINUSA672N",
    title: "Median Household Income - United States",
    description: "Annual, Not Seasonally Adjusted",
    units: "Dollars",
    group: "National"
  },
  MEDIAN_HOME_PRICE: {
    id: "MSPUS",
    title: "Median Sales Price of Houses Sold - United States",
    description: "Quarterly, Not Seasonally Adjusted",
    units: "Dollars",
    group: "National"
  },
  // M2: {
  //   id: "BORROW",
  //   title: "Total Borrowings from the Federal Reserve",
  //   description: "Monthly, Seasonally Adjusted",
  //   units: "Millions of Dollars, Not Seasonally Adjusted",
  //   group: "Monetary"
  // },
  ALUR: {
    id: "ALUR",
    title: "Unemployment Rate - Alabama",
    description: "Monthly, Seasonally Adjusted",
    units: "Percent, Seasonally Adjusted",
    group: "Alabama"
  },
  MEHOINUSALA646N: {
    id: "MEHOINUSALA646N",
    title: "Median Household Income - Alabama",
    description: "Monthly, Seasonally Adjusted",
    units: "Dollars",
    group: "Alabama",
    params: {
      units: "lin"
    }
  },
  MEDDAYONMARAL: {
    id: "MEDDAYONMARAL",
    title: "Median Days on Market in Alabama",
    description: "Monthly, Seasonally Adjusted",
    units: "Dollars",
    group: "Alabama"
  },
  MEDLISPRIAL: {
    id: "MEDLISPRIAL",
    title: "Median Listing Price in Alabama",
    description: "Monthly, Seasonally Adjusted",
    units: "Dollars",
    group: "Alabama"
  },
  ALLF: {
    id: "ALLF",
    title: "Civilian Labor Force - Alabama",
    description: "Monthly, Seasonally Adjusted",
    units: "Thousands of Persons",
    group: "Alabama"
  }
};

async function loadObservations(
  seriesId: string,
  params: Record<string, any> = {},
  metadata: Record<string, any> = {}
): Promise<Observation[]> {
  const response = await api.getSeriesObservations(seriesId, {
    sort_order: "desc",
    observation_start: "2010-01-01",
    limit: 1000,
    ...params
  });
  const obs = response.observations || [];
  return obs.map((obs) => ({
    ...metadata,
    value: obs.value,
    date: new Date(obs.date)
  }));
}

async function loadCategories(seriesId: string): Promise<any[]> {
  const response = await api.getSeriesCategories(seriesId);
  return response.categories || [];
}

// load all indicators
const indicators = Object.values(INDICATORS);

// load all observations
const observations = await Promise.all(
  indicators.map(async (indicator) => ({
    [indicator.id]: await loadObservations(indicator.id, { ...indicator.params }, { ...indicator })
  }))
);

// print all observations
process.stdout.write(JSON.stringify(Object.assign({}, ...observations)));
