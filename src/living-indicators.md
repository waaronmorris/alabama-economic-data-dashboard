---
title: Economic Insights
theme: dashboard
toc: true
---

```js
import { html } from "npm:htl";
import * as Plot from "npm:@observablehq/plot";

const INDICATORS = FileAttachment("data/indicators.json").json();

// Import our components
import { createDateFilter, filterDataByDateRange, getDateRangeFromFilter } from "./components/dateFilter.js";
import {
  createGridControls,
  getGridClass,
  getChartDimensions,
  getGridSettingsFromControls
} from "./components/gridControls.js";
```

```js
// Process the indicators data
const INDICATORS_FLAT = [];

for (const [key, value] of Object.entries(INDICATORS)) {
  if (Array.isArray(value)) {
    value.forEach((data) => {
      INDICATORS_FLAT.push({
        Indicator: data.id,
        Value: Number(data.value),
        Date: new Date(data.date),
        Units: data.units,
        [data.units]: data.value,
        Title: data.title,
        Description: data.description,
        Group: data.group
      });
    });
  }
}

INDICATORS_FLAT.sort((a, b) => a.Date.getTime() - b.Date.getTime());
```

```js
// Define insight categories with better organization
const INSIGHT_CATEGORIES = {
  "Economic Health": {
    insights: ["MISERY_INDEX", "REAL_INTEREST_RATE"],
    color: "#e74c3c",
    description: "Key indicators of economic stress and financial conditions affecting everyday Americans",
    icon: "📊"
  },
  "Housing Market": {
    insights: ["HOUSING_AFFORDABILITY", "HOUSING_DIVERGENCE"],
    color: "#27ae60", 
    description: "Analysis of housing affordability and regional market differences",
    icon: "🏠"
  },
  "Growth Analysis": {
    insights: ["ECONOMIC_GROWTH_INDEX"],
    color: "#3498db",
    description: "Comprehensive measures of economic expansion and prosperity",
    icon: "📈"
  }
};

// Define improved insight definitions
const ECONOMIC_INSIGHTS = {
  MISERY_INDEX: {
    id: "MISERY_INDEX",
    title: "Economic Misery Index",
    subtitle: "How tough are times for average Americans?",
    description: "Combines unemployment and inflation rates to measure economic hardship. Higher values indicate more difficult economic conditions for families.",
    formula: "Unemployment Rate + Inflation Rate",
    components: ["UNRATE", "CPIAUCSL"],
    units: "Percentage Points",
    category: "Economic Health",
    interpretation: {
      low: "Times are relatively good - jobs are available and prices are stable",
      medium: "Moderate economic stress - some challenges with jobs or rising prices", 
      high: "Economic hardship - difficult job market and/or rapidly rising prices"
    }
  },
  REAL_INTEREST_RATE: {
    id: "REAL_INTEREST_RATE",
    title: "Real Interest Rate",
    subtitle: "Are your savings actually growing?",
    description: "Shows whether interest rates are keeping up with inflation. Positive means your money grows, negative means inflation is eating your savings.",
    formula: "Federal Funds Rate - Inflation Rate",
    components: ["FEDFUNDS", "CPIAUCSL"],
    units: "Percentage Points",
    category: "Economic Health",
    interpretation: {
      positive: "Good for savers - interest rates beat inflation",
      negative: "Tough for savers - inflation is higher than interest rates",
      neutral: "Break-even - interest rates match inflation"
    }
  },
  HOUSING_AFFORDABILITY: {
    id: "HOUSING_AFFORDABILITY",
    title: "Housing Affordability Comparison",
    subtitle: "How affordable is housing across different regions?",
    description: "Compares how much income is needed to afford a typical home. Higher values mean housing is more affordable relative to income.",
    formula: "Median Income / Median Home Price × 100",
    components: ["MEHOINUSA672N", "MSPUS", "MEHOINUSALA646N", "MEDLISPRIAL"],
    units: "Affordability Index",
    category: "Housing Market",
    interpretation: {
      high: "Housing is relatively affordable compared to incomes",
      medium: "Moderate housing affordability challenges",
      low: "Housing is expensive relative to typical incomes"
    }
  },
  HOUSING_DIVERGENCE: {
    id: "HOUSING_DIVERGENCE", 
    title: "Regional Housing Gap",
    subtitle: "How does Alabama compare to national housing costs?",
    description: "Shows whether Alabama housing is more or less affordable than the national average. Positive means Alabama is more affordable.",
    formula: "Alabama Affordability - National Affordability",
    components: ["HOUSING_AFFORDABILITY"],
    units: "Percentage Point Difference",
    category: "Housing Market",
    interpretation: {
      positive: "Alabama housing is more affordable than national average",
      negative: "Alabama housing is less affordable than national average",
      neutral: "Alabama housing affordability matches national average"
    }
  },
  ECONOMIC_GROWTH_INDEX: {
    id: "ECONOMIC_GROWTH_INDEX",
    title: "Economic Momentum Index",
    subtitle: "Is the economy expanding or contracting?",
    description: "Combines GDP growth with employment trends to show overall economic momentum and direction.",
    formula: "GDP Growth Rate + Employment Change Rate",
    components: ["GDPC1", "UNRATE"],
    units: "Growth Index Points",
    category: "Growth Analysis",
    interpretation: {
      positive: "Economy is expanding - more jobs and higher output",
      negative: "Economic contraction - declining output and employment",
      neutral: "Economic stability - little change in growth or employment"
    }
  }
};
```

```js
// Calculate composite indicators
function calculateMiseryIndex(unemploymentData, inflationData, dateRange) {
  unemploymentData = filterDataByDateRange(unemploymentData, dateRange.startDate, dateRange.endDate);
  inflationData = filterDataByDateRange(inflationData, dateRange.startDate, dateRange.endDate);

  const commonDates = unemploymentData
    .map((d) => d.Date)
    .filter((date) => inflationData.some((d) => d.Date.getTime() === date.getTime()));

  return commonDates.map((date) => {
    const unemployment = unemploymentData.find((d) => d.Date.getTime() === date.getTime())?.Value || 0;
    const inflation = inflationData.find((d) => d.Date.getTime() === date.getTime())?.Value || 0;

    return {
      Date: date,
      Value: unemployment + inflation,
      Unemployment: unemployment,
      Inflation: inflation
    };
  });
}

function calculateHousingAffordability(incomeData, priceData, dateRange) {
  incomeData = filterDataByDateRange(incomeData, dateRange.startDate, dateRange.endDate);
  priceData = filterDataByDateRange(priceData, dateRange.startDate, dateRange.endDate);

  const commonDates = incomeData
    .map((d) => d.Date)
    .filter((date) => priceData.some((d) => d.Date.getTime() === date.getTime()));

  return commonDates.map((date) => {
    const income = incomeData.find((d) => d.Date.getTime() === date.getTime())?.Value || 0;
    const price = priceData.find((d) => d.Date.getTime() === date.getTime())?.Value || 0;
    const affordability = price > 0 ? (income / price) * 100 : 0;

    return {
      Date: date,
      Value: affordability,
      Income: income,
      Price: price
    };
  });
}

function calculateRealInterestRate(interestData, inflationData, dateRange) {
  interestData = filterDataByDateRange(interestData, dateRange.startDate, dateRange.endDate);
  inflationData = filterDataByDateRange(inflationData, dateRange.startDate, dateRange.endDate);

  const commonDates = interestData
    .map((d) => d.Date)
    .filter((date) => inflationData.some((d) => d.Date.getTime() === date.getTime()));

  return commonDates.map((date) => {
    const interest = interestData.find((d) => d.Date.getTime() === date.getTime())?.Value || 0;
    const inflation = inflationData.find((d) => d.Date.getTime() === date.getTime())?.Value || 0;

    return {
      Date: date,
      Value: interest - inflation,
      Interest: interest,
      Inflation: inflation
    };
  });
}

function calculateEWMA(data, smoothingFactor = 0.3) {
  if (!data || data.length === 0) return [];
  
  const sortedData = [...data].sort((a, b) => a.Date.getTime() - b.Date.getTime());
  const result = [{ Date: sortedData[0].Date, Value: sortedData[0].Value }];

  for (let i = 1; i < sortedData.length; i++) {
    const currentValue = sortedData[i].Value;
    const previousEWMA = result[i - 1].Value;
    const ewma = smoothingFactor * currentValue + (1 - smoothingFactor) * previousEWMA;

    result.push({
      Date: sortedData[i].Date,
      Value: ewma
    });
  }

  return result;
}
```

```js
// Get summary statistics for insights
function getInsightSummaryStats(insightId, dateRange) {
  let data = [];
  let latestValue = null;
  let trend = "stable";
  let interpretation = "";
  
  const insight = ECONOMIC_INSIGHTS[insightId];
  
  if (insightId === "MISERY_INDEX") {
    const unemploymentData = INDICATORS_FLAT.filter((item) => item.Indicator === "UNRATE");
    const inflationData = INDICATORS_FLAT.filter((item) => item.Indicator === "CPIAUCSL");
    data = calculateMiseryIndex(unemploymentData, inflationData, dateRange);
  } else if (insightId === "REAL_INTEREST_RATE") {
    const interestData = INDICATORS_FLAT.filter((item) => item.Indicator === "FEDFUNDS");
    const inflationData = INDICATORS_FLAT.filter((item) => item.Indicator === "CPIAUCSL");
    data = calculateRealInterestRate(interestData, inflationData, dateRange);
  } else if (insightId === "HOUSING_AFFORDABILITY") {
    const nationalIncomeData = INDICATORS_FLAT.filter((item) => item.Indicator === "MEHOINUSA672N");
    const nationalPriceData = INDICATORS_FLAT.filter((item) => item.Indicator === "MSPUS");
    data = calculateHousingAffordability(nationalIncomeData, nationalPriceData, dateRange);
  }
  
  if (data.length > 0) {
    const latest = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : null;
    latestValue = latest.Value;
    
    if (previous) {
      const change = latest.Value - previous.Value;
      trend = Math.abs(change) < 0.1 ? "stable" : (change > 0 ? "increasing" : "decreasing");
    }
    
    // Generate interpretation based on insight type and value
    if (insightId === "MISERY_INDEX") {
      if (latestValue < 8) interpretation = insight.interpretation.low;
      else if (latestValue < 15) interpretation = insight.interpretation.medium;
      else interpretation = insight.interpretation.high;
    } else if (insightId === "REAL_INTEREST_RATE") {
      if (latestValue > 1) interpretation = insight.interpretation.positive;
      else if (latestValue < -1) interpretation = insight.interpretation.negative;
      else interpretation = insight.interpretation.neutral;
    } else if (insightId === "HOUSING_AFFORDABILITY") {
      if (latestValue > 25) interpretation = insight.interpretation.high;
      else if (latestValue > 20) interpretation = insight.interpretation.medium;
      else interpretation = insight.interpretation.low;
    }
  }
  
  return {
    id: insightId,
    title: insight.title,
    subtitle: insight.subtitle,
    latest: latestValue,
    units: insight.units,
    trend: trend,
    interpretation: interpretation,
    date: data.length > 0 ? data[data.length - 1].Date : null
  };
}

function renderInsightSummaryCard(stat) {
  const trendIcon = stat.trend === "increasing" ? "📈" : stat.trend === "decreasing" ? "📉" : "➡️";
  const trendColor = stat.trend === "increasing" ? "#e74c3c" : stat.trend === "decreasing" ? "#27ae60" : "#95a5a6";
  
  // Special handling for some indicators where decreasing is better
  const isGoodTrend = (stat.id === "MISERY_INDEX" && stat.trend === "decreasing") ||
                     (stat.id === "REAL_INTEREST_RATE" && stat.trend === "increasing") ||
                     (stat.id === "HOUSING_AFFORDABILITY" && stat.trend === "increasing");
  
  const finalTrendColor = isGoodTrend ? "#27ae60" : 
                         (stat.trend === "stable" ? "#95a5a6" : "#e74c3c");
  
  return html`
    <div class="insight-summary-card">
      <div class="insight-header">
        <div class="insight-title">
          <h4>${stat.title}</h4>
          <p class="insight-subtitle">${stat.subtitle}</p>
        </div>
        <span class="insight-trend-icon">${trendIcon}</span>
      </div>
      <div class="insight-value">
        ${typeof stat.latest === 'number' ? stat.latest.toFixed(1) : 'N/A'}
        <span class="insight-units">${stat.units}</span>
      </div>
      <div class="insight-trend" style="color: ${finalTrendColor}">
        ${stat.trend} trend
      </div>
      <div class="insight-interpretation">
        ${stat.interpretation}
      </div>
      ${stat.date ? html`<div class="insight-date">
        ${stat.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </div>` : ''}
    </div>
  `;
}
```

```js
// Enhanced chart rendering with better styling
function renderInsightChart(insightId, dateRange, gridColumns) {
  const insight = ECONOMIC_INSIGHTS[insightId];
  const dimensions = getChartDimensions(gridColumns, window.innerWidth < 768);
  const categoryData = INSIGHT_CATEGORIES[insight.category];
  
  if (insightId === "MISERY_INDEX") {
    const unemploymentData = INDICATORS_FLAT.filter((item) => item.Indicator === "UNRATE");
    const inflationData = INDICATORS_FLAT.filter((item) => item.Indicator === "CPIAUCSL");
    const miseryData = calculateMiseryIndex(unemploymentData, inflationData, dateRange);
    const smoothedData = calculateEWMA(miseryData, 0.4);

    return Plot.plot({
      title: insight.title,
      subtitle: "Higher values indicate greater economic hardship",
      x: { grid: true, label: "Date" },
      y: { grid: true, label: insight.units },
      width: dimensions.width,
      height: dimensions.height,
      margin: 40,
      marks: [
        Plot.lineY(miseryData, {
          x: "Date",
          y: "Value", 
          stroke: categoryData.color,
          strokeWidth: 1.5,
          strokeOpacity: 0.7
        }),
        Plot.lineY(smoothedData, {
          x: "Date",
          y: "Value",
          stroke: categoryData.color,
          strokeWidth: 3
        }),
        Plot.dot(miseryData.filter((d, i) => i % 3 === 0), {
          x: "Date",
          y: "Value",
          fill: categoryData.color,
          r: 3,
          tip: true
        })
      ]
    });
  } else if (insightId === "REAL_INTEREST_RATE") {
    const interestData = INDICATORS_FLAT.filter((item) => item.Indicator === "FEDFUNDS");
    const inflationData = INDICATORS_FLAT.filter((item) => item.Indicator === "CPIAUCSL");
    const realRateData = calculateRealInterestRate(interestData, inflationData, dateRange);
    const smoothedData = calculateEWMA(realRateData, 0.3);

    return Plot.plot({
      title: insight.title,
      subtitle: "Positive values benefit savers, negative values favor borrowers",
      x: { grid: true, label: "Date" },
      y: { grid: true, label: insight.units },
      width: dimensions.width,
      height: dimensions.height,
      margin: 40,
      marks: [
        Plot.ruleY([0], { stroke: "#666", strokeDasharray: "3,3" }),
        Plot.areaY(realRateData, {
          x: "Date",
          y: "Value",
          fill: (d) => d.Value >= 0 ? "rgba(39, 174, 96, 0.2)" : "rgba(231, 76, 60, 0.2)"
        }),
        Plot.lineY(realRateData, {
          x: "Date",
          y: "Value",
          stroke: categoryData.color,
          strokeWidth: 1.5,
          strokeOpacity: 0.7
        }),
        Plot.lineY(smoothedData, {
          x: "Date",
          y: "Value",
          stroke: categoryData.color,
          strokeWidth: 3
        })
      ]
    });
  } else if (insightId === "HOUSING_AFFORDABILITY") {
    const nationalIncomeData = INDICATORS_FLAT.filter((item) => item.Indicator === "MEHOINUSA672N");
    const nationalPriceData = INDICATORS_FLAT.filter((item) => item.Indicator === "MSPUS");
    const alabamaIncomeData = INDICATORS_FLAT.filter((item) => item.Indicator === "MEHOINUSALA646N");
    const alabamaPriceData = INDICATORS_FLAT.filter((item) => item.Indicator === "MEDLISPRIAL");
    
    const nationalData = calculateHousingAffordability(nationalIncomeData, nationalPriceData, dateRange);
    const alabamaData = calculateHousingAffordability(alabamaIncomeData, alabamaPriceData, dateRange);

    return Plot.plot({
      title: insight.title,
      subtitle: "Higher values indicate more affordable housing relative to income",
      x: { grid: true, label: "Date" },
      y: { grid: true, label: insight.units },
      width: dimensions.width,
      height: dimensions.height,
      margin: 40,
      marks: [
        Plot.lineY(nationalData, {
          x: "Date",
          y: "Value",
          stroke: "#3498db",
          strokeWidth: 2.5,
          tip: true
        }),
        Plot.lineY(alabamaData, {
          x: "Date",
          y: "Value",
          stroke: "#e74c3c",
          strokeWidth: 2.5,
          tip: true
        }),
        Plot.text([{x: nationalData[0]?.Date, y: 32, text: "National", fill: "#3498db"}], {
          x: "x", y: "y", text: "text", fill: "fill", dx: 20
        }),
        Plot.text([{x: alabamaData[0]?.Date, y: 30, text: "Alabama", fill: "#e74c3c"}], {
          x: "x", y: "y", text: "text", fill: "fill", dx: 20
        })
      ]
    });
  }
  
  return html`<div>Chart for ${insightId} not implemented yet</div>`;
}

function renderInsightSection(categoryName, categoryData, dateRange, gridSettings) {
  const gridClass = getGridClass(gridSettings.columns);
  const summaryStats = categoryData.insights.map(insightId => getInsightSummaryStats(insightId, dateRange));
  
  return html`
    <div class="insight-section">
      <div class="insight-section-header">
        <h2>${categoryData.icon} ${categoryName}</h2>
        <p class="section-description">${categoryData.description}</p>
        <div class="insight-summary-stats">
          ${summaryStats.map(stat => renderInsightSummaryCard(stat))}
        </div>
      </div>
      <div class="insight-section-charts">
        <div class="grid ${gridClass}">
          ${categoryData.insights.map(
            (insightId) => html`
              <div class="insight-chart-container">
                ${renderInsightChart(insightId, dateRange, gridSettings.columns)}
              </div>
            `
          )}
        </div>
      </div>
    </div>
  `;
}
```

```js
// State management for insights dashboard
let currentDateRange = {
  startDate: new Date(new Date().getFullYear() - 5, 0, 1),
  endDate: new Date()
};
let currentGridSettings = { columns: 1, grouped: true };

// Create dashboard content container
const insightsDashboardContainer = html`<div class="insights-dashboard-container"></div>`;

// Function to update insights dashboard
function updateInsightsDashboard() {
  const content = html`<div class="insights-dashboard-sections">
    ${Object.entries(INSIGHT_CATEGORIES).map(([categoryName, categoryData]) => 
      renderInsightSection(categoryName, categoryData, currentDateRange, currentGridSettings)
    )}
  </div>`;

  insightsDashboardContainer.innerHTML = "";
  insightsDashboardContainer.appendChild(content);
}

// Create controls
const insightsDateFilterControl = createDateFilter(
  INDICATORS_FLAT,
  currentDateRange.startDate,
  currentDateRange.endDate,
  (newDateRange) => {
    currentDateRange = newDateRange;
    updateInsightsDashboard();
  }
);

const insightsGridControlsElement = createGridControls(currentGridSettings.columns, false, (newGridSettings) => {
  currentGridSettings = newGridSettings;
  updateInsightsDashboard();
});

// Initial dashboard content
updateInsightsDashboard();
```

# Economic Insights

Explore advanced economic analysis through composite indicators that combine multiple data sources to reveal deeper insights about economic conditions, housing markets, and financial trends.

<div class="insights-intro">
  <div class="intro-content">
    <h1>📊 Economic Insights Dashboard</h1>
    <p>Understanding complex economic relationships through advanced indicators that combine multiple data sources. These insights help reveal the bigger picture of economic conditions affecting everyday Americans.</p>
  </div>
  <div class="insights-overview">
    <div class="overview-stat">
      <span class="stat-number">${Object.keys(ECONOMIC_INSIGHTS).length}</span>
      <span class="stat-label">Composite Indicators</span>
    </div>
    <div class="overview-stat">
      <span class="stat-number">${Object.keys(INSIGHT_CATEGORIES).length}</span>
      <span class="stat-label">Analysis Categories</span>
    </div>
  </div>
</div>

## Dashboard Controls

<div class="dashboard-controls">
  <div class="controls-row">
    ${INDICATORS_FLAT.length > 0 ? insightsDateFilterControl : html`<div>Loading date filter...</div>`}
    ${insightsGridControlsElement}
  </div>
</div>

## Economic Analysis

<div class="insights-dashboard-content">
  ${INDICATORS_FLAT.length > 0 ? insightsDashboardContainer : html`<div>Loading insights...</div>`}
</div>

<style>
/* Insights-specific styling */
.insights-intro {
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

.insights-overview {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.overview-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 120px;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 0.5rem;
}

/* Insight Sections */
.insights-dashboard-sections {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.insight-section {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.insight-section-header {
  background: var(--theme-background-secondary);
  padding: 2rem;
  border-bottom: 1px solid var(--theme-foreground-faint);
}

.insight-section-header h2 {
  margin: 0 0 1rem 0;
  color: var(--theme-foreground-focus);
  font-size: 1.8rem;
  font-weight: 600;
}

.section-description {
  margin: 0 0 2rem 0;
  color: var(--theme-foreground-muted);
  font-size: 1.1rem;
  line-height: 1.5;
}

.insight-summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.insight-summary-card {
  background: var(--theme-background-primary);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--theme-foreground-faint);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.insight-summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.insight-title h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: var(--theme-foreground-focus);
  font-weight: 600;
}

.insight-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--theme-foreground-muted);
  line-height: 1.3;
}

.insight-trend-icon {
  font-size: 1.4rem;
}

.insight-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--theme-foreground-focus);
  margin-bottom: 0.5rem;
  line-height: 1;
}

.insight-units {
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--theme-foreground-muted);
  margin-left: 0.25rem;
}

.insight-trend {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  text-transform: capitalize;
}

.insight-interpretation {
  font-size: 0.9rem;
  color: var(--theme-foreground-muted);
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.insight-date {
  font-size: 0.8rem;
  color: var(--theme-foreground-faint);
}

.insight-section-charts {
  background: var(--theme-background-primary);
  padding: 2rem;
}

.insight-chart-container {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--theme-background-secondary);
  border-radius: 8px;
  overflow: hidden;
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .insights-intro {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
  }
  
  .intro-content h1 {
    font-size: 2rem;
  }
  
  .insights-overview {
    justify-content: center;
  }
  
  .insight-summary-stats {
    grid-template-columns: 1fr;
  }
  
  .insight-section-header {
    padding: 1.5rem;
  }
  
  .insight-section-charts {
    padding: 1.5rem;
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
  .insight-summary-stats {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}
</style>