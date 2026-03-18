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
} = {}) {
  const numericValues = (Array.isArray(transformedData) ? transformedData : [])
    .map((d) => toFiniteNumberOrNaN(d?.[yKey]))
    .filter((v) => Number.isFinite(v));

  const dataYMin = numericValues.length ? Math.min(...numericValues) : 0;
  const dataYMax = numericValues.length ? Math.max(...numericValues) : 100;

  const yMaxNumeric = toFiniteNumberOrNaN(yMax);
  const topMax = Number.isFinite(yMaxNumeric) ? yMaxNumeric : dataYMax;

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

  const paddedMax = (() => {
    if (indexBoolean) {
      const finalRange = topMax - dataYMin;
      return topMax + 0.2 * finalRange;
    }
    return topMax;
  })();

  const paddedMinRaw = (() => {
    if (indexBoolean) {
      const finalRange = topMax - dataYMin;
      return dataYMin - 0.2 * finalRange;
    }
    return computedYMin - Math.abs(computedYMin) * yPadding;
  })();

  const paddedMin = Math.min(paddedMinRaw, paddedMax - Number.EPSILON);

  const niceDomain = scaleLinear().domain([paddedMin, paddedMax]).nice().domain();
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
