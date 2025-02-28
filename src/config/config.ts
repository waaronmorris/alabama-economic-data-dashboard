import { env } from "../env";

export const FRED_API_KEY = env.FRED_API_KEY;

// You can add other configuration values here
export const FRED_CONFIG = {
  baseUrl: "https://api.stlouisfed.org/fred",
  defaultParams: {
    file_type: "json",
    api_key: FRED_API_KEY
  }
};
