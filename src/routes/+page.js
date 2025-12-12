import { base } from "$app/paths";
import { csvParse, autoType } from "d3-dsv";

const dataUrl = `${base}/data/data.csv`;
const dataUrl2 = `${base}/data/data2.csv`;
const datesUrl = `${base}/data/dates.json`;
const holidaysUrl = "https://www.gov.uk/bank-holidays.json";
const metadataUrl = `${base}/data/metadata.csv`;

function nextFriday(date) {
  const offset = (7 + 5 - date.getDay()) % 7;
  return +date + offset * 1000 * 60 * 60 * 24;
}

// Manually added bank holiday dates (ISO format)
const manualHolidayDates = [
  "2023-08-28", // Summer BH
  "2023-12-25", // Boxing Day
  "2023-12-26", // New Year's Day
];

// Convert manual dates to timestamps using nextFriday logic
const manualHolidays = manualHolidayDates.map((dateStr) =>
  nextFriday(new Date(dateStr))
);

// Helper function to determine lookback periods based on frequency
function getLookbackPeriods(frequency) {
  const freq = frequency?.toLowerCase();
  
  switch(freq) {
    case 'daily':
    case 'day':
      return { period: 7, year: 365 }; // 7 days back (weekly change), 365 days for year
    case 'weekly':
    case 'week':
      return { period: 1, year: 52 }; // 1 week back, 52 weeks for year
    case 'monthly':
    case 'month':
      return { period: 1, year: 12 }; // 1 month back, 12 months for year
    case 'quarterly':
    case 'quarter':
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
  const str2 = await (await fetch(dataUrl2)).text();
  const array = csvParse(str, autoType);
  const array2 = csvParse(str2, autoType);

  const json = await (await fetch(holidaysUrl)).json();

  const parseDate = (str2) => {
    const [day, month, year] = str2.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  const grouped = {};

  for (const row of array2) {
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
      // Keep old names for backward compatibility
      month_over_month_change: pop,
      month_over_month_percent: pop_percent,
      year_over_year_change: yoy,
      year_over_year_percent: yoy_percent,
      // Add new names that are more accurate
      period_over_period_change: pop,
      period_over_period_percent: pop_percent,
      full_series: entries,
    };
  }

  console.log(result);

  // Debug: log specific series that have shown unexpected indicator behaviour
  // This helps confirm what values are being passed to the ChangeIndicator component.
  try {
    console.log("DEBUG latestBySeries.debit_failure:", result.debit_failure);
    console.log("DEBUG latestBySeries.vehicle_production:", result.vehicle_production);
  } catch (e) {
    console.warn("DEBUG: could not log specific series", e);
  }

  // Combine API holidays with manual ones
  const holidays = [
    ...json["england-and-wales"].events.map((d) =>
      nextFriday(new Date(d.date))
    ),
    ...manualHolidays,
  ].filter((d) => d >= +array[0].date && d <= +array[array.length - 1].date);

  for (const d of array) {
    d.bank_holiday = holidays.includes(+d.date);
    d.flu_due_to_percent = d.flu_due_to / d.num_england_wales;
    d.flu_with_percent = d.flu_with / d.num_england_wales;
    d.covid_due_to_percent = d.covid_due_to / d.num_england_wales;
    d.covid_with_percent = d.covid_with / d.num_england_wales;
  }

  const earliest = array[0];
  const current = array[array.length - 1];
  const previous = array[array.length - 2];

  const deaths_registered = {
    value: current.num_england_wales,
    change: current.num_england_wales - previous.num_england_wales,
    percent_change:
      100 *
      ((current.num_england_wales - previous.num_england_wales) /
        previous.num_england_wales),
  };

  const deaths_registered_england = {
    value: current.num_england,
    change: current.num_england - previous.num_england,
    percent_change:
      100 *
      ((current.num_england - previous.num_england) / previous.num_england),
  };

  const covid = {
    value_due_to: current.covid_due_to,
    value_involving: current.covid_with,
    percent_due_to: 100 * (current.covid_due_to / current.num_england_wales),
    percent_involving: 100 * (current.covid_with / current.num_england_wales),
  };
  
  const flu = {
    value_due_to: current.flu_due_to,
    value_involving: current.flu_with,
    percent_due_to: 100 * (current.flu_due_to / current.num_england_wales),
    percent_involving: 100 * (current.flu_with / current.num_england_wales),
  };

  const flu_covid_max = Math.max(
    ...[
      ...array.map((d) => d.flu_due_to_percent),
      ...array.map((d) => d.flu_with_percent),
      ...array.map((d) => d.covid_due_to_percent),
      ...array.map((d) => d.covid_with_percent),
    ]
  );

  const deaths_registered_wales = {
    value: current.num_wales,
    change: current.num_wales - previous.num_wales,
    percent_change:
      100 * ((current.num_wales - previous.num_wales) / previous.num_wales),
  };

  const expected_comparison = {
    value: current.num_england_wales - current.exp_england_wales,
    percent_difference:
      100 *
      ((current.num_england_wales - current.exp_england_wales) /
        current.exp_england_wales),
  };

  const expected_comparison_england = {
    value: current.num_england - current.exp_england,
    percent_difference:
      100 * ((current.num_england - current.exp_england) / current.exp_england),
  };

  const expected_comparison_wales = {
    value: current.num_wales - current.exp_wales,
    percent_difference:
      100 * ((current.num_wales - current.exp_wales) / current.exp_wales),
  };

  const current_bank_holiday = current.bank_holiday;
  const previous_bank_holiday = previous.bank_holiday;

  return {
    array,
    array2,
    latestBySeries: result,
    earliest,
    metadataBySeries,
    current,
    deaths_registered,
    expected_comparison,
    expected_comparison_england,
    deaths_registered_england,
    expected_comparison_wales,
    deaths_registered_wales,
    flu,
    covid,
    flu_covid_max,
    current_bank_holiday,
    previous_bank_holiday,
    dates,
  };
}