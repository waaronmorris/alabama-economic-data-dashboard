# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm install` - Install dependencies
- `npm run dev` - Start local development server (serves at http://localhost:3000)
- `npm run build` - Build the production site to `./dist`
- `npm run clean` - Clear the local data loader cache
- `npm run deploy` - Deploy to Observable (requires Observable account)

### Linting and Formatting

- `prettier --write .` - Format code using Prettier

## Project Architecture

This is an **Observable Framework** application that creates an economic data dashboard using Federal Reserve Economic Data (FRED) API. The architecture follows Observable's reactive data model with markdown-based pages.

### Key Components

**Data Architecture:**

- **Data Loaders** (`src/data/*.ts`): TypeScript modules that fetch and transform FRED API data at build time
- **FRED API Service** (`src/services/fredAPI.ts`): TypeScript class for interacting with FRED API
- **Composite Indicators** (`src/services/compositeIndicatorsService.ts`): Calculations for derived metrics like Misery Index
- **Environment Configuration** (`src/env.js`, `env/`): Manages API keys and environment-specific settings

**Frontend Architecture:**

- **Observable Markdown Pages** (`src/*.md`): Reactive data visualization pages with embedded JavaScript
- **Shared Components** (`src/components/`): Reusable visualization components using Observable Plot
- **Configuration** (`observablehq.config.js`): App-level settings including navigation and theme

### Data Flow

1. **Build Time**: Data loaders (`src/data/*.ts`) fetch data from FRED API and generate JSON files
2. **Runtime**: Markdown pages load JSON data using `FileAttachment()` and create reactive visualizations
3. **Visualization**: Uses Observable Plot for charts and D3 for advanced data transformations

### Key Files

- `src/index.md` - Main dashboard with grouped economic indicators
- `src/living-indicators.md` - Advanced composite indicators page
- `observablehq.config.js` - App configuration (navigation, theme, environment variables)
- `src/services/fredAPI.ts` - FRED API client with methods for observations, categories, and series
- `src/data/indicators.json.ts` - Main data loader for economic indicators

### Environment Variables

- `FRED_API_KEY` - Required API key for Federal Reserve Economic Data
- Set in `env/.env` for local development
- Configured as `REACT_APP_FRED_API_KEY` in GitHub Actions for deployment

### Deployment

- **GitHub Pages**: Automated deployment via `.github/workflows/deploy.yml`
- **Schedule**: Runs every Monday to refresh data automatically
- **Manual**: Can be triggered via GitHub Actions workflow_dispatch

### Data Categories

The application organizes economic indicators into groups:

- **National**: GDP, unemployment, inflation, federal funds rate
- **Alabama**: State-specific unemployment, income, housing metrics
- **Housing Indicators**: Affordability indices and price comparisons
- **Composite Indicators**: Derived metrics like Misery Index, Real Interest Rate

### Framework-Specific Notes

- Uses Observable Framework's file-based routing (pages correspond to `.md` files)
- Data reactivity through FileAttachment and JavaScript code blocks in markdown
- Styling uses CSS custom properties with Observable's theme system
- Build output goes to `dist/` directory, then copied to root for GitHub Pages
