// yyyy-MM-dd from local calendar parts (month is 0-based, like Date).
export const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

// Today on the device's calendar (toISOString would give the UTC date, a day off near midnight in Korea).
export function today() {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

// yyyy-MM-dd plus whole months, clamped to the month's last day like Java's plusMonths
// (plain Date would turn Jan 31 + 1 month into Mar 3).
export function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return toIsoDate(target.getFullYear(), target.getMonth(), Math.min(d, lastDay));
}
