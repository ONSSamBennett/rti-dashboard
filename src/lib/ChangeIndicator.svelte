<script>
  import { format } from "d3-format";
  import {
    toBoolean,
    toFiniteNumberOrNaN,
    toNonNegativeIntOrNull,
  } from "$lib/coerce.js";

  export let change = null;
  export let units = "";

  //  identify the series and provide the metadata lookup
  export let seriesId = "";
  export let metadataBySeries = {}; // passed from +page.svelte via data.metadataBySeries

  // Optional label prop for year-over-year indicator
  export let label = "";

  // Control whether to show the label text
  export let showLabel = true;

  // Colours
  export let noChangeBackground = "#D9D9D9";
  export let decreaseBackground = "#D6D3E8";
  export let increaseBackground = "#F7DFCF";
  export let increaseArrowColor = "#C14E01";
  export let decreaseArrowColor = "#574F96";

  // Existing numeric formatting
  const formatPercent = format(".0%");
  const formatValue = (val) =>
    Math.abs(val) < 10 ? format(",.1f")(val) : format(",.0f")(val);

  const indicatorMeta = metadataBySeries?.[seriesId] ?? {};
  const customDpIndicatorEnabled = toBoolean(
    indicatorMeta?.custom_dp_indicator
  );
  const dpIndicatorOverride = toNonNegativeIntOrNull(
    indicatorMeta?.dp_indicator
  );

  // Normalize and guard the numeric change value
  const numericChange = toFiniteNumberOrNaN(change);
  const isAvailable = Number.isFinite(numericChange);
  const absChange = isAvailable ? Math.abs(numericChange) : 0;

  function getIndicatorDp(units, absChange) {
    if (customDpIndicatorEnabled && dpIndicatorOverride !== null) {
      return dpIndicatorOverride;
    }

    // Defaults must mirror the formatting logic used below.
    if (units === "percentage") return 0; // formatPercent = format(".0%")
    if (units === "percentage points") return absChange < 10 ? 1 : 0; // formatValue
    return absChange < 10 ? 1 : 0; // formatValue
  }

  // Treat a change as "No change" when it would display as zero at the indicator's current precision.
  let isEffectivelyZero = false;
  if (isAvailable) {
    const dpUsed = getIndicatorDp(units, absChange);
    const displayZeroThreshold = 0.5 * Math.pow(10, -dpUsed);
    isEffectivelyZero = absChange < displayZeroThreshold;
  }

  const formattedChange = (() => {
    if (!isAvailable) return "";

    if (customDpIndicatorEnabled && dpIndicatorOverride !== null) {
      if (units === "percentage") {
        return format(`.${dpIndicatorOverride}%`)(absChange / 100);
      }
      if (units === "percentage points") {
        return `${format(`,.${dpIndicatorOverride}f`)(absChange)}pp`;
      }
      return format(`,.${dpIndicatorOverride}f`)(absChange);
    }

    if (units === "percentage") return formatPercent(absChange / 100);
    if (units === "percentage points") return `${formatValue(absChange)}pp`;
    return formatValue(absChange);
  })();

  // 🔎 Determine the label text
  let changeContextLabel;

  if (label === "year") {
    // Second indicator always shows "From past year"
    changeContextLabel = "From past year";
  } else {
    // First indicator: check the frequency from metadata
    const indicator_period =
      metadataBySeries?.[seriesId]?.indicator_period?.toLowerCase?.();

    if (
      indicator_period === "daily" ||
      indicator_period === "day" ||
      indicator_period === "weekly" ||
      indicator_period === "week"
    ) {
      changeContextLabel = "From past week";
    } else if (indicator_period === "monthly" || indicator_period === "month") {
      changeContextLabel = "From past month";
    } else if (
      indicator_period === "quarterly" ||
      indicator_period === "quarter"
    ) {
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

{#if !isAvailable}
  <div class="indicator-area no-change" style="background:{noChangeBackground}">
    Not available
  </div>
{:else if isEffectivelyZero}
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
