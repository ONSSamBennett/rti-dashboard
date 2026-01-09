import { csvFormatRows } from "d3-dsv";

export function makeDataFile(latestBySeries, metadataBySeries, dates) {
  const dateOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const publicationDate = new Date(dates.current);

  // Define section order as it appears in the dashboard
  const sections = [
    { title: "Consumer behaviour", category: "consumer" },
    { title: "Business", category: "business" },
    { title: "Energy and housing", category: "energy" },
    { title: "Transport", category: "transport" },
  ];

  // Build header
  let csv = `"Real-time indicators dashboard data"\n`;
  csv += `"Publication date: ${publicationDate.toLocaleDateString(
    "en-GB",
    dateOptions
  )}"\n`;
  csv += `"Date downloaded: ${new Date().toLocaleDateString(
    "en-GB",
    dateOptions
  )}"\n`;
  csv += `Source: Office for National Statistics\n\n`;
  csv += `Notes:\n`;
  csv += `"1. This file contains all indicator series from the Real-time indicators dashboard."\n`;
  csv += `"2. Each series has its own frequency of updates (daily, weekly, monthly, quarterly)."\n`;
  csv += `"3. For full details and methodology, visit: https://www.ons.gov.uk/economy/economicoutputandproductivity/output/bulletins/economicactivityandsocialchangeintheukrealtimeindicators/latest"\n\n`;

  // Create column headers
  const headers = [
    "Section",
    "Date",
    "Series ID",
    "Series Title",
    "Value",
    "Units",
  ];
  csv += csvFormatRows([headers]) + "\n";

  // Collect all data rows organized by section
  const rows = [];
  for (const section of sections) {
    // Get series for this section in the order they appear in the dashboard
    const sectionSeries = Object.entries(latestBySeries)
      .filter(
        ([seriesId]) =>
          metadataBySeries[seriesId]?.category === section.category &&
          metadataBySeries[seriesId]?.show?.toLowerCase() === "true"
      )
      .map(([seriesId]) => seriesId);

    for (const seriesId of sectionSeries) {
      const seriesData = latestBySeries[seriesId]?.full_series || [];
      const seriesTitle = metadataBySeries[seriesId]?.title || seriesId;
      const units = metadataBySeries[seriesId]?.units || "";

      // Sort data points by date within each series
      const sortedSeriesData = [...seriesData].sort((a, b) => a.date - b.date);

      for (const dataPoint of sortedSeriesData) {
        rows.push([
          section.title,
          dataPoint.date.toLocaleDateString("en-GB"),
          seriesId,
          seriesTitle,
          dataPoint.num_uk,
          units,
        ]);
      }
    }
  }

  csv += csvFormatRows(rows);

  return {
    blob: new Blob([csv], { type: "text/csv" }),
    href: `data:text/csv;charset=UTF-8,${encodeURIComponent(csv)}`,
    publicationDate: dates.current,
  };
}
