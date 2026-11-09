import { test, expect } from '@playwright/test';
import { openFrozen } from './helpers.js';

// A stand-in AudioContext that accepts any call and counts how many sounds were started.
const fakeAudio = () => {
  const any = () => new Proxy(function () {}, {
    get: (_, key) => {
      if (key === 'then') return undefined;
      if (key === Symbol.toPrimitive) return () => 0;
      if (key === 'createBufferSource') window.__sfx = (window.__sfx ?? 0) + 1;
      return any();
    },
    apply: () => any(),
    construct: () => any(),
  });
  window.AudioContext = class { constructor() { return any(); } };
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(fakeAudio);
  await openFrozen(page);
});

const sounds = (page) => page.evaluate(() => window.__sfx ?? 0);
const next = (page) => page.getByRole('button', { name: 'เดือนถัดไป' }).click();

test('เปลี่ยนเดือนแล้วตารางสะบัดแบบเบลอ', async ({ page }) => {
  await next(page);
  await page.waitForFunction(() => document.getAnimations().some((a) => a.animationName === 'whip-in'));
  await expect(page.locator('h1')).toHaveText('ธันวาคม 2026');
});
test('เปลี่ยนเดือนแล้วมีเสียงกระดาษ ทั้งปุ่มและแถบเดือน', async ({ page }) => {
  await next(page);
  await expect.poll(() => sounds(page)).toBe(1);
  await page.locator('[data-month="2027-04"]').click();
  await expect.poll(() => sounds(page)).toBe(2);
});
test('เลือกเดือนเดิมซ้ำไม่มีเสียง', async ({ page }) => {
  await page.locator('[data-month="2026-11"]').click();
  await page.waitForTimeout(200);
  expect(await sounds(page)).toBe(0);
});
test('ปิดเสียงได้และจำไว้หลังรีโหลด', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'เสียงกระดาษ' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await next(page);
  await page.waitForTimeout(200);
  expect(await sounds(page)).toBe(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'เสียงกระดาษ' })).toHaveAttribute('aria-pressed', 'false');
});
test('ผู้ใช้ลดการเคลื่อนไหว ไม่มีการสะบัด', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await next(page);
  await expect(page.locator('h1')).toHaveText('ธันวาคม 2026');
  expect(await page.evaluate(() => document.getAnimations().some((a) => a.animationName === 'whip-in'))).toBe(false);
});
