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

export async function load({ fetch }) {
  let dates = await (await fetch(datesUrl)).json();

  const metadataStr = await (await fetch(metadataUrl)).text();
  const metadataArray = csvParse(metadataStr, autoType);

  // Convert to a lookup object
  const metadataBySeries = {};
  for (const meta of metadataArray) {
    metadataBySeries[meta.series_id] = meta;
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
    const mostRecentDate = updateDates.length > 0 
      ? new Date(Math.max(...updateDates))
      : new Date();
    
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
    updatedBySeries[item.series_id] = item.updated_this_week;
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
    grouped[key].push({ ...row, date });
  }

  const result = {};

  for (const [series_id, entries] of Object.entries(grouped)) {
    entries.sort((a, b) => a.date - b.date); // oldest to newest

    const latest = entries[entries.length - 1];

    // Get the frequency from metadata for this series
    // Prefer data_frequency (actual cadence), fall back to indicator_period
    const frequency =
      metadataBySeries[series_id]?.data_frequency ??
      metadataBySeries[series_id]?.indicator_period;
    const { period, year } = getLookbackPeriods(frequency);

    // Calculate period-over-period (adaptive based on frequency)
    const prevPeriod = entries[entries.length - 1 - period];
    const prevYear = entries[entries.length - 1 - year];

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
