import { base } from "$app/paths";
import { csvParse, autoType } from "d3-dsv";

const dataUrl = `${base}/data/data.csv`;
const datesUrl = `${base}/data/dates.json`;
const metadataUrl = `${base}/data/metadata.csv`;

// Helper function to determine lookback periods based on frequency
function getLookbackPeriods(frequency) {
  const freq = frequency?.toLowerCase();

  switch (freq) {
    case "daily":
    case "day":
      return { period: 7, year: 365 }; // 7 days back (weekly change), 365 days for year
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
  const dates = await (await fetch(datesUrl)).json();

  const metadataStr = await (await fetch(metadataUrl)).text();
  const metadataArray = csvParse(metadataStr, autoType);

  // Convert to a lookup object
  const metadataBySeries = {};
  for (const meta of metadataArray) {
    metadataBySeries[meta.series_id] = meta;
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
    const frequency = metadataBySeries[series_id]?.updated;
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
      year_over_year_change: yoy,
      year_over_year_percent: yoy_percent,
      full_series: entries,
    };
  }

  return {
    array,
    latestBySeries: result,
    metadataBySeries,
    dates,
  };
}
