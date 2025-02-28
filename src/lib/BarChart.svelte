<script>
	import { Button } from "@onsvisual/svelte-components";
	import { csvFormatBody } from "d3-dsv";
	import { scaleLinear, scaleBand } from "d3-scale";
	import { line, curveStepAfter } from "d3-shape";

	export let data;
	// export let height = 300;
	export let margin = {left: 80, top: 20, bottom: 45};
	export let xKey = "date";
	export let yKey1 = "number_of_deaths";
	export let yKey2 = "expected_deaths";
	export let yKey3 = "bank_holiday";

	//works out the x date ranges
	function getQuarterFromDate(date) {
        return Math.floor(date.getMonth() / 3) + 1;
    }


    function isQ3Start(date) {
        return date.getMonth() === 6; // July is month 6 (0-based)
    }

    function getDateChanges(data, xKey) {
        const changes = {
            years: [],
            quarters: [],
            yearLabels: [] // New array for year labels at Q3
        };


        
        // Check first date
        const firstDate = data[0][xKey];
        const firstYearStart = new Date(firstDate.getFullYear(), 0, 1);
        const daysSinceYearStart = (firstDate - firstYearStart) / (1000 * 60 * 60 * 24);
        if (daysSinceYearStart < 7) {
            changes.years.push(firstDate);
        }

        // Check first date for quarter
        for (let q = 1; q <= 4; q++) {
            const quarterStart = new Date(firstDate.getFullYear(), (q-1)*3, 1);
            const daysSinceQuarterStart = (firstDate - quarterStart) / (1000 * 60 * 60 * 24);
            if (daysSinceQuarterStart >= 0 && daysSinceQuarterStart < 7) {
                changes.quarters.push(firstDate);
                break;
            }
        }

        // Check changes between dates
        for (let i = 1; i < data.length; i++) {
            const prevDate = data[i-1][xKey];
            const currentDate = data[i][xKey];
            
            // Check year changes
            if (prevDate.getFullYear() !== currentDate.getFullYear()) {
                changes.years.push(currentDate);
            }
            // Check quarter changes within the same year
            else if (getQuarterFromDate(prevDate) !== getQuarterFromDate(currentDate)) {
                changes.quarters.push(currentDate);
                // If this is Q3 start, add to yearLabels
                if (isQ3Start(currentDate)) {
                    changes.yearLabels.push({
                        date: currentDate,
                        year: currentDate.getFullYear()
                    });
                }
            }
        }

        // Check last date
        const lastDate = data[data.length - 1][xKey];
        const nextYearStart = new Date(lastDate.getFullYear() + 1, 0, 1);
        const daysUntilNextYear = (nextYearStart - lastDate) / (1000 * 60 * 60 * 24);
        if (daysUntilNextYear <= 7) {
            changes.years.push(nextYearStart);
        }

        // Check last date for next quarter
        const lastQuarter = getQuarterFromDate(lastDate);
        if (lastQuarter < 4) {
            const nextQuarterStart = new Date(lastDate.getFullYear(), lastQuarter * 3, 1);
            const daysUntilNextQuarter = (nextQuarterStart - lastDate) / (1000 * 60 * 60 * 24);
            if (daysUntilNextQuarter <= 7) {
                changes.quarters.push(nextQuarterStart);
            }
        }

        return changes;


		
    }


    // Calculate date changes
    $: dateChanges = getDateChanges(data, xKey);

    // Function to check if position is too close to edges
    function isTooCloseToEdge(xPos, width) {
        return xPos < 10 || (width - xPos) < 10;
    }

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
<div class="legend-container">
    <svg width="360" height="18" viewBox="0 360 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- <rect width="225" height="18" fill="#E5E5E5"/> -->
    <!-- <rect width="317" height="18" fill="white"/> -->
    <text fill="#414042" xml:space="preserve" style="white-space: pre" font-size="14" letter-spacing="0em"><tspan x="202" y="14.4312">Expected deaths&#10;</tspan></text>
    <line x1="174.25" y1="7.75" x2="192.75" y2="7.75" stroke="#222222" stroke-width="2.5" stroke-linecap="round"/>
    <text fill="#414042" xml:space="preserve" style="white-space: pre" font-size="14" letter-spacing="0em"><tspan x="25" y="14.4312">Deaths registered</tspan></text>
    <circle cx="11" cy="9" r="6" fill="#27A0CC"/>
    </svg>
    <svg width="317" height="18" viewBox="0 0 317 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="317" height="18" fill="#E5E5E5"/>
        <rect width="317" height="18" fill="white"/>
        <text fill="#414042" xml:space="preserve" style="white-space: pre" font-size="14" letter-spacing="0em"><tspan x="25" y="14.4312">Week containing bank holiday</tspan></text>
        <rect x="6" y="5" width="10" height="10" fill="#C5C5C5"/>
        <line x1="6" y1="4.5" x2="16" y2="4.5" stroke="#949494" stroke-width="3"/>
        </svg>
        
    </div>
<div class="chart-container" bind:clientWidth={width} style:height="{height}px">
	{#if width}
		<svg {width} {height} class="chart">
			<g class="y-ticks">
				{#each yTicks as tick (tick)}
					<g class="y-tick" transform="translate(0 {y(tick)})">
						<line class="tick-line" class:tick-line-0={tick === 0} x1={margin.left-5} x2={width}/>
						<text x={margin.left-10} y="6" style="text-anchor: end" class="small">{tick.toLocaleString("en-GB")}</text>
					</g>
				{/each}
			</g>
	  
            <g class="date-dividers">
                <!-- Quarter dividers -->
                {#each dateChanges.quarters as date}
                    <line 
                        class="quarter-divider"
                        x1={date === data[0][xKey] ? x(date) : 
                            date > data[data.length-1][xKey] ? x.range()[1] : x(date)}
                        y1={height - (margin.bottom || 0)}
                        x2={date === data[0][xKey] ? x(date) : 
                            date > data[data.length-1][xKey] ? x.range()[1] : x(date)}
                        y2={height - (margin.bottom || 0)+10}
                    />
                {/each}
                
                <!-- Year dividers -->
                {#each dateChanges.years as date}
                    <line 
                        class="year-divider"
                        x1={date === data[0][xKey] ? x(date) : 
                            date > data[data.length-1][xKey] ? x.range()[1] : x(date)}
                        y1={height - (margin.bottom || 0)}
                        x2={date === data[0][xKey] ? x(date) : 
                            date > data[data.length-1][xKey] ? x.range()[1] : x(date)}
                        y2={height - (margin.bottom || 0)+25}
                    />
                {/each}

                <!-- Year labels at Q3 -->
                {#each dateChanges.yearLabels as {date, year}}
                    {@const xPos = x(date)}
                    {#if !isTooCloseToEdge(xPos, width)}
                        <text 
                            class="year-label"
                            x={xPos}
                            y={height - margin.bottom + 34}
                            text-anchor="middle"
                        >
                            {year}
                        </text>
                    {/if}
                {/each}
            </g>




			<g class="plot">
				{#each data as d (d[xKey])}
                    {#if d[yKey3]}
                        <rect class="bar-holiday" width={x.bandwidth()} height={height - (margin.bottom || 0) - (margin.top || 0)} x={x(d[xKey])} y={margin.top || 0}/>
						<rect class="bar-holiday2" width={x.bandwidth()} height=3px x={x(d[xKey])} y={margin.top || 0}/>
                  
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
<Button href={dataFile?.href} variant="secondary" download="weekly-deaths-{data[data.length - 1][xKey].toISOString().slice(0, 10)}.csv" small>Download chart data (CSV, {Math.round((dataFile?.blob?.size || 0) / 1000)}KB)</Button>

<!-- 
England and Wales, week ending {data.current.date.toLocaleDateString(
	"en-GB",
	dateOptions
  )} -->

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
		/* mix-blend-mode: multiply; */
	}
    .bar-holiday {
        fill: #D9D9D9
		;
    }
	.bar-holiday2 {
        fill: #949494
				;
    }
	.line {
		fill: none;
		stroke: #222;
		stroke-width: 2.5px;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.tick-line {
		stroke: #ccc;
		stroke-width: 1px;
	}
	.tick-line-0 {
		stroke: #555;
	}

	text{font-size: 16px}
    .year-divider {
        stroke:#a0a0a0;;
        stroke-width: 2px;
        /* stroke-dasharray: 4 4; */
    }

    .quarter-divider {
        stroke: #a0a0a0;;
        stroke-width: 2px;
        }

</style>