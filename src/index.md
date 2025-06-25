---
title: FRED Economic Dashboard
theme: dashboard
toc: true
---

```js
import { html } from "npm:htl";
const INDICATORS = FileAttachment("data/indicators.json").json();
const CATEGORIES = FileAttachment("data/categories.json").json();
const CATEGORY_SERIES = FileAttachment("data/categorySeries.json").json();

// Import our new components
import { createDateFilter, filterDataByDateRange, getDateRangeFromFilter } from "./components/dateFilter.js";
import {
  createGridControls,
  getGridClass,
  getChartDimensions,
  getGridSettingsFromControls
} from "./components/gridControls.js";
```

```js
const INDICATOR_GROUPS = Object.values(INDICATORS)
  .flat()
  .map((indicator) => {
    return indicator.group;
  })
  .reduce((acc, group) => {
    if (!acc.includes(group)) {
      acc.push(group);
    }
    return acc;
  }, []);

const INDICATORS_FLAT = Object.values(INDICATORS)
  .flatMap((categoryIndicators) =>
    categoryIndicators.map((data) => {
      return {
        Indicator: data.id,
        Value: Number(data.value),
        Date: new Date(data.date),
        Units: data.units,
        [data.units]: data.value,
        Title: data.title,
        Description: data.description,
        Group: data.group
      };
    })
  )
  .sort((a, b) => a.Date.getTime() - b.Date.getTime());
```

```js
import * as Plot from "npm:@observablehq/plot";

function renderIndicatorPlot(indicator, dateRange, gridColumns, customColor = "steelblue") {
  let data = INDICATORS_FLAT.filter((item) => item.Indicator === indicator);

  // Apply date filtering
  if (dateRange && (dateRange.startDate || dateRange.endDate)) {
    data = filterDataByDateRange(data, dateRange.startDate, dateRange.endDate);
  }

  const indicatorInfo = INDICATORS_FLAT.find((item) => item.Indicator === indicator);
  const dimensions = getChartDimensions(gridColumns, window.innerWidth < 768);

  return Plot.lineY(data, {
    x: "Date",
    y: "Value",
    stroke: customColor,
    strokeWidth: 2,
    tip: true
  }).plot({
    title: indicatorInfo?.Title,
    x: { grid: true, label: "Date" },
    y: { grid: true, label: indicatorInfo?.Units },
    width: dimensions.width,
    height: dimensions.height,
    margin: 40
  });
}

function getSummaryStats(indicators, dateRange) {
  const stats = indicators.map(indicator => {
    let data = INDICATORS_FLAT.filter((item) => item.Indicator === indicator);
    
    // Apply date filtering
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      data = filterDataByDateRange(data, dateRange.startDate, dateRange.endDate);
    }
    
    if (data.length === 0) return null;
    
    const values = data.map(d => d.Value);
    const latest = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : null;
    const change = previous ? ((latest.Value - previous.Value) / previous.Value * 100) : 0;
    
    return {
      id: indicator,
      title: latest.Title,
      latest: latest.Value,
      units: latest.Units,
      change: change,
      date: latest.Date,
      trend: change > 0 ? "up" : change < 0 ? "down" : "stable"
    };
  }).filter(Boolean);
  
  return stats;
}

function renderSummaryCard(stat) {
  const trendIcon = stat.trend === "up" ? "📈" : stat.trend === "down" ? "📉" : "➡️";
  const trendColor = stat.trend === "up" ? "#27ae60" : stat.trend === "down" ? "#e74c3c" : "#95a5a6";
  
  return html`
    <div class="summary-card">
      <div class="summary-header">
        <h4>${stat.title}</h4>
        <span class="trend-icon">${trendIcon}</span>
      </div>
      <div class="summary-value">
        ${typeof stat.latest === 'number' ? 
          (stat.latest > 1000 ? stat.latest.toLocaleString() : stat.latest.toFixed(2)) : 
          stat.latest}
        <span class="units">${stat.units}</span>
      </div>
      <div class="summary-change" style="color: ${trendColor}">
        ${Math.abs(stat.change).toFixed(1)}% ${stat.trend === "up" ? "↑" : stat.trend === "down" ? "↓" : "→"}
      </div>
      <div class="summary-date">
        ${stat.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </div>
    </div>
  `;
}

function renderEconomicSection(title, indicators, dateRange, gridSettings, sectionColor = "steelblue") {
  const gridClass = getGridClass(gridSettings.columns);
  const summaryStats = getSummaryStats(indicators, dateRange);
  
  return html`
    <div class="economic-section">
      <div class="section-header">
        <h2>${title}</h2>
        <div class="summary-stats">
          ${summaryStats.map(stat => renderSummaryCard(stat))}
        </div>
      </div>
      <div class="section-charts">
        <div class="grid ${gridClass}">
          ${indicators.map(
            (indicator) => html`
              <div class="card-chart">${renderIndicatorPlot(indicator, dateRange, gridSettings.columns, sectionColor)}</div>
            `
          )}
        </div>
      </div>
    </div>
  `;
}

// Define indicator categories for better organization
const ECONOMIC_CATEGORIES = {
  "Core Economic Indicators": {
    indicators: ["GDPC1", "UNRATE", "CPIAUCSL", "FEDFUNDS"],
    color: "#3498db",
    description: "Fundamental measures of economic health and monetary policy"
  },
  "Income & Housing": {
    indicators: ["MEHOINUSA672N", "MSPUS"],
    color: "#27ae60", 
    description: "Income levels and housing market trends"
  },
  "Alabama Spotlight": {
    indicators: ["ALUR", "MEHOINUSALA646N", "MEDDAYONMARAL", "MEDLISPRIAL"],
    color: "#e74c3c",
    description: "Alabama-specific economic indicators"
  }
};
```

```js
// Test if data is loading
console.log("INDICATORS loaded:", INDICATORS);
console.log("INDICATORS_FLAT length:", INDICATORS_FLAT.length);
```

```js
// Simple test element
const testElement = html`<div>Data loaded: ${INDICATORS_FLAT.length} indicators</div>`;
```

```js
// State management for dashboard controls
let currentDateRange = {
  startDate: new Date(new Date().getFullYear() - 5, 0, 1),
  endDate: new Date()
};
let currentGridSettings = { columns: 2, grouped: true };

// Create dashboard content container
const dashboardContainer = html`<div class="dashboard-content-container"></div>`;

// Function to update dashboard content
function updateDashboard() {
  const content = html`<div class="dashboard-sections">
    ${Object.entries(ECONOMIC_CATEGORIES).map(([categoryName, categoryData]) => 
      renderEconomicSection(
        categoryName, 
        categoryData.indicators, 
        currentDateRange, 
        currentGridSettings, 
        categoryData.color
      )
    )}
  </div>`;

  dashboardContainer.innerHTML = "";
  dashboardContainer.appendChild(content);
}

// Calculate overall economic health score
function calculateEconomicHealth(dateRange) {
  const coreIndicators = ["GDPC1", "UNRATE", "CPIAUCSL"];
  const stats = getSummaryStats(coreIndicators, dateRange);
  
  if (stats.length === 0) return null;
  
  // Simple scoring: GDP up = good, Unemployment down = good, CPI moderate = good
  let score = 0;
  const gdp = stats.find(s => s.id === "GDPC1");
  const unemployment = stats.find(s => s.id === "UNRATE");
  const cpi = stats.find(s => s.id === "CPIAUCSL");
  
  if (gdp && gdp.trend === "up") score += 1;
  if (unemployment && unemployment.trend === "down") score += 1;
  if (cpi && Math.abs(cpi.change) < 3) score += 1; // Moderate inflation is good
  
  return {
    score: score,
    max: 3,
    percentage: Math.round((score / 3) * 100),
    status: score >= 2 ? "Strong" : score >= 1 ? "Moderate" : "Weak"
  };
}

// Create economic health indicator
const economicHealthContainer = html`<div class="health-indicator-container"></div>`;

function updateEconomicHealth() {
  const health = calculateEconomicHealth(currentDateRange);
  if (!health) return;
  
  const healthColor = health.status === "Strong" ? "#27ae60" : 
                     health.status === "Moderate" ? "#f39c12" : "#e74c3c";
  
  const content = html`
    <div class="economic-health-card">
      <div class="health-header">
        <h3>📊 Economic Health Score</h3>
        <div class="health-score" style="color: ${healthColor}">
          ${health.percentage}%
        </div>
      </div>
      <div class="health-status">
        <span class="status-badge" style="background: ${healthColor}">${health.status}</span>
        <span class="health-details">${health.score}/${health.max} indicators positive</span>
      </div>
    </div>
  `;
  
  economicHealthContainer.innerHTML = "";
  economicHealthContainer.appendChild(content);
}

// Create the date filter control with callback
const dateFilterControl = createDateFilter(
  INDICATORS_FLAT,
  currentDateRange.startDate,
  currentDateRange.endDate,
  (newDateRange) => {
    currentDateRange = newDateRange;
    updateDashboard();
    updateEconomicHealth();
  }
);

// Create the grid controls with callback
const gridControlsElement = createGridControls(currentGridSettings.columns, true, (newGridSettings) => {
  currentGridSettings = newGridSettings;
  updateDashboard();
});

// Initial dashboard content
updateDashboard();
updateEconomicHealth();
```

## Economic Dashboard Overview

```js
// Initialize economic health
updateEconomicHealth();
```

<div class="dashboard-intro">
  <div class="intro-content">
    <h1>Federal Reserve Economic Data Dashboard</h1>
    <p>Track key economic indicators across the United States with real-time data from the Federal Reserve Economic Data (FRED) API. Explore national trends and Alabama-specific metrics.</p>
  </div>
  ${INDICATORS_FLAT ? economicHealthContainer : html`<div>Loading economic health...</div>`}
</div>

<div class="dashboard-controls">
  <div class="controls-row">
    ${INDICATORS_FLAT ? dateFilterControl : html`<div>Loading date filter...</div>`}
    ${gridControlsElement}
  </div>
</div>

<div class="dashboard-content">
  ${INDICATORS_FLAT ? dashboardContainer : html`<div>Loading dashboard content...</div>`}
</div>

<style>
/* Dashboard Intro */
.dashboard-intro {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.intro-content h1 {
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.intro-content p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
  line-height: 1.5;
  max-width: 600px;
}

.economic-health-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 200px;
  text-align: center;
}

.health-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.health-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.health-score {
  font-size: 2rem;
  font-weight: 700;
}

.health-status {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.status-badge {
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.health-details {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Economic Sections */
.dashboard-sections {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.economic-section {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.section-header {
  background: var(--theme-background-secondary);
  padding: 2rem;
  border-bottom: 1px solid var(--theme-foreground-faint);
}

.section-header h2 {
  margin: 0 0 1.5rem 0;
  color: var(--theme-foreground-focus);
  font-size: 1.8rem;
  font-weight: 600;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.summary-card {
  background: var(--theme-background-primary);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--theme-foreground-faint);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.summary-header h4 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--theme-foreground-muted);
  font-weight: 500;
  line-height: 1.3;
}

.trend-icon {
  font-size: 1.2rem;
}

.summary-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--theme-foreground-focus);
  margin-bottom: 0.5rem;
  line-height: 1;
}

.summary-value .units {
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--theme-foreground-muted);
  margin-left: 0.25rem;
}

.summary-change {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.summary-date {
  font-size: 0.8rem;
  color: var(--theme-foreground-muted);
}

.section-charts {
  background: var(--theme-background-primary);
  padding: 2rem;
}

/* Dashboard Controls */
.dashboard-controls {
  background: var(--theme-background-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.controls-row {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

/* Date Filter Styles */
.date-filter {
  flex: 1;
  min-width: 300px;
}

.date-filter-header h4 {
  margin: 0 0 1rem 0;
  color: var(--theme-foreground-focus);
  font-size: 1rem;
  font-weight: 600;
}

.date-filter-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.date-inputs {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-input-group label {
  font-size: 0.875rem;
  color: var(--theme-foreground-muted);
  font-weight: 500;
}

.date-input-group input {
  padding: 0.5rem;
  border: 1px solid var(--theme-foreground-faint);
  border-radius: 6px;
  background: var(--theme-background-primary);
  color: var(--theme-foreground);
  font-size: 0.875rem;
}

.date-presets {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--theme-foreground-faint);
  border-radius: 6px;
  background: var(--theme-background-primary);
  color: var(--theme-foreground);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: var(--theme-background-secondary);
  border-color: var(--theme-primary);
}

.preset-btn.active {
  background: var(--theme-primary);
  color: white;
  border-color: var(--theme-primary);
}

/* Grid Controls Styles */
.grid-controls {
  flex: 1;
  min-width: 250px;
}

.grid-controls-header h4 {
  margin: 0 0 1rem 0;
  color: var(--theme-foreground-focus);
  font-size: 1rem;
  font-weight: 600;
}

.grid-controls-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.grid-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--theme-foreground-faint);
  border-radius: 6px;
  background: var(--theme-background-primary);
  color: var(--theme-foreground);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.grid-btn:hover {
  background: var(--theme-background-secondary);
  border-color: var(--theme-primary);
}

.grid-btn.active {
  background: var(--theme-primary);
  color: white;
  border-color: var(--theme-primary);
}

.grid-controls-toggle {
  margin-top: 0.5rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--theme-foreground);
}

.toggle-label input[type="checkbox"] {
  accent-color: var(--theme-primary);
}

/* Grid System */
.grid {
  display: grid;
  gap: 1.5rem;
  margin: 2rem 0;
}

.grid-cols-1 {
  grid-template-columns: 1fr;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* Responsive Grid */
@media (max-width: 1200px) {
  .grid-cols-4 {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }
  
  .controls-row {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .date-inputs {
    flex-direction: column;
  }
}

.card {
  background: var(--theme-background-secondary);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),
              0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.08),
              0 2px 4px rgba(0, 0, 0, 0.12);
}

.card-header h3 {
  margin: 0 0 1.5rem 0;
  color: var(--theme-foreground-focus);
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.card-chart {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--theme-background-primary);
  border-radius: 8px;
  overflow: hidden;
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  margin: 2rem 0;
  padding: 0 1rem;
}

.error-message {
  background: var(--theme-background-secondary);
  border: 2px solid #ff6b6b;
  border-radius: 8px;
  padding: 2rem;
  margin: 2rem 0;
  text-align: center;
}

.error-message h3 {
  color: #ff6b6b;
  margin: 0 0 1rem 0;
}

section {
  margin-bottom: 4rem;
}

section h2 {
  margin-bottom: 2rem;
  color: var(--theme-foreground-focus);
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  position: relative;
  padding-bottom: 0.5rem;
}

section h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 4px;
  background: var(--theme-primary);
  border-radius: 2px;
}

/* Add a subtle gradient background to the page */
body {
  background: linear-gradient(
    to bottom,
    var(--theme-background-primary),
    var(--theme-background-secondary)
  );
  min-height: 100vh;
}

/* Make the plots more visually appealing */
svg {
  border-radius: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard-intro {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
  }
  
  .intro-content h1 {
    font-size: 2rem;
  }
  
  .economic-health-card {
    min-width: auto;
    width: 100%;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .summary-card {
    padding: 1rem;
  }
  
  .summary-value {
    font-size: 1.5rem;
  }
  
  .section-header {
    padding: 1.5rem;
  }
  
  .section-charts {
    padding: 1.5rem;
  }
  
  .card {
    padding: 1.5rem;
  }
  
  .card-header h3 {
    font-size: 1.2rem;
  }
  
  section h2 {
    font-size: 1.6rem;
  }
  
  .controls-row {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .date-inputs {
    flex-direction: column;
  }
}

@media (max-width: 1024px) {
  .summary-stats {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .dashboard-intro {
    padding: 2.5rem 2rem;
  }
  
  .intro-content h1 {
    font-size: 2.2rem;
  }
}
</style>
