import { test, expect } from '@playwright/test';
import { openFrozen, addItem, cell } from './helpers.js';

const share = (page) => page.locator('#share');

async function makeCode(page) {
  await page.getByRole('button', { name: 'สร้างโค้ด' }).click();
  const box = share(page).getByLabel('โค้ด');
  await expect(box).toHaveValue(/^CAL1-/);
  return box.inputValue();
}

async function enterCode(page, code) {
  await page.getByRole('button', { name: 'ใส่โค้ด' }).click();
  await share(page).getByLabel('โค้ด').fill(code);
  await share(page).getByRole('button', { name: 'ใช้โค้ดนี้' }).click();
}

test('สร้างโค้ดแล้วเอาไปใส่อีกเบราว์เซอร์ ได้ปฏิทินเดียวกันทันที', async ({ page, browser }) => {
  await openFrozen(page);
  await addItem(page, '2026-11-10', 'ส่งรายงาน');
  await page.locator('[data-month="2026-12"]').click();
  await addItem(page, '2026-12-25', 'คริสต์มาส', 'กิจกรรม');
  const code = await makeCode(page);
  await expect(share(page)).toContainText('2 รายการ');

  const other = await browser.newContext({ timezoneId: 'Asia/Bangkok', viewport: { width: 1440, height: 900 } });
  const page2 = await other.newPage();
  await openFrozen(page2);
  await enterCode(page2, code);
  await expect(share(page2)).toBeHidden();
  await expect(cell(page2, '2026-11-10').locator('.chip')).toContainText('ส่งรายงาน');
  await expect(page2.getByRole('status')).toContainText('2 รายการ');
  await page2.locator('[data-month="2026-12"]').click();
  await expect(cell(page2, '2026-12-25').locator('.chip')).toHaveAttribute('data-kind', 'activity');
  await page2.reload();
  await expect(cell(page2, '2026-11-10').locator('.chip')).toContainText('ส่งรายงาน');
  await other.close();
});

test('ใส่โค้ดแทนที่รายการเดิมหลังยืนยัน แต่รูปของเครื่องนี้ยังอยู่', async ({ page }) => {
  await openFrozen(page);
  await addItem(page, '2026-11-10', 'ของใหม่');
  const code = await makeCode(page);
  await share(page).getByRole('button', { name: 'ปิด' }).click();
  await page.getByRole('button', { name: 'ลบ', exact: true }).click();
  await addItem(page, '2026-11-11', 'ของเดิม');
  await page.getByLabel('เพิ่มรูป').setInputFiles('tests/e2e/fixtures/ok.png');
  page.on('dialog', (d) => d.accept());
  await enterCode(page, code);
  await expect(cell(page, '2026-11-10').locator('.chip')).toContainText('ของใหม่');
  await expect(cell(page, '2026-11-11').locator('.chip')).toHaveCount(0);
  await expect(cell(page, '2026-11-11').locator('img')).toHaveCount(1);
});

test('กดยกเลิกที่หน้ายืนยัน ข้อมูลเดิมอยู่ครบ', async ({ page }) => {
  await openFrozen(page);
  const code = await makeCode(page);
  await share(page).getByRole('button', { name: 'ปิด' }).click();
  await addItem(page, '2026-11-10', 'ห้ามหาย');
  page.on('dialog', (d) => d.dismiss());
  const asked = page.waitForEvent('dialog');
  await enterCode(page, code);
  await asked;
  await expect(share(page)).toBeVisible();
  await page.reload();
  await expect(cell(page, '2026-11-10').locator('.chip')).toContainText('ห้ามหาย');
});

test('โค้ดผิด บอกเหตุผลและไม่แตะข้อมูลเดิม', async ({ page }) => {
  await openFrozen(page);
  await addItem(page, '2026-11-10', 'ห้ามหาย');
  await enterCode(page, 'CAL1-not-a-real-code');
  await expect(share(page)).toContainText('โค้ดไม่ถูกต้อง');
  await expect(share(page)).toBeVisible();
  await page.reload();
  await expect(cell(page, '2026-11-10').locator('.chip')).toContainText('ห้ามหาย');
});

test('ปุ่มคัดลอกโค้ดใส่คลิปบอร์ดได้', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openFrozen(page);
  await addItem(page, '2026-11-10', 'คัดลอก');
  const code = await makeCode(page);
  await share(page).getByRole('button', { name: 'คัดลอกโค้ด' }).click();
  await expect(share(page).getByRole('button', { name: 'คัดลอกแล้ว' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
});
