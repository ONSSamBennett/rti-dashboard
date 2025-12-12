<script>
  import { onMount } from "svelte";
  import {
    Embed,
    Notice,
    Section,
    Cards,
    Card,
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
  export let data2;

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
</script>

<Embed>
  <AnalyticsBanner {analyticsProps} hideBanner />

  <Section width="wide">
    <Accordion>
      <AccordionItem title="Consumer behaviour">
        <Cards>
          {#each Object.entries(latestBySeries) as [seriesId, row]}
            {#if metadataBySeries[seriesId]?.category === "consumer" && metadataBySeries[seriesId]?.show?.toLowerCase() === "true"}
              <Card colspan={3}>
                <div class="card-header">
                  <h3 class="card-title">{metadataBySeries[seriesId]?.title ?? seriesId}</h3>
                  {#if String(metadataBySeries[seriesId]?.updated_this_week).toLowerCase() === 'true'}
                    <span class="updated-flag"><span class="updated-dot" aria-hidden></span>Updated this week</span>
                  {/if}
                </div>
                <p>{metadataBySeries[seriesId]?.description}</p>
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
                      <h4
                        style="padding-top:10px; font-size:17px; margin-bottom:5px"
                      >
                        Change in {metadataBySeries[seriesId]?.units}
                      </h4>
                      <p style="margin:0; font-weight:normal; font-size:14px; color:#666">
                        up to {row.date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div class="causes-row">
                      <div class="causes-child">
                        <ChangeIndicator
                          seriesId={seriesId}
                          metadataBySeries={metadataBySeries}
                          change={metadataBySeries[seriesId]?.units === "percentage"
                            ? (row.period_over_period_percent ?? row.month_over_month_percent)
                            : (row.period_over_period_change ?? row.month_over_month_change)}
                          units={metadataBySeries[seriesId]?.units}
                        />
                      </div>
                      <div class="causes-child">
                        <ChangeIndicator
                          label="year"
                          change={metadataBySeries[seriesId]?.units ===
                          "percentage"
                            ? row.year_over_year_percent
                            : row.year_over_year_change}
                          units={metadataBySeries[seriesId]?.units}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            {/if}
          {/each}
        </Cards>
      </AccordionItem>
      <AccordionItem title="Business">
        <Cards>
          {#each Object.entries(latestBySeries) as [seriesId, row]}
            {#if metadataBySeries[seriesId]?.category === "business" && metadataBySeries[seriesId]?.show?.toLowerCase() === "true"}
              <Card colspan={3}>
                <div class="card-header">
                  <h3 class="card-title">{metadataBySeries[seriesId]?.title ?? seriesId}</h3>
                  {#if String(metadataBySeries[seriesId]?.updated_this_week).toLowerCase() === 'true'}
                    <span class="updated-flag"><span class="updated-dot" aria-hidden></span>Updated this week</span>
                  {/if}
                </div>
                <p>{metadataBySeries[seriesId]?.description}</p>
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
      yMinMode: metadataBySeries[seriesId]?.yMinMode ?? "zero",     // "zero" | "data" | "above-zero"
      yPadding: metadataBySeries[seriesId]?.yPadding ?? 0.1         // 10% padding
    }}

                    />
                  </div>
                  <div class="causes-container">
                        <div class="causes-header">
                      <h4
                        style="padding-top:10px; font-size:17px; margin-bottom:5px"
                      >
                        Change in {metadataBySeries[seriesId]?.units}
                      </h4>
                      <p style="margin:0; font-weight:normal; font-size:14px; color:#666">
                        up to {row.date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div class="causes-row">
                      <div class="causes-child">
                        <ChangeIndicator
                          seriesId={seriesId}
                          metadataBySeries={metadataBySeries}
                          change={metadataBySeries[seriesId]?.units === "percentage"
                            ? (row.period_over_period_percent ?? row.month_over_month_percent)
                            : (row.period_over_period_change ?? row.month_over_month_change)}
                          units={metadataBySeries[seriesId]?.units}
                        />
                      </div>
                      <div class="causes-child">
                        <ChangeIndicator
                          label="year"
                          change={metadataBySeries[seriesId]?.units ===
                          "percentage"
                            ? row.year_over_year_percent
                            : row.year_over_year_change}
                          units={metadataBySeries[seriesId]?.units}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            {/if}
          {/each}
        </Cards>
      </AccordionItem>
      <AccordionItem title="Energy and housing">
        <Cards>
          {#each Object.entries(latestBySeries) as [seriesId, row]}
            {#if metadataBySeries[seriesId]?.category === "energy" && metadataBySeries[seriesId]?.show?.toLowerCase() === "true"}
              <Card colspan={3}>
                <div class="card-header">
                  <h3 class="card-title">{metadataBySeries[seriesId]?.title ?? seriesId}</h3>
                  {#if String(metadataBySeries[seriesId]?.updated_this_week).toLowerCase() === 'true'}
                    <span class="updated-flag"><span class="updated-dot" aria-hidden></span>Updated this week</span>
                  {/if}
                </div>
                <p>{metadataBySeries[seriesId]?.description}</p>
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
                      <h4
                        style="padding-top:10px; font-size:17px; margin-bottom:5px"
                      >
                        Change in {metadataBySeries[seriesId]?.units}
                      </h4>
                      <p style="margin:0; font-weight:normal; font-size:14px; color:#666">
                        up to {row.date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div class="causes-row">
                      <div class="causes-child">
                        <ChangeIndicator
                          seriesId={seriesId}
                          metadataBySeries={metadataBySeries}
                          change={metadataBySeries[seriesId]?.units === "percentage"
                            ? (row.period_over_period_percent ?? row.month_over_month_percent)
                            : (row.period_over_period_change ?? row.month_over_month_change)}
                          units={metadataBySeries[seriesId]?.units}
                        />
                      </div>
                      <div class="causes-child">
                        <ChangeIndicator
                          label="year"
                          change={metadataBySeries[seriesId]?.units ===
                          "percentage"
                            ? row.year_over_year_percent
                            : row.year_over_year_change}
                          units={metadataBySeries[seriesId]?.units}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            {/if}
          {/each}
        </Cards>
      </AccordionItem>
      <AccordionItem title="Transport">
        <Cards>
          {#each Object.entries(latestBySeries) as [seriesId, row]}
            {#if metadataBySeries[seriesId]?.category === "transport" && metadataBySeries[seriesId]?.show?.toLowerCase() === "true"}
              <Card colspan={3}>
                <div class="card-header">
                  <h3 class="card-title">{metadataBySeries[seriesId]?.title ?? seriesId}</h3>
                  {#if String(metadataBySeries[seriesId]?.updated_this_week).toLowerCase() === 'true'}
                    <span class="updated-flag"><span class="updated-dot" aria-hidden></span>Updated this week</span>
                  {/if}
                </div>
                <p>{metadataBySeries[seriesId]?.description}</p>
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
                      <h4
                        style="padding-top:10px; font-size:17px; margin-bottom:5px"
                      >
                        Change in {metadataBySeries[seriesId]?.units}
                      </h4>
                      <p style="margin:0; font-weight:normal; font-size:14px; color:#666">
                        up to {row.date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div class="causes-row">
                      <div class="causes-child">
                        <ChangeIndicator
                          seriesId={seriesId}
                          metadataBySeries={metadataBySeries}
                          change={metadataBySeries[seriesId]?.units === "percentage"
                            ? (row.period_over_period_percent ?? row.month_over_month_percent)
                            : (row.period_over_period_change ?? row.month_over_month_change)}
                          units={metadataBySeries[seriesId]?.units}
                        />
                      </div>
                      <div class="causes-child">
                        <ChangeIndicator
                          label="year"
                          change={metadataBySeries[seriesId]?.units ===
                          "percentage"
                            ? row.year_over_year_percent
                            : row.year_over_year_change}
                          units={metadataBySeries[seriesId]?.units}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            {/if}
          {/each}
        </Cards>
      </AccordionItem>
    </Accordion>
  </Section>
</Embed>

<style>
  .card-full-width {
    width: 100% !important;
    grid-column: 1 / -1;
  }

  .layout-container {
    display: flex;
    flex-wrap: wrap; /* ✅ allow children to wrap */
    gap: 16px;
    margin-top: 16.8px;
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
    padding: 8px 0 0 0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 12px 0 6px; /* restore top spacing similar to native card title */
    margin-bottom: 6px;
  }

  .card-title {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.1;
    font-weight: 600;
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
  }
  .layout-container,
  .causes-header,
  .causes-row,
  .causes-child,
  .chart {
    border: 0px solid #666;
  }

  svg {
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

  /* Mobile: place the updated flag above the title but keep it right-aligned */
  @media screen and (max-width: 607px) {
    .card-header {
      flex-direction: column;
      align-items: stretch;
      padding: 10px 0 6px;
    }

    /* Put the flag above the title (DOM order is title, flag) */
    .updated-flag {
      order: -1; /* show before title */
      align-self: flex-end;
      margin-bottom: 6px;
    }

    .updated-dot {
      margin-right: 6px;
    }

    .card-title {
      margin: 0;
      order: 0;
      align-self: flex-start;
    }
  }
</style>