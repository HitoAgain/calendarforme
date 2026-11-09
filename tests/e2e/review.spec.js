import { test, expect } from '@playwright/test';
import { openFrozen, openForm, addItem, cell, form } from './helpers.js';

test('เปิดค้างไว้โดยไม่สลับแท็บ ข้ามเที่ยงคืนแล้ววันนี้เปลี่ยนเอง', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-07T23:59:00+07:00') });
  await page.goto('/');
  await expect(page.locator('[aria-current="date"]')).toHaveAttribute('aria-label', /7 พฤศจิกายน 2026/);
  await page.clock.runFor('05:00');
  await expect(page.locator('[aria-current="date"]')).toHaveAttribute('aria-label', /8 พฤศจิกายน 2026/);
  await expect(page.locator('#pad .numeral')).toHaveText('8');
});

test.describe('หลังรีวิว', () => {
  test.beforeEach(({ page }) => openFrozen(page));

  test('ดับเบิลคลิกบันทึกได้รายการเดียว', async ({ page }) => {
    await openForm(page, '2026-11-10');
    await page.getByLabel('ชื่อรายการ').fill('ครั้งเดียว');
    await page.getByRole('button', { name: 'บันทึก' }).dblclick();
    await form(page).waitFor({ state: 'hidden' });
    await page.reload();
    await expect(cell(page, '2026-11-10').locator('.chip')).toHaveCount(1);
  });

  test('รูป SVG แสดงผ่าน data: ไม่ใช่ blob ของแอป', async ({ page }) => {
    await cell(page, '2026-11-10').click();
    await page.getByLabel('เพิ่มรูป').setInputFiles('tests/e2e/fixtures/evil.svg');
    const src = await cell(page, '2026-11-10').locator('img').getAttribute('src');
    expect(src.startsWith('data:image/svg+xml')).toBe(true);
    const padSrc = await page.locator('#pad figure img').getAttribute('src');
    expect(padSrc.startsWith('data:image/svg+xml')).toBe(true);
  });

  test('ลากเลือกข้อความออกนอกฟอร์มแล้วฟอร์มไม่ปิด', async ({ page }) => {
    await openForm(page, '2026-11-10');
    const field = page.getByLabel('ชื่อรายการ');
    await field.fill('ห้ามหาย');
    const box = await field.boundingBox();
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(5, 5, { steps: 5 });
    await page.mouse.up();
    await expect(form(page)).toBeVisible();
    await expect(field).toHaveValue('ห้ามหาย');
  });

  test('ชื่อยาวไม่เว้นวรรคบนจอ 375px ปุ่มเลิกทำยังอยู่ในจอ', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await addItem(page, '2026-11-10', 'a'.repeat(120));
    await page.getByRole('button', { name: 'ลบ', exact: true }).click();
    const undo = await page.getByRole('button', { name: 'เลิกทำ' }).boundingBox();
    expect(undo.x + undo.width).toBeLessThanOrEqual(375);
  });

  test('เปลี่ยนหน้าที่ที่เสร็จแล้วเป็นกิจกรรม ไม่ค้างสถานะเสร็จ', async ({ page }) => {
    await addItem(page, '2026-11-10', 'สลับ');
    await page.getByRole('checkbox', { name: 'ทำเสร็จแล้ว' }).check();
    await page.getByRole('button', { name: 'แก้ไข' }).click();
    await page.getByRole('radio', { name: 'กิจกรรม' }).check();
    await page.getByRole('button', { name: 'บันทึก' }).click();
    await expect(cell(page, '2026-11-10').locator('.chip')).not.toHaveClass(/done/);
    await expect(page.locator('#next-up')).toContainText('สลับ');
  });
});
