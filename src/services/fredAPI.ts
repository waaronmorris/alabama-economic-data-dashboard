const FRED_API_KEY = process.env.REACT_APP_FRED_API_KEY;
const BASE_URL = "https://api.stlouisfed.org/fred";

export default class FredAPI {
  private apiKey: string;

  constructor(apiKey: string = FRED_API_KEY) {
    if (!apiKey) {
      throw new Error("FRED API key is required. Please set REACT_APP_FRED_API_KEY environment variable.");
    }
    this.apiKey = apiKey;
  }

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

  async getSeriesCategories(seriesId: string): Promise<{ categories: Array<any> }> {
    return this.fetchFromFred(`/series/categories`, {
      series_id: seriesId
    });
  }
}
