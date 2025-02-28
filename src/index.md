---
title: FRED Economic Dashboard
theme: dashboard
toc: true
---

```ts
const INDICATORS = FileAttachment("data/indicators.json").json();
const CATEGORIES = FileAttachment("data/categories.json").json();
const CATEGORY_SERIES = FileAttachment("data/categorySeries.json").json();
console.log(CATEGORIES);
```

```js
const INDICATORS_FLAT = INDICATORS.flatMap((indicator, index) =>
  indicator.map((item) => {
    const data = JSON.parse(JSON.stringify(item));
    return {
      Indicator: Number(index),
      Value: Number(data.value),
      Date: new Date(data.date),
      Units: data.units,
      [data.units]: data.value,
      Title: data.title,
      Description: data.description
    };
  })
).sort((a, b) => a.Date.getTime() - b.Date.getTime());
```

```js
import * as Plot from "npm:@observablehq/plot";
```

## Economic Indicators Dashboard

### Advanced Indicators

### Base Indicators

<div class="grid grid-cols-2">
${Array.from({length: INDICATORS.length}, (_, indicator) => {
  const data = INDICATORS_FLAT.filter(item => item.Indicator === indicator);
  const indicatorInfo = INDICATORS_FLAT.find(item => item.Indicator === indicator);
  return html`
    <div class="card">
      ${resize((width) => Plot.lineY(data, {
        x: "Date",
        y: "Value",
        title: "Title",
      }).plot({
        title: indicatorInfo?.Title,
        x: {grid: true, label: "Date"},
        y: {grid: true, label: indicatorInfo?.Units}
      }))}
    </div>
  `;
})}
</div>

<style>
.grid {
display: grid;
gap: 1rem;
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
border-radius: 8px;
padding: 1.5rem;
box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-header h3 {
margin: 0 0 0.5rem 0;
color: var(--theme-foreground-focus);
}

.card-stats {
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 1rem;
margin: 1rem 0;
padding: 1rem;
background: var(--theme-background-tertiary);
border-radius: 6px;
}

.stat {
text-align: center;
}

.stat-title {
font-size: 0.875rem;
color: var(--theme-foreground-muted);
}

.stat-value {
font-size: 1.5rem;
font-weight: 600;
color: var(--theme-foreground-focus);
}

.stat-desc {
font-size: 0.875rem;
color: var(--theme-foreground-muted);
}

.card-chart {
margin: 1rem 0;
overflow: hidden;
}

.card-footer {
margin-top: 1rem;
padding-top: 1rem;
border-top: 1px solid var(--theme-background-tertiary);
}

.text-sm {
font-size: 0.875rem;
}

.text-muted {
color: var(--theme-foreground-muted);
}
</style>
