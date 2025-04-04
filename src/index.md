---
title: FRED Economic Dashboard
theme: dashboard
toc: true
---

```js
const INDICATORS = FileAttachment("data/indicators.json").json();
const CATEGORIES = FileAttachment("data/categories.json").json();
const CATEGORY_SERIES = FileAttachment("data/categorySeries.json").json();
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

function renderIndicatorPlot(indicator) {
  const data = INDICATORS_FLAT.filter((item) => item.Indicator === indicator);
  const indicatorInfo = INDICATORS_FLAT.find((item) => item.Indicator === indicator);
  return Plot.lineY(data, {
    x: "Date",
    y: "Value",
    stroke: "steelblue",
    strokeWidth: 1.5
  }).plot({
    title: indicatorInfo?.Title,
    x: { grid: true, label: "Date" },
    y: { grid: true, label: indicatorInfo?.Units },
    width: 500,
    height: 300,
    margin: 40
  });
}

function renderIndicatorGroup(group) {
  const indicators = INDICATORS_FLAT.filter((item) => item.Group === group).reduce((acc, item) => {
    if (!acc.includes(item.Indicator)) acc.push(item.Indicator);
    return acc;
  }, []);

  return html`
    <div class="card">
      <div class="card-header">
        <h3>${group}</h3>
      </div>
      <div class="grid grid-cols-2">
        ${indicators.map((indicator) => html` <div class="card-chart">${renderIndicatorPlot(indicator)}</div> `)}
      </div>
    </div>
  `;
}
```

## Economic Indicators Dashboard

<!-- Loop through INDICATOR_GROUPS and render each group -->

<div class="dashboard-grid">
  ${INDICATOR_GROUPS.map(group => renderIndicatorGroup(group))}
</div>

<style>
.grid {
  display: grid;
  gap: 1.5rem;
  margin: 2rem 0;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 1024px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
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
