import { html } from "npm:htl";

export function createDateFilter(data, initialStartDate, initialEndDate, onDateChange) {
  // Get the full date range from the data
  const allDates = data.map((d) => d.Date).sort((a, b) => a.getTime() - b.getTime());
  const minDate = allDates[0];
  const maxDate = allDates[allDates.length - 1];

  // Set defaults if not provided
  const defaultStartDate =
    initialStartDate || new Date(maxDate.getFullYear() - 5, maxDate.getMonth(), maxDate.getDate());
  const defaultEndDate = initialEndDate || maxDate;

  // Format date for input fields
  const formatDateForInput = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  // Create preset date ranges
  const presets = [
    { label: "1Y", years: 1 },
    { label: "2Y", years: 2 },
    { label: "5Y", years: 5, active: true },
    { label: "10Y", years: 10 },
    { label: "All Time", years: null }
  ];

  const container = html`<div class="date-filter">
    <div class="date-filter-header">
      <h4>Date Range</h4>
    </div>
    <div class="date-filter-controls">
      <div class="date-inputs">
        <div class="date-input-group">
          <label for="start-date">Start Date:</label>
          <input
            type="date"
            id="start-date"
            value="${formatDateForInput(defaultStartDate)}"
            min="${formatDateForInput(minDate)}"
            max="${formatDateForInput(maxDate)}" />
        </div>
        <div class="date-input-group">
          <label for="end-date">End Date:</label>
          <input
            type="date"
            id="end-date"
            value="${formatDateForInput(defaultEndDate)}"
            min="${formatDateForInput(minDate)}"
            max="${formatDateForInput(maxDate)}" />
        </div>
      </div>
      <div class="date-presets">
        ${presets.map(
          (preset) => html`
            <button class="preset-btn ${preset.active ? "active" : ""}" data-years="${preset.years}">
              ${preset.label}
            </button>
          `
        )}
      </div>
    </div>
  </div>`;

  // Add event listeners for date inputs
  const startInput = container.querySelector("#start-date");
  const endInput = container.querySelector("#end-date");

  const handleDateChange = () => {
    const startDate = startInput.value ? new Date(startInput.value) : null;
    const endDate = endInput.value ? new Date(endInput.value) : null;

    if (onDateChange) {
      onDateChange({ startDate, endDate });
    }
  };

  startInput.addEventListener("change", handleDateChange);
  endInput.addEventListener("change", handleDateChange);

  // Add event listeners for preset buttons
  const presetButtons = container.querySelectorAll(".preset-btn");
  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons
      presetButtons.forEach((btn) => btn.classList.remove("active"));
      // Add active class to clicked button
      button.classList.add("active");

      const years = button.dataset.years;
      let startDate, endDate;

      if (years === "null") {
        // All time
        startDate = minDate;
        endDate = maxDate;
      } else {
        // Calculate start date based on years
        const yearsNum = parseInt(years);
        startDate = new Date(maxDate.getFullYear() - yearsNum, maxDate.getMonth(), maxDate.getDate());
        endDate = maxDate;
      }

      // Update input values
      startInput.value = formatDateForInput(startDate);
      endInput.value = formatDateForInput(endDate);

      if (onDateChange) {
        onDateChange({ startDate, endDate });
      }
    });
  });

  return container;
}

// Utility function to filter data by date range
export function filterDataByDateRange(data, startDate, endDate) {
  if (!startDate && !endDate) return data;

  return data.filter((item) => {
    const itemDate = item.Date;
    const afterStart = !startDate || itemDate >= startDate;
    const beforeEnd = !endDate || itemDate <= endDate;
    return afterStart && beforeEnd;
  });
}

// Helper function to get current date range from a date filter element
export function getDateRangeFromFilter(filterElement) {
  const startInput = filterElement.querySelector("#start-date");
  const endInput = filterElement.querySelector("#end-date");

  return {
    startDate: startInput ? new Date(startInput.value) : null,
    endDate: endInput ? new Date(endInput.value) : null
  };
}
