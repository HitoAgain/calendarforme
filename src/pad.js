import { FIRST_DAY, LAST_DAY, formatDay, formatMonth, formatWeekday, fromKey, monthOf, relativeDay, repeatDates } from './dates.js';
import { h, icon } from './dom.js';
import { checkImageFile, monthStats, nextUp, sortDay, validateItem } from './model.js';
import { celebrate, saveOrWarn, toast } from './fx.js';
import { deleteImage, deleteItem, putImage, putItem, deleteItems, putItems } from './store.js';

const TEAR_DISTANCE = 110;

export async function addImages(files, date, ctx) {
  for (const file of files) {
    const check = checkImageFile(file);
    if (!check.ok) { toast(check.error); continue; }
    const blob = new Blob([file], { type: check.type });
    const url = URL.createObjectURL(blob);
    try {
      const probe = new Image();
      probe.src = url;
      await probe.decode();
    } catch {
      toast(`${file.name}: ไม่ใช่ไฟล์รูปที่เปิดได้`);
      continue;
    } finally {
      URL.revokeObjectURL(url);
    }
    await saveOrWarn(putImage({ id: crypto.randomUUID(), date, name: file.name, type: check.type, blob, createdAt: Date.now() }));
  }
  await ctx.refresh();
}

export function openItemForm(ctx, { date, item }) {
  const dialog = document.getElementById('item-form');
  const id = item?.id ?? crypto.randomUUID();
  const createdAt = item?.createdAt ?? Date.now();
  const error = h('p', { class: 'form-error', id: 'f-error', role: 'alert' });
  const title = h('input', { name: 'title', id: 'f-title', maxLength: 120, value: item?.title ?? '', autocomplete: 'off', 'aria-describedby': 'f-error' });
  const kind = item?.kind ?? 'duty';
  const radio = (value, label) => h('label', { class: 'radio', 'data-kind': value },
    h('input', { type: 'radio', name: 'kind', value, checked: kind === value }), h('i', { class: 'mark' }), label);
  const repeatField = h('select', { id: 'f-repeat', name: 'repeat' },
    h('option', { value: 'none' }, 'ไม่ทำซ้ำ'), h('option', { value: 'daily' }, 'ทุกวัน'),
    h('option', { value: 'weekly' }, 'ทุกสัปดาห์'), h('option', { value: 'monthly' }, 'ทุกเดือน'));
  const untilField = h('input', { id: 'f-until', name: 'until', type: 'date', min: FIRST_DAY, max: LAST_DAY, value: LAST_DAY, disabled: true });
  const count = h('p', { class: 'repeat-count', id: 'f-repeat-count', 'aria-live': 'polite' });
  const showCount = (text, isError = false) => { count.textContent = text; count.classList.toggle('form-error', isError); };
  const updateCount = () => {
    const freq = repeatField.value;
    untilField.disabled = freq === 'none';
    const n = repeatDates(form.elements.date.value, freq, untilField.value).length;
    showCount(freq === 'none' ? '' : n ? `จะเพิ่มอีก ${n} วัน` : 'ไม่มีวันให้ทำซ้ำในช่วงนี้');
  };
  const form = h('form', {
    method: 'dialog',
    oninput: updateCount,
    onchange: updateCount,
    noValidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.currentTarget));
      // Fixed id per open form: a double submit rewrites the same record instead of adding a copy.
      const result = validateItem({ ...item, id, createdAt, ...data, ...(data.kind === 'activity' && { done: false }) });
      if (!result.ok) {
        error.textContent = result.error;
        title.setAttribute('aria-invalid', 'true');
        title.focus();
        return;
      }
      const dates = repeatDates(result.value.date, data.repeat, data.until);
      if (data.repeat !== 'none' && !dates.length) {
        showCount('ไม่มีวันให้ทำซ้ำในช่วงนี้ เลือกวันทำซ้ำถึงให้ไกลกว่านี้', true);
        untilField.focus();
        return;
      }
      // Copy ids derive from the original's id, so a double submit rewrites them instead of doubling them.
      const copies = dates.map((d, n) => ({ ...result.value, id: `${id}~${d}`, date: d, done: false, createdAt: createdAt + n + 1 }));
      if (!(await saveOrWarn(putItems([result.value, ...copies])))) return;
      ctx.state.justAdded = item ? null : result.value.id;
      dialog.close();
      await ctx.refresh();
      ctx.focusDay();
      if (copies.length) {
        toast(`ทำซ้ำ "${result.value.title}" เพิ่มอีก ${copies.length} วันแล้ว`, {
          undo: async () => { await saveOrWarn(deleteItems(copies.map((c) => c.id))); await ctx.refresh(); },
        });
      }
    },
  },
  h('h2', {}, item ? 'แก้ไขรายการ' : 'เพิ่มรายการ'),
  h('label', { class: 'field', htmlFor: 'f-title' }, 'ชื่อรายการ'), title, error,
  h('fieldset', { class: 'kinds' }, h('legend', {}, 'ประเภท'), radio('duty', 'หน้าที่'), radio('activity', 'กิจกรรม')),
  h('div', { class: 'row' },
    h('div', {}, h('label', { class: 'field', htmlFor: 'f-date' }, 'วันที่'),
      h('input', { id: 'f-date', name: 'date', type: 'date', min: FIRST_DAY, max: LAST_DAY, value: date })),
    h('div', {}, h('label', { class: 'field', htmlFor: 'f-time' }, 'เวลา'),
      h('input', { id: 'f-time', name: 'time', type: 'time', value: item?.time ?? '' }))),
  h('div', { class: 'row' },
    h('div', {}, h('label', { class: 'field', htmlFor: 'f-repeat' }, 'ทำซ้ำ'), repeatField),
    h('div', {}, h('label', { class: 'field', htmlFor: 'f-until' }, 'ทำซ้ำถึง'), untilField)),
  count,
  h('label', { class: 'field', htmlFor: 'f-note' }, 'รายละเอียด'),
  h('textarea', { id: 'f-note', name: 'note', rows: 3, maxLength: 2000, value: item?.note ?? '' }),
  h('div', { class: 'form-actions' },
    h('button', { class: 'btn', type: 'button', onclick: () => dialog.close() }, 'ยกเลิก'),
    h('button', { class: 'btn primary', type: 'submit' }, 'บันทึก')));
  dialog.replaceChildren(form);
  dialog.showModal();
  title.focus();
}

function itemRow(item, ctx) {
  const toggle = async (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const done = e.currentTarget.checked;
    if (!(await saveOrWarn(putItem({ ...item, done })))) { await ctx.refresh(); return; }
    if (done) celebrate(box.left + box.width / 2, box.top + box.height / 2);
    await ctx.refresh();
  };
  const remove = async () => {
    if (!(await saveOrWarn(deleteItem(item.id)))) return;
    await ctx.refresh();
    toast(`ลบ "${item.title}" แล้ว`, { undo: async () => { await saveOrWarn(putItem(item)); await ctx.refresh(); } });
  };
  return h('li', { 'data-item-id': item.id, 'data-kind': item.kind, class: item.done ? 'done' : '' },
    item.kind === 'duty'
      ? h('input', { type: 'checkbox', checked: item.done, 'aria-label': 'ทำเสร็จแล้ว', title: 'ทำเสร็จแล้ว', 'data-fk': `check:${item.id}`, onchange: toggle })
      : h('i', { class: 'mark' }),
    h('div', { class: 'item-text' },
      h('span', { class: 'item-title' }, item.time && h('b', {}, `${item.time} `), item.title),
      item.note && h('span', { class: 'item-note' }, item.note)),
    h('span', { class: 'item-actions' },
      h('button', { class: 'mini', type: 'button', 'aria-label': 'แก้ไข', title: 'แก้ไข', 'data-fk': `edit:${item.id}`, onclick: () => openItemForm(ctx, { date: item.date, item }) }, icon('edit')),
      h('button', { class: 'mini', type: 'button', 'aria-label': 'ลบ', title: 'ลบ', 'data-fk': `del:${item.id}`, onclick: remove }, icon('close'))));
}

function imageFigure(image, ctx) {
  const remove = async () => {
    if (!(await saveOrWarn(deleteImage(image.id)))) return;
    ctx.forgetImage(image.id);
    await ctx.refresh();
    toast(`ลบรูป ${image.name} แล้ว`, { undo: async () => { await saveOrWarn(putImage(image)); await ctx.refresh(); } });
  };
  const view = () => {
    const box = document.getElementById('lightbox');
    box.replaceChildren(h('img', { src: ctx.imageUrl(image), alt: image.name }), h('p', {}, image.name));
    box.showModal();
  };
  return h('figure', { 'data-image-id': image.id },
    h('button', { class: 'thumb-open', type: 'button', 'aria-label': `ดูรูป ${image.name}`, 'data-fk': `view:${image.id}`, onclick: view },
      h('img', { class: image.type === 'image/svg+xml' ? 'contain' : '', src: ctx.imageUrl(image), alt: '', decoding: 'sync' })),
    h('button', { class: 'mini on-image', type: 'button', 'aria-label': 'ลบรูป', title: 'ลบรูป', 'data-fk': `delimg:${image.id}`, onclick: remove }, icon('close')));
}

function dragToTear(head, page, ctx) {
  head.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    const startY = e.clientY;
    let dy = 0;
    head.setPointerCapture(e.pointerId);
    page.style.transition = 'none';
    const move = (ev) => {
      dy = Math.max(0, ev.clientY - startY);
      page.style.transform = `translateY(${dy}px) rotate(${Math.min(dy / 40, 5)}deg)`;
    };
    const up = () => {
      head.removeEventListener('pointermove', move);
      head.removeEventListener('pointerup', up);
      head.removeEventListener('pointercancel', up);
      page.style.transition = '';
      page.style.transform = '';
      if (dy >= TEAR_DISTANCE) ctx.tearNext(dy);
    };
    head.addEventListener('pointermove', move);
    head.addEventListener('pointerup', up);
    head.addEventListener('pointercancel', up);
  });
}

export function renderPad(root, ctx) {
  const { state } = ctx;
  const key = state.selected;
  const items = sortDay(state.items.filter((i) => i.date === key));
  const images = state.images.filter((i) => i.date === key);
  const stats = monthStats(state.items, state.month);
  const upcoming = nextUp(state.items, state.today);
  const isLast = key === LAST_DAY;

  const head = h('div', { class: 'page-head', title: 'ลากลงเพื่อฉีก' },
    h('p', { class: 'weekday' }, formatWeekday(key), key === state.today && h('span', { class: 'today-tag' }, ' · วันนี้')),
    h('p', { class: 'numeral' }, String(fromKey(key).getDate())),
    h('p', { class: 'monthline' }, formatMonth(monthOf(key))),
    h('h2', { class: 'sr-only' }, formatDay(key)),
    h('button', { class: 'tear', type: 'button', 'data-fk': 'tear', disabled: isLast, onclick: () => ctx.tearNext() }, icon('down'), 'ฉีกหน้านี้'));

  const page = h('div', {
    class: 'page',
    ondragover: (e) => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); },
    ondrop: (e) => { if (e.dataTransfer.files.length) { e.preventDefault(); addImages([...e.dataTransfer.files], key, ctx); } },
  },
  head,
  h('div', { class: 'page-body' },
    items.length
      ? h('ul', { class: 'items' }, items.map((i) => itemRow(i, ctx)))
      : h('p', { class: 'empty' }, 'ยังไม่มีรายการ'),
    h('button', { class: 'add-row', type: 'button', 'data-fk': 'addrow', onclick: () => openItemForm(ctx, { date: key }) }, icon('plus'), 'เขียนลงหน้านี้'),
    h('div', { class: 'gallery' },
      images.map((i) => imageFigure(i, ctx)),
      h('label', { class: 'add-image' }, icon('plus'), 'เพิ่มรูป',
        h('input', {
          class: 'sr-only', type: 'file', accept: '.svg,.jpg,.jpeg,.png,image/svg+xml,image/jpeg,image/png', multiple: true,
          onchange: async (e) => { const files = [...e.target.files]; e.target.value = ''; await addImages(files, key, ctx); },
        })))));
  dragToTear(head, page, ctx);

  root.replaceChildren(
    h('div', { class: 'binding', 'aria-hidden': 'true' }),
    page,
    h('div', { class: 'stack', 'aria-hidden': 'true', style: `--left:${ctx.remainingRatio()}` }),
    h('div', { class: 'pad-foot' },
      h('div', { id: 'next-up' }, upcoming
        ? h('button', { type: 'button', 'data-fk': 'nextup', onclick: () => ctx.select(upcoming.date) },
          h('span', { class: 'what' }, `${upcoming.time ? `${upcoming.time} ` : ''}${upcoming.title} · ${relativeDay(upcoming.date, state.today)}`))
        : h('p', {}, 'ยังไม่มีรายการที่จะถึง')),
      h('div', { id: 'progress', role: 'img', 'aria-label': `หน้าที่เดือนนี้ ทำเสร็จ ${stats.done} จาก ${stats.total}` },
        h('div', { class: 'ticks' }, Array.from({ length: stats.total }, (_, i) => h('i', { class: i < stats.done ? 'on' : '' }))),
        h('span', { class: 'count' }, stats.total ? `หน้าที่เดือนนี้ ${stats.done}/${stats.total}` : 'เดือนนี้ยังไม่มีหน้าที่'))));
  root.toggleAttribute('data-today', key === state.today);
}
