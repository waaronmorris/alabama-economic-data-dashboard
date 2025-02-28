import * as Plot from "npm:@observablehq/plot";
import React from "react";

export function timeline(events, { width, height } = {}) {
  return Plot.plot({
    width,
    height,
    marginTop: 30,
    x: { nice: true, label: null, tickFormat: "" },
    y: { axis: null },
    marks: [
      Plot.ruleX(events, { x: "year", y: "y", markerEnd: "dot", strokeWidth: 2.5 }),
      Plot.ruleY([0]),
      Plot.text(events, { x: "year", y: "y", text: "name", lineAnchor: "bottom", dy: -10, lineWidth: 10, fontSize: 12 })
    ]
  });
}

const Timeline = ({ data }) => {
  if (!data?.observations) return <div>No data available</div>;

  // Transform the data for the timeline
  const events = data.observations.map((obs) => ({
    year: new Date(obs.date),
    y: 0,
    name: `${new Date(obs.date).toLocaleDateString()}: ${parseFloat(obs.value).toLocaleString()}`
  }));

  return <div className="timeline-container">{timeline(events, { width: 800, height: 200 })}</div>;
};

export default Timeline;
