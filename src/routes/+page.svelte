<script>
  import { onDestroy, onMount } from "svelte";
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
  import { scaleLinear } from "d3-scale";
  import { makeDataFile } from "$lib/dataDownload.js";
  export let data;

  const { metadataBySeries, updatedBySeries } = data;

  const { latestBySeries } = data;
  const dateCurrent = new Date(data.dates.current);
  const dateNext = new Date(data.dates.next);

  const analyticsProps = {
    product: "advanced-content",
    pageTitle: "Real-time indicators dashboard",
    contentType: "visualisations",
    contentSubType: "dashboard",
    outputSeries: "economicactivityandsocialchangeintheukrealtimeindicators",
    releaseDate: data.dates.current.replaceAll("-", ""),
    nextReleaseDate: data.dates.next.replaceAll("-", ""),
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
      }),
      data.dates.email,
      data.dates.emailText
    )
  );

  function toggleEvent(e, label, sectionTitle, sectionNumber) {
    analyticsEvent({
      event: "interaction",
      interactionType: "accordion",
      interactionValue: e?.detail?.open ? "open" : "close",
      interactionLabel: label,
      sectionTitle,
      sectionNumber,
    });
  
  }




  // Compute the global max date across all series
  function getGlobalMaxDate() {
    let maxDate = null;
    Object.values(latestBySeries).forEach(row => {
      if (row.full_series && Array.isArray(row.full_series)) {
        row.full_series.forEach(d => {
          const date = new Date(d.date);
          if (!isNaN(date)) {
            if (!maxDate || date > maxDate) maxDate = date;
          }
        });
      }
    });
    return maxDate;
  }
  const globalMaxDate = getGlobalMaxDate();

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
    const indicator_period = metadata?.indicator_period?.toLowerCase?.();
    if (
      indicator_period === "daily" ||
      indicator_period === "day" ||
      indicator_period === "weekly" ||
      indicator_period === "week"
    ) {
      return "week";
    } else if (indicator_period === "monthly" || indicator_period === "month") {
      return "month";
    } else if (indicator_period === "quarterly" || indicator_period === "quarter") {
      return "quarter";
    } else {
      return "period";
    }
  }

  // Track expanded state for each card
  let expandedCards = {};

  $: visibleSeriesIds = Object.entries(latestBySeries)
    .filter(
      ([seriesId]) =>
        metadataBySeries[seriesId]?.show?.toLowerCase() === "true"
    )
    .map(([seriesId]) => seriesId);

  $: anyCardsExpanded = visibleSeriesIds.some(
    (seriesId) => expandedCards[seriesId]
  );

  function toggleAllCards() {
    const nextState = !anyCardsExpanded;
    const nextExpanded = {};

    visibleSeriesIds.forEach((seriesId) => {
      nextExpanded[seriesId] = nextState;
    });

    expandedCards = nextExpanded;

    analyticsEvent({
      event: "interaction",
      interactionType: "button",
      interactionValue: nextState ? "open" : "close",
      interactionLabel: nextState ? "Expand all cards" : "Close all cards",
      sectionTitle: "Dashboard cards",
      sectionNumber: "all",
    });
  }

  function toggleCard(seriesId, sectionTitle, sectionNumber) {
    expandedCards = {
      ...expandedCards,
      [seriesId]: !expandedCards[seriesId],
    };

    // Track analytics
    analyticsEvent({
      event: "interaction",
      interactionType: "expandableCard",
      interactionValue: expandedCards[seriesId] ? "open" : "close",
      interactionLabel: metadataBySeries[seriesId]?.title ?? seriesId,
      sectionTitle,
      sectionNumber,
    });
  }

  const destinationTaxonomy = {
    clickContentGroup: "economy",
    clickContentTheme: "economicoutputandproductivity",
    clickContentType: "dataset",
  };

  function getDatasetTitle(seriesId) {
    return metadataBySeries[seriesId]?.title ?? seriesId;
  }

  function getDatasetDisplayTitle(seriesId) {
    return getDatasetTitle(seriesId).toLowerCase().replace("uk", "UK");
  }

  function getDatasetLinkText(seriesId) {
    return `Go to the dataset for ${getDatasetDisplayTitle(seriesId)}`;
  }

  function trackDataLinkClick(seriesId, sectionTitle, sectionNumber) {
    const title = getDatasetTitle(seriesId);
    const { clickContentGroup, clickContentTheme, clickContentType } =
      destinationTaxonomy;

    analyticsEvent({
      event: "navigation-click",
      interactionType: "link",
      interactionValue: "click",
      label: title,
      sectionTitle,
      sectionNumber,

      navigationType: "to-data-download",
      linkText: getDatasetLinkText(seriesId),
      clickContentGroup,
      clickContentType,
      clickContentTheme,
    });
  }

  function getDownloadLinkText() {
    return `Download data (CSV, ${fileSizeKB}KB)`;
  }

  function getLinkDomainFromUrl(urlString) {
    if (!urlString) return "";
    try {
      const url = new URL(urlString);
      if (url.protocol === "blob:") {
        // blob URLs are of the form: blob:<origin>/<uuid>
        try {
          const originUrl = new URL(url.pathname);
          return originUrl.host;
        } catch {
          return "";
        }
      }
      return url.host;
    } catch {
      return "";
    }
  }

  // Persist a Blob URL so it can be used in data-ga-link-url
  let downloadObjectUrl = "";
  let downloadBlob;

  $: downloadFileName = `rti-dashboard-data-${dataFile?.publicationDate ?? ""}.csv`;

  $: {
    const nextBlob = dataFile?.blob;
    if (nextBlob !== downloadBlob) {
      if (downloadObjectUrl) URL.revokeObjectURL(downloadObjectUrl);
      downloadBlob = nextBlob;
      downloadObjectUrl = nextBlob ? URL.createObjectURL(nextBlob) : "";
    }
  }

  $: downloadLinkDomain = getLinkDomainFromUrl(downloadObjectUrl);

  onDestroy(() => {
    if (downloadObjectUrl) URL.revokeObjectURL(downloadObjectUrl);
  });

  function downloadData() {
    if (!dataFile?.blob) return;

    const link = document.createElement("a");
    const fileName = downloadFileName;

    // Prefer a Blob URL for a manageable `linkUrl` value
    const objectUrl = downloadObjectUrl || URL.createObjectURL(dataFile.blob);
    link.href = objectUrl;
    link.download = fileName;
    link.click();

    // Revoke only if we had to create a one-off URL (normally we reuse downloadObjectUrl)
    if (!downloadObjectUrl && objectUrl) {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }

    // Track analytics
    analyticsEvent({
      event: "file_download",
      fileExtension: "csv",
      fileName,
      linkText: getDownloadLinkText(),
      linkUrl: objectUrl,
      linkDomain: getLinkDomainFromUrl(objectUrl) || undefined,

      interactionType: "button",
      interactionValue: "click",
      label: "Download all data",
      sectionTitle: "Data download",
      sectionNumber: "footer",
    });
  }

  // Calculate data file to get size
  $: dataFile = makeDataFile(latestBySeries, metadataBySeries, data.dates);
  $: fileSizeKB = ((dataFile?.blob?.size || 0) / 1000).toFixed(0);

  $: noticeLines = data?.dates?.notice_text
    ? data.dates.notice_text.split(/\r?\n/)
    : [];

  function getSummaryTableEntries() {
    return ["consumer", "business", "energy", "transport"].flatMap(
      (category) =>
        Object.entries(latestBySeries).filter(
          ([seriesId]) =>
            metadataBySeries[seriesId]?.category === category &&
            metadataBySeries[seriesId]?.show?.toLowerCase() === "true"
        )
    );
  }

  function formatNumberForCsv(value) {
    if (value === null || value === undefined) return "";
    if (typeof value !== "number") return String(value);
    return String(Number(value.toFixed(5)));
  }

  function formatDateForCsv(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function escapeCsv(value) {
    const s = value === null || value === undefined ? "" : String(value);
    if (/[\r\n",]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  }

  function downloadSummaryTableCsv() {
    const headers = [
      "Series",
      "Unit Label",
      "Data frequency",
      "Latest Value",
      "Date Last Updated",
      "Date for Latest Change",
      "Date for YoY",
      "Latest Change (Raw)",
      "Latest Change (%)",
      "YoY Change (Raw)",
      "YoY Change (%)",
    ];

    const rows = getSummaryTableEntries().map(([seriesId, row]) => {
      const unitLabel = metadataBySeries[seriesId]?.units ?? "";
      const frequency =
        metadataBySeries[seriesId]?.data_frequency ??
        metadataBySeries[seriesId]?.indicator_period ??
        "";

      // These columns are *relative percent changes* (not percentage-point deltas)
      const percentSuffix = "%";

      return [
        metadataBySeries[seriesId]?.title ?? seriesId,
        unitLabel,
        frequency,
        formatNumberForCsv(row.num_uk),
        formatDateForCsv(row.date),
        formatDateForCsv(row.period_over_period_date),
        formatDateForCsv(row.year_over_year_date),
        formatNumberForCsv(row.period_over_period_change),
        row.period_over_period_percent !== null &&
        row.period_over_period_percent !== undefined
          ? `${formatNumberForCsv(row.period_over_period_percent)}${percentSuffix}`
          : "",
        formatNumberForCsv(row.year_over_year_change),
        row.year_over_year_percent !== null && row.year_over_year_percent !== undefined
          ? `${formatNumberForCsv(row.year_over_year_percent)}${percentSuffix}`
          : "",
      ];
    });

    const csv = [headers, ...rows]
      .map((line) => line.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rti-dashboard-summary-table-${data?.dates?.current ?? ""}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const chartStartDate = new Date(2023, 11, 31);

  function normalizeBoolean(value) {
    if (value === true) return true;
    if (value === false) return false;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const v = value.trim().toLowerCase();
      return v === "true" || v === "1" || v === "yes";
    }
    return Boolean(value);
  }

  function normalizeNumber(value) {
    if (value === null || value === undefined) return NaN;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/,/g, "").trim();
      if (cleaned === "") return NaN;
      return Number(cleaned);
    }
    return Number(value);
  }

  function getEndLabelDecimalPlaces(seriesId, row) {
    const meta = metadataBySeries?.[seriesId] ?? {};
    const hasCustomDp = normalizeBoolean(meta.custom_dp);
    const customDpValue = normalizeNumber(meta.dp);
    if (
      hasCustomDp &&
      typeof customDpValue === "number" &&
      Number.isFinite(customDpValue) &&
      !Number.isNaN(customDpValue)
    ) {
      return Math.max(0, Math.trunc(customDpValue));
    }
    const indexBoolean = normalizeBoolean(meta.index);
    const thousandsBoolean = normalizeBoolean(meta.thousands);
    const unitsChart = meta.units_chart;
    const yMinMode = meta.yMinMode ?? "auto";
    const yPadding = meta.yPadding ?? 0.1;

    const series = row?.full_series;
    if (!Array.isArray(series) || series.length === 0) return null;

    const transformedData = series
      .map((d) => {
        const raw = normalizeNumber(d?.num_uk);
        const numeric = thousandsBoolean && !Number.isNaN(raw) ? raw / 1000 : raw;
        return { ...d, num_uk: numeric };
      })
      .filter((d) => !chartStartDate || d?.date >= chartStartDate);

    if (!transformedData.length) return null;

    const numericValues = transformedData
      .map((d) => normalizeNumber(d?.num_uk))
      .filter((v) => typeof v === "number" && !Number.isNaN(v));
    if (!numericValues.length) return null;

    const dataYMin = Math.min(...numericValues);
    const dataYMax = Math.max(...numericValues);
    const topMax = dataYMax;

    const computedYMin = (() => {
      if (indexBoolean && yMinMode === "auto") return dataYMin;

      let baseMin;
      if (yMinMode === "zero") baseMin = 0;
      else if (yMinMode === "data") baseMin = dataYMin;
      else if (yMinMode === "above-zero") baseMin = dataYMin > 0 ? dataYMin : 0;
      else if (yMinMode === "auto") baseMin = 0;
      else baseMin = 0;

      if (yMinMode === "auto" && dataYMin > baseMin) {
        const range = topMax - baseMin;
        const gap = dataYMin - baseMin;
        if (range > 0 && gap / range > 0.5) {
          const frac = 0.3;
          const denom = 1 - frac;
          if (denom > 0) {
            const newBottom = (dataYMin - frac * topMax) / denom;
            if (newBottom < dataYMin) return newBottom;
          }
        }
      }
      return baseMin;
    })();

    const paddedMax = indexBoolean ? topMax + 0.2 * (topMax - dataYMin) : topMax;
    let paddedMin;
    if (indexBoolean) {
      const finalRange = topMax - dataYMin;
      paddedMin = dataYMin - 0.2 * finalRange;
    } else {
      paddedMin = computedYMin - Math.abs(computedYMin) * yPadding;
    }
    if (!(paddedMin < paddedMax)) paddedMin = paddedMax - Number.EPSILON;

    const yScale = scaleLinear().domain([paddedMin, paddedMax]).nice();
    const yTicks = yScale.ticks(5);
    const hasDecimalTicks = yTicks.some((t) => t % 1 !== 0);

    const lastPoint = transformedData[transformedData.length - 1];
    const lastVal = normalizeNumber(lastPoint?.num_uk);
    if (Number.isNaN(lastVal)) return null;

    if (unitsChart === "percentage") {
      return lastVal < 20 ? 1 : hasDecimalTicks ? 1 : 0;
    }
    return lastVal < 20 ? 1 : hasDecimalTicks ? 1 : 0;
  }

  $: endLabelDpBySeries = (() => {
    const out = {};
    for (const [seriesId, row] of getSummaryTableEntries()) {
      out[seriesId] = getEndLabelDecimalPlaces(seriesId, row);
    }
    return out;
  })();
</script>

<svelte:head>
  <title>Real-time Indicators Dashboard</title>
</svelte:head>

<Embed>
  <AnalyticsBanner {analyticsProps} hideBanner />

  {#if data.dates?.notice_enabled && noticeLines.length}
    <Section width="wide">
      <Notice>
        {#each noticeLines as line}
          <p>{line}</p>
        {/each}
      </Notice>
    </Section>
  {/if}


  <Section width="wide">
    <div class="intro-row">
      <p class="intro-text">
        Click on any row to view more detail for that indicator.
        <img src="img/click.svg" alt="" aria-hidden="true" />
      </p>

      <div class="cards-controls">
        <Button
          type="button"
          variant="secondary"
          small={true}
          aria-pressed={anyCardsExpanded ? "true" : "false"}
          on:click={toggleAllCards}
        >
          {anyCardsExpanded ? "Close all cards" : "Expand all cards"}
        </Button>
      </div>
    </div>

    <div class="mobile-legend" aria-hidden="true">
      <span class="updated-dot" aria-hidden="true" />
      <span class="legend-text">Updated this week</span>
    </div>

  </Section>

  <div class="first-divider">
    <Divider hr="full" />
  </div>

  {#each [{ title: "Consumer behaviour", category: "consumer" }, { title: "Business and workforce", category: "business" }, { title: "Energy and housing", category: "energy" }, { title: "Transport", category: "transport" }] as section, sectionIndex}
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
                    class="expand-icon {expandedCards[seriesId]
                      ? 'expanded'
                      : ''}"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      class="icon-vertical"
                      d="M12 5 L12 19"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    />
                    <path
                      class="icon-horizontal"
                      d="M5 12 L19 12"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    />
                  </svg>
                  <h3 class="card-title">
                    <span class="card-title-text">{metadataBySeries[seriesId]?.title ?? seriesId}</span>
                    {#if String(updatedBySeries[seriesId]).toLowerCase() === "true"}
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
                        ]?.indicator_period?.toLowerCase() === "monthly"
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
                  {:else}
                    <div class="header-spacer"></div>
                  {/if}
                  <div class="updated-flag-container">
                    {#if String(updatedBySeries[seriesId]).toLowerCase() === "true"}
                      <span class="updated-flag"
                        ><span class="updated-dot" aria-hidden />Updated this
                        week</span
                      >
                    {/if}
                  </div>
                </div>
              </div>
              <div class="card-expanded-content" class:hidden={!expandedCards[seriesId]}>
                <p class="subtitle">
                  {metadataBySeries[seriesId]?.description}
                </p>
                <div class="layout-container">
                  <div class="chart">
                    <LineChartSimple
                      data={row.full_series}
                      yKey="num_uk"
                      lineColor="#206095"
                      startDate={new Date(2023, 11, 31)}
                      endDate={globalMaxDate}
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
                      indicator_period={metadataBySeries[seriesId]?.indicator_period}
                      meta={{
                        yMinMode:
                          metadataBySeries[seriesId]?.yMinMode ?? "auto",
                        yPadding: metadataBySeries[seriesId]?.yPadding ?? 0.1,
                        custom_dp: metadataBySeries[seriesId]?.custom_dp,
                        dp: metadataBySeries[seriesId]?.dp,
                      }}
                      showYearDividersAtDomainEdges={false}
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
                        ]?.indicator_period?.toLowerCase() === "monthly"
                          ? row.date.toLocaleDateString("en-GB", {
                              year: "numeric",
                              month: "long",
                            })
                          : row.date.toLocaleDateString("en-GB", {
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
                        data-ga-event="navigation-click"
                        data-ga-navigation-type="to-data-download"
                        data-ga-link-text={getDatasetLinkText(seriesId)}
                        data-ga-click-content-group={destinationTaxonomy.clickContentGroup}
                        data-ga-click-content-type={destinationTaxonomy.clickContentType}
                        data-ga-click-content-theme={destinationTaxonomy.clickContentTheme}
                        on:click={() =>
                          trackDataLinkClick(
                            seriesId,
                            section.title,
                            String(sectionIndex + 1)
                          )}
                      >
                        Go to the dataset for {getDatasetDisplayTitle(seriesId)}
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
              </div>
            </button>
          {/each}
        </div>
      </section>
    </Section>
    <Divider hr="full" />
  {/each}

  <Section width="wide">
    <h2>Year-on-Year Change Table</h2>
    <div style="overflow-x:auto; margin-bottom: 2rem;">
      <table style="border-collapse: collapse; width: 100%; min-width: 950px; font-size: 0.92em;">
        <thead>
          <tr style="background: #f4f4f4;">
            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Series</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">Unit Label</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">Data frequency</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">Latest Value</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">End label d.p.</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">Date Last Updated</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">Date for Latest Change</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">Date for YoY</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">Latest Change (Raw)</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">Latest Change (%)</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">YoY Change (Raw)</th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: right;">YoY Change (%)</th>
          </tr>
        </thead>
        <tbody>
          {#each getSummaryTableEntries() as [seriesId, row]}
            <tr>
              <td style="padding: 8px; border: 1px solid #ccc;">{metadataBySeries[seriesId]?.title ?? seriesId}</td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">{metadataBySeries[seriesId]?.units || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">{(metadataBySeries[seriesId]?.data_frequency ?? metadataBySeries[seriesId]?.indicator_period ?? 'N/A')}</td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">{typeof row.num_uk === 'number' ? row.num_uk.toLocaleString(undefined, { maximumFractionDigits: 5 }) : row.num_uk}</td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">
                {#if typeof endLabelDpBySeries?.[seriesId] === 'number'}
                  {endLabelDpBySeries[seriesId]}
                {:else}
                  N/A
                {/if}
              </td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">
                {#if row.date}
                  {new Date(row.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                {:else}
                  N/A
                {/if}
              </td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">
                {#if row.period_over_period_date}
                  {new Date(row.period_over_period_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                {:else}
                  N/A
                {/if}
              </td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">
                {#if row.year_over_year_date}
                  {new Date(row.year_over_year_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                {:else}
                  N/A
                {/if}
              </td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">
                {#if row.period_over_period_change !== null && row.period_over_period_change !== undefined}
                  {typeof row.period_over_period_change === 'number' ? row.period_over_period_change.toLocaleString(undefined, { maximumFractionDigits: 5 }) : row.period_over_period_change}
                {:else}
                  N/A
                {/if}
              </td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">
                {#if row.period_over_period_percent !== null && row.period_over_period_percent !== undefined}
                  {typeof row.period_over_period_percent === 'number' ? row.period_over_period_percent.toLocaleString(undefined, { maximumFractionDigits: 5 }) : row.period_over_period_percent}
                  %
                {:else}
                  N/A
                {/if}
              </td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">
                {#if row.year_over_year_change !== null && row.year_over_year_change !== undefined}
                  {typeof row.year_over_year_change === 'number' ? row.year_over_year_change.toLocaleString(undefined, { maximumFractionDigits: 5 }) : row.year_over_year_change}
                {:else}
                  N/A
                {/if}
              </td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">
                {#if row.year_over_year_percent !== null && row.year_over_year_percent !== undefined}
                  {typeof row.year_over_year_percent === 'number' ? row.year_over_year_percent.toLocaleString(undefined, { maximumFractionDigits: 5 }) : row.year_over_year_percent}
                  %
                {:else}
                  N/A
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <Button
      type="button"
      variant="secondary"
      icon="download"
      iconPosition="before"
      small={true}
      on:click={downloadSummaryTableCsv}
    >
      Download table (CSV)
    </Button>
    <div class="download-section">
      <div class="download-content">
        <h2>Download dashboard data</h2>
        <p>
          Download all indicator data in this dashboard in a single CSV file.
        </p>
      </div>
      <div class="download-button-wrapper">
        <span
          data-ga-event="file_download"
          data-ga-file-extension="csv"
          data-ga-file-name={downloadFileName}
          data-ga-link-text={getDownloadLinkText()}
          data-ga-link-url={downloadObjectUrl}
          data-ga-link-domain={downloadLinkDomain}
        >
          <Button
            type="button"
            variant="secondary"
            icon="download"
            iconPosition="before"
            small={true}
            on:click={downloadData}
          >
            Download data (CSV, {fileSizeKB}KB)
          </Button>
        </span>
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
    font-weight: 700;
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
    padding: 15px 20px 20px 20px;
    cursor: pointer;
    transition: padding 0.3s ease, background 0.3s ease;
    width: 100%;
    max-width: 950px;
  }

  .card.collapsed {
    padding: 15px 20px 20px 20px;
  }

  .header-spacer {
    height: 45.547px;
    background-color: red;
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
    outline-offset: 1px;
  }

  /* Typography inside cards */
  .card h3 {
    font-size: 1.25rem;
    font-weight: 700;
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

  .expand-icon {
    flex-shrink: 0;
    margin-top: 0;
    display: block;
    outline: none;
    border: none;
  }

  .expand-icon path {
    stroke: rgb(55, 55, 55);
    transition: transform 0.2s ease;
    transform-origin: center;
  }

  .expand-icon .icon-vertical {
    transform: rotate(0deg);
  }

  .expand-icon .icon-horizontal {
    transform: rotate(0deg) scaleX(1);
  }

  .expand-icon.expanded .icon-vertical {
    transform: rotate(90deg);
  }

  .expand-icon.expanded .icon-horizontal {
    transform: rotate(90deg) scaleX(0);
  }

  .card-title {
    margin: 0;
    padding: 0;
    font-size: 1.05rem;
    line-height: 1.1;
    font-weight: 700;
    flex: 1;
    color: #206095;
    text-wrap: balance;
  }

  .card-title-text {
    display: inline;
  }

  .card-expanded-content.hidden {
    position: absolute;
    visibility: hidden;
    pointer-events: none;
    z-index: -1;
  }

  .card:focus-visible .card-title-text {
    background-color: #fbc900;
    text-decoration: underline;
    text-decoration-color: #000;
    text-underline-offset: 0.25em;
    text-decoration-thickness: 3px;
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

  svg:not(.external-icon):not(.expand-icon) {
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
      padding: 16px 16px 16px 16px;
    }

    .subtitle {
      font-size: 16px !important;
    }
  }

  .mobile-legend {
    display: none;
    align-items: center;
    gap: 2px;
    padding: 4px 0;
    font-size: 0.9rem;
    color: #666;
  }

  .intro-row {
    max-width: 950px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .intro-text {
    margin: 0;
    color: #666;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 420px;
  }

  .intro-text img {
    transform: scale(0.8);
  }

  .cards-controls {
    display: flex;
    justify-content: flex-end;
  }

  .legend-text {
    font-weight: 400;
    font-size: 16px;
  }

  /* Mobile breakpoints: below 720px - shared styles */
  @media screen and (max-width: 720px) {
    h2 {
      padding: 0 0 4px 0;
    }

    .cards {
      gap: 20px;
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

    .intro-row {
      gap: 8px;
    }

    .cards-controls {
      justify-content: flex-start;
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

  .first-divider {
    margin-top: -25px;
  }

  /* Download section styles */
  .download-section {
    padding: 0 0 32px 0;
    max-width: 950px;
    margin: 0 auto;
  }

  .download-content h2 {
    margin-bottom: 0px;
    margin-top: 0;
    padding-bottom: 6px;
  }

  .download-content p {
    color: #666;
    margin-bottom: 0;
    margin-top: 0;
  }

  @media screen and (max-width: 490px) {
    .download-section {
      text-align: left;
    }

    .download-content p {
      margin-bottom: 16px;
    }
  }

  @media screen and (min-width: 491px) {
    .download-section {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      align-items: center;
    }

    .download-button-wrapper {
      display: flex;
      align-items: center;
    }
  }
</style>
