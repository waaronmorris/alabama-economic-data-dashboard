// See https://observablehq.com/framework/config for documentation.
export default {
  // The app's title
  title: "Economic Data Dashboard",

  // The pages and sections in the sidebar
  pages: [
    { name: "Home", path: "/" },
    { name: "Alabama Dashboard", path: "/alabama-dashboard" },
    { name: "Economic Insights", path: "/living-indicators" },
  ],

  // The base URL for your app
  baseUrl: "/",

  // Custom head elements
  head: `
    <meta name="description" content="Explore Federal Reserve Economic Data (FRED)">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>">
  `,

  // Theme configuration
  theme: "light",

  // Enable search
  search: true,

  // Source directory
  root: "src",

  // Build output directory
  output: "dist",

  // Environment variables that should be exposed to client-side code
  // using process.env
  env: ["FRED_API_KEY"],
};
