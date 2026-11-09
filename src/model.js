import { inRange, monthOf } from './dates.js';

const KINDS = ['activity', 'duty'];
const IMAGE_TYPES = { svg: 'image/svg+xml', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateItem(fields) {
  const title = String(fields.title ?? '').trim();
  const note = String(fields.note ?? '').trim();
  const time = fields.time ?? '';
  if (!title) return { ok: false, error: 'กรุณาใส่ชื่อรายการ' };
  if (title.length > 120) return { ok: false, error: 'ชื่อรายการยาวได้ไม่เกิน 120 ตัวอักษร' };
  if (note.length > 2000) return { ok: false, error: 'รายละเอียดยาวได้ไม่เกิน 2000 ตัวอักษร' };
  if (!DATE_RE.test(fields.date ?? '') || !inRange(fields.date)) return { ok: false, error: 'วันที่ต้องอยู่ระหว่าง 7 พ.ย. 2026 ถึง 31 ก.ค. 2027' };
  if (!KINDS.includes(fields.kind)) return { ok: false, error: 'กรุณาเลือกประเภทรายการ' };
  if (time !== '' && !/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: 'รูปแบบเวลาไม่ถูกต้อง' };
  return {
    ok: true,
    value: {
      id: fields.id ?? crypto.randomUUID(),
      date: fields.date, title, kind: fields.kind, time, note,
      done: fields.done === true,
      createdAt: fields.createdAt ?? Date.now(),
    },
  };
}

export function sortDay(items) {
  return [...items].sort((a, b) => (a.time || '99') .localeCompare(b.time || '99') || a.createdAt - b.createdAt);
}

export function monthStats(items, month) {
  const duties = items.filter((i) => i.kind === 'duty' && monthOf(i.date) === month);
  const done = duties.filter((i) => i.done).length;
  return { total: duties.length, done, percent: duties.length ? Math.round((done / duties.length) * 100) : 0 };
}

export function nextUp(items, todayKey) {
  const upcoming = items.filter((i) => !i.done && i.date >= todayKey);
  const earliest = upcoming.reduce((min, i) => (i.date < min ? i.date : min), '9999');
  return sortDay(upcoming.filter((i) => i.date === earliest))[0] ?? null;
}

export function checkImageFile({ name, type, size }) {
  const ext = name.split('.').pop().toLowerCase();
  const resolved = type || IMAGE_TYPES[ext];
  if (!Object.values(IMAGE_TYPES).includes(resolved)) return { ok: false, error: `${name}: รับเฉพาะไฟล์ SVG, JPG หรือ PNG` };
  if (size > MAX_IMAGE_BYTES) return { ok: false, error: `${name}: ไฟล์ใหญ่เกิน 10 MB` };
  return { ok: true, type: resolved };
}

export function validateBackup(data) {
  const fail = { ok: false, error: 'ไฟล์สำรองไม่ถูกต้อง' };
  if (data?.app !== 'calendarforme' || data.version !== 1 || !Array.isArray(data.items) || !Array.isArray(data.images)) return fail;
  for (const item of data.items) {
    if (typeof item?.id !== 'string' || !validateItem(item).ok) return fail;
  }
  for (const img of data.images) {
    const validType = Object.values(IMAGE_TYPES).includes(img?.type);
    if (!validType || typeof img.id !== 'string' || !DATE_RE.test(img.date ?? '') || !inRange(img.date)) return fail;
    if (typeof img.dataUrl !== 'string' || !img.dataUrl.startsWith(`data:${img.type};base64,`)) return fail;
  }
  return { ok: true };
}
