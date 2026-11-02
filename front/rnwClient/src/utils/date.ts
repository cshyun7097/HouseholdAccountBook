// yyyy-MM-dd from local calendar parts (month is 0-based, like Date).
export const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

// Today on the device's calendar (toISOString would give the UTC date, a day off near midnight in Korea).
export function today() {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}
