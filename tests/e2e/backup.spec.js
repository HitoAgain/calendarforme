import { test, expect } from '@playwright/test';
import { openFrozen, addItem, cell } from './helpers.js';

test.beforeEach(({ page }) => openFrozen(page));

test('ส่งออกแล้วนำเข้ากลับ รายการและรูปกลับมาครบ', async ({ page }, info) => {
  await addItem(page, '2026-11-10', 'เก็บไว้');
  await page.getByLabel('เพิ่มรูป').setInputFiles('tests/e2e/fixtures/ok.png');
  await expect(cell(page, '2026-11-10').locator('img')).toHaveCount(1);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'สำรองข้อมูล' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^calendarforme-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = info.outputPath('b.json');
  await dl.saveAs(path);
  await page.evaluate(async () => (await import('/src/store.js')).replaceAll({ items: [], images: [] }));
  await page.reload();
  await expect(cell(page, '2026-11-10').locator('.chip')).toHaveCount(0);
  page.on('dialog', (d) => d.accept());
  await page.getByLabel('นำเข้าข้อมูล').setInputFiles(path);
  await expect(cell(page, '2026-11-10').locator('.chip')).toContainText('เก็บไว้');
  const img = cell(page, '2026-11-10').locator('img');
  await expect(img).toHaveCount(1);
  await expect.poll(() => img.evaluate((i) => i.naturalWidth)).toBeGreaterThan(0);
});
test('ไฟล์เสีย ข้อมูลเดิมอยู่ครบ', async ({ page }) => {
  await addItem(page, '2026-11-10', 'ห้ามหาย');
  page.on('dialog', (d) => d.accept());
  for (const body of ['{not json', '{"app":"other"}']) {
    await page.getByLabel('นำเข้าข้อมูล').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(body) });
    await expect(page.getByRole('status')).toContainText('ไฟล์สำรองไม่ถูกต้อง');
  }
  await page.reload();
  await expect(cell(page, '2026-11-10').locator('.chip')).toContainText('ห้ามหาย');
});
test('กดยกเลิกที่หน้ายืนยัน ข้อมูลเดิมอยู่ครบ', async ({ page }) => {
  await addItem(page, '2026-11-10', 'ห้ามหาย');
  page.on('dialog', (d) => d.dismiss());
  const body = JSON.stringify({ app: 'calendarforme', version: 1, items: [], images: [] });
  await page.getByLabel('นำเข้าข้อมูล').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(body) });
  await page.reload();
  await expect(cell(page, '2026-11-10').locator('.chip')).toContainText('ห้ามหาย');
});
