import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

test('เปิดผ่าน file:// แล้วเห็นคำเตือนภาษาไทย', async ({ page }) => {
  await page.goto(pathToFileURL(resolve('index.html')).href);
  await expect(page.locator('#file-warning')).toBeVisible();
  await expect(page.locator('#file-warning')).toContainText('start.cmd');
});
test('server กัน path traversal', async ({ request }) => {
  // ไต่ขึ้นเกินจำนวนชั้นจริง เพื่อให้ถึง C:\ เสมอ ไฟล์ปลายทางจึงมีอยู่จริงถ้าไม่มีตัวกัน
  for (const up of ['..%2f', '..%5c']) {
    const p = '/' + up.repeat(12) + 'Windows%2fwin.ini';
    expect((await request.get(p)).status()).not.toBe(200);
  }
});
test('ฟอนต์ไทยโหลดจากเครื่องตัวเอง ไม่ต้องใช้อินเทอร์เน็ต', async ({ page }) => {
  const external = [];
  await page.route((url) => url.hostname !== '127.0.0.1', (route) => { external.push(route.request().url()); route.abort(); });
  await page.goto('/');
  await page.locator('.day').first().waitFor();
  const loaded = await page.evaluate(async () => {
    await document.fonts.load('900 40px "Noto Serif Thai"', 'วันที่ 7');
    await document.fonts.load('400 16px "Noto Sans Thai"', 'วันที่ 7');
    return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''));
  });
  expect(loaded).toEqual(expect.arrayContaining(['Noto Serif Thai', 'Noto Sans Thai']));
  expect(external).toEqual([]);
});
test('server ส่ง JS ด้วย MIME ที่ถูกต้อง', async ({ request }) => {
  expect((await request.get('/src/dates.js')).headers()['content-type']).toContain('javascript');
});
test('store เก็บและลบรายการ/รูปได้จริง และอยู่ข้ามการรีโหลด', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const s = await import('/src/store.js');
    await s.putItem({ id: 'a', date: '2026-11-07', title: 'x', kind: 'duty', time: '', note: '', done: false, createdAt: 1 });
    await s.putItem({ id: 'b', date: '2026-11-07', title: 'y', kind: 'duty', time: '', note: '', done: false, createdAt: 2 });
    await s.deleteItem('b');
    await s.putImage({ id: 'i', date: '2026-11-07', name: 'p.png', type: 'image/png', blob: new Blob(['x'], { type: 'image/png' }), createdAt: 1 });
  });
  await page.reload();
  const n = await page.evaluate(async () => {
    const s = await import('/src/store.js');
    const { items, images } = await s.getAll();
    return { items: items.length, blobSize: images[0].blob.size };
  });
  expect(n).toEqual({ items: 1, blobSize: 1 });
});
test('replaceAll แบบ all-or-nothing', async ({ page }) => {
  await page.goto('/');
  const left = await page.evaluate(async () => {
    const s = await import('/src/store.js');
    await s.putItem({ id: 'keep', date: '2026-11-07', title: 'x', kind: 'duty', time: '', note: '', done: false, createdAt: 1 });
    await s.replaceAll({ items: [{ noId: true }], images: [] }).catch(() => {});
    return (await s.getAll()).items.map((i) => i.id);
  });
  expect(left).toEqual(['keep']);
});
