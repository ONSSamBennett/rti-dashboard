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
    Button,
  } from "@onsvisual/svelte-components";
  import LineChartSimple from "$lib/LineChartSimple.svelte";
  import ChangeIndicator from "$lib/ChangeIndicator.svelte";
  import insertHeader from "$lib/insert-header.js";
  import { format } from "d3-format";
  import { makeDataFile } from "$lib/dataDownload.js";
  export let data;

  const { metadataBySeries } = data;

  const { latestBySeries } = data;
  const dateCurrent = new Date(data.dates.current);
  const dateNext = new Date(data.dates.next);

  const analyticsProps = {
    contentTitle: "Real-time indicators dashboard",
    releaseDate: data.dates.current.replaceAll("-", ""),
    nextReleaseDate: data.dates.next.replaceAll("-", ""),
    outputSeries: "economicactivityandsocialchangeintheukrealtimeindicators",
    contentType: "dashboard",
  };

  const dateOptions2 = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  //get header dates from
  onMount(() =>
    insertHeader(
      dateCurrent.toLocaleDateString("en-GB", dateOptions2),
      dateNext.toLocaleDateString("en-GB", dateOptions2),
      dateCurrent.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
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
    return Object.entries(latestBySeries).filter(
      ([seriesId]) =>
        metadataBySeries[seriesId]?.category === category &&
        metadataBySeries[seriesId]?.show?.toLowerCase() === "true"
    );
  }

  function getChangeValue(row, isPercentage) {
    return isPercentage
      ? row.period_over_period_percent
      : row.period_over_period_change;
  }

  function getYearOverYearChange(row, isPercentage) {
    return isPercentage
      ? row.year_over_year_percent
      : row.year_over_year_change;
  }

  function getTimePeriod(metadata) {
    const updated = metadata?.updated?.toLowerCase?.();
    if (
      updated === "daily" ||
      updated === "day" ||
      updated === "weekly" ||
      updated === "week"
    ) {
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

  function toggleCard(seriesId, sectionTitle, sectionNumber) {
    const wasExpanded = expandedCards[seriesId];
    expandedCards[seriesId] = !expandedCards[seriesId];

    // Track analytics
    analyticsEvent({
      event: "interaction",
      interactionType: "accordion",
      interactionValue: expandedCards[seriesId] ? "open" : "close",
      label: metadataBySeries[seriesId]?.title ?? seriesId,
      sectionTitle,
      sectionNumber,
    });
  }

  function trackDataLinkClick(seriesId, sectionTitle, sectionNumber) {
    analyticsEvent({
      event: "interaction",
      interactionType: "link",
      interactionValue: "click",
      label: metadataBySeries[seriesId]?.title ?? seriesId,
      sectionTitle,
      sectionNumber,
    });
  }

  function downloadData() {
    const dataFile = makeDataFile(latestBySeries, metadataBySeries, data.dates);
    const link = document.createElement("a");
    link.href = dataFile.href;
    link.download = `rti-dashboard-data-${dataFile.publicationDate}.csv`;
    link.click();

    // Track analytics
    analyticsEvent({
      event: "interaction",
      interactionType: "button",
      interactionValue: "click",
      label: "Download all data",
      sectionTitle: "Data download",
      sectionNumber: "footer",
    });
  }
</script>

<Embed>
  <AnalyticsBanner {analyticsProps} hideBanner />

  <div class="mobile-legend" aria-hidden="true">
    <span class="updated-dot" aria-hidden="true" />
    <span class="legend-text">Updated this week</span>
  </div>

  {#each [{ title: "Consumer behaviour", category: "consumer" }, { title: "Business", category: "business" }, { title: "Energy and housing", category: "energy" }, { title: "Transport", category: "transport" }] as section, sectionIndex}
    <Section width="wide">
      <section aria-label="{section.title} section">
        <h2>{section.title}</h2>
        <div class="cards">
          {#each renderCards(section.category) as [seriesId, row]}
            <button
              class="card {expandedCards[seriesId] ? 'expanded' : 'collapsed'}"
              on:click={() =>
                toggleCard(seriesId, section.title, String(sectionIndex + 1))}
              aria-expanded={expandedCards[seriesId] ? "true" : "false"}
              aria-label="{expandedCards[seriesId]
                ? 'Collapse'
                : 'Expand'} {metadataBySeries[seriesId]?.title ??
                seriesId} details"
            >
              <div class="card-header">
                <div class="title-with-arrow">
                  <svg
                    class="twisty-arrow {expandedCards[seriesId]
                      ? 'expanded'
                      : ''}"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {#if expandedCards[seriesId]}
                      <path
                        d="M5 12 L19 12"
                        stroke-width="2.5"
                        stroke-linecap="round"
                      />
                    {:else}
                      <path
                        d="M12 5 L12 19 M5 12 L19 12"
                        stroke-width="2.5"
                        stroke-linecap="round"
                      />
                    {/if}
                  </svg>
                  <h3 class="card-title">
                    {metadataBySeries[seriesId]?.title ?? seriesId}
                    {#if String(metadataBySeries[seriesId]?.updated_this_week).toLowerCase() === "true"}
                      <span class="screen-reader-only">Updated this week.</span>
                      <span class="updated-dot-inline" aria-hidden="true" />
                      <span class="updated-flag-top-row">
                        <span class="updated-flag-top"
                          ><span class="updated-dot" aria-hidden />Updated this
                          week</span
                        >
                      </span>
                    {/if}
                  </h3>
                </div>
                <div class="card-header-right">
                  {#if !expandedCards[seriesId]}
                    <div class="compact-change">
                      <p
                        style="margin:0; font-weight:normal; font-size:14px; color:#666; line-height:1.3; text-align:right;"
                      >
                        <span style="text-transform: capitalize;"
                          >{getTimePeriod(metadataBySeries[seriesId])}</span
                        >
                        up to<br />{metadataBySeries[
                          seriesId
                        ]?.updated?.toLowerCase() === "monthly"
                          ? row.date.toLocaleDateString("en-GB", {
                              year: "numeric",
                              month: "long",
                            })
                          : row.date.toLocaleDateString("en-GB", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                      </p>
                      <ChangeIndicator
                        {seriesId}
                        {metadataBySeries}
                        change={getChangeValue(
                          row,
                          metadataBySeries[seriesId]?.units === "percentage"
                        )}
                        units={metadataBySeries[seriesId]?.units}
                        showLabel={false}
                      />
                    </div>
                  {/if}
                  <div class="updated-flag-container">
                    {#if String(metadataBySeries[seriesId]?.updated_this_week).toLowerCase() === "true"}
                      <span class="updated-flag"
                        ><span class="updated-dot" aria-hidden />Updated this
                        week</span
                      >
                    {/if}
                  </div>
                </div>
              </div>
              {#if expandedCards[seriesId]}
                <p class="subtitle">
                  {metadataBySeries[seriesId]?.description}
                </p>
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
                      thinSeries={metadataBySeries[seriesId]?.thin_line ===
                      "TRUE"
                        ? seriesId
                        : null}
                      updated={metadataBySeries[seriesId]?.updated}
                      meta={{
                        yMinMode:
                          metadataBySeries[seriesId]?.yMinMode ?? "auto",
                        yPadding: metadataBySeries[seriesId]?.yPadding ?? 0.1,
                      }}
                    />
                  </div>
                  <div class="indicators-container">
                    <div class="indicators-header">
                      <h4>
                        Change in {metadataBySeries[seriesId]?.units}
                      </h4>
                      <p style="font-weight:normal; font-size:14px; color:#666">
                        up to {metadataBySeries[
                          seriesId
                        ]?.updated?.toLowerCase() === "monthly"
                          ? row.date.toLocaleDateString("en-GB", {
                              year: "numeric",
                              month: "long",
                            })
                          : row.date.toLocaleDateString("en-GB", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                      </p>
                    </div>
                    <div class="indicators-row">
                      {#each [{ label: undefined, getValue: (r, isP) => getChangeValue(r, isP) }, { label: "year", getValue: (r, isP) => getYearOverYearChange(r, isP) }] as indicator}
                        <div class="indicators-child">
                          <ChangeIndicator
                            seriesId={indicator.label ? undefined : seriesId}
                            metadataBySeries={indicator.label
                              ? undefined
                              : metadataBySeries}
                            label={indicator.label}
                            change={indicator.getValue(
                              row,
                              metadataBySeries[seriesId]?.units === "percentage"
                            )}
                            units={metadataBySeries[seriesId]?.units}
                          />
                        </div>
                      {/each}
                    </div>
                    <p class="get-data-link">
                      <a
                        href={metadataBySeries[seriesId]?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        on:click={() =>
                          trackDataLinkClick(
                            seriesId,
                            section.title,
                            String(sectionIndex + 1)
                          )}
                      >
                        Go to the {(
                          metadataBySeries[seriesId]?.title ?? seriesId
                        )
                          .toLowerCase()
                          .replace("uk", "UK")} dataset
                        <span class="screen-reader-only"
                          >(opens in new tab)</span
                        >
                        <svg
                          class="external-icon"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M12 8.66667V12.6667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M10 2H14V6"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M6.66666 9.33333L14 2"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </a>
                    </p>
                  </div>
                </div>
              {/if}
            </button>
          {/each}
        </div>
      </section>
    </Section>
    <Divider hr="full" />
  {/each}

  <Section width="wide">
    <div class="download-section">
      <h2>Download dashboard data</h2>
      <div>
        <p>
          Download all indicator data from this dashboard in a single CSV file.
          The file includes all series with their complete time series data.
        </p>
        <Button
          type="button"
          variant="secondary"
          icon="download"
          iconPosition="before"
          small={true}
          on:click={downloadData}
        >
          Download all data (CSV)
        </Button>
      </div>
    </div>
  </Section>
</Embed>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  @media screen and (max-width: 950px) {
    :global(body),
    :global(#svelte),
    :global(.ons-page),
    :global(.ons-page__container),
    :global(.ons-container) {
      padding-left: 0 !important;
      padding-right: 0 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
    }
  }

  h2 {
    padding: 0px 0 11px 0;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  .card {
    /* Button reset */
    border: none;
    font-family: inherit;
    font-size: inherit;
    text-align: left;

    background: #f5f5f5;
    padding: 16px 20px 20px 20px;
    cursor: pointer;
    transition: padding 0.3s ease, background 0.3s ease;
    width: 100%;
    max-width: 950px;
  }

  .card.collapsed {
    padding: 16px 20px;
  }

  @media (hover: hover) {
    .card:hover {
      background: #ebebeb;
    }
  }

  .card:focus {
    outline: none;
  }

  .card:focus-visible {
    outline: 3px solid #222;
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
    font-size: 17px;
    font-weight: 700;
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
    font-size: 18px !important;
    text-wrap: balance;
  }

  .card-full-width {
    width: 100% !important;
    grid-column: 1 / -1;
  }

  .layout-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 40px;
  }

  .chart,
  .indicators-container {
    flex: 1 1 100%;
  }

  .indicators-container {
    display: flex;
    flex-direction: column;
  }

  .indicators-header {
    font-weight: bold;
    padding: 0;
  }

  .indicators-header p {
    margin: 0;
    margin-top: 4px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 0;
    margin: 0;
    position: relative;
  }

  .card-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    margin-right: 180px;
  }

  .title-with-arrow {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-height: 32px;
  }

  .twisty-arrow {
    flex-shrink: 0;
    transition: all 0.3s ease;
    margin-top: 0;
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
    text-wrap: balance;
  }

  .compact-change {
    padding-top: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .compact-change p {
    align-self: center;
  }

  .compact-change :global(.indicator-area) {
    align-self: center;
  }

  .updated-flag-container {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 0px;
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
    margin-right: 6px;
    flex: 0 0 auto;
  }

  .updated-dot-inline {
    display: none; /* hidden on desktop */
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

  .updated-flag-top-row {
    display: none; /* hidden by default, shown only on intermediate screens */
  }

  .updated-flag-top {
    font-size: 0.85rem;
    color: #666;
    font-weight: 400;
    white-space: nowrap;
    display: inline;
  }

  .indicators-row {
    display: flex;
    gap: 16px;
  }

  .indicators-child {
    flex: 1;
    padding-top: 8px;
    overflow-wrap: break-word;
  }

  .card .get-data-link {
    padding-top: 15px;
    margin-top: 8px;
    font-size: 17px;
    line-height: 1.3;
    overflow-wrap: break-word;
    word-wrap: break-word;
    text-wrap: balance;
  }

  .card .get-data-link a {
    color: #206095;
    text-decoration: underline;
    display: inline;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }

  .card .get-data-link a:hover {
    color: #0f1e2e;
  }

  .card .get-data-link .external-icon {
    display: inline;
    vertical-align: -2px;
    margin-left: 2px;
  }

  .layout-container,
  .indicators-header,
  .indicators-row,
  .indicators-child,
  .chart {
    border: 0px solid #666;
  }

  svg:not(.external-icon):not(.twisty-arrow) {
    border: 1px solid #666;
  }

  /* Breakpoint defined in src/lib/config.js */
  @media screen and (min-width: 721px) {
    .chart {
      flex: 1 1 30%;
      min-width: 0;
    }

    .indicators-container {
      flex: 2 1 0;
      min-width: 0;
    }
  }

  /* Desktop: lock card width */
  @media screen and (min-width: 951px) {
    .card {
      width: 950px !important;
    }
  }

  /* Mobile: full width */
  @media screen and (max-width: 950px) {
    .card {
      width: 100% !important;
      padding: 16px;
    }

    .card.collapsed {
      padding: 16px 16px 12px 16px;
    }

    .subtitle {
      font-size: 16px !important;
    }
  }

  .mobile-legend {
    display: none;
    align-items: center;
    gap: 2px;
    padding: 12px 0;
    font-size: 0.9rem;
    color: #666;
  }

  .legend-text {
    font-weight: 400;
    font-size: 14px;
  }

  /* Mobile breakpoints: below 720px - shared styles */
  @media screen and (max-width: 720px) {
    h2 {
      padding: 0 0 4px 0;
    }

    .card h3 {
      font-size: 1.1rem;
      overflow-wrap: break-word;
    }

    .card-header {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .card-header-right {
      margin-right: 0;
      flex-direction: row;
      align-items: center;
      width: 100%;
      gap: 12px;
    }

    .card.expanded .card-header-right {
      display: none;
    }

    .title-with-arrow {
      flex-direction: row-reverse;
      gap: 8px;
    }

    .card-title {
      font-size: 1.1rem;
    }

    .compact-change {
      flex-direction: row-reverse;
      gap: 12px;
    }

    .compact-change p {
      text-align: left !important;
    }

    .updated-flag-container {
      display: none;
    }

    .subtitle {
      font-size: 16px !important;
      padding-top: 4px;
    }

    .layout-container {
      gap: 24px;
      margin-top: 20px;
    }

    .indicators-header {
      margin-top: 2px;
    }

    .indicators-header p {
      margin-top: 4px;
    }

    .indicators-row {
      gap: 12px;
    }
  }

  /* Medium mobile: 491-720px */
  @media screen and (min-width: 491px) and (max-width: 720px) {
    .title-with-arrow {
      justify-content: space-between;
    }

    .updated-flag-top-row {
      display: inline;
      margin-left: 8px;
    }

    .card-header-right {
      justify-content: flex-start;
    }
  }

  /* Small mobile: below 490px */
  @media screen and (max-width: 490px) {
    .mobile-legend {
      display: flex;
      padding: 12px 4px;
    }

    .title-with-arrow {
      justify-content: flex-end;
    }

    .card-header-right {
      justify-content: space-between;
      gap: 8px;
    }

    .updated-dot {
      width: 10px;
      height: 10px;
      border-radius: 5px;
    }

    .updated-dot-inline {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background-color: #16a34a;
      margin-left: 4px;
      vertical-align: middle;
      left: -2px;
    }
  }

  /* Download section styles */
  .download-section {
    padding: 0 0 32px 0;
    max-width: 950px;
    margin: 0 auto;
  }

  .download-section h2 {
    margin-bottom: 0px;
    margin-top: 0;
  }

  .download-section p {
    color: #666;
    margin-bottom: 0;
    margin-top: 0;
  }

  @media screen and (max-width: 490px) {
    .download-section {
      text-align: center;
    }

    .download-section p {
      margin-bottom: 24px;
    }
  }

  @media screen and (min-width: 491px) {
    .download-section {
      display: flex;
      flex-direction: column;
      gap: 0px;
    }

    .download-section > div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
  }
</style>
