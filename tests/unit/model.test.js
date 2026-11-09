import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateItem, sortDay, monthStats, nextUp, checkImageFile, validateBackup } from '../../src/model.js';

test('validateItem ตัดช่องว่าง เติมค่าปริยาย และปฏิเสธชื่อว่าง', () => {
  const { value } = validateItem({ date: '2026-11-07', title: '  สอบ  ', kind: 'duty' });
  assert.equal(value.title, 'สอบ'); assert.equal(value.done, false); assert.equal(value.time, '');
  assert.equal(typeof value.id, 'string'); assert.equal(typeof value.createdAt, 'number');
  assert.equal(validateItem({ date: '2026-11-07', title: '   ', kind: 'duty' }).ok, false);
});
test('validateItem ปฏิเสธชื่อยาวเกิน วันนอกช่วง kind แปลก และเวลาผิดรูปแบบ', () => {
  assert.equal(validateItem({ date: '2026-11-07', title: 'ก'.repeat(121), kind: 'duty' }).ok, false);
  assert.equal(validateItem({ date: '2027-08-01', title: 'x', kind: 'duty' }).ok, false);
  assert.equal(validateItem({ date: '2026-11-06', title: 'x', kind: 'duty' }).ok, false);
  assert.equal(validateItem({ date: '2026-11-07', title: 'x', kind: 'party' }).ok, false);
  assert.equal(validateItem({ date: '2026-11-07', title: 'x', kind: 'duty', time: '9am' }).ok, false);
});
test('sortDay: มีเวลาก่อน ไม่มีเวลาไว้ท้าย', () => {
  const r = sortDay([{ id: 'a', time: '', createdAt: 1 }, { id: 'b', time: '14:00', createdAt: 2 }, { id: 'c', time: '08:30', createdAt: 3 }]);
  assert.deepEqual(r.map(x => x.id), ['c', 'b', 'a']);
});
test('monthStats นับเฉพาะหน้าที่ในเดือนนั้น และไม่หารด้วยศูนย์', () => {
  const items = [{ date: '2026-11-08', kind: 'duty', done: true }, { date: '2026-11-09', kind: 'duty', done: false }, { date: '2026-11-10', kind: 'activity', done: false }, { date: '2026-12-01', kind: 'duty', done: true }];
  assert.deepEqual(monthStats(items, '2026-11'), { total: 2, done: 1, percent: 50 });
  assert.deepEqual(monthStats([], '2026-11'), { total: 0, done: 0, percent: 0 });
});
test('nextUp ข้ามรายการอดีตและที่เสร็จแล้ว', () => {
  const items = [{ id: 'old', date: '2026-11-01', done: false, time: '', createdAt: 1 }, { id: 'done', date: '2026-11-08', done: true, time: '', createdAt: 2 }, { id: 'later', date: '2026-11-20', done: false, time: '', createdAt: 3 }, { id: 'next', date: '2026-11-09', done: false, time: '', createdAt: 4 }];
  assert.equal(nextUp(items, '2026-11-07').id, 'next');
  assert.equal(nextUp([], '2026-11-07'), null);
});
test('checkImageFile', () => {
  assert.equal(checkImageFile({ name: 'a.png', type: 'image/png', size: 10 }).ok, true);
  assert.equal(checkImageFile({ name: 'a.SVG', type: '', size: 10 }).type, 'image/svg+xml'); // Windows อาจส่ง type ว่าง
  assert.equal(checkImageFile({ name: 'a.gif', type: 'image/gif', size: 10 }).ok, false);
  assert.equal(checkImageFile({ name: 'a.exe', type: '', size: 10 }).ok, false);
  assert.equal(checkImageFile({ name: 'a.jpg', type: 'image/jpeg', size: 10 * 1024 * 1024 + 1 }).ok, false);
});
test('validateBackup ปฏิเสธไฟล์ผิดรูปแบบ', () => {
  const base = { app: 'calendarforme', version: 1, items: [], images: [] };
  for (const bad of [null, [], { ...base, app: 'other' }, { ...base, version: 2 }, { app: 'calendarforme', version: 1 },
    { ...base, items: [{ id: 'a', date: 'bad', title: 'x', kind: 'duty' }] },
    { ...base, items: [{ date: '2026-11-07', title: 'x', kind: 'duty' }] },
    { ...base, images: [{ id: 'i', date: '2026-11-07', name: 'x', type: 'image/gif', createdAt: 1, dataUrl: 'data:image/gif;base64,AA==' }] },
    { ...base, images: [{ id: 'i', date: '2026-11-07', name: 'x', type: 'image/png', createdAt: 1, dataUrl: 'data:text/html;base64,AA==' }] }])
    assert.equal(validateBackup(bad).ok, false);
  assert.equal(validateBackup(base).ok, true);
});
