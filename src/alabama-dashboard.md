---
title: Alabama Economic Dashboard
theme: dashboard
toc: true
---

```js
import { html } from "npm:htl";
const INDICATORS = FileAttachment("data/indicators.json").json();

// Import our shared components
import { createDateFilter, filterDataByDateRange, getDateRangeFromFilter } from "./components/dateFilter.js";
import {
  createGridControls,
  getGridClass,
  getChartDimensions,
  getGridSettingsFromControls
} from "./components/gridControls.js";
```

```js
// Filter to only Alabama indicators and national unemployment for comparison
const ALABAMA_INDICATORS = Object.values(INDICATORS)
  .flat()
  .filter((indicator) => indicator.group === "Alabama" || indicator.id === "UNRATE")
  .map((indicator) => {
    return {
      Indicator: indicator.id,
      Value: Number(indicator.value),
      Date: new Date(indicator.date),
      Units: indicator.units,
      [indicator.units]: indicator.value,
      Title: indicator.title,
      Description: indicator.description,
      Group: indicator.group === "Alabama" ? "Alabama" : "National Comparison"
    };
  })
  .sort((a, b) => a.Date.getTime() - b.Date.getTime());

// Get unique Alabama indicator IDs
const ALABAMA_INDICATOR_IDS = [...new Set(ALABAMA_INDICATORS.filter(d => d.Group === "Alabama").map(d => d.Indicator))];
```

```js
import * as Plot from "npm:@observablehq/plot";

function renderAlabamaIndicatorPlot(indicator, dateRange, gridColumns, includeNational = false) {
  let data = ALABAMA_INDICATORS.filter((item) => item.Indicator === indicator);
  
  // Add national comparison if requested and available
  let nationalData = [];
  if (includeNational && indicator === "ALUR") {
    nationalData = ALABAMA_INDICATORS.filter((item) => item.Indicator === "UNRATE");
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      nationalData = filterDataByDateRange(nationalData, dateRange.startDate, dateRange.endDate);
    }
  }

  // Apply date filtering
  if (dateRange && (dateRange.startDate || dateRange.endDate)) {
    data = filterDataByDateRange(data, dateRange.startDate, dateRange.endDate);
  }

  const indicatorInfo = ALABAMA_INDICATORS.find((item) => item.Indicator === indicator);
  const dimensions = getChartDimensions(gridColumns, window.innerWidth < 768);

  const marks = [
    Plot.lineY(data, {
      x: "Date",
      y: "Value",
      stroke: "#e74c3c",
      strokeWidth: 2.5,
      tip: true
    })
  ];

  // Add national comparison line if available
  if (nationalData.length > 0) {
    marks.push(
      Plot.lineY(nationalData, {
        x: "Date",
        y: "Value",
        stroke: "#3498db",
        strokeWidth: 2,
        strokeDasharray: "5,5",
        tip: true
      })
    );
  }

  return Plot.plot({
    title: indicatorInfo?.Title,
    subtitle: includeNational && nationalData.length > 0 ? "Red: Alabama, Blue (dashed): National" : null,
    x: { grid: true, label: "Date" },
    y: { grid: true, label: indicatorInfo?.Units },
    width: dimensions.width,
    height: dimensions.height,
    margin: 40,
    marks
  });
}

function renderAlabamaOverview(dateRange, gridSettings) {
  const gridClass = getGridClass(gridSettings.columns);
  
  return html`
    <div class="card">
      <div class="card-header">
        <h3>🏡 Alabama Economic Indicators</h3>
        <p class="card-subtitle">Comprehensive labor market data, income trends, and housing metrics tracking Alabama's economic health and performance</p>
      </div>
      <div class="grid ${gridClass}">
        ${ALABAMA_INDICATOR_IDS.map(
          (indicator) => html`
            <div class="card-chart">
              ${renderAlabamaIndicatorPlot(indicator, dateRange, gridSettings.columns, indicator === "ALUR")}
            </div>
          `
        )}
      </div>
    </div>
  `;
}

function renderComparisonSection(dateRange, gridSettings) {
  // Focus on unemployment comparison since we have both Alabama and National data
  const alabamaUnemployment = ALABAMA_INDICATORS.filter(d => d.Indicator === "ALUR" && d.Group === "Alabama");
  const nationalUnemployment = ALABAMA_INDICATORS.filter(d => d.Indicator === "UNRATE");
  
  if (alabamaUnemployment.length === 0 || nationalUnemployment.length === 0) {
    return html`<div class="error-message">Comparison data not available</div>`;
  }

  // Apply date filtering
  let alData = alabamaUnemployment;
  let natData = nationalUnemployment;
  
  if (dateRange && (dateRange.startDate || dateRange.endDate)) {
    alData = filterDataByDateRange(alData, dateRange.startDate, dateRange.endDate);
    natData = filterDataByDateRange(natData, dateRange.startDate, dateRange.endDate);
  }

  const dimensions = getChartDimensions(2, window.innerWidth < 768);

  const comparisonPlot = Plot.plot({
    title: "Alabama vs. National Unemployment Rate Comparison",
    subtitle: "Red: Alabama, Blue: National Average",
    x: { grid: true, label: "Date" },
    y: { grid: true, label: "Unemployment Rate (%)" },
    width: dimensions.width * 2,
    height: dimensions.height,
    margin: 40,
    marks: [
      Plot.lineY(alData, {
        x: "Date",
        y: "Value",
        stroke: "#e74c3c",
        strokeWidth: 3,
        tip: true
      }),
      Plot.lineY(natData, {
        x: "Date",
        y: "Value", 
        stroke: "#3498db",
        strokeWidth: 3,
        tip: true
      })
    ]
  });

  // Calculate latest difference
  const latestAL = alData[alData.length - 1]?.Value || 0;
  const latestNational = natData[natData.length - 1]?.Value || 0;
  const difference = (latestAL - latestNational).toFixed(1);
  const comparison = difference > 0 ? "higher" : "lower";
  const absoluteDiff = Math.abs(difference);

  return html`
    <div class="card">
      <div class="card-header">
        <h3>📊 Alabama vs. National Comparison</h3>
        <p class="card-subtitle">How Alabama's unemployment rate compares to the national average</p>
      </div>
      <div class="comparison-content">
        <div class="comparison-stats">
          <div class="stat-item">
            <span class="stat-label">Alabama Current Rate</span>
            <span class="stat-value alabama-color">${latestAL}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">National Average</span>
            <span class="stat-value national-color">${latestNational}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Difference</span>
            <span class="stat-value ${difference > 0 ? 'negative' : 'positive'}">${absoluteDiff}% ${comparison}</span>
          </div>
        </div>
        <div class="chart-container">
          ${comparisonPlot}
        </div>
      </div>
    </div>
  `;
}
```

```js
// State management for dashboard controls
let currentDateRange = {
  startDate: new Date(new Date().getFullYear() - 5, 0, 1),
  endDate: new Date()
};
let currentGridSettings = { columns: 2, grouped: true };

// Create dashboard content containers
const overviewContainer = html`<div class="overview-container"></div>`;
const comparisonContainer = html`<div class="comparison-container"></div>`;

// Function to update dashboard content
function updateDashboard() {
  const overviewContent = renderAlabamaOverview(currentDateRange, currentGridSettings);
  const comparisonContent = renderComparisonSection(currentDateRange, currentGridSettings);

  overviewContainer.innerHTML = "";
  overviewContainer.appendChild(overviewContent);
  
  comparisonContainer.innerHTML = "";
  comparisonContainer.appendChild(comparisonContent);
}

// Create the date filter control with callback
const dateFilterControl = createDateFilter(
  ALABAMA_INDICATORS,
  currentDateRange.startDate,
  currentDateRange.endDate,
  (newDateRange) => {
    currentDateRange = newDateRange;
    updateDashboard();
  }
);

// Create the grid controls with callback
const gridControlsElement = createGridControls(currentGridSettings.columns, true, (newGridSettings) => {
  currentGridSettings = newGridSettings;
  updateDashboard();
});

// Initial dashboard content
updateDashboard();
```

# Alabama Economic Dashboard

Explore key economic indicators specific to Alabama, including comprehensive labor market metrics, income data, and housing statistics. Track Alabama's civilian labor force, unemployment trends, and economic performance compared to national averages.

<div class="dashboard-intro">
  <div class="intro-stats">
    <div class="intro-stat">
      <span class="intro-number">${ALABAMA_INDICATOR_IDS.length}</span>
      <span class="intro-label">Alabama Indicators</span>
    </div>
    <div class="intro-stat">
      <span class="intro-number">${ALABAMA_INDICATORS.length}</span>
      <span class="intro-label">Data Points</span>
    </div>
    <div class="intro-stat">
      <span class="intro-number">${Math.round((new Date() - new Date(Math.min(...ALABAMA_INDICATORS.map(d => d.Date)))) / (365.25 * 24 * 60 * 60 * 1000))}</span>
      <span class="intro-label">Years of Data</span>
    </div>
  </div>
</div>

## Dashboard Controls

<div class="dashboard-controls">
  <div class="controls-row">
    ${ALABAMA_INDICATORS.length > 0 ? dateFilterControl : html`<div>Loading date filter...</div>`}
    ${gridControlsElement}
  </div>
</div>

## Alabama Economic Indicators

<div class="dashboard-content">
  ${ALABAMA_INDICATORS.length > 0 ? overviewContainer : html`<div>Loading Alabama indicators...</div>`}
</div>

## Performance Comparison

<div class="dashboard-content">
  ${ALABAMA_INDICATORS.length > 0 ? comparisonContainer : html`<div>Loading comparison data...</div>`}
</div>

## Labor Force Context

Understanding Alabama's labor market requires looking beyond just unemployment rates. The **Civilian Labor Force** represents the total number of people aged 16 and over who are either employed or actively seeking employment. This metric helps contextualize unemployment trends:

- **Labor Force Size**: Shows the scale of Alabama's workforce and long-term participation trends
- **Economic Capacity**: Larger labor forces indicate greater economic potential and population growth
- **Context for Unemployment**: A 5% unemployment rate means different things when the labor force is 2.1 million vs 2.3 million people

When combined with unemployment rates, labor force data reveals whether job market changes reflect economic growth, population shifts, or changing participation patterns. This comprehensive view helps policymakers and businesses make more informed decisions about Alabama's economic trajectory.

<style>
/* Inherit base styles from index.md */
@import url("./index.css");

/* Alabama-specific styling */
.dashboard-intro {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: center;
}

.intro-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-top: 1rem;
}

.intro-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.intro-number {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}

.intro-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 0.5rem;
}

.card-subtitle {
  color: var(--theme-foreground-muted);
  font-size: 0.95rem;
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
}

.comparison-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.comparison-stats {
  display: flex;
  justify-content: space-around;
  background: var(--theme-background-primary);
  padding: 1.5rem;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--theme-foreground-muted);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
}

.alabama-color {
  color: #e74c3c;
}

.national-color {
  color: #3498db;
}

.positive {
  color: #27ae60;
}

.negative {
  color: #e74c3c;
}

.chart-container {
  display: flex;
  justify-content: center;
}

/* Responsive adjustments for Alabama dashboard */
@media (max-width: 768px) {
  .intro-stats {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .comparison-stats {
    flex-direction: column;
    text-align: center;
  }
  
  .intro-number {
    font-size: 2rem;
  }
}

/* Dashboard Controls - inherit from main dashboard */
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
</style>