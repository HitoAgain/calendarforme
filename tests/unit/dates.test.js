import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MONTHS, FIRST_DAY, LAST_DAY, toKey, fromKey, inRange, monthOf, clampMonth, monthGrid, daysBetween, relativeDay, formatMonth, formatDay, repeatDates } from '../../src/dates.js';

test('repeatDates ทุกวัน ทุกสัปดาห์ ไม่รวมวันแรก', () => {
  assert.deepEqual(repeatDates('2026-11-10', 'daily', '2026-11-13'), ['2026-11-11', '2026-11-12', '2026-11-13']);
  assert.deepEqual(repeatDates('2026-11-10', 'weekly', '2026-12-01'), ['2026-11-17', '2026-11-24', '2026-12-01']);
});
test('repeatDates ทุกเดือน วันที่ 31 ตกวันสุดท้ายของเดือนที่สั้นกว่า', () => {
  assert.deepEqual(repeatDates('2027-01-31', 'monthly', '2027-04-30'), ['2027-02-28', '2027-03-31', '2027-04-30']);
});
test('repeatDates ไม่ทำซ้ำ หรือวันสิ้นสุดก่อนวันเริ่ม ได้ว่าง', () => {
  assert.deepEqual(repeatDates('2026-11-10', 'none', '2026-12-01'), []);
  assert.deepEqual(repeatDates('2026-11-10', 'daily', '2026-11-09'), []);
  assert.deepEqual(repeatDates('2026-11-10', 'daily', ''), []);
});
test('repeatDates ไม่เกินวันสุดท้ายของปฏิทิน', () => {
  const r = repeatDates('2027-07-28', 'daily', '2027-12-31');
  assert.deepEqual(r, ['2027-07-29', '2027-07-30', '2027-07-31']);
});

test('toKey ใช้วันท้องถิ่น ไม่ใช่ UTC', () => assert.equal(toKey(new Date(2026, 10, 7, 0, 30)), '2026-11-07'));
test('fromKey กลับมาเป็นวันเดิม', () => assert.equal(toKey(fromKey('2027-07-31')), '2027-07-31'));
test('ช่วงเริ่มวันนี้ถึงสิ้น ก.ค. 2027 มี 9 เดือน', () => {
  assert.equal(FIRST_DAY, '2026-11-07'); assert.equal(LAST_DAY, '2027-07-31');
  assert.equal(MONTHS.length, 9); assert.equal(MONTHS[0], '2026-11'); assert.equal(MONTHS[8], '2027-07');
});
test('monthGrid เริ่มอาทิตย์และมี 42 วัน', () => {
  for (const [m, first, last] of [['2026-11', '2026-11-01', '2026-12-12'], ['2027-02', '2027-01-31', '2027-03-13'], ['2027-07', '2027-06-27', '2027-08-07']]) {
    const g = monthGrid(m); assert.equal(g.length, 42); assert.equal(g[0], first); assert.equal(g[41], last);
  }
});
test('inRange ตรงขอบ', () => {
  assert.equal(inRange('2026-11-07'), true); assert.equal(inRange('2027-07-31'), true);
  assert.equal(inRange('2026-11-06'), false); assert.equal(inRange('2027-08-01'), false);
});
test('monthOf', () => assert.equal(monthOf('2027-03-15'), '2027-03'));
test('clampMonth บีบเข้าช่วง', () => {
  assert.equal(clampMonth(new Date(2026, 5, 1)), '2026-11'); assert.equal(clampMonth(new Date(2027, 2, 15)), '2027-03'); assert.equal(clampMonth(new Date(2028, 0, 1)), '2027-07');
});
test('daysBetween ข้ามปี', () => assert.equal(daysBetween('2026-12-31', '2027-01-02'), 2));
test('relativeDay', () => {
  assert.equal(relativeDay('2026-11-07', '2026-11-07'), 'วันนี้');
  assert.equal(relativeDay('2026-11-08', '2026-11-07'), 'พรุ่งนี้');
  assert.equal(relativeDay('2026-11-10', '2026-11-07'), 'อีก 3 วัน');
});
test('ข้อความไทยเป็น ค.ศ. ไม่มีคำว่า ค.ศ.', () => {
  assert.equal(formatMonth('2026-11'), 'พฤศจิกายน 2026');
  assert.equal(formatDay('2026-11-07'), 'วันเสาร์ที่ 7 พฤศจิกายน 2026');
});
