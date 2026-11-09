import { test, expect } from '@playwright/test';
import { openFrozen, openForm, cell, form } from './helpers.js';

test.beforeEach(({ page }) => openFrozen(page));

const repeat = (page) => page.getByLabel('ทำซ้ำ', { exact: true });
const until = (page) => page.getByLabel('ทำซ้ำถึง');
const save = (page) => page.getByRole('button', { name: 'บันทึก' }).click();

test('เพิ่มรายการทุกสัปดาห์ถึงวันที่เลือก ได้ครบทุกสัปดาห์ และอยู่หลังรีโหลด', async ({ page }) => {
  await openForm(page, '2026-11-10');
  await page.getByLabel('ชื่อรายการ').fill('เรียนว่ายน้ำ');
  await expect(until(page)).toBeDisabled();
  await repeat(page).selectOption('weekly');
  await until(page).fill('2026-12-01');
  await expect(form(page)).toContainText('จะเพิ่มอีก 3 วัน');
  await save(page);
  await expect(form(page)).toBeHidden();
  for (const d of ['2026-11-10', '2026-11-17', '2026-11-24']) await expect(cell(page, d).locator('.chip')).toContainText('เรียนว่ายน้ำ');
  await expect(page.getByRole('status')).toContainText('3');
  await page.reload();
  await page.locator('[data-month="2026-12"]').click();
  await expect(cell(page, '2026-12-01').locator('.chip')).toContainText('เรียนว่ายน้ำ');
  await expect(cell(page, '2026-12-08').locator('.chip')).toHaveCount(0);
});

test('เลิกทำการทำซ้ำ ลบเฉพาะรายการที่ซ้ำ รายการแรกยังอยู่', async ({ page }) => {
  await openForm(page, '2026-11-10');
  await page.getByLabel('ชื่อรายการ').fill('วิ่ง');
  await repeat(page).selectOption('daily');
  await until(page).fill('2026-11-13');
  await save(page);
  await expect(cell(page, '2026-11-13').locator('.chip')).toContainText('วิ่ง');
  await page.getByRole('button', { name: 'เลิกทำ' }).click();
  await expect(cell(page, '2026-11-11').locator('.chip')).toHaveCount(0);
  await expect(cell(page, '2026-11-13').locator('.chip')).toHaveCount(0);
  await expect(cell(page, '2026-11-10').locator('.chip')).toContainText('วิ่ง');
});

test('ทำซ้ำรายการที่มีอยู่แล้วจากปุ่มแก้ไข', async ({ page }) => {
  await openForm(page, '2026-11-10');
  await page.getByLabel('ชื่อรายการ').fill('ประชุม');
  await page.getByLabel('เวลา').fill('09:00');
  await save(page);
  await page.getByRole('button', { name: 'แก้ไข' }).click();
  await repeat(page).selectOption('daily');
  await until(page).fill('2026-11-12');
  await save(page);
  await expect(cell(page, '2026-11-11').locator('.chip')).toContainText('09:00 ประชุม');
  await expect(cell(page, '2026-11-12').locator('.chip')).toContainText('ประชุม');
  await expect(cell(page, '2026-11-10').locator('.chip')).toHaveCount(1);
});

test('ช่วงทำซ้ำที่ไม่มีวันเพิ่ม บอกเหตุผลและไม่บันทึก', async ({ page }) => {
  await openForm(page, '2026-11-10');
  await page.getByLabel('ชื่อรายการ').fill('ไม่มีวัน');
  await repeat(page).selectOption('weekly');
  await until(page).fill('2026-11-12');
  await save(page);
  await expect(form(page)).toContainText('ไม่มีวันให้ทำซ้ำ');
  await expect(form(page)).toBeVisible();
});

test('ช่องทำซ้ำถึงจำกัดอยู่ในช่วงปฏิทิน', async ({ page }) => {
  await openForm(page, '2026-11-10');
  await expect(until(page)).toHaveAttribute('max', '2027-07-31');
});
