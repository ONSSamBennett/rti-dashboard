<script>
  import { onMount } from "svelte";
  import {
    Embed,
    Notice,
    Section,
    Cards,
    Card,
    Twisty,
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

  <Section title="Transport" width="medium">
    <p>Subtitle if needed</p>
  </Section>
  {#if current_bank_holiday || previous_bank_holiday}
    <Section width="wide">
      <Notice>
        {#if current_bank_holiday && previous_bank_holiday}
          Both the latest week and previous week included a bank holiday, which
          can mean fewer death registrations. This can lead to larger
          differences when comparing with other weeks and with expected deaths
        {:else if current_bank_holiday}
          The latest week included a bank holiday, which can mean fewer death
          registrations. This can lead to larger differences when comparing with
          the previous weeks and with expected deaths
        {:else}
          The previous week included a bank holiday, which can mean fewer death
          registrations. This can lead to larger differences when comparing with
          the latest week and with expected deaths
        {/if}
      </Notice>
    </Section>
  {/if}

  <Cards>
    {#each Object.entries(latestBySeries) as [seriesId, row]}
      <div class="card-full-width">
        <div class="layout-container">
          <Card title={metadataBySeries[seriesId]?.title ?? seriesId}>
            <p>{metadataBySeries[seriesId]?.description}</p>
            <div chart-div>
              <LineChartSimple
                data={row.full_series}
                yKey="num_uk"
                lineColor="#206095"
                title={metadataBySeries[seriesId]?.title}
                description={metadataBySeries[seriesId]?.description}
                units={metadataBySeries[seriesId]?.units}
              />
            </div>
            <h4>Change in {metadataBySeries[seriesId]?.units}</h4>
            <div class="causes-container">
              <div class="causes-child">
                <ChangeIndicator
                  label="month"
                  change={row.month_over_month_change}
                  units={metadataBySeries[seriesId]?.units}
                />
              </div>
              <div class="causes-child">
                <ChangeIndicator
                  label="year"
                  change={row.year_over_year_change}
                  units={metadataBySeries[seriesId]?.units}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    {/each}
  </Cards>

  <!--
  {#each Object.entries(latestBySeries) as [seriesId, row]}
    <div class="card-full-width">
      <div class="layout-container">
        <div class="layout-header">
          <p>{metadataBySeries[seriesId]?.title ?? seriesId}</p>
          <p />
          <p>{metadataBySeries[seriesId]?.description}</p>
        </div>
        <div class="chart">
          <LineChartSimple
            data={row.full_series}
            yKey="num_uk"
            lineColor="#206095"
            title={metadataBySeries[seriesId]?.title}
            description={metadataBySeries[seriesId]?.description}
            units={metadataBySeries[seriesId]?.units}
          />
        </div>
        <div class="causes-container">
          <div class="causes-header">
                <h4 style="padding-top:10px; margin-bottom:10px">          
           {metadataBySeries[seriesId]?.units}</h4>
          </div>
          <div class="causes-row">
            <div class="causes-child">
              <ChangeIndicator
                label="month"
                change={row.month_over_month_change}
                units={metadataBySeries[seriesId]?.units}
              />
            </div>
            <div class="causes-child">
              <ChangeIndicator
                label="year"
                change={row.year_over_year_change}
                units={metadataBySeries[seriesId]?.units}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  {/each}

  <div class="card-full-width">
    <div class="layout-container">
      <div class="layout-header">Main Header</div>
      <div class="chart">Chart</div>
      <div class="causes-container">
        <div class="causes-header">Causes Header</div>
        <div class="causes-row">
          <div class="causes-child">Cause 1</div>
          <div class="causes-child">Cause 2</div>
        </div>
      </div>
    </div>
  </div>

  -->

  <Cards>
    {#each Object.entries(latestBySeries) as [seriesId, row]}
      <Card title={metadataBySeries[seriesId]?.title ?? seriesId} colspan={3}>
        <p>{metadataBySeries[seriesId]?.description}</p>
        <div class="layout-container">
          <div class="chart">
            <LineChartSimple
              data={row.full_series}
              yKey="num_uk"
              lineColor="#206095"
              title={metadataBySeries[seriesId]?.title}
              description={metadataBySeries[seriesId]?.description}
              units={metadataBySeries[seriesId]?.units}
            />
          </div>
          <div class="causes-container">
            <div class="causes-header">
              <h4 style="padding-top:10px; margin-bottom:10px">
                Change in {metadataBySeries[seriesId]?.units}
              </h4>
            </div>
            <div class="causes-row">
              <div class="causes-child">
                <ChangeIndicator
                  label="month"
                  change={row.month_over_month_change}
                  units={metadataBySeries[seriesId]?.units}
                />
              </div>
              <div class="causes-child">
                <ChangeIndicator
                  label="year"
                  change={row.year_over_year_change}
                  units={metadataBySeries[seriesId]?.units}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    {/each}
  </Cards>
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
</style>
