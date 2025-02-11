<script>
	import { Button } from "@onsvisual/svelte-components";
	import { csvFormatBody } from "d3-dsv";
	import { scaleLinear, scaleBand } from "d3-scale";
	import { line, curveStepAfter } from "d3-shape";

	export let data;
	// export let height = 300;
	export let margin = {left: 50, top: 20, bottom: 20};
	export let xKey = "date";
	export let yKey1 = "number_of_deaths";
	export let yKey2 = "expected_deaths";
	export let yKey3 = "bank_holiday";

	const dateOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};

	function makeDataFile() {
		let csv = `Deaths registered and expected deaths, week ending ${data[0][xKey].toLocaleDateString("en-GB", dateOptions)} to ${data[data.length - 1][xKey].toLocaleDateString("en-GB", dateOptions)}
Source: Office for National Statistics

Data downloaded on ${(new Date()).toLocaleDateString("en-GB", dateOptions)}

Date,Deaths registered,Expected deaths,Bank holiday week
`;
		csv += csvFormatBody(data, [xKey, yKey1, yKey2, yKey3]);
		return {
			blob: new Blob([csv], { type: "text/csv" }),
			href: `data:text/csv;charset=UTF-8,${encodeURIComponent(csv)}`
		};
	}
	
	let width;
    $: height = +width < 400 ? 300 : 400;

	$: xDomain = data.map(d => d[xKey]);
	$: yDomain = [
		0,
		Math.max(
			...data.map(d => d[yKey1]),
			...data.map(d => d[yKey2])
		)
	];

	$: x = scaleBand().padding(0.1).domain(xDomain).range([(margin.left || 0), width - (margin.right || 0)]);
	$: y = scaleLinear().domain(yDomain).range([height - (margin.bottom || 0), (margin.top || 0)]);
	$: yTicks = y.ticks(4);
	$: lineFn = line()
		.curve(curveStepAfter)
        .x(d => x(d[xKey]))
        .y(d => y(d[yKey2]));
	// $: lineFn = (data, yKey) => (line()
	// 	.curve(curveStepAfter)
    //     .x(d => x(d[xKey]))
    //     .y(d => y(d[yKey])))(data);

	$: dataFile = makeDataFile(data);
</script>

<div class="chart-container" bind:clientWidth={width} style:height="{height}px">
	{#if width}
		<svg {width} {height} class="chart">
			<g class="y-ticks">
				{#each yTicks as tick (tick)}
					<g class="y-tick" transform="translate(0 {y(tick)})">
						<line class="tick-line" class:tick-line-0={tick === 0} x1={0} x2={width}/>
						<text x="0" y="-4" class="small">{tick.toLocaleString("en-GB")}</text>
					</g>
				{/each}
			</g>
			<g class="plot">
				{#each data as d (d[xKey])}
                    {#if d[yKey3]}
                        <rect class="bar-holiday" width={x.bandwidth()} height={height - (margin.bottom || 0) - (margin.top || 0)} x={x(d[xKey])} y={margin.top || 0}/>
                    {/if}
					<rect class="bar" width={x.bandwidth()} height={y(0) - y(d[yKey1])} x={x(d[xKey])} y={y(d[yKey1])}/>
				{/each}
				<path
					class="line"
					d="{lineFn(data)}L{width - (margin.right || 0)},{y(data[data.length - 1][yKey2])}"
					transform="translate(-{x.bandwidth() * 0.05},0)"/>
			</g>
		</svg>
	{/if}
</div>
<Button href={dataFile?.href} variant="secondary" download="test-file-name.csv" small>Download chart data (CSV, {Math.round((dataFile?.blob?.size || 0) / 1000)}KB)</Button>

<style>
	.chart-container {
		display: block;
		/* background: #f5f5f5; */
	}
	.chart {
		display: block;
		overflow: visible;
		width: 100%;
		height: 100%;
	}
	.bar {
		fill: #27a0cc;
		mix-blend-mode: multiply;
	}
    .bar-holiday {
        fill: #ccc;
    }
	.line {
		fill: none;
		stroke: black;
		stroke-width: 2;
	}
	.tick-line {
		stroke: #ccc;
		stroke-weight: 1;
	}
	.tick-line-0 {
		stroke: #555;
	}
</style>