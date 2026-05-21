import { scaleLinear } from "d3-scale";

function toNumberOrNaN(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (cleaned === "") return NaN;
    return Number(cleaned);
  }
  return Number(value);
}

function toFiniteNumberOrNaN(value) {
  const n = toNumberOrNaN(value);
  return Number.isFinite(n) ? n : NaN;
}

export function computeTransformedData(
  data,
  {
    xKey = "date",
    yKey = "value",
    thousandsBoolean = false,
    startDate = null,
  } = {}
) {
  if (!data || !Array.isArray(data)) return [];

  const base = data
    .map((d) => {
      const raw = d?.[yKey];
      const n = toFiniteNumberOrNaN(raw);
      const numeric = thousandsBoolean && Number.isFinite(n) ? n / 1000 : n;
      return { ...d, [yKey]: numeric };
    })
    .filter((d) => !startDate || d?.[xKey] >= startDate);

  return base;
}

export function computeYDomainFromTransformedData({
  transformedData,
  yKey = "value",
  yMax = undefined,
  indexBoolean = false,
  yMinMode = "auto", // "zero" | "data" | "above-zero" | "auto"
  yPadding = 0.1,
  niceCount = 5,
} = {}) {
  const baseline = indexBoolean ? 100 : 0;
  // Extra breathing room for indexed charts when the series is above the baseline.
  // Kept deliberately small to avoid reintroducing overly-large domains.
  const indexExtraTopPad = 0.1;
  const indexExtraBottomPad = 0.1;

  const numericValues = (Array.isArray(transformedData) ? transformedData : [])
    .map((d) => toFiniteNumberOrNaN(d?.[yKey]))
    .filter((v) => Number.isFinite(v));

  const dataYMin = numericValues.length ? Math.min(...numericValues) : 0;
  const dataYMax = numericValues.length ? Math.max(...numericValues) : 100;

  const yMaxNumeric = toFiniteNumberOrNaN(yMax);
  const topMaxRaw = Number.isFinite(yMaxNumeric) ? yMaxNumeric : dataYMax;
  // For index charts, keep the 100 baseline visible even if the data sits below 100.
  let topMax = indexBoolean ? Math.max(topMaxRaw, baseline) : topMaxRaw;

  const { computedYMin, baseMin } = (() => {
    let baseMin;
    if (yMinMode === "zero") baseMin = baseline;
    else if (yMinMode === "data") baseMin = dataYMin;
    else if (yMinMode === "above-zero") {
      baseMin = dataYMin > baseline ? dataYMin : baseline;
    } else if (yMinMode === "auto") {
      // Mirror the non-index behavior (baseline is the starting point) but for index
      // series allow dips below the baseline to remain visible.
      baseMin = indexBoolean ? Math.min(baseline, dataYMin) : baseline;
    } else baseMin = baseline;

    let computedYMin = baseMin;

    if (yMinMode === "auto" && dataYMin > baseMin) {
      const range = topMax - baseMin;
      const gap = dataYMin - baseMin;
      if (range > 0 && gap / range > 0.5) {
        const frac = 0.3;
        const denom = 1 - frac;
        if (denom > 0) {
          const newBottom = (dataYMin - frac * topMax) / denom;
          if (newBottom < dataYMin) computedYMin = newBottom;
        }
      }
    }

    return { computedYMin, baseMin };
  })();

  // Opposite-direction heuristic (symmetric to the "raise bottom" heuristic above):
  // if the chosen top sits far above the data, pull it down so the data max isn't
  // squashed at the bottom of the chart.
  if (yMinMode === "auto" && dataYMax < topMax) {
    const range = topMax - computedYMin;
    const gap = topMax - dataYMax;
    if (range > 0 && gap / range > 0.5) {
      const frac = 0.3;
      const denom = 1 - frac;
      if (denom > 0) {
        // Place dataYMax at (1-frac) of the range above the bottom, leaving frac headroom.
        const newTop = (dataYMax - frac * computedYMin) / denom;
        const constrainedTop = indexBoolean ? Math.max(newTop, baseline) : newTop;
        if (constrainedTop > dataYMax && constrainedTop < topMax) {
          topMax = constrainedTop;
        }
      }
    }
  }

  const rangeForPadding = Math.max(0, topMax - computedYMin);

  const paddedMax = (() => {
    if (indexBoolean && dataYMax > baseline) {
      return topMax + indexExtraTopPad * rangeForPadding;
    }
    return topMax;
  })();

  const paddedMinRaw = (() => {
    // Apply padding relative to the chosen baseline so index charts (baseline=100)
    // behave like non-index charts (baseline=0): no automatic padding when the
    // domain minimum equals the baseline.
    const basePad = Math.abs(computedYMin - baseline) * yPadding;
    const extraPad =
      indexBoolean && dataYMax > baseline
        ? indexExtraBottomPad * rangeForPadding
        : 0;
    return computedYMin - basePad - extraPad;
  })();

  const paddedMin = Math.min(paddedMinRaw, paddedMax - Number.EPSILON);

  const niceScale = scaleLinear().domain([paddedMin, paddedMax]);
  const niceDomain = Number.isFinite(niceCount)
    ? niceScale.nice(niceCount).domain()
    : niceScale.nice().domain();
  const [niceMin, niceMax] = niceDomain;

  return {
    dataYMin,
    dataYMax,
    topMax,
    computedYMin,
    paddedMin,
    paddedMax,
    niceMin,
    niceMax,
  };
}
