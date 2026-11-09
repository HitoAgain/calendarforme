# ปฏิทินส่วนตัว (calendarforme) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **แก้ไขหลังเขียนแผน (7 พ.ย. 2026):** เจ้าของเลือกให้เริ่มที่วันนี้ และเลือกดีไซน์ "ปฏิทินฉีก" รายละเอียดวันจึงอยู่ในแผ่นฉีกสีแดงทางซ้ายที่เห็นตลอด ฟอร์มเพิ่ม/แก้ไขอยู่ใน `dialog#item-form` และไม่มีโหมดมืด หาก Task 4-8 ขัดกับหมายเหตุนี้ ให้ยึดหมายเหตุนี้และ `.impeccable/` surface brief

**Goal:** เว็บปฏิทินสำหรับผู้ใช้คนเดียว ตั้งแต่ 7 พ.ย. 2026 ถึง ก.ค. 2027 เพิ่มกิจกรรม/หน้าที่รายวันและรูปภาพได้ อ่านรู้เรื่องทันทีที่เห็น และมีลูกเล่นกับแอนิเมชัน

**Architecture:** เว็บ static ไม่มี build step ใช้ HTML + CSS + ES modules เก็บข้อมูลใน IndexedDB ของเบราว์เซอร์ (รูปเป็น Blob) ไม่มี backend ตรรกะล้วนแยกไว้ใน `dates.js` / `model.js` เพื่อทดสอบด้วย `node --test` ส่วน UI ทดสอบด้วย Playwright บน Edge ที่มีในเครื่อง

**Tech Stack:** Vanilla JS (ES modules), CSS, IndexedDB, Node 24 (`node:test`, static server ไม่มี dependency), `@playwright/test` เป็น devDependency เดียว

**Spec:** `readme.md`

## Global Constraints

- ช่วงปฏิทินตายตัว: `2026-11-07` ถึง `2027-07-31` (9 เดือน) วันที่อยู่นอกช่วงเข้าถึงไม่ได้
- ข้อความ UI ทุกจุดเป็นภาษาไทย ปีแสดงเป็น ค.ศ. เสมอ (ใช้ locale `th-TH-u-ca-gregory`) เพราะ `th-TH` เฉยๆ จะได้ พ.ศ.
- สัปดาห์เริ่มวันอาทิตย์
- รูปที่รับ: SVG, JPG, PNG เท่านั้น ไม่เกิน 10 MB ต่อรูป
- ห้ามเพิ่ม dependency ฝั่ง runtime ห้ามใช้ `innerHTML` กับข้อมูลผู้ใช้ และแสดงรูปผ่าน `<img>` เท่านั้น (SVG ที่อยู่ใน `<img>` รันสคริปต์ไม่ได้)
- ทุกแอนิเมชันต้องปิดเมื่อ `prefers-reduced-motion: reduce`
- ใช้งานที่ความกว้าง 375px ได้โดยไม่มี scroll แนวนอน และใช้คีย์บอร์ดอย่างเดียวได้ครบ
- server ใช้ `http://127.0.0.1:4173` ตายตัว เพราะ IndexedDB ผูกกับ origin ถ้าเปลี่ยน port ข้อมูลจะเหมือนหายไป

**ไม่ทำ (ไม่อยู่ใน spec):** sync หลายอุปกรณ์, ระบบล็อกอิน, กิจกรรมซ้ำ, การแจ้งเตือน, วันหยุดไทย, ค้นหา, PWA

## Review Focus

1. เปิด `index.html` ด้วยการดับเบิลคลิก (`file://`) ES modules จะโหลดไม่ได้ ต้องเห็นข้อความไทยบอกให้ใช้ `start.cmd` ไม่ใช่หน้าขาว (test: Task 3)
2. เวลาใกล้เที่ยงคืนใน UTC+7 `toISOString()` จะได้วันก่อนหน้า วันที่ต้องไม่เลื่อน และถ้าเปิดแอปค้างข้ามคืน ไฮไลต์ "วันนี้" ต้องเปลี่ยนตาม (test: Task 1, Task 4)
3. ไฟล์รูปที่ไม่ปกติ เช่น `.png` ที่ข้างในไม่ใช่รูป หรือ SVG ที่ฝังสคริปต์ ต้องไม่ทำให้แอปพังและสคริปต์ต้องไม่รัน (test: Task 6)
4. นำเข้าไฟล์สำรองที่เสียหรือไม่ใช่ของแอป ข้อมูลเดิมต้องอยู่ครบ (test: Task 8)
5. เนื้อหาล้น: 20 รายการในวันเดียว ชื่อยาว 120 ตัวอักษร ชื่อที่มี HTML บนจอ 375px ต้องไม่ทำเลย์เอาต์พัง และแสดงเป็นข้อความธรรมดา (test: Task 5)

---

## โครงสร้างไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | โครงหน้า, ข้อความเตือน `file://`, โหลด `src/app.js` |
| `styles.css` | design tokens, เลย์เอาต์, แอนิเมชันทั้งหมด |
| `src/dates.js` | ช่วงวันที่, grid เดือน, การจัดรูปแบบภาษาไทย (pure) |
| `src/model.js` | สร้าง/ตรวจรายการ, สถิติ, รายการถัดไป, ตรวจไฟล์รูป, ตรวจไฟล์สำรอง (pure) |
| `src/store.js` | ตัวเดียวที่แตะ IndexedDB |
| `src/calendar.js` | วาดหัวเดือน, แถบเดือน, grid, คีย์บอร์ด, ลากวาง |
| `src/day-panel.js` | `<dialog>` รายละเอียดวัน: ฟอร์ม, รายการ, รูป |
| `src/widgets.js` | วงแหวนความคืบหน้า, การ์ดรายการถัดไป |
| `src/fx.js` | toast + เลิกทำ, confetti, สลับเดือนแบบมีแอนิเมชัน |
| `src/backup.js` | ส่งออก/นำเข้าไฟล์สำรอง |
| `src/app.js` | state กลาง, โหลดข้อมูล, ประสานทุกส่วน |
| `server.mjs`, `start.cmd` | static server ไม่มี dependency และตัวเปิดแบบดับเบิลคลิก |
| `tests/unit/*.test.js`, `tests/e2e/*.spec.js` | ทดสอบตรรกะ / ทดสอบในเบราว์เซอร์จริง |

## ทิศทางการออกแบบ

แนว "ปฏิทินตั้งโต๊ะบนกระดาษ": ไม่ใช่ dashboard และไม่ใช้กระจกฝ้าหรือ gradient ม่วง หัวเดือนตัวใหญ่แบบนิตยสาร ตัวเลขวันใหญ่อ่านได้จากระยะไกล ส่วน "วันนี้" เป็นบล็อกสีหมึกทึบที่เห็นก่อนสิ่งอื่น ก่อนเขียน CSS ใน Task 4 ให้เรียก skill `frontend-design` เพื่อเก็บรายละเอียด แต่คง token เหล่านี้ไว้

```css
:root { --paper:#f6f1e7; --card:#fffdf8; --ink:#1f1b16; --muted:#6d6558; --line:#ddd3c2;
        --activity:#0f766e; --duty:#c2410c; }
@media (prefers-color-scheme: dark) { :root { --paper:#17140f; --card:#211d17; --ink:#f4eee2;
        --muted:#a89f8f; --line:#3a342a; --activity:#2dd4bf; --duty:#fb923c; } }
```

ฟอนต์: Google Fonts `Mitr` (หัวข้อ) และ `IBM Plex Sans Thai` (เนื้อหา) โดย fallback เป็น `"Leelawadee UI", sans-serif` เพื่อให้ใช้งานออฟไลน์ได้

## สัญญาร่วมของ UI (ทุก task ใช้ชื่อเหล่านี้)

- ช่องวัน: `div.day[data-date="YYYY-MM-DD"]` ข้างในมี `button.day-open` (`aria-label` = `formatDay` + จำนวนรายการ) และ `div.chip[data-item-id][data-kind][draggable=true]` ห้ามซ้อน chip ใน button เพราะเป็น HTML ที่ไม่ถูกต้องและลากไม่ได้ คลิกตรงไหนของช่องก็เปิดวันนั้น
- สถานะช่องวัน: `[data-outside]` = คนละเดือนกับที่เปิดอยู่, `[data-disabled]` = นอกช่วงปฏิทิน, `aria-current="date"` บน `.day-open` ของวันนี้, `.more` = ข้อความ `+N`
- ปุ่มนำทาง: `เดือนก่อนหน้า`, `เดือนถัดไป`, `วันนี้` / หัวเดือน: `h1` / แถบเดือน: `nav[aria-label="เลือกเดือน"]` มีปุ่ม `[data-month]`
- แผงวัน: `dialog#day-panel` หัวข้อเป็น `formatDay` / ฟอร์ม: `ชื่อรายการ`, radio `กิจกรรม` / `หน้าที่`, `เวลา`, `วันที่`, `รายละเอียด`, ปุ่ม `บันทึก` (ห้ามตั้งชื่อช่อง note ว่า "บันทึก" เพราะซ้ำกับปุ่ม)
- แถวรายการ: `li[data-item-id]` มี checkbox `ทำเสร็จแล้ว` (เฉพาะหน้าที่), ปุ่ม `แก้ไข`, `ลบ`
- รูป: input ป้าย `เพิ่มรูป`, `figure[data-image-id]`, ปุ่ม `ลบรูป`
- Toast: `[role=status]`, ปุ่ม `เลิกทำ` / วิดเจ็ต: `#progress-ring`, `#next-up` / สำรองข้อมูล: ปุ่ม `สำรองข้อมูล`, input ป้าย `นำเข้าข้อมูล`

---

### Task 1: โปรเจกต์และตรรกะวันที่

**Files:**
- Create: `package.json`, `.gitignore`, `src/dates.js`
- Test: `tests/unit/dates.test.js`

**Interfaces:**
- Produces (`src/dates.js`):
  - `MONTHS: string[]` จาก `'2026-11'` ถึง `'2027-07'`, `FIRST_DAY = '2026-11-07'`, `LAST_DAY = '2027-07-31'`
  - `toKey(d: Date): string`, `fromKey(key: string): Date` (เที่ยงคืนเวลาท้องถิ่น), `inRange(key): boolean`, `monthOf(key): string`
  - `clampMonth(d: Date): string` เดือนที่จะเปิด โดยบีบให้อยู่ในช่วง
  - `monthGrid(month): string[]` 42 วัน เริ่มวันอาทิตย์
  - `daysBetween(fromKey, toKey): number`, `relativeDay(key, todayKey): string`
  - `formatMonth(month): string`, `formatDay(key): string`

- [ ] **Step 1: ตั้งโปรเจกต์**

Run: `git init` แล้วสร้าง `package.json` ด้วย `"type":"module"`, `"private":true`, scripts `"test":"node --test \"tests/unit/*.test.js\""`, `"e2e":"playwright test"`, `"start":"node server.mjs"` และ `.gitignore` มี `node_modules/`, `test-results/`, `playwright-report/`

- [ ] **Step 2: เขียน test ที่ fail**

```js
test('toKey ใช้วันท้องถิ่น ไม่ใช่ UTC', () => assert.equal(toKey(new Date(2026, 10, 7, 0, 30)), '2026-11-07'));
test('fromKey กลับมาเป็นวันเดิม', () => assert.equal(toKey(fromKey('2027-07-31')), '2027-07-31'));
test('MONTHS มี 9 เดือน', () => { assert.equal(MONTHS.length, 9); assert.equal(MONTHS[0], '2026-11'); assert.equal(MONTHS[8], '2027-07'); });
test('monthGrid เริ่มอาทิตย์และมี 42 วัน', () => {
  for (const [m, first, last] of [['2026-11','2026-11-01','2026-12-12'], ['2027-02','2027-01-31','2027-03-13'], ['2027-07','2027-06-27','2027-08-07']]) {
    const g = monthGrid(m); assert.equal(g.length, 42); assert.equal(g[0], first); assert.equal(g[41], last);
  }
});
test('inRange ตรงขอบ', () => {
  assert.equal(inRange('2026-11-07'), true); assert.equal(inRange('2027-07-31'), true);
  assert.equal(inRange('2026-11-06'), false); assert.equal(inRange('2027-08-01'), false);
});
test('clampMonth บีบเข้าช่วง', () => {
  assert.equal(clampMonth(new Date(2026, 5, 1)), '2026-11'); assert.equal(clampMonth(new Date(2027, 2, 15)), '2027-03'); assert.equal(clampMonth(new Date(2028, 0, 1)), '2027-07');
});
test('relativeDay', () => {
  assert.equal(relativeDay('2026-11-07', '2026-11-07'), 'วันนี้');
  assert.equal(relativeDay('2026-11-08', '2026-11-07'), 'พรุ่งนี้');
  assert.equal(relativeDay('2026-11-10', '2026-11-07'), 'อีก 3 วัน');
});
test('ข้อความไทยเป็น ค.ศ. ไม่มีคำว่า ค.ศ.', () => {
  assert.equal(formatMonth('2026-11'), 'พฤศจิกายน 2026');
  assert.equal(formatDay('2026-11-07'), 'วันเสาร์ที่ 7 พฤศจิกายน 2026');
});
```

- [ ] **Step 3: รันให้เห็นว่า fail**

Run: `npm test`
Expected: FAIL เพราะหา `src/dates.js` ไม่พบ

- [ ] **Step 4: เขียน `src/dates.js`**

ต้องสร้าง key จาก `getFullYear/getMonth/getDate` ห้ามใช้ `toISOString` และ `new Date('YYYY-MM-DD')` เพราะทั้งคู่อิง UTC `formatDay` ใช้ `Intl.DateTimeFormat('th-TH-u-ca-gregory', {dateStyle:'full'})` แล้วตัด `'ค.ศ. '` ออก

- [ ] **Step 5: รันให้ผ่าน**

Run: `npm test`
Expected: PASS ทุกข้อ

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore src/dates.js tests/unit/dates.test.js readme.md docs
git commit -m "feat: add project scaffold and date logic"
```

---

### Task 2: โมเดลข้อมูล

**Files:**
- Create: `src/model.js`
- Test: `tests/unit/model.test.js`

**Interfaces:**
- Consumes: `inRange`, `monthOf` จาก `dates.js`
- Produces (`src/model.js`):
  - `Item = {id, date, title, kind:'activity'|'duty', time:''|'HH:MM', note, done:boolean, createdAt:number}`
  - `validateItem(fields): {ok:true, value} | {ok:false, error:string}` ตัดช่องว่างหัวท้าย, title 1-120 ตัว, note ไม่เกิน 2000 ตัว, `date` อยู่ในช่วง, `time` เป็น `''` หรือ `HH:MM` และเติมค่าปริยาย (`id` จาก `crypto.randomUUID()`, `createdAt` จาก `Date.now()`, `done:false`)
  - `sortDay(items): Item[]` รายการที่มีเวลาขึ้นก่อนตามเวลา แล้วตามด้วยรายการไม่มีเวลา จากนั้นเรียงตาม `createdAt`
  - `monthStats(items, month): {total, done, percent}` นับเฉพาะ `kind:'duty'`
  - `nextUp(items, todayKey): Item|null` รายการแรกที่ยังไม่เสร็จและ `date >= todayKey`
  - `checkImageFile({name, type, size}): {ok:true, type} | {ok:false, error}`
  - `validateBackup(data): {ok:true} | {ok:false, error}`

- [ ] **Step 1: เขียน test ที่ fail**

```js
test('validateItem ตัดช่องว่างและปฏิเสธชื่อว่าง', () => {
  assert.equal(validateItem({ date:'2026-11-07', title:'  สอบ  ', kind:'duty' }).value.title, 'สอบ');
  assert.equal(validateItem({ date:'2026-11-07', title:'   ', kind:'duty' }).ok, false);
});
test('validateItem ปฏิเสธชื่อยาวเกิน วันนอกช่วง และ kind แปลก', () => {
  assert.equal(validateItem({ date:'2026-11-07', title:'ก'.repeat(121), kind:'duty' }).ok, false);
  assert.equal(validateItem({ date:'2027-08-01', title:'x', kind:'duty' }).ok, false);
  assert.equal(validateItem({ date:'2026-11-07', title:'x', kind:'party' }).ok, false);
});
test('sortDay: มีเวลาก่อน ไม่มีเวลาไว้ท้าย', () => {
  const r = sortDay([{id:'a',time:'',createdAt:1},{id:'b',time:'14:00',createdAt:2},{id:'c',time:'08:30',createdAt:3}]);
  assert.deepEqual(r.map(x => x.id), ['c','b','a']);
});
test('monthStats นับเฉพาะหน้าที่ในเดือนนั้น และไม่หารด้วยศูนย์', () => {
  const items = [{date:'2026-11-01',kind:'duty',done:true},{date:'2026-11-02',kind:'duty',done:false},{date:'2026-11-03',kind:'activity',done:false},{date:'2026-12-01',kind:'duty',done:true}];
  assert.deepEqual(monthStats(items,'2026-11'), {total:2,done:1,percent:50});
  assert.deepEqual(monthStats([], '2026-11'), {total:0,done:0,percent:0});
});
test('nextUp ข้ามรายการอดีตและที่เสร็จแล้ว', () => {
  const items = [{id:'old',date:'2026-11-01',done:false,time:'',createdAt:1},{id:'done',date:'2026-11-08',done:true,time:'',createdAt:2},{id:'next',date:'2026-11-09',done:false,time:'',createdAt:3}];
  assert.equal(nextUp(items,'2026-11-07').id,'next');
  assert.equal(nextUp([], '2026-11-07'), null);
});
test('checkImageFile', () => {
  assert.equal(checkImageFile({name:'a.png',type:'image/png',size:10}).ok, true);
  assert.equal(checkImageFile({name:'a.SVG',type:'',size:10}).type, 'image/svg+xml'); // Windows อาจส่ง type ว่าง
  assert.equal(checkImageFile({name:'a.gif',type:'image/gif',size:10}).ok, false);
  assert.equal(checkImageFile({name:'a.exe',type:'',size:10}).ok, false);
  assert.equal(checkImageFile({name:'a.jpg',type:'image/jpeg',size:10*1024*1024+1}).ok, false);
});
test('validateBackup ปฏิเสธไฟล์ผิดรูปแบบ', () => {
  for (const bad of [null, [], {app:'other',version:1,items:[],images:[]}, {app:'calendarforme',version:2,items:[],images:[]},
    {app:'calendarforme',version:1,items:[{id:'a',date:'bad',title:'x',kind:'duty'}],images:[]},
    {app:'calendarforme',version:1,items:[{date:'2026-11-07',title:'x',kind:'duty'}],images:[]},
    {app:'calendarforme',version:1,items:[],images:[{id:'i',date:'2026-11-07',name:'x',type:'image/gif',createdAt:1,dataUrl:'data:image/gif;base64,AA=='}]},
    {app:'calendarforme',version:1,items:[],images:[{id:'i',date:'2026-11-07',name:'x',type:'image/png',createdAt:1,dataUrl:'data:text/html;base64,AA=='}]}])
    assert.equal(validateBackup(bad).ok, false);
  assert.equal(validateBackup({app:'calendarforme',version:1,items:[],images:[]}).ok, true);
});
```

- [ ] **Step 2: รันให้เห็นว่า fail**

Run: `npm test`
Expected: FAIL เพราะหา `src/model.js` ไม่พบ

- [ ] **Step 3: เขียน `src/model.js`**

`validateBackup` ใช้ `validateItem` ซ้ำกับทุกรายการ ต้องมี `id` เป็น string และ `dataUrl` ของรูปต้องขึ้นต้นด้วย `data:<type>;base64,` ของ `type` นั้นๆ `checkImageFile` ใช้นามสกุลไฟล์เมื่อ `type` ว่าง ข้อความ error เป็นภาษาไทย

- [ ] **Step 4: รันให้ผ่าน**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/model.js tests/unit/model.test.js
git commit -m "feat: add item, image and backup validation"
```

---

### Task 3: Server, ที่เก็บข้อมูล และชุดทดสอบเบราว์เซอร์

**Files:**
- Create: `server.mjs`, `start.cmd`, `index.html`, `src/store.js`, `playwright.config.js`
- Test: `tests/e2e/foundation.spec.js`

**Interfaces:**
- Produces (`src/store.js`), ทุกฟังก์ชันคืน Promise และ reject เมื่อ IndexedDB ล้มเหลว:
  - `getAll(): {items: Item[], images: Image[]}`
  - `putItem(item)`, `deleteItem(id)`, `putImage(image)`, `deleteImage(id)`
  - `replaceAll({items, images})` ลบแล้วเขียนใหม่ใน transaction เดียวครอบทั้งสอง store
  - `Image = {id, date, name, type, blob, createdAt}`
  - ฐานข้อมูลชื่อ `calendarforme` version 1, stores `items` และ `images` ใช้ `keyPath:'id'`
- Produces: `index.html` มี `<main id="app">` และ `<p id="file-warning" hidden>`

- [ ] **Step 1: ติดตั้ง Playwright และตั้งค่า**

Run: `npm i -D @playwright/test`
สร้าง `playwright.config.js`: `testDir:'tests/e2e'`, `use:{baseURL:'http://127.0.0.1:4173', channel:'msedge', timezoneId:'Asia/Bangkok'}` (ใช้ Edge ในเครื่อง ไม่ต้องโหลดเบราว์เซอร์), `webServer:{command:'node server.mjs', url:'http://127.0.0.1:4173', reuseExistingServer:true}`

- [ ] **Step 2: เขียน test ที่ fail**

```js
test('เปิดผ่าน file:// แล้วเห็นคำเตือนภาษาไทย', async ({ page }) => {
  await page.goto(pathToFileURL(resolve('index.html')).href);
  await expect(page.locator('#file-warning')).toBeVisible();
  await expect(page.locator('#file-warning')).toContainText('start.cmd');
});
test('server กัน path traversal', async ({ request }) => {
  // ไต่ขึ้นเกินจำนวนชั้นจริง เพื่อให้ถึง C:\ เสมอ ไฟล์ปลายทางจึงมีอยู่จริงถ้าไม่มีตัวกัน
  for (const up of ['..%2f', '..%5c']) { const p = '/' + up.repeat(12) + 'Windows%2fwin.ini';
    expect((await request.get(p)).status()).not.toBe(200); }
});
test('server ส่ง JS ด้วย MIME ที่ถูกต้อง', async ({ request }) => {
  expect((await request.get('/src/dates.js')).headers()['content-type']).toContain('javascript');
});
test('store เก็บและลบรายการ/รูปได้จริง และอยู่ข้ามการรีโหลด', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => { const s = await import('/src/store.js');
    await s.putItem({ id:'a', date:'2026-11-07', title:'x', kind:'duty', time:'', note:'', done:false, createdAt:1 });
    await s.putImage({ id:'i', date:'2026-11-07', name:'p.png', type:'image/png', blob:new Blob(['x'],{type:'image/png'}), createdAt:1 }); });
  await page.reload();
  const n = await page.evaluate(async () => { const s = await import('/src/store.js'); const { items, images } = await s.getAll();
    return { items: items.length, blobSize: images[0].blob.size }; });
  expect(n).toEqual({ items: 1, blobSize: 1 });
});
test('replaceAll แบบ all-or-nothing', async ({ page }) => {
  await page.goto('/');
  const left = await page.evaluate(async () => { const s = await import('/src/store.js');
    await s.putItem({ id:'keep', date:'2026-11-07', title:'x', kind:'duty', time:'', note:'', done:false, createdAt:1 });
    await s.replaceAll({ items:[{ noId:true }], images:[] }).catch(() => {});
    return (await s.getAll()).items.map(i => i.id); });
  expect(left).toEqual(['keep']);
});
```

- [ ] **Step 3: รันให้เห็นว่า fail**

Run: `npm run e2e`
Expected: FAIL เพราะยังไม่มี `server.mjs`

- [ ] **Step 4: เขียน `server.mjs`, `start.cmd`, `index.html`, `src/store.js`**

- `server.mjs`: bind `127.0.0.1:4173`, map MIME ของ `.html .css .js .svg` เอง (Windows registry ทำ MIME ของ `.js` เพี้ยนได้), resolve path แล้วต้องอยู่ใต้โฟลเดอร์โปรเจกต์ ไม่งั้นตอบ 403, `/` ส่ง `index.html`, port ชนต้องแสดงข้อความไทยแล้วออก ห้ามสุ่ม port ใหม่
- `start.cmd`: `start "" cmd /c "timeout /t 1 >nul & start http://127.0.0.1:4173"` แล้วตามด้วย `node server.mjs` (เปิดเบราว์เซอร์หลัง server พร้อม 1 วินาที)
- `index.html`: `<script>` แบบ classic ตัวเล็กเปิด `#file-warning` เมื่อ `location.protocol === 'file:'` ข้อความ: `เปิดด้วยการดับเบิลคลิกไม่ได้ ให้เปิดผ่าน start.cmd แทน` และโหลด `<script type="module" src="src/app.js">` (สร้าง `src/app.js` ว่างไว้ก่อน)
- `store.js`: เปิด DB แบบ lazy ครั้งเดียว ห้าม `await` งานอื่นระหว่าง transaction เพราะ transaction จะปิดเอง และ `replaceAll` ต้อง `tx.abort()` เมื่อ `put` throw แบบ synchronous มิฉะนั้นการลบที่ทำไปแล้วจะ commit

- [ ] **Step 5: รันให้ผ่าน**

Run: `npm run e2e`
Expected: PASS 5 ข้อ

- [ ] **Step 6: Commit**

```bash
git add server.mjs start.cmd index.html src playwright.config.js package.json package-lock.json tests/e2e
git commit -m "feat: add local server, IndexedDB store and browser test setup"
```

---

### Task 4: หน้าปฏิทินและการออกแบบ

**Files:**
- Create: `src/calendar.js`, `styles.css`
- Modify: `src/app.js`, `index.html` (ลิงก์ CSS และฟอนต์)
- Test: `tests/e2e/calendar.spec.js`

**Interfaces:**
- Consumes: ทุกอย่างจาก `dates.js`, `sortDay` จาก `model.js`, `getAll` จาก `store.js`
- Produces:
  - `renderCalendar(root, state, handlers)` โดย `state = {month, today, items, images}` และ `handlers = {onMonth(month), onOpenDay(key)}` (Task 6-7 เพิ่ม handler อื่น)
  - `app.js`: `state`, `refresh()` (โหลดจาก store แล้ววาดใหม่), `render()` (วาดจาก state), `imageUrl(image): string` (cache object URL ตาม id)
  - สำหรับ test: เวลาทั้งหมดอ่านจาก `new Date()` จึงคุมได้ด้วย `page.clock`

เปิดแอป: `state.month = clampMonth(new Date())` และ `state.today = toKey(new Date())` โดย `visibilitychange` ต้องอัปเดต `today` แล้วเรียก `refresh()` จุดเดียวนี้แก้ทั้งเรื่องข้ามเที่ยงคืนและเรื่องแท็บอื่นแก้ข้อมูล

- [ ] **Step 1: เรียก skill `frontend-design`** โดยยึดทิศทางการออกแบบด้านบน

- [ ] **Step 2: เขียน test ที่ fail**

```js
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-11-07T10:00:00+07:00')); await page.goto('/'); });

test('เปิดมาเห็นเดือนปัจจุบันและวันนี้เด่น', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('พฤศจิกายน 2026');
  await expect(page.locator('[aria-current="date"]')).toHaveAttribute('aria-label', /วันเสาร์ที่ 7 พฤศจิกายน 2026/);
  await expect(page.locator('.day')).toHaveCount(42);
});
test('ไปได้ถึงขอบช่วงเท่านั้น', async ({ page }) => {
  await expect(page.getByRole('button', { name:'เดือนก่อนหน้า' })).toBeDisabled();
  for (let i = 0; i < 8; i++) await page.getByRole('button', { name:'เดือนถัดไป' }).click();
  await expect(page.locator('h1')).toHaveText('กรกฎาคม 2027');
  await expect(page.getByRole('button', { name:'เดือนถัดไป' })).toBeDisabled();
  await expect(page.locator('.day[data-date="2027-08-01"]')).toHaveAttribute('data-disabled', '');
});
test('แถบเดือนกระโดดได้และปุ่มวันนี้กลับมา', async ({ page }) => {
  await page.locator('[data-month="2027-03"]').click();
  await expect(page.locator('h1')).toHaveText('มีนาคม 2027');
  await page.getByRole('button', { name:'วันนี้' }).click();
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
});
test('หลังช่วงปฏิทินแล้ว เปิดเดือนสุดท้ายและปุ่มวันนี้กดไม่ได้', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2028-01-01T10:00:00+07:00'));
  await page.reload();
  await expect(page.locator('h1')).toHaveText('กรกฎาคม 2027');
  await expect(page.getByRole('button', { name:'วันนี้' })).toBeDisabled();
  await expect(page.locator('[aria-current="date"]')).toHaveCount(0);
});
test('จอ 375px ไม่มี scroll แนวนอน', async ({ page }) => {
  await page.setViewportSize({ width:375, height:812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
```

- [ ] **Step 3: รันให้เห็นว่า fail**

Run: `npx playwright test calendar`
Expected: FAIL เพราะยังไม่มี `h1`

- [ ] **Step 4: เขียน `src/calendar.js`, `src/app.js`, `styles.css`**

ใช้ roving tabindex บน `.day-open` เพื่อให้ Tab เข้า grid ครั้งเดียว และคง focus ไว้ที่วันเดียวกันหลังวาดใหม่ บนจอกว้างช่องวันแสดง chip สูงสุด 3 อันและ `+N` ส่วนจอแคบ (ต่ำกว่า 640px) ย่อ chip เป็นจุดสีตาม kind ด้วย CSS เท่านั้น (DOM เหมือนเดิมทุกขนาดจอ) คงหน้าที่ไว้ที่ `--duty` และกิจกรรมที่ `--activity` พร้อมป้ายกำกับเพื่อไม่ให้สื่อด้วยสีอย่างเดียว

- [ ] **Step 5: รันให้ผ่าน**

Run: `npx playwright test calendar`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/calendar.js src/app.js styles.css index.html tests/e2e/calendar.spec.js
git commit -m "feat: add month view with navigation and keyboard support"
```

---

### Task 5: เพิ่ม แก้ไข ลบรายการ

**Files:**
- Create: `src/day-panel.js`, `src/fx.js`
- Modify: `src/app.js`, `styles.css`
- Test: `tests/e2e/items.spec.js`

**Interfaces:**
- Consumes: `validateItem`, `sortDay`, `putItem`, `deleteItem`, `refresh()`, `formatDay`
- Produces:
  - `openDayPanel(key, ctx)` โดย `ctx = {state, refresh, imageUrl}`
  - `toast(message, {undo?: () => Promise<void>}): void` ปิดเองใน 5 วินาที แสดงทีละอัน อันใหม่แทนอันเก่า
  - `tests/e2e/helpers.js`: `addItem(page, date, title, kind='หน้าที่')` และ `openFrozen(page)` (ตั้งเวลาเป็น `2026-11-07T10:00:00+07:00` แล้ว `goto('/')`) โดย spec ของ Task 5-8 ใช้ `test.beforeEach(({ page }) => openFrozen(page))`
  - `saveOrWarn(promise): Promise<boolean>` ถ้า write ล้มเหลวให้ขึ้น toast `บันทึกไม่สำเร็จ พื้นที่อาจเต็ม` แล้วคืน `false`

- [ ] **Step 1: เขียน test ที่ fail**

`addItem` คลิกช่องวัน กรอกฟอร์ม กด `บันทึก` แล้วกด Escape

```js
test('เพิ่มหน้าที่แล้วเห็นบนปฏิทิน และอยู่หลังรีโหลด', async ({ page }) => {
  await addItem(page, '2026-11-10', 'ส่งรายงาน');
  await expect(page.locator('.day[data-date="2026-11-10"] .chip')).toContainText('ส่งรายงาน');
  await page.reload();
  await expect(page.locator('.day[data-date="2026-11-10"] .chip')).toHaveAttribute('data-kind', 'duty');
});
test('ชื่อว่างไม่บันทึกและบอกเหตุผล', async ({ page }) => {
  await page.locator('.day[data-date="2026-11-10"]').click();
  await page.getByRole('button', { name:'บันทึก' }).click();
  await expect(page.locator('#day-panel li[data-item-id]')).toHaveCount(0);
  await expect(page.getByLabel('ชื่อรายการ')).toBeFocused();
});
test('แก้ไขและย้ายวันผ่านช่องวันที่', async ({ page }) => {
  await addItem(page, '2026-11-10', 'เดิม');
  await page.locator('.day[data-date="2026-11-10"]').click();
  await page.getByRole('button', { name:'แก้ไข' }).click();
  await page.getByLabel('ชื่อรายการ').fill('ใหม่');
  await page.getByLabel('วันที่').fill('2026-11-12');
  await page.getByRole('button', { name:'บันทึก' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.day[data-date="2026-11-10"] .chip')).toHaveCount(0);
  await expect(page.locator('.day[data-date="2026-11-12"] .chip')).toContainText('ใหม่');
});
test('ช่องวันที่จำกัดอยู่ในช่วงปฏิทิน', async ({ page }) => {
  await page.locator('.day[data-date="2026-11-10"]').click();
  await expect(page.getByLabel('วันที่')).toHaveAttribute('min', '2026-11-07');
  await expect(page.getByLabel('วันที่')).toHaveAttribute('max', '2027-07-31');
});
test('ลบแล้วเลิกทำได้', async ({ page }) => {
  await addItem(page, '2026-11-10', 'ลบฉัน');
  await page.locator('.day[data-date="2026-11-10"]').click();
  await page.getByRole('button', { name:'ลบ', exact:true }).click();
  await expect(page.locator('#day-panel li[data-item-id]')).toHaveCount(0);
  await page.getByRole('button', { name:'เลิกทำ' }).click();
  await expect(page.locator('#day-panel li[data-item-id]')).toContainText('ลบฉัน');
});
test('ติ๊กหน้าที่แล้วสถานะอยู่หลังรีโหลด กิจกรรมไม่มี checkbox', async ({ page }) => {
  await addItem(page, '2026-11-10', 'งาน'); await addItem(page, '2026-11-10', 'เที่ยว', 'กิจกรรม');
  await page.locator('.day[data-date="2026-11-10"]').click();
  await expect(page.getByRole('checkbox', { name:'ทำเสร็จแล้ว' })).toHaveCount(1);
  await page.getByRole('checkbox', { name:'ทำเสร็จแล้ว' }).check();
  await page.reload();
  await page.locator('.day[data-date="2026-11-10"]').click();
  await expect(page.getByRole('checkbox', { name:'ทำเสร็จแล้ว' })).toBeChecked();
});
test('ชื่อที่มี HTML แสดงเป็นข้อความ', async ({ page }) => {
  const evil = '<img src=x onerror="window.hacked=1">';
  await addItem(page, '2026-11-10', evil);
  await expect(page.locator('.day[data-date="2026-11-10"] .chip')).toContainText(evil);
  expect(await page.evaluate(() => window.hacked)).toBeUndefined();
});
test('20 รายการชื่อยาวบนจอ 375px เลย์เอาต์ไม่พัง', async ({ page }) => {
  await page.setViewportSize({ width:375, height:812 });
  await page.evaluate(async () => { const s = await import('/src/store.js');
    for (let i = 0; i < 20; i++) await s.putItem({ id:`x${i}`, date:'2026-11-10', title:'ก'.repeat(120), kind:'duty', time:'', note:'', done:false, createdAt:i }); });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.setViewportSize({ width:1280, height:800 });
  await expect(page.locator('.day[data-date="2026-11-10"] .more')).toHaveText('+17');
});
test('ปิดแผงแล้ว focus กลับช่องวันเดิม', async ({ page }) => {
  await page.locator('.day[data-date="2026-11-10"] .day-open').focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('ชื่อรายการ').fill('งาน');
  await page.getByRole('button', { name:'บันทึก' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator(':focus')).toHaveAttribute('aria-label', /10 พฤศจิกายน 2026/);
});
test('เขียนไม่สำเร็จ: เตือนและไม่ทิ้งข้อความที่พิมพ์', async ({ page }) => {
  await page.evaluate(() => { IDBObjectStore.prototype.put = () => { throw new DOMException('full', 'QuotaExceededError'); }; });
  await page.locator('.day[data-date="2026-11-10"]').click();
  await page.getByLabel('ชื่อรายการ').fill('ห้ามหาย');
  await page.getByRole('button', { name:'บันทึก' }).click();
  await expect(page.getByRole('status')).toContainText('บันทึกไม่สำเร็จ');
  await expect(page.getByLabel('ชื่อรายการ')).toHaveValue('ห้ามหาย');
});
```

- [ ] **Step 2: รันให้เห็นว่า fail**

Run: `npx playwright test items`
Expected: FAIL เพราะไม่พบ `#day-panel`

- [ ] **Step 3: เขียน `src/day-panel.js`, `src/fx.js`**

ใช้ `<dialog>.showModal()` ซึ่งจัดการ focus trap และ Escape ให้แล้ว คลิกฉากหลังเพื่อปิดได้ ค่าปริยายของวันที่คือวันที่เปิด บันทึกสำเร็จแล้ว panel เปิดค้างและล้างฟอร์มเพื่อเพิ่มต่อได้ เขียนข้อความผู้ใช้ด้วย `textContent` เท่านั้น เมื่อแก้ item ที่ย้ายวันให้แถวหายจาก panel ของวันเดิม

**จุดพลาดง่าย:** ทุกอย่างนอก modal dialog จะ inert ถ้า toast อยู่ใน `body` ปุ่ม `เลิกทำ` จะกดไม่ได้ ดังนั้น `fx.js` ต้องแนบ toast (และ confetti ใน Task 7) ที่ `document.querySelector('dialog[open]') ?? document.body`

- [ ] **Step 4: รันให้ผ่าน**

Run: `npx playwright test items`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/day-panel.js src/fx.js src/app.js styles.css tests/e2e/items.spec.js
git commit -m "feat: add day panel to create, edit, complete and delete items"
```

---

### Task 6: รูปภาพ SVG / JPG / PNG

**Files:**
- Modify: `src/day-panel.js`, `src/calendar.js`, `src/app.js`, `styles.css`
- Test: `tests/e2e/images.spec.js`, `tests/e2e/fixtures/ok.png`, `ok.svg`, `evil.svg`, `fake.png`

**Interfaces:**
- Consumes: `checkImageFile`, `putImage`, `deleteImage`, `imageUrl`, `toast`, `saveOrWarn`
- Produces:
  - `addImages(files: File[], dateKey, ctx): Promise<void>` อยู่ใน `day-panel.js` ทุกทางเข้าใช้ฟังก์ชันนี้
  - `handlers.onDropFiles(key, files)` และ `handlers.imageUrl(image)` เพิ่มใน `renderCalendar`

- [ ] **Step 1: สร้าง fixtures และเขียน test ที่ fail**

`evil.svg` มี `<script>document.title='hacked'</script>` และ `onload="document.title='hacked'"`, `fake.png` เป็นไฟล์ข้อความ `not an image`, `ok.png` เป็น PNG 1x1 จริง

```js
const panel = (page) => page.locator('#day-panel');
test('เพิ่ม PNG แล้วเห็นในแผงและบนช่องวัน อยู่หลังรีโหลด', async ({ page }) => {
  await page.locator('.day[data-date="2026-11-10"]').click();
  await page.getByLabel('เพิ่มรูป').setInputFiles('tests/e2e/fixtures/ok.png');
  await expect(panel(page).locator('figure[data-image-id] img')).toHaveCount(1);
  await page.reload();
  const img = page.locator('.day[data-date="2026-11-10"] img');
  await expect(img).toHaveCount(1);
  expect(await img.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
});
test('SVG ที่ฝังสคริปต์แสดงได้แต่สคริปต์ไม่รัน', async ({ page }) => {
  const title = await page.title();
  await page.locator('.day[data-date="2026-11-10"]').click();
  await page.getByLabel('เพิ่มรูป').setInputFiles('tests/e2e/fixtures/evil.svg');
  await expect(panel(page).locator('figure[data-image-id] img')).toHaveCount(1);
  expect(await page.title()).toBe(title);
});
test('.png ปลอมถูกปฏิเสธและไม่ถูกบันทึก', async ({ page }) => {
  await page.locator('.day[data-date="2026-11-10"]').click();
  await page.getByLabel('เพิ่มรูป').setInputFiles('tests/e2e/fixtures/fake.png');
  await expect(page.getByRole('status')).toContainText('ไม่ใช่ไฟล์รูป');
  await expect(panel(page).locator('figure[data-image-id]')).toHaveCount(0);
});
test('ลากไฟล์มาวางบนช่องวันได้', async ({ page }) => {
  const dt = await page.evaluateHandle(() => { const d = new DataTransfer();
    d.items.add(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>'], 's.svg', { type:'image/svg+xml' })); return d; });
  await page.locator('.day[data-date="2026-11-12"]').dispatchEvent('drop', { dataTransfer: dt });
  await expect(page.locator('.day[data-date="2026-11-12"] img')).toHaveCount(1);
});
test('ลบรูปแล้วเลิกทำได้', async ({ page }) => {
  await page.locator('.day[data-date="2026-11-10"]').click();
  await page.getByLabel('เพิ่มรูป').setInputFiles('tests/e2e/fixtures/ok.svg');
  await page.getByRole('button', { name:'ลบรูป' }).click();
  await expect(panel(page).locator('figure[data-image-id]')).toHaveCount(0);
  await page.getByRole('button', { name:'เลิกทำ' }).click();
  await expect(panel(page).locator('figure[data-image-id]')).toHaveCount(1);
});
```

- [ ] **Step 2: รันให้เห็นว่า fail**

Run: `npx playwright test images`
Expected: FAIL เพราะไม่พบป้าย `เพิ่มรูป`

- [ ] **Step 3: เขียนโค้ดรูปภาพ**

`addImages` ทำตามลำดับ: `checkImageFile` -> โหลดเข้า `new Image()` แล้ว `await img.decode()` (ไม่ผ่านขึ้น toast `ไม่ใช่ไฟล์รูป`) -> `saveOrWarn(putImage(...))` ช่องวันใช้รูปแรกเป็นพื้นหลังบางๆ โดยข้อความยังอ่านออก ใส่ `object-fit: contain` กับ SVG และ `cover` กับรูปถ่าย รองรับการวางไฟล์บน panel และ paste ใน panel ด้วย รีเซ็ตค่า file input หลังใช้งานเพื่อให้เลือกไฟล์เดิมซ้ำได้ รูปผูกกับวัน ไม่ผูกกับรายการ `imageUrl` ต้อง revoke เมื่อรูปถูกลบถาวร เขียน comment: `shortcut: thumbnail ใช้รูปเต็ม ถ้าเดือนที่มีรูปเยอะแล้วกระตุกค่อยย่อรูปตอนเก็บ`

- [ ] **Step 4: รันให้ผ่าน**

Run: `npx playwright test images`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src tests/e2e/images.spec.js tests/e2e/fixtures styles.css
git commit -m "feat: add svg, jpg and png images to days"
```

---

### Task 7: วิดเจ็ต แอนิเมชัน และลากวาง

**Files:**
- Create: `src/widgets.js`
- Modify: `src/fx.js`, `src/calendar.js`, `src/app.js`, `src/day-panel.js`, `styles.css`
- Test: `tests/e2e/delight.spec.js`

**Interfaces:**
- Consumes: `monthStats`, `nextUp`, `relativeDay`, `toast`
- Produces:
  - `renderWidgets(root, state, handlers)` สร้าง `#progress-ring` (SVG `role="img"`, `aria-label="ทำเสร็จ N จาก M"`) และ `#next-up`
  - `celebrate(x, y): void` confetti แบบ CSS (`.confetti`) ลบตัวเองเมื่อ `animationend` และไม่ทำงานเมื่อ reduced motion
  - `swapMonth(fn, direction): void` ใช้ `document.startViewTransition?.(fn) ?? fn()`
  - `handlers.onMoveItem(id, key)` เพิ่มใน `renderCalendar`

ลูกเล่นที่ต้องมี: วงแหวนความคืบหน้าวิ่งเมื่อเปลี่ยนค่า, การ์ดรายการถัดไปพร้อม `relativeDay` (คลิกแล้วไปวันนั้น), แถบเดือนมีเส้นความคืบหน้าของแต่ละเดือน, สลับเดือนแบบเลื่อนตามทิศทาง, panel สไลด์เข้า, chip เด้งเมื่อเพิ่มใหม่, confetti เมื่อติ๊กหน้าที่, ลาก chip ข้ามวัน

- [ ] **Step 1: เขียน test ที่ fail**

```js
test('วงแหวนและรายการถัดไปอัปเดตตามข้อมูล', async ({ page }) => {
  await expect(page.locator('#next-up')).toContainText('ยังไม่มีรายการที่จะถึง');
  await addItem(page, '2026-11-10', 'สอบ');
  await expect(page.locator('#next-up')).toContainText('สอบ');
  await expect(page.locator('#next-up')).toContainText('อีก 3 วัน');
  await expect(page.locator('#progress-ring')).toHaveAttribute('aria-label', 'ทำเสร็จ 0 จาก 1');
  await page.locator('.day[data-date="2026-11-10"]').click();
  await page.getByRole('checkbox', { name:'ทำเสร็จแล้ว' }).check();
  await page.keyboard.press('Escape');
  await expect(page.locator('#progress-ring')).toHaveAttribute('aria-label', 'ทำเสร็จ 1 จาก 1');
  await expect(page.locator('#next-up')).toContainText('ยังไม่มีรายการที่จะถึง');
});
test('ลาก chip ไปวันอื่นแล้วย้ายจริง', async ({ page }) => {
  await addItem(page, '2026-11-10', 'ย้ายฉัน');
  await page.locator('.day[data-date="2026-11-10"] .chip').dragTo(page.locator('.day[data-date="2026-11-18"]'));
  await expect(page.locator('.day[data-date="2026-11-18"] .chip')).toContainText('ย้ายฉัน');
  await page.reload();
  await expect(page.locator('.day[data-date="2026-11-18"] .chip')).toContainText('ย้ายฉัน');
});
test('วางบนช่องนอกช่วงปฏิทินไม่ย้าย', async ({ page }) => {
  await page.locator('[data-month="2027-07"]').click();
  await addItem(page, '2027-07-30', 'อยู่นี่');
  await page.locator('.day[data-date="2027-07-30"] .chip').dragTo(page.locator('.day[data-date="2027-08-02"]'));
  await expect(page.locator('.day[data-date="2027-07-30"] .chip')).toContainText('อยู่นี่');
});
test('confetti ขึ้นเมื่อติ๊ก และไม่ขึ้นเมื่อผู้ใช้ลดการเคลื่อนไหว', async ({ page }) => {
  await addItem(page, '2026-11-10', 'งาน');
  await page.locator('.day[data-date="2026-11-10"]').click();
  await page.getByRole('checkbox', { name:'ทำเสร็จแล้ว' }).check();
  await expect(page.locator('.confetti').first()).toBeAttached();
  await page.getByRole('checkbox', { name:'ทำเสร็จแล้ว' }).uncheck();
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.locator('.confetti').first().waitFor({ state:'detached' });
  await page.getByRole('checkbox', { name:'ทำเสร็จแล้ว' }).check();
  await expect(page.locator('.confetti')).toHaveCount(0);
});
test('สลับเดือนได้ในเบราว์เซอร์ที่ไม่มี View Transitions', async ({ page }) => {
  await page.evaluate(() => { document.startViewTransition = undefined; });
  await page.getByRole('button', { name:'เดือนถัดไป' }).click();
  await expect(page.locator('h1')).toHaveText('ธันวาคม 2026');
});
```

- [ ] **Step 2: รันให้เห็นว่า fail**

Run: `npx playwright test delight`
Expected: FAIL เพราะไม่พบ `#next-up`

- [ ] **Step 3: เขียน `src/widgets.js` และแอนิเมชัน**

เรียก `renderWidgets` จาก `render()` ของ `app.js` แอนิเมชันเป็น CSS ทั้งหมด ยกเว้นการสร้างชิ้น confetti ใช้ `transform` และ `opacity` เท่านั้น ใส่ `html::view-transition { pointer-events:none }` เพื่อให้กดเปลี่ยนเดือนรัวๆ ได้ และใส่ `@media (prefers-reduced-motion: reduce)` ปิดแอนิเมชันและ `::view-transition-*` ทั้งหมด ลาก chip ใช้ HTML5 drag events เท่านั้น บนมือถือย้ายวันผ่านช่อง `วันที่` ในฟอร์มแก้ไข

- [ ] **Step 4: รันทุก test ให้ผ่าน**

Run: `npm test; npm run e2e`
Expected: PASS ทั้งหมด

- [ ] **Step 5: Commit**

```bash
git add src styles.css tests/e2e
git commit -m "feat: add progress ring, next-up card, animations and drag to move"
```

---

### Task 8: สำรองและนำเข้าข้อมูล พร้อมตรวจรับรวม

ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์เดียว การล้างข้อมูลเบราว์เซอร์จะทำให้ข้อมูลหาย task นี้จึงเป็นทางรอดเดียวของผู้ใช้

**Files:**
- Create: `src/backup.js`
- Modify: `src/app.js`, `index.html` (ปุ่มในส่วนท้ายหน้า), `styles.css`
- Test: `tests/e2e/backup.spec.js`

**Interfaces:**
- Consumes: `getAll`, `replaceAll`, `validateBackup`, `toast`
- Produces:
  - `exportBackup(): Promise<void>` ดาวน์โหลด `calendarforme-backup-YYYY-MM-DD.json` รูปแบบ `{app:'calendarforme', version:1, exportedAt, items, images:[{id,date,name,type,createdAt,dataUrl}]}`
  - `importBackup(file: File): Promise<boolean>` คืน `true` เมื่อแทนที่ข้อมูลแล้ว จากนั้น `app.js` เรียก `refresh()` ส่วนกรณีผิดพลาดขึ้น toast `ไฟล์สำรองไม่ถูกต้อง`

- [ ] **Step 1: เขียน test ที่ fail**

```js
test('ส่งออกแล้วนำเข้ากลับ รายการและรูปกลับมาครบ', async ({ page }, info) => {
  await addItem(page, '2026-11-10', 'เก็บไว้');
  await page.locator('.day[data-date="2026-11-10"]').click();
  await page.getByLabel('เพิ่มรูป').setInputFiles('tests/e2e/fixtures/ok.png');
  await page.keyboard.press('Escape');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name:'สำรองข้อมูล' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^calendarforme-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = info.outputPath('b.json'); await dl.saveAs(path);
  await page.evaluate(async () => (await import('/src/store.js')).replaceAll({ items:[], images:[] }));
  await page.reload();
  page.on('dialog', d => d.accept());
  await page.getByLabel('นำเข้าข้อมูล').setInputFiles(path);
  await expect(page.locator('.day[data-date="2026-11-10"] .chip')).toContainText('เก็บไว้');
  const img = page.locator('.day[data-date="2026-11-10"] img');
  await expect(img).toHaveCount(1);
  await expect.poll(() => img.evaluate(i => i.naturalWidth)).toBeGreaterThan(0);
});
test('ไฟล์เสีย ข้อมูลเดิมอยู่ครบ', async ({ page }) => {
  await addItem(page, '2026-11-10', 'ห้ามหาย');
  page.on('dialog', d => d.accept());
  for (const body of ['{not json', '{"app":"other"}']) {
    await page.getByLabel('นำเข้าข้อมูล').setInputFiles({ name:'b.json', mimeType:'application/json', buffer:Buffer.from(body) });
    await expect(page.getByRole('status')).toContainText('ไฟล์สำรองไม่ถูกต้อง');
  }
  await page.reload();
  await expect(page.locator('.day[data-date="2026-11-10"] .chip')).toContainText('ห้ามหาย');
});
test('กดยกเลิกที่หน้ายืนยัน ข้อมูลเดิมอยู่ครบ', async ({ page }) => {
  await addItem(page, '2026-11-10', 'ห้ามหาย');
  page.on('dialog', d => d.dismiss());
  const body = JSON.stringify({ app:'calendarforme', version:1, items:[], images:[] });
  await page.getByLabel('นำเข้าข้อมูล').setInputFiles({ name:'b.json', mimeType:'application/json', buffer:Buffer.from(body) });
  await page.reload();
  await expect(page.locator('.day[data-date="2026-11-10"] .chip')).toContainText('ห้ามหาย');
});
```

- [ ] **Step 2: รันให้เห็นว่า fail**

Run: `npx playwright test backup`
Expected: FAIL เพราะไม่พบปุ่ม `สำรองข้อมูล`

- [ ] **Step 3: เขียน `src/backup.js`**

ลำดับของ `importBackup`: parse JSON -> `validateBackup` -> `confirm('แทนที่ข้อมูลปัจจุบันทั้งหมดด้วย N รายการ และ M รูป?')` -> แปลง `dataUrl` เป็น Blob ด้วย `fetch(url).then(r => r.blob())` ให้ครบทุกรูป **ก่อน** เรียก `replaceAll` ส่วน `exportBackup` แปลง Blob ด้วย `FileReader.readAsDataURL` เรียก `navigator.storage?.persist?.()` ตอนเปิดแอปใน `app.js` เพื่อลดโอกาสที่เบราว์เซอร์ลบข้อมูลเอง เขียน comment: `shortcut: backup รวมเป็นสตริงเดียว ถ้ารูปรวมเกินหลายร้อย MB ค่อยเปลี่ยนเป็น zip`

- [ ] **Step 4: รันทุก test ให้ผ่าน**

Run: `npm test; npm run e2e`
Expected: PASS ทั้งหมด

- [ ] **Step 5: ตรวจด้วยตาในแอปจริง**

เปิดด้วย `start.cmd` แล้วตรวจที่กว้าง 1280px และ 375px ทั้งโหมดสว่างและมืด: เห็นเดือน วันนี้ และรายการถัดไปภายในพริบตาเดียวหรือไม่, ตัวอักษรไทยมีสระและวรรณยุกต์ไม่ถูกตัด (`line-height` ของ chip), แอนิเมชันสลับเดือนลื่น แก้สิ่งที่เจอแล้วรัน test อีกรอบ

- [ ] **Step 6: Commit**

```bash
git add src index.html styles.css tests/e2e/backup.spec.js
git commit -m "feat: add backup export and import"
```
