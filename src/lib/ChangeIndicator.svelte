<script>
  import { format } from "d3-format";
  export let label = "";
  export let change = null;
  export let units = "";

  const formatPercent = format(".0%");
  const formatValue = format(",.0f");

  const formattedChange =
    units === "percentage"
      ? formatPercent(Math.abs(change / 100))
      : formatValue(Math.abs(change));
</script>

{#if change === 0 || change === null}
  <p class="text-indicatorsm">
    {label === "month"
      ? "No change from previous month"
      : "No change from last year"}
  </p>
{:else}
  <p class="text-indicator-sm" style="margin-bottom: 0; margin-top: 0;">
    {label === "month" ? "From previous month" : "From last year"}
  </p>

  {#if change > 0}
    <div
      class="indicator-area"
      style="background: #FAD9CB; margin-top:5px;padding:5px; padding-left: 10px;padding-right:13px;display:inline-block"
    >
      <svg width="14" height="16" viewBox="0 0 12 14">
        <path
          d="M5.5 1.5L5.5 12.5M5.5 1.5L9.5 5.5M5.5 1.5L1.5 5.5"
          fill="none"
          stroke="#AD001F"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <span style="font-weight:700;">
        {formattedChange}
      </span>
      higher
    </div>
  {:else}
    <div
      class="indicator-area"
      style="background: #D2E2CB; margin-top:5px;padding:5px; padding-left: 10px; padding-right:13px;display:inline-block"
    >
      <svg width="14" height="16" viewBox="0 0 12 14">
        <path
          d="M5.5 12.5L5.5 1.5M5.5 12.5L1.5 8.5M5.5 12.5L9.5 8.5"
          fill="none"
          stroke="#195000"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span style="font-weight:600">
        {formattedChange}
      </span>
      lower
    </div>
  {/if}
{/if}

<style>
  .text-indicator-sm {
    font-size: 14px;
  }

  .indicator-area {
    font-size: 17px;
  }
</style>
