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

function renderIndicatorPlot(indicator, dateRange, gridColumns) {
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
    stroke: "steelblue",
    strokeWidth: 1.5
  }).plot({
    title: indicatorInfo?.Title,
    x: { grid: true, label: "Date" },
    y: { grid: true, label: indicatorInfo?.Units },
    width: dimensions.width,
    height: dimensions.height,
    margin: 40
  });
}

function renderIndicatorGroup(group, dateRange, gridSettings) {
  const indicators = INDICATORS_FLAT.filter((item) => item.Group === group).reduce((acc, item) => {
    if (!acc.includes(item.Indicator)) acc.push(item.Indicator);
    return acc;
  }, []);

  const gridClass = getGridClass(gridSettings.columns);

  return html`
    <div class="card">
      <div class="card-header">
        <h3>${group}</h3>
      </div>
      <div class="grid ${gridClass}">
        ${indicators.map(
          (indicator) => html`
            <div class="card-chart">${renderIndicatorPlot(indicator, dateRange, gridSettings.columns)}</div>
          `
        )}
      </div>
    </div>
  `;
}
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
  const content = html`<div class="dashboard-grid">
    ${INDICATOR_GROUPS.map((group) => renderIndicatorGroup(group, currentDateRange, currentGridSettings))}
  </div>`;

  dashboardContainer.innerHTML = "";
  dashboardContainer.appendChild(content);
}

// Create the date filter control with callback
const dateFilterControl = createDateFilter(
  INDICATORS_FLAT,
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

## Economic Indicators Dashboard

${INDICATORS_FLAT ? html`<div>Successfully loaded ${INDICATORS_FLAT.length} indicators</div>` : html`<div>Loading indicators...</div>`}

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
  .card {
    padding: 1.5rem;
  }
  
  .card-header h3 {
    font-size: 1.2rem;
  }
  
  section h2 {
    font-size: 1.6rem;
  }
}
</style>
