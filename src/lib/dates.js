export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromISO(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(isoDate, days) {
  const date = dateFromISO(isoDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function datesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function formatDate(isoDate, options = {}) {
  if (!isoDate) return "—";
  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(dateFromISO(isoDate));
}

export function countNights(checkin, checkout) {
  return Math.max(1, Math.round((dateFromISO(checkout) - dateFromISO(checkin)) / 86400000));
}
