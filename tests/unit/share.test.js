import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeCode, decodeCode } from '../../src/share.js';

const items = [
  { id: 'a', date: '2026-11-10', title: 'ส่งรายงาน บท 3', kind: 'duty', time: '09:30', note: 'แนบไฟล์ PDF', done: true, createdAt: 5 },
  { id: 'b', date: '2027-07-31', title: 'เที่ยวทะเล 🌊', kind: 'activity', time: '', note: '', done: false, createdAt: 9 },
];
const strip = ({ id, createdAt, ...rest }) => rest;

test('เข้ารหัสแล้วถอดกลับได้รายการเดิม', async () => {
  const code = await encodeCode(items);
  assert.match(code, /^CAL1-[A-Za-z0-9_-]+$/);
  const result = await decodeCode(code);
  assert.equal(result.ok, true);
  assert.deepEqual(result.items.map(strip), items.map(strip));
  assert.equal(typeof result.items[0].id, 'string');
});
test('ลำดับเดิมคงอยู่ผ่าน createdAt', async () => {
  const { items: out } = await decodeCode(await encodeCode(items));
  assert.ok(out[0].createdAt < out[1].createdAt);
});
test('โค้ดว่างก็ถอดได้', async () => {
  assert.deepEqual((await decodeCode(await encodeCode([]))).items, []);
});
test('มีช่องว่างหรือขึ้นบรรทัดใหม่ปนมาตอนวางก็ยังใช้ได้', async () => {
  const code = await encodeCode(items);
  const messy = `  ${code.slice(0, 20)}\n${code.slice(20)}  `;
  assert.equal((await decodeCode(messy)).ok, true);
});
test('ปฏิเสธโค้ดที่ไม่ถูกต้อง', async () => {
  for (const bad of ['', 'hello', 'CAL1-', 'CAL1-!!!!', 'CAL9-AAAA', 'CAL1-AAAAAAAA']) {
    const r = await decodeCode(bad);
    assert.equal(r.ok, false, bad);
    assert.equal(typeof r.error, 'string');
  }
});
test('ปฏิเสธโค้ดที่มีรายการผิดรูปแบบ', async () => {
  const bad = await encodeCode([{ ...items[0], date: '2030-01-01' }]);
  assert.equal((await decodeCode(bad)).ok, false);
});
test('ปฏิเสธโค้ดที่ขยายแล้วใหญ่เกินไป', async () => {
  const huge = Array.from({ length: 6000 }, (_, i) => ({ ...items[0], id: String(i), note: 'ก'.repeat(2000) }));
  assert.equal((await decodeCode(await encodeCode(huge))).ok, false);
});
