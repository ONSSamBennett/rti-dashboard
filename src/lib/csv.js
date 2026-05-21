/**
 * CSV helpers for consistent exports.
 */

export function formatNumberForCsv(value) {
  if (value === null || value === undefined) return "";
  if (typeof value !== "number") return String(value);
  return String(Number(value.toFixed(5)));
}

export function formatDateForCsv(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function escapeCsv(value) {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[\r\n",]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}
