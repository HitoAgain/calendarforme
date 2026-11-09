import { test, expect } from '@playwright/test';
import { openFrozen, openForm, addItem, cell, form } from './helpers.js';

test.beforeEach(({ page }) => openFrozen(page));
const rows = (page) => page.locator('#pad li[data-item-id]');

test('เพิ่มหน้าที่แล้วเห็นบนปฏิทิน และอยู่หลังรีโหลด', async ({ page }) => {
  await addItem(page, '2026-11-10', 'ส่งรายงาน');
  await expect(cell(page, '2026-11-10').locator('.chip')).toContainText('ส่งรายงาน');
  await page.reload();
  await expect(cell(page, '2026-11-10').locator('.chip')).toHaveAttribute('data-kind', 'duty');
});
test('กดวันที่เลือกอยู่ซ้ำเปิดฟอร์มของวันนั้น', async ({ page }) => {
  await cell(page, '2026-11-10').click();
  await expect(form(page)).toBeHidden();
  await cell(page, '2026-11-10').click();
  await expect(form(page)).toBeVisible();
  await expect(page.getByLabel('วันที่')).toHaveValue('2026-11-10');
});
test('ชื่อว่างไม่บันทึกและบอกเหตุผล', async ({ page }) => {
  await openForm(page, '2026-11-10');
  await page.getByLabel('ชื่อรายการ').fill('   ');
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await expect(form(page)).toContainText('กรุณาใส่ชื่อรายการ');
  await expect(page.getByLabel('ชื่อรายการ')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(rows(page)).toHaveCount(0);
});
test('แก้ไขและย้ายวันผ่านช่องวันที่', async ({ page }) => {
  await addItem(page, '2026-11-10', 'เดิม');
  await page.getByRole('button', { name: 'แก้ไข' }).click();
  await page.getByLabel('ชื่อรายการ').fill('ใหม่');
  await page.getByLabel('วันที่').fill('2026-11-12');
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await expect(cell(page, '2026-11-10').locator('.chip')).toHaveCount(0);
  await expect(cell(page, '2026-11-12').locator('.chip')).toContainText('ใหม่');
});
test('ช่องวันที่จำกัดอยู่ในช่วงปฏิทิน', async ({ page }) => {
  await openForm(page, '2026-11-10');
  await expect(page.getByLabel('วันที่')).toHaveAttribute('min', '2026-11-07');
  await expect(page.getByLabel('วันที่')).toHaveAttribute('max', '2027-07-31');
});
test('ลบแล้วเลิกทำได้', async ({ page }) => {
  await addItem(page, '2026-11-10', 'ลบฉัน');
  await page.getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(rows(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'เลิกทำ' }).click();
  await expect(rows(page)).toContainText('ลบฉัน');
});
test('ติ๊กหน้าที่แล้วสถานะอยู่หลังรีโหลด กิจกรรมไม่มี checkbox', async ({ page }) => {
  await addItem(page, '2026-11-10', 'งาน');
  await addItem(page, '2026-11-10', 'เที่ยว', 'กิจกรรม');
  await expect(page.getByRole('checkbox', { name: 'ทำเสร็จแล้ว' })).toHaveCount(1);
  await page.getByRole('checkbox', { name: 'ทำเสร็จแล้ว' }).check();
  await page.reload();
  await cell(page, '2026-11-10').click();
  await expect(page.getByRole('checkbox', { name: 'ทำเสร็จแล้ว' })).toBeChecked();
});
test('ชื่อที่มี HTML แสดงเป็นข้อความ', async ({ page }) => {
  const evil = '<img src=x onerror="window.hacked=1">';
  await addItem(page, '2026-11-10', evil);
  await expect(cell(page, '2026-11-10').locator('.chip')).toContainText(evil);
  expect(await page.evaluate(() => window.hacked)).toBeUndefined();
});
test('20 รายการชื่อยาวบนจอ 375px เลย์เอาต์ไม่พัง', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(async () => {
    const s = await import('/src/store.js');
    for (let i = 0; i < 20; i++) await s.putItem({ id: `x${i}`, date: '2026-11-10', title: 'ก'.repeat(120), kind: 'duty', time: '', note: '', done: false, createdAt: i });
  });
  await page.reload();
  await cell(page, '2026-11-10').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(cell(page, '2026-11-10').locator('.more')).toHaveText('+17');
  const box = await cell(page, '2026-11-10').boundingBox();
  expect(box.height).toBeLessThan(150);
});
test('ปิดฟอร์มแล้ว focus กลับช่องวันเดิม', async ({ page }) => {
  await cell(page, '2026-11-10').locator('.day-open').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.getByLabel('ชื่อรายการ').fill('งาน');
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await expect(page.locator(':focus')).toHaveAttribute('aria-label', /10 พฤศจิกายน 2026/);
});
test('เขียนไม่สำเร็จ: เตือนและไม่ทิ้งข้อความที่พิมพ์', async ({ page }) => {
  await page.evaluate(() => { IDBObjectStore.prototype.put = () => { throw new DOMException('full', 'QuotaExceededError'); }; });
  await openForm(page, '2026-11-10');
  await page.getByLabel('ชื่อรายการ').fill('ห้ามหาย');
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await expect(page.getByRole('status')).toContainText('บันทึกไม่สำเร็จ');
  await expect(page.getByLabel('ชื่อรายการ')).toHaveValue('ห้ามหาย');
});
