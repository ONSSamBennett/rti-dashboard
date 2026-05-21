/**
 * Dataset naming helpers.
 */

export function getDatasetTitle(metadataBySeries, seriesId) {
  return metadataBySeries?.[seriesId]?.title ?? seriesId;
}

export function getDatasetDisplayTitle(metadataBySeries, seriesId) {
  const lower = String(
    getDatasetTitle(metadataBySeries, seriesId)
  ).toLowerCase();

  return lower
    .replace(/\buk\b/g, "UK")
    .replace(/\bdirect debit\b/g, "Direct Debit")
    .replace(/\brevolut\b/g, "Revolut")
    .replace(/\bvat\b/g, "VAT");
}

export function getDatasetLinkText(metadataBySeries, seriesId) {
  return `Go to the dataset for ${getDatasetDisplayTitle(
    metadataBySeries,
    seriesId
  )}`;
}
