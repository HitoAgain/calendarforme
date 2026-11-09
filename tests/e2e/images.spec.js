import { test, expect } from '@playwright/test';
import { openFrozen, cell } from './helpers.js';

test.beforeEach(({ page }) => openFrozen(page));
const figures = (page) => page.locator('#pad figure[data-image-id]');
const fixture = (n) => `tests/e2e/fixtures/${n}`;

test('เพิ่ม PNG แล้วเห็นในแผ่นฉีกและบนช่องวัน อยู่หลังรีโหลด', async ({ page }) => {
  await cell(page, '2026-11-10').click();
  await page.getByLabel('เพิ่มรูป').setInputFiles(fixture('ok.png'));
  await expect(figures(page).locator('img')).toHaveCount(1);
  await page.reload();
  const img = cell(page, '2026-11-10').locator('img');
  await expect(img).toHaveCount(1);
  await expect.poll(() => img.evaluate((i) => i.naturalWidth)).toBeGreaterThan(0);
});
test('SVG ที่ฝังสคริปต์แสดงได้แต่สคริปต์ไม่รัน', async ({ page }) => {
  const title = await page.title();
  await cell(page, '2026-11-10').click();
  await page.getByLabel('เพิ่มรูป').setInputFiles(fixture('evil.svg'));
  await expect(figures(page).locator('img')).toHaveCount(1);
  expect(await page.title()).toBe(title);
});
test('.png ปลอมถูกปฏิเสธและไม่ถูกบันทึก', async ({ page }) => {
  await cell(page, '2026-11-10').click();
  await page.getByLabel('เพิ่มรูป').setInputFiles(fixture('fake.png'));
  await expect(page.getByRole('status')).toContainText('ไม่ใช่ไฟล์รูป');
  await expect(figures(page)).toHaveCount(0);
});
test('ลากไฟล์มาวางบนช่องวันได้', async ({ page }) => {
  const dt = await page.evaluateHandle(() => {
    const d = new DataTransfer();
    d.items.add(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>'], 's.svg', { type: 'image/svg+xml' }));
    return d;
  });
  await cell(page, '2026-11-12').dispatchEvent('drop', { dataTransfer: dt });
  await expect(cell(page, '2026-11-12').locator('img')).toHaveCount(1);
});
test('ลบรูปแล้วเลิกทำได้', async ({ page }) => {
  await cell(page, '2026-11-10').click();
  await page.getByLabel('เพิ่มรูป').setInputFiles(fixture('ok.svg'));
  await page.getByRole('button', { name: 'ลบรูป' }).click();
  await expect(figures(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'เลิกทำ' }).click();
  await expect(figures(page)).toHaveCount(1);
});
test('กดรูปแล้วเปิดดูขนาดเต็ม', async ({ page }) => {
  await cell(page, '2026-11-10').click();
  await page.getByLabel('เพิ่มรูป').setInputFiles(fixture('ok.png'));
  await figures(page).getByRole('button', { name: /ดูรูป/ }).click();
  await expect(page.locator('#lightbox img')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
});
