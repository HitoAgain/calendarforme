import { toKey } from './dates.js';
import { validateBackup } from './model.js';
import { getAll, replaceAll } from './store.js';
import { toast } from './fx.js';

export const toDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

export async function exportBackup() {
  const { items, images } = await getAll();
  // shortcut: the backup is one big string, move to zip if images ever reach several hundred MB.
  const data = {
    app: 'calendarforme', version: 1, exportedAt: new Date().toISOString(), items,
    images: await Promise.all(images.map(async ({ blob, ...rest }) => ({ ...rest, dataUrl: await toDataUrl(blob) }))),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `calendarforme-backup-${toKey(new Date())}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast(`สำรองแล้ว ${items.length} รายการ ${images.length} รูป`);
}

// Returns true only when the current data was actually replaced.
export async function importBackup(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    toast('ไฟล์สำรองไม่ถูกต้อง ข้อมูลเดิมยังอยู่ครบ');
    return false;
  }
  if (!validateBackup(data).ok) {
    toast('ไฟล์สำรองไม่ถูกต้อง ข้อมูลเดิมยังอยู่ครบ');
    return false;
  }
  if (!confirm(`แทนที่ข้อมูลปัจจุบันทั้งหมดด้วย ${data.items.length} รายการ และ ${data.images.length} รูป?`)) return false;
  try {
    // Convert before opening the transaction: awaiting inside it would auto-commit the clear.
    const images = await Promise.all(data.images.map(async ({ dataUrl, ...rest }) => ({ ...rest, blob: await (await fetch(dataUrl)).blob() })));
    await replaceAll({ items: data.items, images });
  } catch (err) {
    console.error(err);
    toast('นำเข้าไม่สำเร็จ ข้อมูลเดิมยังอยู่ครบ');
    return false;
  }
  toast(`นำเข้าแล้ว ${data.items.length} รายการ ${data.images.length} รูป`);
  return true;
}
