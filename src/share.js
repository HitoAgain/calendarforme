// A share code is the whole item list, compressed, in one pasteable string. Images are not included: they would make it megabytes long.
import { validateItem } from './model.js';

const PREFIX = 'CAL1-';
const MAX_BYTES = 1024 * 1024; // a pasted code may decompress to far more than it looks; stop here
const KINDS = ['duty', 'activity'];

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function encodeCode(items) {
  const rows = [...items]
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    .map((i) => [i.date, i.title, KINDS.indexOf(i.kind), i.time, i.note, i.done ? 1 : 0]);
  const stream = new Blob([JSON.stringify({ v: 1, i: rows })]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return PREFIX + toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()));
}

async function inflateLimited(bytes) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) { await reader.cancel(); throw new Error('too large'); }
    chunks.push(value);
  }
  return new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
}

export async function decodeCode(input) {
  const fail = { ok: false, error: 'โค้ดไม่ถูกต้อง ลองคัดลอกมาใหม่ทั้งหมด' };
  const code = String(input ?? '').replace(/\s+/g, '');
  if (!code.startsWith(PREFIX) || !/^[A-Za-z0-9_-]+$/.test(code.slice(PREFIX.length))) return fail;
  let data;
  try {
    data = JSON.parse(await inflateLimited(fromBase64Url(code.slice(PREFIX.length))));
  } catch {
    return fail;
  }
  if (data?.v !== 1 || !Array.isArray(data.i)) return fail;
  const base = Date.now();
  const items = [];
  for (const [n, row] of data.i.entries()) {
    if (!Array.isArray(row)) return fail;
    const [date, title, kind, time, note, done] = row;
    const result = validateItem({ date, title, kind: KINDS[kind], time, note, done: done === 1, createdAt: base + n });
    if (!result.ok) return fail;
    items.push(result.value);
  }
  return { ok: true, items };
}
