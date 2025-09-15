<script>
  import { scaleLinear, scaleBand } from "d3-scale";
  import { line, curveLinear } from "d3-shape";
  import { format } from "d3-format";

  export let data;
  export let yKey = "value";
  export let yMax;
  export let lineColor = "#27a0cc";
  export let title;
  export let description;
  export let units;

  let width;
  $: height = +width < 500 ? width * 0.5 : width * 0.4;

  const margin = { left: 60, top: 0, bottom: 30, right: 60 };
  const xKey = "date";
  const formatPercent = format(".0%");
  const formatValue = format(",.0f");

  function getQuarterFromDate(date) {
    return Math.floor(date.getMonth() / 3) + 1;
  }

  function isQ3Start(date) {
    return date.getMonth() === 6; // July is month 6 (0-based)
  }

  function getDateChanges(data, xKey) {
    const changes = {
      years: [],
      yearLabels: [],
    };

    // Check changes between dates
    for (let i = 1; i < data.length; i++) {
      const prevDate = data[i - 1][xKey];
      const currentDate = data[i][xKey];

      // Check year changes
      if (prevDate.getFullYear() !== currentDate.getFullYear()) {
        changes.years.push(currentDate);
      }
      // Check quarter changes within the same year
      else if (
        getQuarterFromDate(prevDate) !== getQuarterFromDate(currentDate)
      ) {
        // If this is Q3 start, add to yearLabels
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

  $: dateChanges = getDateChanges(data, xKey);

  function isTooCloseToEdge(xPos, width) {
    return xPos < 20 || width - xPos < 20;
  }

  $: xDomain = data.map((d) => d[xKey]);

  $: computedYMax =
    yMax ?? (data?.length ? Math.max(...data.map((d) => d[yKey])) * 1.1 : 100);

  $: yDomain = [0, computedYMax];

  $: x = scaleBand()
    .padding(0.1)
    .domain(xDomain)
    .range([margin.left, width - margin.right]);

  $: y = scaleLinear()
    .domain(yDomain)
    .range([height - margin.bottom, margin.top]);

  $: yTicks = y.ticks(5);

  $: lineFn = line()
    .curve(curveLinear)
    .x((d) => x(d[xKey]))
    .y((d) => y(d[yKey]));
</script>

<div style="padding:10px; margin-top:0px; margin-bottom:10px">
  <div
    class="chart-container"
    bind:clientWidth={width}
    style:height="{height}px"
  >
    {#if width}
      <svg {width} {height} class="chart">
        <g class="y-ticks">
          {#each yTicks as tick (tick)}
            <g class="y-tick" transform="translate(0 {y(tick)})">
              <line
                class="tick-line"
                class:tick-line-0={tick === 0}
                x1={margin.left}
                x2={width - margin.right}
              />
              <text
                style="text-anchor:end;"
                x={margin.left - 5}
                y="6"
                class="small"
              >
                {units === "percentage"
                  ? formatPercent(tick / 100)
                  : formatValue(tick)}
              </text>
            </g>
          {/each}
        </g>

        <g class="date-dividers">
          <!-- Year dividers -->
          {#each dateChanges.years as date}
            <line
              class="year-divider"
              x1={x(date)}
              y1={height - margin.bottom}
              x2={x(date)}
              y2={height - margin.bottom + 18}
            />
          {/each}

          <!-- Year labels at Q3 -->
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
          <path class="line" d={lineFn(data)} stroke={lineColor} />

          <!-- End point -->
          <circle
            class="line-point"
            cx={x(data[data.length - 1][xKey])}
            cy={y(data[data.length - 1][yKey])}
            r="4"
            fill={lineColor}
          />
          <text
            x={x(data[data.length - 1][xKey]) + 8}
            y={y(data[data.length - 1][yKey]) + 4}
            style="fill: {lineColor}; font-weight: 600;"
          >
            {units === "percentage"
              ? formatPercent(data[data.length - 1][yKey] / 100)
              : formatValue(data[data.length - 1][yKey])}
          </text></g
        >
      </svg>
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
