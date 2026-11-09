let dbPromise;

function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('calendarforme', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('items', { keyPath: 'id' });
      req.result.createObjectStore('images', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

// Runs fn inside one transaction; a synchronous throw aborts it so earlier writes in the same tx roll back.
async function tx(mode, fn) {
  const conn = await db();
  return new Promise((resolve, reject) => {
    const t = conn.transaction(['items', 'images'], mode);
    let result;
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error ?? new DOMException('ยกเลิกการเขียนข้อมูล', 'AbortError'));
    try {
      result = fn(t);
    } catch (err) {
      t.onabort = () => reject(err);
      t.abort();
    }
  });
}

const write = (store, method, arg) => tx('readwrite', (t) => { t.objectStore(store)[method](arg); });

export async function getAll() {
  const out = {};
  await tx('readonly', (t) => {
    for (const store of ['items', 'images']) t.objectStore(store).getAll().onsuccess = (e) => { out[store] = e.target.result; };
  });
  return out;
}

export const putItem = (item) => write('items', 'put', item);
// Several items in one transaction: all land or none do.
export const putItems = (items) => tx('readwrite', (t) => { items.forEach((i) => t.objectStore('items').put(i)); });
export const deleteItems = (ids) => tx('readwrite', (t) => { ids.forEach((id) => t.objectStore('items').delete(id)); });
export const deleteItem = (id) => write('items', 'delete', id);
export const putImage = (image) => write('images', 'put', image);
export const deleteImage = (id) => write('images', 'delete', id);

export function replaceAll({ items, images }) {
  return tx('readwrite', (t) => {
    const itemStore = t.objectStore('items');
    const imageStore = t.objectStore('images');
    itemStore.clear();
    imageStore.clear();
    items.forEach((i) => itemStore.put(i));
    images.forEach((i) => imageStore.put(i));
  });
}
