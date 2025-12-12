
<script>
  import { scaleLinear, scaleTime } from "d3-scale";
  import { line, curveLinear } from "d3-shape";
  import { format } from "d3-format";
  import { timeYear } from "d3-time";
  import { timeFormat } from "d3-time-format";

  // Props (existing)
  export let data = [];
  export let yKey = "value";
  export let yMax;
  export let lineColor = "#27a0cc";
  export let title;
  export let description;
  export let units;
  export let units_chart; // e.g., "percentage"
  export let index = false;
  export let thousands = false;

  // Normalize `index` prop to a boolean so strings like "false"/"0" don't evaluate truthy
  $: indexBoolean = (() => {
    if (index === true) return true;
    if (index === false) return false;
    if (typeof index === "number") return index === 1;
    if (typeof index === "string") {
      const v = index.trim().toLowerCase();
      return v === "true" || v === "1" || v === "yes";
    }
    return Boolean(index);
  })();

  // Fixed time window
  export let startDate = null; // e.g., new Date(2022, 0, 1)
  export let endDate = null;   // e.g., new Date(2025, 11, 31)

  // NEW: metadata object to drive axis options (and anything else)
  export let meta = {};

  // Internals
  $: thousandsBoolean = (() => {
    if (thousands === true) return true;
    if (typeof thousands === "number") return thousands === 1;
    if (typeof thousands === "string") {
      const v = thousands.trim().toLowerCase();
      return v === "true" || v === "1" || v === "yes";
    }
    return Boolean(thousands);
  })();
  let width;
  $: height = +width < 500 ? width * 0.5 : width * 0.4;

  const margin = { left: 60, top: 0, bottom: 30, right: 60 };
  const xKey = "date"; // data[xKey] should be Date objects

  // Transform values to thousands if requested
  $: transformedData =
    data && Array.isArray(data)
      ? thousandsBoolean
        ? data.map((d) => {
            // Ensure numeric value (handle strings like "742,745")
            const raw = d[yKey];
            let val = raw;
            if (typeof raw === "string") {
              // remove any commas or whitespace
              const cleaned = raw.replace(/,/g, "").trim();
              val = cleaned === "" ? NaN : Number(cleaned);
            }
            // If value is not a number, leave as-is (NaN will propagate)
            const numeric = typeof val === "number" && !isNaN(val) ? val / 1000 : val;
            return { ...d, [yKey]: numeric };
          })
        : data
      : [];

  // Fallback to data extent if no start/end provided
  $: dataMinDate =
    transformedData.length ? new Date(Math.min(...transformedData.map((d) => +d[xKey]))) : null;
  $: dataMaxDate =
    transformedData.length ? new Date(Math.max(...transformedData.map((d) => +d[xKey]))) : null;

  $: effectiveStart = startDate ?? dataMinDate ?? new Date(2000, 0, 1);
  $: effectiveEnd   = endDate   ?? dataMaxDate ?? new Date(2000, 11, 31);

  // Avoid zero-length domain
  $: [domainStart, domainEnd] =
    +effectiveStart === +effectiveEnd
      ? [
          new Date(effectiveStart.getTime() - 24 * 3600 * 1000),
          new Date(effectiveEnd.getTime() + 24 * 3600 * 1000),
        ]
      : [effectiveStart, effectiveEnd];

  $: x = scaleTime()
    .domain([domainStart, domainEnd])
    .range([margin.left, width - margin.right])
    .clamp(true);

  // --- Y domain calculations driven by metadata ---
  // Pull axis settings from metadata (with sensible defaults)
  $: yMinMode = meta?.yMinMode ?? "auto";  // "zero" | "data" | "above-zero" | "auto"
  $: yPadding = meta?.yPadding ?? 0.1;     // 10% padding

  // Data min/max
  $: dataYMin =
    transformedData?.length
      ? Math.min(...transformedData.map((d) => d[yKey]))
      : 0;

  $: dataYMax =
    transformedData?.length
      ? Math.max(...transformedData.map((d) => d[yKey]))
      : 100;

  // Respect explicit yMax when provided; otherwise use data max
  $: topMax = yMax ?? dataYMax;

  // Compute bottom min based on mode
  $: computedYMin = (() => {
    // First, determine the baseline min based on the mode
    let baseMin;
    if (yMinMode === "zero") {
      baseMin = 0;
    } else if (yMinMode === "data") {
      baseMin = dataYMin;
    } else if (yMinMode === "above-zero") {
      baseMin = dataYMin > 0 ? dataYMin : 0;
    } else if (yMinMode === "auto") {
      // Auto mode: start with zero, then check for wasted space
      baseMin = 0;
    } else {
      baseMin = 0;
    }

    // Auto-detection: if yMinMode is "auto", check for excessive unused space
    if (yMinMode === "auto" && dataYMin > baseMin) {
      // Calculate what the range would be if we kept baseMin
      const range = topMax - baseMin;
      // Gap between data minimum and the floor
      const gap = dataYMin - baseMin;
      // If gap is > 50% of the range, cut the axis but keep 30% of the final axis range below the data
      if (range > 0 && gap / range > 0.5) {
        const frac = 0.3; // fraction of final axis to reserve below the lowest data point
        // Solve for new bottom B so that dataYMin - B = frac * (topMax - B)
        // => B = (dataYMin - frac * topMax) / (1 - frac)
        const denom = 1 - frac;
        if (denom > 0) {
          const newBottom = (dataYMin - frac * topMax) / denom;
          // Ensure we don't accidentally pick a bottom above the data
          if (newBottom < dataYMin) return newBottom;
        }
      }
    }

    return baseMin;
  })();

  // Add padding to bottom min (expand downward)
  $: paddedMin = computedYMin - Math.abs(computedYMin) * yPadding;

  // Final domain max (no padding applied here)
  $: paddedMax = topMax;

  // Avoid inverted domain when top and bottom collide
  $: paddedMin = Math.min(paddedMin, paddedMax - Number.EPSILON);

  $: y = scaleLinear()
    .domain([paddedMin, paddedMax])
    .range([height - margin.bottom, margin.top])
    .nice();

  $: yTicks = y.ticks(5);

  // For baseline styling when 0 is visible
  $: zeroInDomain = paddedMin <= 0 && 0 <= paddedMax;

  $: formatValue = (() => {
    const hasDecimal = yTicks.some((t) => t % 1 !== 0);
    return format(hasDecimal ? ",.1f" : ",.0f");
  })();

  $: formatPercent = (() => {
    const hasDecimal = yTicks.some((t) => t % 1 !== 0);
    return format(hasDecimal ? ".1%" : ".0%");
  })();

  const formatLastDate = timeFormat("%-d %b");

  function getQuarterFromDate(date) {
    return Math.floor(date.getMonth() / 3) + 1;
  }

  function isQ3Start(date) {
    return date.getMonth() === 6; // July
  }

  function getDateChangesFromDomain(domainStart, domainEnd) {
    const changes = {
      years: [],       // year boundary markers (Jan 1)
      yearLabels: [],  // { date: Jul 1, year: YYYY }
    };
    if (!domainStart || !domainEnd) return changes;

    // Year starts (Jan 1)
    const yearStarts = timeYear.range(timeYear.floor(domainStart), timeYear.ceil(domainEnd));
    for (const ys of yearStarts) {
      changes.years.push(ys);
      // Mid-year label (Jul 1) to replicate Q3 labeling
      const mid = new Date(ys.getFullYear(), 6, 1);
      if (mid >= domainStart && mid <= domainEnd) {
        changes.yearLabels.push({ date: mid, year: mid.getFullYear() });
      }
    }

    return changes;
  }

  $: dateChanges = getDateChangesFromDomain(domainStart, domainEnd);

  // Line generator
  $: lineFn = line()
    .curve(curveLinear)
    .x((d) => x(d[xKey]))
    .y((d) => y(d[yKey]));

  function isTooCloseToEdge(xPos, w) {
    return xPos < 20 || w - xPos < 20;
  }
</script>

<div style="padding:10px; margin-top:0px; margin-bottom:10px">
  {#if thousandsBoolean}
    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
      Values shown in thousands
    </div>
  {/if}
  <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
    <strong>Index</strong>: {indexBoolean ? 'yes' : 'no'}
  </div>
  <div style="font-size: 12px; color: #999; line-height:1.4;">
    <div><strong>yMinMode</strong>: {yMinMode}</div>
    <div><strong>Axis top</strong>: {units_chart === "percentage" ? formatPercent(paddedMax/100) : formatValue(paddedMax)}</div>
    <div><strong>Axis min</strong>: {units_chart === "percentage" ? formatPercent(paddedMin/100) : formatValue(paddedMin)}</div>
    <div><strong>Data top</strong>: {units_chart === "percentage" ? formatPercent(dataYMax/100) : formatValue(dataYMax)}</div>
    <div><strong>Data bottom</strong>: {units_chart === "percentage" ? formatPercent(dataYMin/100) : formatValue(dataYMin)}</div>
  </div>

  <div class="chart-container" bind:clientWidth={width} style:height="{height}px">
    {#if width}
      {#if transformedData.length > 0}
        <svg {width} {height} class="chart">
          <!-- Y grid/ticks -->
          <g class="y-ticks">
            {#each yTicks as tick (tick)}
                  <g class="y-tick" transform="translate(0 {y(tick)})">
                <line
                  class="tick-line"
                      class:tick-line-0={(zeroInDomain && tick === 0) || (indexBoolean && tick === 100)}
                  x1={margin.left}
                  x2={width - margin.right}
                />
                <text style="text-anchor:end;" x={margin.left - 5} y="6" class="small">
                  {units_chart === "percentage" ? formatPercent(tick / 100) : formatValue(tick)}
                </text>
              </g>
            {/each}
          </g>

          <!-- Date dividers + mid-year labels -->
          <g class="date-dividers">
            {#each dateChanges.years as date}
              <line
                class="year-divider"
                x1={x(date)}
                y1={height - margin.bottom}
                x2={x(date)}
                y2={height - margin.bottom + 18}
              />
            {/each}

            {#each dateChanges.yearLabels as { date, year }}
              {#if !isTooCloseToEdge(x(date), width)}
                <text
                  class="year-label"
                  x={x(date)}
                  y={height - margin.bottom + 20}
                  text-anchor="middle"
                >
                  {year}
                </text>
              {/if}
            {/each}
          </g>

          <!-- Line series -->
          <g class="plot">
            <path class="line" d={lineFn(transformedData)} stroke={lineColor} />

            <!-- Last point marker/label: value (top) + date (bottom) -->
            {#if transformedData.length}
              {@const lastPoint = transformedData[transformedData.length - 1]}
              {@const lastX = x(lastPoint[xKey])}
              {@const lastY = y(lastPoint[yKey])}
              {@const lastDateStr = formatLastDate(lastPoint[xKey])}

              <circle
                class="line-point"
                cx={lastX}
                cy={lastY}
                r="4"
                fill={lineColor}
              />

              <!-- Two-line label placed to the right of the last point -->
              <text
                x={lastX + 8}
                y={lastY + 4}
                style="fill: {lineColor}; font-weight: 600;"
              >
                <!-- top line: value -->
                <tspan x={lastX + 8} dy="0">
                  {#if units_chart === "percentage"}
                    {lastPoint[yKey] < 20
                      ? format(".1%")(lastPoint[yKey] / 100)
                      : formatPercent(lastPoint[yKey] / 100)}
                  {:else}
                    {lastPoint[yKey] < 20
                      ? format(",.1f")(lastPoint[yKey])
                      : formatValue(lastPoint[yKey])}
                  {/if}
                </tspan>
                <!-- bottom line: date -->
                <tspan x={lastX + 8} dy="1.2em" style="fill:#666; font-weight: 400;">
                  {lastDateStr}
                </tspan>
              </text>
            {/if}
          </g>
        </svg>
      {:else}
        <div
          style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;"
        >
          No data available
        </div>
      {/if}
    {/if}
  </div>
</div>


<style>
  .chart-container {
    display: block;
  }

  .chart {
    display: block;
    overflow: visible;
    width: 100%;
    height: 100%;
  }

  .line {
    fill: none;
    stroke-width: 2px;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .tick-line {
    stroke: #ccc;
    stroke-width: 1;
  }

  .tick-line-0 {
    stroke: #555;
  }

  .year-divider {
    stroke: #a0a0a0;
    stroke-width: 2px;
  }

  text {
    font-size: 14px;
    fill: #333;
  }

  .year-label {
    font-size: 12px;
    fill: #666;
  }

  svg {
    padding: 0px;
    margin: 0;
  }
</style>
