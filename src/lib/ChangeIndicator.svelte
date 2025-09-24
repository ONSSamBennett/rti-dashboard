<script>
  import { format } from "d3-format";
  export let label = "";
  export let change = null;
  export let units = "";

  // Color variables
  export let noChangeBackground = "#D9D9D9";

  //red
  //export let increaseBackground = "#FAD9CB";

  //green
  //export let decreaseBackground = "#D2E2CB";

  // midnight
  // export let increaseBackground = "#CFE4ED";

  //lavender;
  export let decreaseBackground = "#D6D3E8";

  //plum
  //export let decreaseBackground = "#F6D5F1";

  //sky blue
  // export let decreaseBackground = "#CAE9F7";

  //spring green
  //export let increaseBackground = "#DCDFCE";

  //maroon
  // export let increaseBackground = "#E6D1DD";

  //jaffa
  export let increaseBackground = "#F7DFCF";

  //arrow colour

  //midnight
  //export let increaseArrowColor = "#003C57";

  //spring green
  // export let increaseArrowColor = "#5B6B0B";

  //maroon
  // export let increaseArrowColor = "#871A5B";

  //plum
  //export let decreaseArrowColor = "#902082";

  //jaffa
  export let increaseArrowColor = "#C14E01";

  //sky blue
  //export let decreaseArrowColor = "#1E7C9F";

  //lavender
  export let decreaseArrowColor = "#574F96";

  //red
  // export let increaseArrowColor = "#AD001F";

  //green
  //export let increaseArrowColor = "#195000";

  const formatPercent = format(".0%");
  const formatValue = (val) => {
    if (Math.abs(val) < 2) {
      return format(",.1f")(val);
    } else {
      return format(",.0f")(val);
    }
  };

  const formattedChange =
    units === "percentage"
      ? formatPercent(Math.abs(change / 100))
      : units === "percentage points"
      ? `${formatValue(Math.abs(change))}pp`
      : formatValue(Math.abs(change));
</script>

<p class="text-indicator-sm" style="margin-bottom: 0; margin-top: 0;">
  {label === "month" ? "From previous month" : "From last year"}
</p>

{#if change === 0 || change === null}
  <div
    class="indicator-area"
    style="background: {noChangeBackground}; margin-top:5px;padding:5px; padding-left: 10px;padding-right:13px;display:inline-block"
  >
    No change
  </div>
{:else if change > 0}
  <div
    class="indicator-area"
    style="background: {increaseBackground}; margin-top:5px;padding:5px; padding-left: 10px;padding-right:13px;display:inline-block"
  >
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

    <span style="font-weight:700;">
      {formattedChange}
    </span>
    higher
  </div>
{:else}
  <div
    class="indicator-area"
    style="background: {decreaseBackground}; margin-top:5px;padding:5px; padding-left: 10px; padding-right:13px;display:inline-block"
  >
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
    <span style="font-weight:600">
      {formattedChange}
    </span>
    lower
  </div>
{/if}

<style>
  .text-indicator-sm {
    font-size: 14px;
  }

  .indicator-area {
    font-size: 17px;
  }
</style>
