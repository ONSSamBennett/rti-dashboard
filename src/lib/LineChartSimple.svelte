<script>
  import { scaleLinear, scaleBand } from "d3-scale";
  import { line, curveLinear } from "d3-shape";
  import { format } from "d3-format";

  export let data = [];
  export let yKey = "value";
  export let yMax;
  export let lineColor = "#27a0cc";
  export let title;
  export let description;
  export let units;
  export let units_chart;
  export let index = false;
  export let thousands;

  // Handle both boolean and string values for thousands
  $: thousandsBoolean = thousands === true || thousands === "TRUE";

  let width;
  $: height = +width < 500 ? width * 0.5 : width * 0.4;

  const margin = { left: 30, top: 0, bottom: 30, right: 60 };
  const xKey = "date";

  // Ensure data exists and is an array before transformation
  $: transformedData =
    data && Array.isArray(data)
      ? thousandsBoolean
        ? data.map((d) => ({ ...d, [yKey]: d[yKey] / 1000 }))
        : data
      : [];

  $: dateChanges = getDateChanges(transformedData, xKey);

  $: xDomain = transformedData.map((d) => d[xKey]);

  $: computedYMax =
    yMax ??
    (transformedData?.length
      ? Math.max(...transformedData.map((d) => d[yKey])) * 1.2
      : 100);

  $: yDomain = [0, computedYMax];

  $: x = scaleBand()
    .padding(0.1)
    .domain(xDomain)
    .range([margin.left, width - margin.right]);

  $: y = scaleLinear()
    .domain(yDomain)
    .range([height - margin.bottom, margin.top]);

  $: yTicks = y.ticks(5);

  $: formatValue = (() => {
    const hasDecimal = yTicks.some((t) => t % 1 !== 0);
    return format(hasDecimal ? ",.1f" : ",.0f");
  })();

  $: formatPercent = (() => {
    const hasDecimal = yTicks.some((t) => t % 1 !== 0);
    return format(hasDecimal ? ".1%" : ".0%");
  })();

  $: lineFn = line()
    .curve(curveLinear)
    .x((d) => x(d[xKey]))
    .y((d) => y(d[yKey]));

  function getQuarterFromDate(date) {
    return Math.floor(date.getMonth() / 3) + 1;
  }

  function isQ3Start(date) {
    return date.getMonth() === 6;
  }

  function getDateChanges(data, xKey) {
    const changes = {
      years: [],
      yearLabels: [],
    };

    if (!data || !Array.isArray(data)) return changes;

    for (let i = 1; i < data.length; i++) {
      const prevDate = data[i - 1][xKey];
      const currentDate = data[i][xKey];

      if (!prevDate || !currentDate) continue;

      if (prevDate.getFullYear() !== currentDate.getFullYear()) {
        changes.years.push(currentDate);
      } else if (
        getQuarterFromDate(prevDate) !== getQuarterFromDate(currentDate)
      ) {
        if (isQ3Start(currentDate)) {
          changes.yearLabels.push({
            date: currentDate,
            year: currentDate.getFullYear(),
          });
        }
      }
    }

    return changes;
  }

  function isTooCloseToEdge(xPos, width) {
    return xPos < 20 || width - xPos < 20;
  }
</script>

<div style="padding:10px; margin-top:0px; margin-bottom:10px">
  <div
    class="chart-container"
    bind:clientWidth={width}
    style:height="{height}px"
  >
    {#if width && transformedData.length > 0}
      <svg {width} {height} class="chart">
        <g class="y-ticks">
          {#each yTicks as tick (tick)}
            <g class="y-tick" transform="translate(0 {y(tick)})">
              <line
                class="tick-line"
                class:tick-line-0={tick === 0 || (index && tick === 100)}
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
            {@const xPos = x(date)}
            {#if !isTooCloseToEdge(xPos, width)}
              <text
                class="year-label"
                x={xPos}
                y={height - margin.bottom + 20}
                text-anchor="middle"
              >
                {year}
              </text>
            {/if}
          {/each}
        </g>

        <g class="plot">
          <path class="line" d={lineFn(transformedData)} stroke={lineColor} />

          <circle
            class="line-point"
            cx={x(transformedData[transformedData.length - 1][xKey])}
            cy={y(transformedData[transformedData.length - 1][yKey])}
            r="4"
            fill={lineColor}
          />
          <text
            x={x(transformedData[transformedData.length - 1][xKey]) + 8}
            y={y(transformedData[transformedData.length - 1][yKey]) + 4}
            style="fill: {lineColor}; font-weight: 600;"
          >
            {#if units_chart === "percentage"}
              {transformedData[transformedData.length - 1][yKey] < 20
                ? format(".1%")(
                    transformedData[transformedData.length - 1][yKey] / 100
                  )
                : formatPercent(
                    transformedData[transformedData.length - 1][yKey] / 100
                  )}
            {:else}
              {transformedData[transformedData.length - 1][yKey] < 20
                ? format(",.1f")(
                    transformedData[transformedData.length - 1][yKey]
                  )
                : formatValue(
                    transformedData[transformedData.length - 1][yKey]
                  )}
            {/if}
          </text>
        </g>
      </svg>
    {:else if width}
      <div
        style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;"
      >
        No data available
      </div>
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
    stroke-width: 3px;
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
