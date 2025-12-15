<script>
  import { onMount } from "svelte";
  import {
    Embed,
    Notice,
    Section,
    Twisty,
    Accordion,
    AccordionItem,
    Divider,
    AnalyticsBanner,
    analyticsEvent,
  } from "@onsvisual/svelte-components";
  import BarChartAlt from "$lib/BarChartAlt.svelte";
  import LineChartSimple from "$lib/LineChartSimple.svelte";
  import ChangeIndicator from "$lib/ChangeIndicator.svelte";
  import insertHeader from "$lib/insert-header.js";
  export let data;

  const { metadataBySeries } = data;
  
  const { latestBySeries } = data;
  const dateCurrent = new Date(data.dates.current);
  const dateNext = new Date(data.dates.next);

  const analyticsProps = {
    contentTitle: "Weekly deaths dashboard",
    releaseDate: data.dates.current.replaceAll("-", ""),
    nextReleaseDate: data.dates.next.replaceAll("-", ""),
    outputSeries: "weeklyprovisionalfiguresondeathsregisteredinenglandandwales",
    contentType: "dashboard",
  };

  const { current_bank_holiday } = data;
  const { previous_bank_holiday } = data;

  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const dateOptions2 = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const currentWeek = data.current.date.toLocaleDateString(
    "en-GB",
    dateOptions
  );

  const currentWeek2 = data.current.date.toLocaleDateString(
    "en-GB",
    dateOptions2
  );

  const earliestWeek = data.earliest.date.toLocaleDateString(
    "en-GB",
    dateOptions2
  );

  //get header dates from
  onMount(() =>
    insertHeader(
      dateCurrent.toLocaleDateString("en-GB", dateOptions2),
      dateNext.toLocaleDateString("en-GB", dateOptions2),
      currentWeek
    )
  );

  function toggleEvent(e, label, sectionTitle, sectionNumber) {
    analyticsEvent({
      event: "interaction",
      interactionType: "accordion",
      interactionValue: e?.detail?.open ? "open" : "close",
      label,
      sectionTitle,
      sectionNumber,
    });
  }

  function renderCards(category) {
    return Object.entries(latestBySeries).filter(([seriesId]) => 
      metadataBySeries[seriesId]?.category === category && 
      metadataBySeries[seriesId]?.show?.toLowerCase() === "true"
    );
  }

  function getChangeValue(row, metadata, isPercentage) {
    if (isPercentage) {
      return row.period_over_period_percent ?? row.month_over_month_percent;
    }
    return row.period_over_period_change ?? row.month_over_month_change;
  }

  function getYearOverYearChange(row, metadata, isPercentage) {
    return isPercentage ? row.year_over_year_percent : row.year_over_year_change;
  }

  function getTimePeriod(metadata) {
    const updated = metadata?.updated?.toLowerCase?.();
    if (updated === "daily" || updated === "day" || updated === "weekly" || updated === "week") {
      return "week";
    } else if (updated === "monthly" || updated === "month") {
      return "month";
    } else if (updated === "quarterly" || updated === "quarter") {
      return "quarter";
    } else {
      return "period";
    }
  }

  // Track expanded state for each card
  let expandedCards = {};
  
  function toggleCard(seriesId) {
    expandedCards[seriesId] = !expandedCards[seriesId];
  }
</script>

<Embed>
  <AnalyticsBanner {analyticsProps} hideBanner />

  {#each [
    { title: "Consumer behaviour", category: "consumer" },
    { title: "Business", category: "business" },
    { title: "Energy and housing", category: "energy" },
    { title: "Transport", category: "transport" }
  ] as section}
    <Section width="wide">
      <h2>{section.title}</h2>
      <div class="cards">
        {#each renderCards(section.category) as [seriesId, row]}
              <div class="card {expandedCards[seriesId] ? 'expanded' : 'collapsed'}" on:click={() => toggleCard(seriesId)} on:keydown={(e) => e.key === 'Enter' && toggleCard(seriesId)} role="button" tabindex="0">
                <div class="card-header">
                  <div class="title-with-arrow">
                    <svg class="twisty-arrow {expandedCards[seriesId] ? 'expanded' : ''}" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                      {#if expandedCards[seriesId]}
                        <path d="M5 12 L19 12" stroke-width="2.5" stroke-linecap="round"/>
                      {:else}
                        <path d="M12 5 L12 19 M5 12 L19 12" stroke-width="2.5" stroke-linecap="round"/>
                      {/if}
                    </svg>
                    <h3 class="card-title">{metadataBySeries[seriesId]?.title ?? seriesId}</h3>
                  </div>
                  <div class="card-header-right">
                    {#if !expandedCards[seriesId]}
                      <div class="compact-change">
                        <p style="margin:0; margin-right:12px; font-weight:normal; font-size:14px; color:#666; line-height:1.2; text-align:right;">
                          <span style="text-transform: capitalize;">{getTimePeriod(metadataBySeries[seriesId])}</span> up to<br>{row.date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <ChangeIndicator
                          seriesId={seriesId}
                          metadataBySeries={metadataBySeries}
                          change={getChangeValue(row, metadataBySeries[seriesId], metadataBySeries[seriesId]?.units === "percentage")}
                          units={metadataBySeries[seriesId]?.units}
                          showLabel={false}
                        />
                      </div>
                    {/if}
                    <div class="updated-flag-container">
                      {#if String(metadataBySeries[seriesId]?.updated_this_week).toLowerCase() === 'true'}
                        <span class="updated-flag"><span class="updated-dot" aria-hidden></span>Updated this week</span>
                      {/if}
                    </div>
                  </div>
                </div>
                {#if expandedCards[seriesId]}
                <p class="subtitle">{metadataBySeries[seriesId]?.description}</p>
                <div class="layout-container">
                  <div class="chart">
                    <LineChartSimple
                      data={row.full_series}
                      yKey="num_uk"
                      lineColor="#206095"
                      startDate={new Date(2023, 0, 1)}
                      endDate={new Date(2025, 11, 17)}
                      title={metadataBySeries[seriesId]?.title}
                      description={metadataBySeries[seriesId]?.description}
                      units={metadataBySeries[seriesId]?.units}
                      units_chart={metadataBySeries[seriesId]?.units_chart}
                      index={metadataBySeries[seriesId]?.index}
                      thousands={metadataBySeries[seriesId]?.thousands}
                      series_id={seriesId}
                      thinSeries={metadataBySeries[seriesId]?.thin_line === "TRUE" ? seriesId : null}
                      meta={{
                        yMinMode: metadataBySeries[seriesId]?.yMinMode ?? "auto",
                        yPadding: metadataBySeries[seriesId]?.yPadding ?? 0.1
                      }}
                    />
                  </div>
                  <div class="causes-container">
                    <div class="causes-header">
                      <h4>
                        Change in {metadataBySeries[seriesId]?.units}
                      </h4>
                      <p style="margin:0; font-weight:normal; font-size:14px; color:#666">
                        up to {row.date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div class="causes-row">
                      {#each [
                        { label: undefined, getValue: (r, m, isP) => getChangeValue(r, m, isP) },
                        { label: "year", getValue: (r, m, isP) => getYearOverYearChange(r, m, isP) }
                      ] as indicator}
                        <div class="causes-child">
                          <ChangeIndicator
                            seriesId={indicator.label ? undefined : seriesId}
                            metadataBySeries={indicator.label ? undefined : metadataBySeries}
                            label={indicator.label}
                            change={indicator.getValue(row, metadataBySeries[seriesId], metadataBySeries[seriesId]?.units === "percentage")}
                            units={metadataBySeries[seriesId]?.units}
                          />
                        </div>
                      {/each}
                    </div>
                    <p class="get-data-link">
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        Get the data for {(metadataBySeries[seriesId]?.title ?? seriesId).toLowerCase().replace('uk', 'UK')}
                        <svg class="external-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M12 8.66667V12.6667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M6.66666 9.33333L14 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </a>
                    </p>
                  </div>
                </div>
                {/if}
              </div>
            {/each}
          </div>
    </Section>
    <Divider hr="full" />
  {/each}
</Embed>

<style>
  h2 {
    padding: 0px 0 11px 0;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  .card {
    background: #f5f5f5;
    padding: 16px 20px 20px 20px;
    cursor: pointer;
    transition: padding 0.3s ease, background 0.3s ease;
    width: 950px;
    max-width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .card.collapsed {
    padding: 16px 20px;
  }

  .card:hover {
    background: #ebebeb;
  }

  .card:focus {
    outline: none;
  }

  .card:focus-visible {
    outline: 3px solid #206095;
    outline-offset: 2px;
  }

  /* Typography inside cards */
  .card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
    color: #222;
    margin: 0 0 0px 0;
  }

  .card h4 {
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.3;
    color: #222;
    margin: 0;
  }

  .card p {
    font-size: 1rem;
    color: #222;
    margin: 0 0 12px 0;
  }

  .subtitle {
    line-height: 1.3;
    padding-top: 10px;
  }

  .card-full-width {
    width: 100% !important;
    grid-column: 1 / -1;
  }

  .layout-container {
    display: flex;
    flex-wrap: wrap; /* ✅ allow children to wrap */
    gap: 16px;
    margin-top: 40px;
  }

  .layout-header {
    width: 100%; /* ✅ force full width */
    font-size: 1.25rem;
    font-weight: bold;
    padding: 0px 0 0 0;
    border-bottom: 1px solid #ccc;
  }

  .chart {
    padding: 0px;
    flex: 1 1 100%; /* ✅ full width on mobile */
  }

  .causes-container {
    display: flex;
    flex-direction: column;
    gap: 0px;
    flex: 1 1 100%; /* ✅ full width on mobile */
  }

  .causes-header {
    font-weight: bold;
    padding: 0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 0;
    margin: 0;
  }

  .card-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .title-with-arrow {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex: 1;
  }

  .twisty-arrow {
    flex-shrink: 0;
    transition: all 0.3s ease;
    margin-top: 3px;
    display: block;
    outline: none;
    border: none;
  }

  .twisty-arrow path {
    stroke: rgb(55, 55, 55);
  }

  .twisty-arrow.expanded {
    /* No rotation needed for +/- icons */
  }

  .card-title {
    margin: 0;
    padding: 0;
    font-size: 1.05rem;
    line-height: 1.1;
    font-weight: 600;
    flex: 1;
    color: #206095;
  }

  .compact-change {
    padding-top: 0;
    display: flex;
    align-items: center;
  }

  .compact-change :global(.change-indicator) {
    align-self: center;
  }

  .updated-flag-container {
    min-width: 170px; /* width to reserve space for "Updated this week" flag */
    display: flex;
    justify-content: flex-end;
  }

  .updated-flag {
    font-size: 0.85rem;
    color: #666;
    font-weight: 400;
    white-space: nowrap;
  }

  .updated-dot {
    display: inline-block;
    width: 12px; /* diameter 12px => radius 6px */
    height: 12px;
    border-radius: 6px;
    background-color: #16a34a; /* green */
    margin-right: 8px;
    flex: 0 0 auto;
  }

  .causes-row {
    display: flex;
    gap: 16px;
  }

  .causes-child {
    flex: 1;
    padding: 0px;
    padding-top: 8px;
  }

  .card .get-data-link {
    padding-top: 15px;
    margin-top: 8px;
    font-size: 17px;
    line-height: 1.3;
  }

  .card .get-data-link a {
    color: #206095;
    text-decoration: underline;
    display: inline;
  }

  .card .get-data-link a:hover {
    color: #0F1E2E;
  }

  .card .get-data-link .external-icon {
    display: inline;
    vertical-align: baseline;
    margin-left: 2px;
  }

  .layout-container,
  .causes-header,
  .causes-row,
  .causes-child,
  .chart {
    border: 0px solid #666;
  }

  svg:not(.external-icon):not(.twisty-arrow) {
    border: 1px solid #666;
  }

  @media screen and (min-width: 608px) {
    .chart {
      flex: 1 1 30%;
    }

    .causes-container {
      flex: 2 1 0;
    }
  }

  /* Mobile: stack elements and improve spacing */
  @media screen and (max-width: 950px) {
    .card {
      width: 100%;
      padding: 16px;
    }

    .card.collapsed {
      padding: 12px 16px;
    }
  }

  @media screen and (max-width: 607px) {
    .card-header {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      padding: 0px;
    }

    .card-header-right {
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
      gap: 8px;
    }

    .compact-change {
      order: 1;
    }

    .updated-flag-container {
      min-width: auto;
      order: 2;
    }

    .updated-flag {
      font-size: 0.8rem;
    }

    .updated-dot {
      width: 10px;
      height: 10px;
      border-radius: 5px;
      margin-right: 6px;
    }

    .card-title {
      margin: 0;
      padding: 0;
      font-size: 1rem;
      color: #206095;
    }

    .layout-container {
      gap: 12px;
      margin-top: 12px;
    }

    .causes-row {
      flex-direction: column;
      gap: 12px;
    }
  }
</style>