import { base } from "$app/paths";
import { csvParse, autoType } from "d3-dsv";

const dataUrl = `${base}/data/data.csv`;
const datesUrl = `${base}/data/header-details.json`;
const metadataUrl = `${base}/data/metadata.csv`;
const updatedUrl = `${base}/data/updated.csv`;

// Helper function to determine lookback periods based on frequency
function getLookbackPeriods(frequency) {
  const freq = frequency?.toLowerCase();

  switch (freq) {
    case "daily":
    case "day":
      return { period: 7, year: 364 }; // 7 days back (weekly change), 364 days for year (to same day of the week last year)
    case "weekly":
    case "week":
      return { period: 1, year: 52 }; // 1 week back, 52 weeks for year
    case "monthly":
    case "month":
      return { period: 1, year: 12 }; // 1 month back, 12 months for year
    case "quarterly":
    case "quarter":
      return { period: 1, year: 4 }; // 1 quarter back, 4 quarters for year
    default:
      return { period: 1, year: 12 }; // default to monthly
  }
}

function isQuarterlyIndicator(indicatorPeriod) {
  const p = indicatorPeriod?.toLowerCase?.();
  return p === "quarterly" || p === "quarter";
}

// Infer underlying data cadence from the time series itself.
// This helps when indicator_period is quarterly but the series is actually monthly (etc.).
function inferCadenceFromEntries(entries) {
  if (!entries || entries.length < 3) return null;

  const diffsDays = [];
  const start = Math.max(1, entries.length - 10);
  for (let i = start; i < entries.length; i++) {
    const prev = entries[i - 1]?.date;
    const curr = entries[i]?.date;
    if (!(prev instanceof Date) || !(curr instanceof Date)) continue;
    const diff = (curr - prev) / (24 * 60 * 60 * 1000);
    if (Number.isFinite(diff) && diff > 0) diffsDays.push(diff);
  }
  if (!diffsDays.length) return null;

  diffsDays.sort((a, b) => a - b);
  const mid = Math.floor(diffsDays.length / 2);
  const median =
    diffsDays.length % 2 === 0
      ? (diffsDays[mid - 1] + diffsDays[mid]) / 2
      : diffsDays[mid];

  if (median <= 2) return "daily";
  if (median <= 10) return "weekly";
  if (median <= 45) return "monthly";
  if (median <= 120) return "quarterly";
  return "monthly";
}

function getQuarterlyPeriodLookbackPoints(cadence) {
  const c = cadence?.toLowerCase?.();
  switch (c) {
    case "daily":
    case "day":
      return 91; // approx 13 weeks / 1 quarter
    case "weekly":
    case "week":
      return 13;
    case "monthly":
    case "month":
      return 3;
    case "quarterly":
    case "quarter":
      return 1;
    default:
      return 3;
  }
}

function isMonthlyCadence(cadence) {
  const c = cadence?.toLowerCase?.();
  return c === "monthly" || c === "month";
}

function isPreviousCalendarMonth(latestDate, prevDate) {
  if (!(latestDate instanceof Date) || !(prevDate instanceof Date))
    return false;
  if (Number.isNaN(latestDate.getTime()) || Number.isNaN(prevDate.getTime()))
    return false;

  const latestYear = latestDate.getFullYear();
  const latestMonth = latestDate.getMonth();

  const expectedPrev = new Date(latestYear, latestMonth - 1, 1);
  return (
    prevDate.getFullYear() === expectedPrev.getFullYear() &&
    prevDate.getMonth() === expectedPrev.getMonth()
  );
}

export async function load({ fetch }) {
  let dates = await (await fetch(datesUrl)).json();

  const metadataStr = await (await fetch(metadataUrl)).text();
  const metadataArray = csvParse(metadataStr, autoType);

  // Convert to a lookup object
  const metadataBySeries = {};
  for (const meta of metadataArray) {
    const rawKey = meta?.series_id;
    if (rawKey === null || rawKey === undefined) continue;
    const key = String(rawKey).trim();
    if (!key) continue;
    metadataBySeries[key] = meta;
  }

  // Load updated_this_week separately
  const updatedStr = await (await fetch(updatedUrl)).text();
  const updatedArray = csvParse(updatedStr, autoType);

  // Handle "auto" dates by finding the most recent update date from updated.csv
  if (dates.current === "auto" || dates.next === "auto") {
    // Parse dates from updated.csv (format: YYYY-MM-DD)
    const updateDates = updatedArray
      .map((row) => {
        // Column name in updated.csv is `date_updated` (older files used `date_of_update`)
        const rawDate = row.date_updated ?? row.date_of_update;
        if (!rawDate) return null;
        const dateStr = String(rawDate);
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
      })
      .filter((d) => d !== null);

    // Find the most recent date
    const mostRecentDate =
      updateDates.length > 0 ? new Date(Math.max(...updateDates)) : new Date();

    // Calculate next update date (7 days later)
    const nextUpdateDate = new Date(mostRecentDate);
    nextUpdateDate.setDate(nextUpdateDate.getDate() + 7);

    // Format dates as YYYY-MM-DD
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (dates.current === "auto") {
      dates.current = formatDate(mostRecentDate);
    }
    if (dates.next === "auto") {
      dates.next = formatDate(nextUpdateDate);
    }
  }

  const updatedBySeries = {};
  for (const item of updatedArray) {
    const rawKey = item?.series_id;
    if (rawKey === null || rawKey === undefined) continue;
    const key = String(rawKey).trim();
    if (!key) continue;
    updatedBySeries[key] = item.updated_this_week;
  }

  const str = await (await fetch(dataUrl)).text();
  const array = csvParse(str, autoType);

  const parseDate = (str) => {
    const [day, month, year] = str.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  const grouped = {};

  for (const row of array) {
    const date = parseDate(row.date);
    const key = row.series_id;

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ ...row, date, gapDate: date });
  }

  const result = {};

  for (const [series_id, entries] of Object.entries(grouped)) {
    entries.sort((a, b) => a.date - b.date); // oldest to newest

    const latest = entries[entries.length - 1];

    const meta = metadataBySeries[series_id] ?? {};
    const dataFrequency = meta?.data_frequency;
    const indicatorPeriod = meta?.indicator_period;

    // If the underlying data is monthly, shift points from the 1st to the 15th
    // so they plot mid-month on the chart.
    const inferredCadence = inferCadenceFromEntries(entries);
    const cadenceForPlot = dataFrequency ?? inferredCadence;
    if (isMonthlyCadence(cadenceForPlot)) {
      for (const entry of entries) {
        const d = entry?.date;
        if (!(d instanceof Date) || Number.isNaN(d.getTime())) continue;
        if (d.getDate() !== 1) continue;

        // Keep the original (1st-of-month) date for grey-band calculations,
        // but plot the point at mid-month.
        entry.gapDate = entry.gapDate instanceof Date ? entry.gapDate : d;
        entry.date = new Date(d.getFullYear(), d.getMonth(), 15);
      }
    }

    // Default lookback is based on the underlying data cadence (if present),
    // otherwise we fall back to the indicator_period.
    const frequencyForLookback = dataFrequency ?? indicatorPeriod;
    let { period: periodLookback, year: yearLookback } =
      getLookbackPeriods(frequencyForLookback);

    // If the indicator is defined as quarterly, ensure the period-over-period change
    // compares to the prior quarter (e.g., 3 months back for monthly data).
    if (isQuarterlyIndicator(indicatorPeriod)) {
      const cadenceForQuarterly =
        dataFrequency ?? inferredCadence ?? frequencyForLookback;
      periodLookback = getQuarterlyPeriodLookbackPoints(cadenceForQuarterly);
      yearLookback = getLookbackPeriods(cadenceForQuarterly).year;
    }

    // Calculate period-over-period (adaptive based on frequency)
    let prevPeriod = entries[entries.length - 1 - periodLookback];
    const prevYear = entries[entries.length - 1 - yearLookback];

    // Monthly indicators should only compare to the actual prior calendar month.
    // If that month is missing, mark the change as unavailable.
    const isMonthlyIndicator = isMonthlyCadence(frequencyForLookback);
    if (isMonthlyIndicator && periodLookback === 1 && prevPeriod) {
      if (!isPreviousCalendarMonth(latest.date, prevPeriod.date)) {
        prevPeriod = null;
      }
    }

    const pop = prevPeriod ? latest.num_uk - prevPeriod.num_uk : null;
    const yoy = prevYear ? latest.num_uk - prevYear.num_uk : null;

    const pop_percent = prevPeriod
      ? 100 * ((latest.num_uk - prevPeriod.num_uk) / prevPeriod.num_uk)
      : null;

    const yoy_percent = prevYear
      ? 100 * ((latest.num_uk - prevYear.num_uk) / prevYear.num_uk)
      : null;

    result[series_id] = {
      ...latest,
      period_over_period_change: pop,
      period_over_period_percent: pop_percent,
      period_over_period_date: prevPeriod ? prevPeriod.date : null,
      year_over_year_change: yoy,
      year_over_year_percent: yoy_percent,
      year_over_year_date: prevYear ? prevYear.date : null,
      full_series: entries,
    };
  }

  return {
    array,
    latestBySeries: result,
    metadataBySeries,
    updatedBySeries,
    dates,
  };
}
