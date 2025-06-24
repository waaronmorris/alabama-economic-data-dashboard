import { html } from "npm:htl";

export function createGridControls(initialColumns, showGroupToggle = true, onGridChange) {
  const gridOptions = [
    { columns: 1, label: "1x1", description: "Single column" },
    { columns: 2, label: "2x2", description: "Two columns", active: initialColumns === 2 },
    { columns: 3, label: "3x3", description: "Three columns" },
    { columns: 4, label: "4x4", description: "Four columns" }
  ];

  const container = html`<div class="grid-controls">
    <div class="grid-controls-header">
      <h4>Grid Layout</h4>
    </div>
    <div class="grid-controls-buttons">
      ${gridOptions.map(
        (option) => html`
          <button
            class="grid-btn ${option.active ? "active" : ""}"
            data-columns="${option.columns}"
            title="${option.description}">
            ${option.label}
          </button>
        `
      )}
    </div>
    ${showGroupToggle
      ? html`
          <div class="grid-controls-toggle">
            <label class="toggle-label">
              <input type="checkbox" id="group-toggle" checked />
              <span class="toggle-text">Group by Category</span>
            </label>
          </div>
        `
      : ""}
  </div>`;

  // Add event listeners
  const buttons = container.querySelectorAll(".grid-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons
      buttons.forEach((btn) => btn.classList.remove("active"));
      // Add active class to clicked button
      button.classList.add("active");

      const columns = parseInt(button.dataset.columns);
      const groupToggle = container.querySelector("#group-toggle");
      const grouped = groupToggle ? groupToggle.checked : true;

      if (onGridChange) {
        onGridChange({ columns, grouped });
      }
    });
  });

  // Add group toggle event listener
  if (showGroupToggle) {
    const groupToggle = container.querySelector("#group-toggle");
    groupToggle.addEventListener("change", () => {
      const activeButton = container.querySelector(".grid-btn.active");
      const columns = activeButton ? parseInt(activeButton.dataset.columns) : 2;

      if (onGridChange) {
        onGridChange({ columns, grouped: groupToggle.checked });
      }
    });
  }

  return container;
}

// Utility function to get CSS grid class based on column count
export function getGridClass(columns) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4"
  };
  return gridClasses[columns] || "grid-cols-2";
}

// Utility function to calculate chart dimensions based on grid size
export function getChartDimensions(columns, isMobile = false) {
  if (isMobile) {
    return { width: 350, height: 250 };
  }

  const baseDimensions = {
    1: { width: 800, height: 400 },
    2: { width: 500, height: 300 },
    3: { width: 350, height: 250 },
    4: { width: 280, height: 200 }
  };

  return baseDimensions[columns] || baseDimensions[2];
}

// Helper function to get current grid settings from a grid controls element
export function getGridSettingsFromControls(controlsElement) {
  const activeButton = controlsElement.querySelector(".grid-btn.active");
  const groupToggle = controlsElement.querySelector("#group-toggle");

  return {
    columns: activeButton ? parseInt(activeButton.dataset.columns) : 2,
    grouped: groupToggle ? groupToggle.checked : true
  };
}
