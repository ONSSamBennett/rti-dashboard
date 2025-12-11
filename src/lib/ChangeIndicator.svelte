
<script>
  import { format } from "d3-format";

  // Props you already pass
  export let change = null;
  export let units = "";

  // NEW: identify the series and provide the metadata lookup
  export let seriesId = "";
  export let metadataBySeries = {}; // passed from +page.svelte via data.metadataBySeries

  // Colors (your existing values)
  export let noChangeBackground = "#D9D9D9";
  export let decreaseBackground = "#D6D3E8";
  export let increaseBackground = "#F7DFCF";
  export let increaseArrowColor = "#C14E01";
  export let decreaseArrowColor = "#574F96";

  // Existing numeric formatting
  const formatPercent = format(".0%");
  const formatValue = (val) => (Math.abs(val) < 2 ? format(",.1f")(val) : format(",.0f")(val));

  const formattedChange =
    units === "percentage"
      ? formatPercent(Math.abs(change / 100))
      : units === "percentage points"
      ? `${formatValue(Math.abs(change))}pp`
      : formatValue(Math.abs(change));

  // 🔎 Read cadence from metadata ('weekly' | 'monthly' | ...)
  const updated = metadataBySeries?.[seriesId]?.updated?.toLowerCase?.();

  // Map cadence to the human-friendly label
  const periodMap = {
    daily: "From previous day",
    day: "From previous day",
    weekly: "From previous week",
    week: "From previous week",
    monthly: "From previous month",
    month: "From previous month",
    quarterly: "From previous quarter",
    quarter: "From previous quarter",
    yearly: "From last year",
    year: "From last year",
  };

  // Safe fallback if metadata missing/unexpected
  const changeContextLabel = periodMap[updated] ?? "Change from previous period";
</script>

<p class="text-indicator-sm" style="margin-bottom: 0; margin-top: 0;">
  {changeContextLabel}
</p>

{#if change === 0 || change === null}
  <div class="indicator-area" style="background: {noChangeBackground}; margin-top:5px;padding:5px; padding-left: 10px;padding-right:13px;display:inline-block">
    No change
  </div>
{:else if change > 0}
  <div class="indicator-area" style="background: {increaseBackground}; margin-top:5px;padding:5px; padding-left: 10px;padding-right:13px;display:inline-block">
    <svg width="14" height="16" viewBox="0 0 12 14">
      <path d="M5.5 1.5L5.5 12.5M5.5 1.5L9.5 5.5M5.5 1.5L1.5 5.5" fill="none" stroke={increaseArrowColor} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span style="font-weight:700;">{formattedChange}</span>
    higher
  </div>
{:else}
  <div class="indicator-area" style="background: {decreaseBackground}; margin-top:5px;padding:5px; padding-left: 10px; padding-right:13px;display:inline-block">
    <svg width="14" height="16" viewBox="0 0 12 14">
      <path d="M5.5 12.5L5.5 1.5M5.5 12.5L1.5 8.5M5.5 12.5L9.5 8.5" fill="none" stroke={decreaseArrowColor} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span style="font-weight:600">{formattedChange}</span>
    lower
  </div>
{/if}

<style>
  .text-indicator-sm { font-size: 14px; }
  .indicator-area { font-size: 17px; }
</style>
