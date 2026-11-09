import { test, expect } from '@playwright/test';
import { openFrozen, addItem, cell } from './helpers.js';

test.beforeEach(({ page }) => openFrozen(page));
const tear = (page) => page.getByRole('button', { name: 'ฉีกหน้านี้' });

test('ฉีกแผ่นแล้วไปวันถัดไป และมีแผ่นร่วงลงมา', async ({ page }) => {
  await tear(page).click();
  await expect(page.locator('#pad .numeral')).toHaveText('8');
  await expect(page.locator('.sheet-falling')).toBeAttached();
  await page.locator('.sheet-falling').waitFor({ state: 'detached' });
});
test('ฉีกข้ามสิ้นเดือนแล้วเดือนเปลี่ยนตาม', async ({ page }) => {
  await cell(page, '2026-11-30').click();
  await tear(page).click();
  await expect(page.locator('h1')).toHaveText('ธันวาคม 2026');
  await expect(page.locator('#pad .numeral')).toHaveText('1');
});
test('วันสุดท้ายฉีกต่อไม่ได้', async ({ page }) => {
  await page.locator('[data-month="2027-07"]').click();
  await cell(page, '2027-07-31').click();
  await expect(tear(page)).toBeDisabled();
});
test('ลากแผ่นลงเกินระยะเพื่อฉีก ลากนิดเดียวแผ่นกลับที่', async ({ page }) => {
  const box = await page.locator('#pad .numeral').boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 30, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('#pad .numeral')).toHaveText('7');
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 220, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('#pad .numeral')).toHaveText('8');
});
test('เข้าเว็บวันใหม่ แผ่นเมื่อวานร่วงเอง', async ({ page }) => {
  await expect(page.locator('.day')).toHaveCount(42);
  await page.evaluate(() => localStorage.setItem('lastSeen', '2026-11-06'));
  await page.reload();
  await expect(page.locator('.sheet-falling')).toBeAttached();
  await page.locator('.sheet-falling').waitFor({ state: 'detached' });
  await page.reload();
  await expect(page.locator('.sheet-falling')).toHaveCount(0);
});
test('ความคืบหน้าและรายการถัดไปอัปเดตตามข้อมูล', async ({ page }) => {
  await expect(page.locator('#next-up')).toContainText('ยังไม่มีรายการที่จะถึง');
  await addItem(page, '2026-11-10', 'สอบ');
  await expect(page.locator('#next-up')).toContainText('สอบ');
  await expect(page.locator('#next-up')).toContainText('อีก 3 วัน');
  await expect(page.locator('#progress')).toHaveAttribute('aria-label', 'หน้าที่เดือนนี้ ทำเสร็จ 0 จาก 1');
  await page.getByRole('checkbox', { name: 'ทำเสร็จแล้ว' }).check();
  await expect(page.locator('#progress')).toHaveAttribute('aria-label', 'หน้าที่เดือนนี้ ทำเสร็จ 1 จาก 1');
  await expect(page.locator('#next-up')).toContainText('ยังไม่มีรายการที่จะถึง');
});
test('กดรายการถัดไปแล้วพาไปวันนั้น', async ({ page }) => {
  await page.locator('[data-month="2027-02"]').click();
  await addItem(page, '2027-02-14', 'วันวาเลนไทน์', 'กิจกรรม');
  await page.getByRole('button', { name: 'วันนี้', exact: true }).click();
  await page.locator('#next-up button').click();
  await expect(page.locator('h1')).toHaveText('กุมภาพันธ์ 2027');
  await expect(page.locator('#pad .numeral')).toHaveText('14');
});
test('ลาก chip ไปวันอื่นแล้วย้ายจริง', async ({ page }) => {
  await addItem(page, '2026-11-10', 'ย้ายฉัน');
  await cell(page, '2026-11-10').locator('.chip').dragTo(cell(page, '2026-11-18'));
  await expect(cell(page, '2026-11-18').locator('.chip')).toContainText('ย้ายฉัน');
  await page.reload();
  await expect(cell(page, '2026-11-18').locator('.chip')).toContainText('ย้ายฉัน');
});
test('วางบนช่องนอกช่วงปฏิทินไม่ย้าย', async ({ page }) => {
  await addItem(page, '2026-11-10', 'อยู่นี่');
  await cell(page, '2026-11-10').locator('.chip').dragTo(cell(page, '2026-11-03'));
  await expect(cell(page, '2026-11-10').locator('.chip')).toContainText('อยู่นี่');
});
test('เศษกระดาษขึ้นเมื่อติ๊ก และไม่ขึ้นเมื่อผู้ใช้ลดการเคลื่อนไหว', async ({ page }) => {
  await addItem(page, '2026-11-10', 'งาน');
  const box = page.getByRole('checkbox', { name: 'ทำเสร็จแล้ว' });
  await box.check();
  await expect(page.locator('.confetti').first()).toBeAttached();
  await box.uncheck();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.confetti').first().waitFor({ state: 'detached' });
  await box.check();
  await expect(page.locator('.confetti')).toHaveCount(0);
  await tear(page).click();
  await expect(page.locator('.sheet-falling')).toHaveCount(0);
});
test('สลับเดือนได้ในเบราว์เซอร์ที่ไม่มี View Transitions', async ({ page }) => {
  await page.evaluate(() => { document.startViewTransition = undefined; });
  await page.getByRole('button', { name: 'เดือนถัดไป' }).click();
  await expect(page.locator('h1')).toHaveText('ธันวาคม 2026');
});
