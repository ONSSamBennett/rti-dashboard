/**
 * Small coercion helpers used across components.
 * Intentionally conservative: treat null/undefined/"" as false/NaN.
 */

export function toBoolean(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (value === null || value === undefined) return false;

  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (!v) return false;
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
  }

  return Boolean(value);
}

export function toNumberOrNaN(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (cleaned === "") return NaN;
    return Number(cleaned);
  }
  return Number(value);
}

export function toFiniteNumberOrNaN(value) {
  const n = toNumberOrNaN(value);
  return Number.isFinite(n) ? n : NaN;
}

export function toNonNegativeIntOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = toNumberOrNaN(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.trunc(n));
}
