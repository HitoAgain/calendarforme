export async function openFrozen(page) {
  await page.clock.setFixedTime(new Date('2026-11-07T10:00:00+07:00'));
  await page.goto('/');
}

export const cell = (page, date) => page.locator(`.day[data-date="${date}"]`);
export const form = (page) => page.locator('#item-form');

// Clicking a day selects it; clicking the already selected day opens the form instead.
export async function openForm(page, date) {
  await cell(page, date).click();
  if (!(await form(page).evaluate((d) => d.open))) await page.getByRole('button', { name: 'เพิ่มรายการ' }).click();
}

export async function addItem(page, date, title, kind = 'หน้าที่') {
  await openForm(page, date);
  await page.getByLabel('ชื่อรายการ').fill(title);
  await page.getByRole('radio', { name: kind }).check();
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await form(page).waitFor({ state: 'hidden' });
}
