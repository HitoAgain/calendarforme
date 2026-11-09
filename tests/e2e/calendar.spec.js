import { test, expect } from '@playwright/test';
import { openFrozen, cell } from './helpers.js';

test.beforeEach(({ page }) => openFrozen(page));

test('เปิดมาเห็นเดือนปัจจุบัน วันนี้เด่น และแผ่นฉีกเป็นวันนี้', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('พฤศจิกายน 2026');
  await expect(page.locator('[aria-current="date"]')).toHaveAttribute('aria-label', /วันเสาร์ที่ 7 พฤศจิกายน 2026/);
  await expect(page.locator('.day')).toHaveCount(42);
  await expect(page.locator('#pad .numeral')).toHaveText('7');
});
test('ปฏิทินเริ่มวันนี้: 1-6 พ.ย. กดไม่ได้', async ({ page }) => {
  await expect(cell(page, '2026-11-06')).toHaveAttribute('data-disabled', '');
  await expect(cell(page, '2026-11-06').locator('.day-open')).toBeDisabled();
  await expect(cell(page, '2026-11-07')).not.toHaveAttribute('data-disabled', '');
});
test('ไปได้ถึงขอบช่วงเท่านั้น', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'เดือนก่อนหน้า' })).toBeDisabled();
  for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'เดือนถัดไป' }).click();
  await expect(page.locator('h1')).toHaveText('กรกฎาคม 2027');
  await expect(page.getByRole('button', { name: 'เดือนถัดไป' })).toBeDisabled();
  await expect(cell(page, '2027-08-01')).toHaveAttribute('data-disabled', '');
});
test('แถบเดือนกระโดดได้และปุ่มวันนี้กลับมา', async ({ page }) => {
  await page.locator('[data-month="2027-03"]').click();
  await expect(page.locator('h1')).toHaveText('มีนาคม 2027');
  await page.getByRole('button', { name: 'วันนี้', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('พฤศจิกายน 2026');
});
test('คีย์บอร์ด: ลูกศรย้ายวัน PageDown เปลี่ยนเดือน', async ({ page }) => {
  await page.locator('[aria-current="date"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(':focus')).toHaveAttribute('aria-label', /8 พฤศจิกายน 2026/);
  await page.keyboard.press('PageDown');
  await expect(page.locator('h1')).toHaveText('ธันวาคม 2026');
});
test('เปิดค้างข้ามเที่ยงคืนแล้ววันนี้เปลี่ยน', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-08T00:05:00+07:00'));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.locator('[aria-current="date"]')).toHaveAttribute('aria-label', /8 พฤศจิกายน 2026/);
  await expect(page.locator('#pad .numeral')).toHaveText('8');
});
test('หลังช่วงปฏิทินแล้ว เปิดเดือนสุดท้ายและปุ่มวันนี้กดไม่ได้', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2028-01-01T10:00:00+07:00'));
  await page.reload();
  await expect(page.locator('h1')).toHaveText('กรกฎาคม 2027');
  await expect(page.getByRole('button', { name: 'วันนี้', exact: true })).toBeDisabled();
  await expect(page.locator('[aria-current="date"]')).toHaveCount(0);
});
test('จอ 375px ไม่มี scroll แนวนอน', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
test('คลิกวันที่อื่นแล้วแผ่นฉีกเปลี่ยนตาม', async ({ page }) => {
  await cell(page, '2026-11-19').click();
  await expect(page.locator('#pad .numeral')).toHaveText('19');
  await expect(page.locator('#pad')).toContainText('วันพฤหัสบดี');
  await expect(page.locator('#item-form')).toBeHidden();
});
