function isShown(meta) {
  return (
    String(meta?.show ?? "")
      .trim()
      .toLowerCase() === "true"
  );
}

export function getVisibleSeriesIds(latestBySeries, metadataBySeries) {
  return Object.entries(latestBySeries ?? {})
    .filter(([seriesId]) => isShown(metadataBySeries?.[seriesId]))
    .map(([seriesId]) => seriesId);
}

export function getSeriesEntriesByCategory(
  latestBySeries,
  metadataBySeries,
  category
) {
  return Object.entries(latestBySeries ?? {}).filter(
    ([seriesId]) =>
      metadataBySeries?.[seriesId]?.category === category &&
      isShown(metadataBySeries?.[seriesId])
  );
}

export function getSummaryTableEntries(
  latestBySeries,
  metadataBySeries,
  categories = ["consumer", "business", "energy", "transport"]
) {
  return categories.flatMap((category) =>
    getSeriesEntriesByCategory(latestBySeries, metadataBySeries, category)
  );
}
