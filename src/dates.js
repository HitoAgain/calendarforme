export const FIRST_DAY = '2026-11-07';
export const LAST_DAY = '2027-07-31';
export const MONTHS = ['2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06', '2027-07'];

const LOCALE = 'th-TH-u-ca-gregory'; // th-TH alone renders Buddhist-era years
const pad = (n) => String(n).padStart(2, '0');

// Keys are built from local date parts: toISOString would shift a day back in UTC+7.
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const inRange = (key) => key >= FIRST_DAY && key <= LAST_DAY;
export const monthOf = (key) => key.slice(0, 7);

export function clampMonth(d) {
  const month = monthOf(toKey(d));
  if (month < MONTHS[0]) return MONTHS[0];
  if (month > MONTHS[MONTHS.length - 1]) return MONTHS[MONTHS.length - 1];
  return month;
}

export function monthGrid(month) {
  const first = fromKey(`${month}-01`);
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => toKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)));
}

export function addDays(key, n) {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

// Dates after `start` up to `until` (and never past LAST_DAY). Monthly keeps the start's day, landing on the month's last day when it is shorter.
export function repeatDates(start, freq, until) {
  const end = until > LAST_DAY ? LAST_DAY : until;
  if (!['daily', 'weekly', 'monthly'].includes(freq) || !end || end <= start) return [];
  const s = fromKey(start);
  const out = [];
  for (let n = 1; ; n++) {
    let d;
    if (freq === 'monthly') {
      const lastOfMonth = new Date(s.getFullYear(), s.getMonth() + n + 1, 0).getDate();
      d = new Date(s.getFullYear(), s.getMonth() + n, Math.min(s.getDate(), lastOfMonth));
    } else {
      d = new Date(s.getFullYear(), s.getMonth(), s.getDate() + n * (freq === 'weekly' ? 7 : 1));
    }
    const key = toKey(d);
    if (key > end) return out;
    out.push(key);
  }
}

export function daysBetween(fromK, toK) {
  const utc = (k) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((utc(toK) - utc(fromK)) / 86400000);
}

export function relativeDay(key, todayKey) {
  const n = daysBetween(todayKey, key);
  if (n === 0) return 'วันนี้';
  if (n === 1) return 'พรุ่งนี้';
  return `อีก ${n} วัน`;
}

const monthFormat = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
const dayFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'full' });
const shortMonthFormat = new Intl.DateTimeFormat(LOCALE, { month: 'short' });
const weekdayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' });

export const formatMonth = (month) => monthFormat.format(fromKey(`${month}-01`));
export const formatDay = (key) => dayFormat.format(fromKey(key)).replace('ค.ศ. ', '');
export const formatShortMonth = (month) => shortMonthFormat.format(fromKey(`${month}-01`));
export const formatWeekday = (key) => weekdayFormat.format(fromKey(key));
