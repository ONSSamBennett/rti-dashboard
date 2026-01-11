<script>
  import { format } from "d3-format";

  // Props you already pass
  export let change = null;
  export let units = "";

  // NEW: identify the series and provide the metadata lookup
  export let seriesId = "";
  export let metadataBySeries = {}; // passed from +page.svelte via data.metadataBySeries

  // Optional label prop for year-over-year indicator
  export let label = "";

  // Control whether to show the label text
  export let showLabel = true;

  // Colors (your existing values)
  export let noChangeBackground = "#D9D9D9";
  export let decreaseBackground = "#D6D3E8";
  export let increaseBackground = "#F7DFCF";
  export let increaseArrowColor = "#C14E01";
  export let decreaseArrowColor = "#574F96";

  // Existing numeric formatting
  const formatPercent = format(".0%");
  const formatValue = (val) =>
    Math.abs(val) < 2 ? format(",.1f")(val) : format(",.0f")(val);

  // Normalize and guard the numeric change value
  const numericChange = typeof change === "number" ? change : Number(change);
  const absChange = Math.abs(numericChange);
  const isFiniteChange = Number.isFinite(numericChange);

  // Treat very small changes as effectively zero so they display "No change".
  // - For percentage (e.g. 0.5%) we expect `change` in percent units, threshold 0.5
  // - For percentage points we expect `change` in pp, threshold 0.05
  let isEffectivelyZero = false;
  if (change == null || !isFiniteChange) {
    // null/undefined or non-finite values: show "No change"
    isEffectivelyZero = true;
  } else if (units === "percentage") {
    isEffectivelyZero = absChange < 0.5; // less than 0.5%
  } else if (units === "percentage points") {
    isEffectivelyZero = absChange < 0.05; // less than 0.05 pp
  } else {
    isEffectivelyZero = absChange === 0;
  }

  const formattedChange = isFiniteChange
    ? units === "percentage"
      ? formatPercent(absChange / 100)
      : units === "percentage points"
      ? `${formatValue(absChange)}pp`
      : formatValue(absChange)
    : "";

  // For the "No change" display show a slightly more precise value
  // (one extra decimal for % and two for pp)
  let noChangeFormatted = "";
  if (isFiniteChange) {
    if (units === "percentage") {
      const formatPercentOne = format(".1%");
      noChangeFormatted = formatPercentOne(absChange / 100);
    } else if (units === "percentage points") {
      const formatPpTwo = format(".2f");
      noChangeFormatted = `${formatPpTwo(absChange)}pp`;
    } else {
      // fallback: one decimal place for other numeric units
      noChangeFormatted = format(",.1f")(absChange);
    }
  }

  // 🔎 Determine the label text
  let changeContextLabel;

  if (label === "year") {
    // Second indicator always shows "From past year"
    changeContextLabel = "From past year";
  } else {
    // First indicator: check the frequency from metadata
    const updated = metadataBySeries?.[seriesId]?.updated?.toLowerCase?.();

    if (
      updated === "daily" ||
      updated === "day" ||
      updated === "weekly" ||
      updated === "week"
    ) {
      changeContextLabel = "From past week";
    } else if (updated === "monthly" || updated === "month") {
      changeContextLabel = "From past month";
    } else if (updated === "quarterly" || updated === "quarter") {
      changeContextLabel = "From past quarter";
    } else {
      changeContextLabel = "From past period";
    }
  }
</script>

{#if showLabel}
  <p class="text-indicator-sm">
    {changeContextLabel}
  </p>
{/if}

{#if isEffectivelyZero}
  <div class="indicator-area no-change" style="background:{noChangeBackground}">
    No change
  </div>
{:else if numericChange > 0}
  <div class="indicator-area increase" style="background:{increaseBackground}">
    <svg width="14" height="16" viewBox="0 0 12 14">
      <path
        d="M5.5 1.5L5.5 12.5M5.5 1.5L9.5 5.5M5.5 1.5L1.5 5.5"
        fill="none"
        stroke={increaseArrowColor}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span class="change-value">{formattedChange}</span>
    higher
  </div>
{:else}
  <div class="indicator-area decrease" style="background:{decreaseBackground}">
    <svg width="14" height="16" viewBox="0 0 12 14">
      <path
        d="M5.5 12.5L5.5 1.5M5.5 12.5L1.5 8.5M5.5 12.5L9.5 8.5"
        fill="none"
        stroke={decreaseArrowColor}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span class="change-value">{formattedChange}</span>
    lower
  </div>
{/if}

<style>
  .text-indicator-sm {
    font-size: 14px;
    margin-bottom: 0;
    margin-top: 10px;
  }

  .indicator-area {
    font-size: 17px;
    padding: 10px 13px 10px 10px;
    margin-top: 6px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    vertical-align: middle;
  }

  .change-value {
    font-weight: 700;
  }
</style>
