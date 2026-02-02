<script>
  import { scaleLinear, scaleTime } from "d3-scale";
  import { line, curveLinear } from "d3-shape";
  import { format } from "d3-format";
  import { timeYear } from "d3-time";
  import { timeFormat } from "d3-time-format";

  // Props (existing)
  export let data = [];
  export let yKey = "value";
  export let yMax = undefined;
  export let lineColor = "#27a0cc";
  export let title;
  export let description;
  export let units;
  export let units_chart; // e.g., "percentage"
  export let index = false;
  export let thousands = false;
  export let series_id = null; // NEW: identifier for this series
  export let thinSeries = null; // NEW: which series_id should be thinner
  export let indicator_period = null; // NEW: frequency for date formatting (e.g., "monthly", "weekly")

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
  export let endDate = null; // e.g., new Date(2025, 11, 31)

  // NEW: metadata object to drive axis options (and anything else)
  export let meta = {};

  // Internals
  // Determine stroke width based on series_id
  let baseStrokeWidth;
  $: baseStrokeWidth = thinSeries && series_id === thinSeries ? 2 : 3;
  $: strokeWidth =
    width && +width < 500 ? baseStrokeWidth - 0.5 : baseStrokeWidth;
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

  const margin = { left: 58, top: 0, bottom: 30, right: 60 };
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
            const numeric =
              typeof val === "number" && !isNaN(val) ? val / 1000 : val;
            return { ...d, [yKey]: numeric };
          })
        : data
      : [];

  // Fallback to data extent if no start/end provided
  $: dataMinDate = transformedData.length
    ? new Date(Math.min(...transformedData.map((d) => +d[xKey])))
    : null;
  $: dataMaxDate = transformedData.length
    ? new Date(Math.max(...transformedData.map((d) => +d[xKey])))
    : null;

  $: effectiveStart = startDate ?? dataMinDate ?? new Date(2000, 0, 1);
  $: effectiveEnd = endDate ?? dataMaxDate ?? new Date(2000, 11, 31);

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
  $: yMinMode = meta?.yMinMode ?? "auto"; // "zero" | "data" | "above-zero" | "auto"
  $: yPadding = meta?.yPadding ?? 0.1; // 10% padding

  // Data min/max
  $: dataYMin = transformedData?.length
    ? Math.min(...transformedData.map((d) => d[yKey]))
    : 0;

  $: dataYMax = transformedData?.length
    ? Math.max(...transformedData.map((d) => d[yKey]))
    : 100;

  // Respect explicit yMax when provided; otherwise use data max
  $: topMax = yMax ?? dataYMax;

  // Compute bottom min based on mode
  $: computedYMin = (() => {
    // If this is an index chart and we're in auto mode, set the axis bottom
    // exactly to the data minimum so there is no reserved whitespace below
    // the lowest data point (index charts should sit flush at the bottom).
    if (indexBoolean && yMinMode === "auto") {
      return dataYMin;
    }

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
      // If gap is > 50% of the range, cut the axis but keep 30% of the final axis range below the lowest data point
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

  // Add padding to bottom min (expand downward).
  // For index charts: apply 10% of the final axis range as bottom gap (consistent visual spacing).
  // For other charts: use yPadding as percentage of computed min.
  // Avoid inverted domain when top and bottom collide.
  $: paddedMin = (() => {
    let min;
    if (indexBoolean) {
      // For index charts: reserve 10% of the final range below the data
      // finalRange = topMax - dataYMin, so gap = 0.1 * finalRange
      // paddedMin = dataYMin - gap = dataYMin - 0.1 * (topMax - dataYMin)
      const finalRange = topMax - dataYMin;
      min = dataYMin - 0.2 * finalRange;
    } else {
      // For non-index charts: use yPadding as percentage of computedYMin
      min = computedYMin - Math.abs(computedYMin) * yPadding;
    }
    return Math.min(min, paddedMax - Number.EPSILON);
  })();

  // Add padding to top max (expand upward).
  // For index charts: apply 10% of the final axis range as top gap (symmetric with bottom).
  // For other charts: no top padding.
  $: paddedMax = (() => {
    if (indexBoolean) {
      // For index charts: reserve 10% of the final range above the data
      // gap = 0.1 * (topMax - dataYMin)
      // paddedMax = topMax + gap
      const finalRange = topMax - dataYMin;
      return topMax + 0.2 * finalRange;
    } else {
      return topMax;
    }
  })();

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
  const formatLastDateMonthly = timeFormat("%B");

  function getQuarterFromDate(date) {
    return Math.floor(date.getMonth() / 3) + 1;
  }

  function isQ3Start(date) {
    return date.getMonth() === 6; // July
  }

  function getDateChangesFromDomain(domainStart, domainEnd) {
    const changes = {
      years: [], // year boundary markers (Jan 1)
      yearLabels: [], // { date: Jul 1, year: YYYY }
    };
    if (!domainStart || !domainEnd) return changes;

    // Year starts (Jan 1)
    const yearStarts = timeYear.range(
      timeYear.floor(domainStart),
      timeYear.ceil(domainEnd)
    );
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

  // Calculate if there's a significant gap at the start (no data period)
  $: hasNoDataPeriod = (() => {
    if (!transformedData.length || !effectiveStart) return false;

    const firstDataDate = transformedData[0][xKey];
    const daysDiff = (firstDataDate - effectiveStart) / (1000 * 60 * 60 * 24);

    // If first data point is more than 30 days after axis start, show no-data indicator
    return daysDiff > 30;
  })();

  $: noDataRectEnd =
    hasNoDataPeriod && transformedData.length ? transformedData[0][xKey] : null;

  // Screenreader text calculations
  $: firstDataPoint = data?.length ? data[0] : null;
  $: lastDataPoint = data?.length ? data[data.length - 1] : null;
  $: maxDataPoint = data?.length
    ? data.reduce((max, d) => (d[yKey] > max[yKey] ? d : max), data[0])
    : null;
  $: minDataPoint = data?.length
    ? data.reduce((min, d) => (d[yKey] < min[yKey] ? d : min), data[0])
    : null;

  $: formatSRValue = (val) => {
    if (units_chart === "percentage") {
      return format(val < 20 ? ".1%" : ".0%")(val / 100);
    } else if (thousandsBoolean) {
      return format(val < 20 ? ",.1f" : ",.0f")(val) + " thousand";
    } else {
      return format(val < 20 ? ",.1f" : ",.0f")(val);
    }
  };

  $: firstDate = firstDataPoint
    ? indicator_period?.toLowerCase() === "monthly"
      ? firstDataPoint.date.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
        })
      : firstDataPoint.date.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
    : "";

  $: lastDate = lastDataPoint
    ? indicator_period?.toLowerCase() === "monthly"
      ? lastDataPoint.date.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
        })
      : lastDataPoint.date.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
    : "";

  $: maxDate = maxDataPoint
    ? indicator_period?.toLowerCase() === "monthly"
      ? maxDataPoint.date.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
        })
      : maxDataPoint.date.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
    : "";

  $: minDate = minDataPoint
    ? indicator_period?.toLowerCase() === "monthly"
      ? minDataPoint.date.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
        })
      : minDataPoint.date.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
    : "";

  $: formattedValue = lastDataPoint ? formatSRValue(lastDataPoint[yKey]) : "";
  $: formattedMaxValue = maxDataPoint ? formatSRValue(maxDataPoint[yKey]) : "";
  $: formattedMinValue = minDataPoint ? formatSRValue(minDataPoint[yKey]) : "";

  $: datePreposition = indicator_period?.toLowerCase() === "monthly" ? "in" : "on";

  $: latestIsHighest =
    lastDataPoint && maxDataPoint
      ? lastDataPoint[yKey] === maxDataPoint[yKey] &&
        lastDataPoint.date.getTime() === maxDataPoint.date.getTime()
      : false;
  $: latestIsLowest =
    lastDataPoint && minDataPoint
      ? lastDataPoint[yKey] === minDataPoint[yKey] &&
        lastDataPoint.date.getTime() === minDataPoint.date.getTime()
      : false;
</script>

<div style="padding:0px; margin-top:0px; margin-bottom:0px">
  <div
    class="chart-container"
    bind:clientWidth={width}
    style:height="{height}px"
  >
    {#if width}
      {#if transformedData.length > 0}
        <svg {width} {height} class="chart" aria-hidden="true">
          <!-- Thousands label -->
          {#if thousandsBoolean}
            <text
              x={margin.left + 5}
              y="15"
              class="small"
            >
              thousands
            </text>
          {/if}

          <!-- Y grid/ticks -->
          <g class="y-ticks">
            {#each yTicks as tick (tick)}
              <g class="y-tick" transform="translate(0 {y(tick)})">
                <line
                  class="tick-line"
                  class:tick-line-0={(zeroInDomain &&
                    tick === 0 &&
                    !indexBoolean) ||
                    (indexBoolean && tick === 100)}
                  x1={margin.left}
                  x2={width - margin.right}
                />
                <text
                  style="text-anchor:end;"
                  x={margin.left - 5}
                  y="6"
                  class="small"
                >
                  {units_chart === "percentage"
                    ? formatPercent(tick / 100)
                    : formatValue(tick)}
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

          <!-- No data period indicator -->
          {#if hasNoDataPeriod && noDataRectEnd}
            <rect
              class="no-data-rect"
              x={x(effectiveStart)}
              y={margin.top}
              width={Math.max(0, x(noDataRectEnd) - x(effectiveStart))}
              height={height - margin.bottom - margin.top}
              fill="rgba(200, 200, 200, 0.3)"
              stroke="none"
            />
          {/if}

          <!-- Line series -->
          <g class="plot">
            <path
              class="line"
              d={lineFn(transformedData)}
              stroke={lineColor}
              stroke-width="{strokeWidth}px"
            />

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
                <tspan
                  x={lastX + 8}
                  dy="1.2em"
                  style="fill:#666; font-weight: 400;"
                >
                  {indicator_period?.toLowerCase() === "monthly"
                    ? formatLastDateMonthly(lastPoint[xKey])
                    : lastDateStr}
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

    {#if data?.length}
      <p class="screen-reader-only">
        A line chart showing the trend in {title ?? "the data"} since {firstDate}.
        The latest value is {formattedValue}
        {datePreposition}
        {lastDate}{#if latestIsHighest && latestIsLowest}. This was both the
          highest and lowest data value.{:else if latestIsHighest}. This was the
          highest data value.{:else if latestIsLowest}. This was the lowest data
          value.{:else}.{/if}
        {#if !latestIsHighest && !latestIsLowest}The highest data value was {formattedMaxValue}
          {datePreposition}
          {maxDate}. The lowest data value was {formattedMinValue}
          {datePreposition}
          {minDate}.{:else if latestIsLowest}The highest data value was {formattedMaxValue}
          {datePreposition}
          {maxDate}.{:else if latestIsHighest}The lowest data value was {formattedMinValue}
          {datePreposition}
          {minDate}.{/if} The data for the charts is available to download at the
        end of this dashboard.
      </p>
    {/if}
  </div>
</div>

<style>
  .chart-container {
    display: block;
    min-height: 200px;
  }

  .chart {
    display: block;
    overflow: visible;
    width: 100%;
    height: 100%;
  }

  .line {
    fill: none;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .tick-line {
    stroke: #ccc;
    stroke-width: 1;
  }

  .tick-line-0 {
    stroke: #b3b3b3;
    stroke-width: 2px;
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
    font-size: 14px;
    fill: #666;
  }

  svg {
    padding: 0px;
    margin: 0;
  }

  .screen-reader-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
