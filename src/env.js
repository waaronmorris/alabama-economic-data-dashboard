import { config } from "dotenv";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);
const envDir = `${rootDir}/env`;

// Determine environment
const NODE_ENV = process.env.NODE_ENV || "development";

// Load environment variables from .env files in the env directory
// First load the default .env file
config({ path: `${envDir}/.env` });

// Then load environment specific file if it exists
config({ path: `${envDir}/.env.${NODE_ENV}`, override: true });

// Export environment variables
export const env = {
  FRED_API_KEY: process.env.FRED_API_KEY || "",
  NODE_ENV: NODE_ENV
};

// Validate required environment variables
if (!env.FRED_API_KEY) {
  console.error("FRED_API_KEY is required but not set in environment variables");
  process.exit(1);
}
