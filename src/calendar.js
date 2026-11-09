import { FIRST_DAY, MONTHS, addDays, formatDay, formatMonth, formatShortMonth, inRange, monthGrid, monthOf } from './dates.js';
import { h, icon } from './dom.js';
import { monthStats, sortDay } from './model.js';

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
// Short windows fit fewer lines per day; +N must stay truthful rather than letting CSS clip a chip.
const shortWindow = matchMedia('(max-height: 759px)');
export const onWindowFitChange = (fn) => shortWindow.addEventListener('change', fn);

function chip(item, justAdded) {
  return h('div', {
    class: `chip${item.done ? ' done' : ''}${item.id === justAdded ? ' pop' : ''}`,
    'data-item-id': item.id,
    'data-kind': item.kind,
    draggable: true,
    title: item.title,
    ondragstart: (e) => { e.dataTransfer.setData('text/x-item', item.id); e.dataTransfer.effectAllowed = 'move'; },
  }, h('i', { class: 'mark' }), h('span', {}, `${item.time ? `${item.time} ` : ''}${item.title}`));
}

function dayCell(key, state, handlers, focusKey) {
  const items = sortDay(state.items.filter((i) => i.date === key));
  const maxChips = shortWindow.matches ? 2 : 3;
  const firstImage = state.images.find((i) => i.date === key);
  const enabled = inRange(key);
  const count = items.length ? ` มี ${items.length} รายการ` : '';
  const over = (e) => { if (enabled) { e.preventDefault(); e.currentTarget.classList.add('drop-target'); } };
  return h('div', {
    class: 'day',
    'data-date': key,
    'data-outside': monthOf(key) !== state.month,
    'data-disabled': !enabled,
    'data-past': enabled && key < state.today,
    'data-today': key === state.today,
    'data-selected': key === state.selected,
    onclick: () => { if (enabled) handlers.onDayClick(key); },
    ondragover: over,
    ondragleave: (e) => e.currentTarget.classList.remove('drop-target'),
    ondrop: (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('drop-target');
      if (!enabled) return;
      const id = e.dataTransfer.getData('text/x-item');
      if (e.dataTransfer.files.length) handlers.onDropFiles(key, [...e.dataTransfer.files]);
      else if (id) handlers.onMoveItem(id, key);
    },
  },
  h('button', {
    class: 'day-open',
    type: 'button',
    disabled: !enabled,
    tabIndex: key === focusKey ? 0 : -1,
    'aria-label': `${formatDay(key)}${count}`,
    'aria-current': key === state.today ? 'date' : null,
    'aria-pressed': key === state.selected ? 'true' : 'false',
    'data-fk': `day:${key}`,
  }, String(Number(key.slice(8)))),
  firstImage && h('img', { class: `thumb ${firstImage.type === 'image/svg+xml' ? 'contain' : ''}`, src: handlers.imageUrl(firstImage), alt: '', decoding: 'sync', draggable: false }),
  items.length > 0 && h('div', { class: 'chips' },
    items.slice(0, maxChips).map((i) => chip(i, state.justAdded))),
  items.length > maxChips && h('div', { class: 'more' }, `+${items.length - maxChips}`));
}

function onGridKey(e, handlers) {
  const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  if (e.key === 'PageDown' || e.key === 'PageUp') {
    e.preventDefault();
    handlers.onMonthStep(e.key === 'PageDown' ? 1 : -1);
    return;
  }
  const from = e.target.closest?.('.day')?.dataset.date;
  if (!steps[e.key] || !from) return;
  e.preventDefault();
  const target = e.currentTarget.querySelector(`.day[data-date="${addDays(from, steps[e.key])}"] .day-open:not([disabled])`);
  if (!target) return;
  e.currentTarget.querySelector('.day-open[tabindex="0"]')?.setAttribute('tabindex', '-1');
  target.setAttribute('tabindex', '0');
  target.focus();
}

export function renderCalendar(root, state, handlers) {
  const index = MONTHS.indexOf(state.month);
  const keys = monthGrid(state.month);
  // One day in the grid stays tabbable so Tab enters it once, then arrow keys take over.
  const focusKey = [state.selected, state.today, keys.find((k) => monthOf(k) === state.month && k >= FIRST_DAY)]
    .find((k) => keys.includes(k) && inRange(k));
  const stepButton = (label, name, step, fk) => h('button', {
    class: 'btn square', type: 'button', 'aria-label': label, title: label, 'data-fk': fk,
    disabled: !MONTHS[index + step],
    onclick: () => handlers.onMonthStep(step),
  }, icon(name));

  root.replaceChildren(
    h('header', { class: 'bar' },
      h('h1', {}, formatMonth(state.month)),
      h('div', { class: 'bar-actions' },
        stepButton('เดือนก่อนหน้า', 'prev', -1, 'prev'),
        h('button', {
          class: 'btn', type: 'button', 'data-fk': 'today', disabled: !inRange(state.today),
          onclick: handlers.onToday,
        }, 'วันนี้'),
        stepButton('เดือนถัดไป', 'next', 1, 'next'),
        h('button', { class: 'btn primary', type: 'button', 'data-fk': 'add', onclick: handlers.onAdd }, icon('plus'), 'เพิ่มรายการ'))),
    h('div', { class: 'dow', 'aria-hidden': 'true' }, WEEKDAYS.map((d) => h('span', {}, d))),
    h('section', {
      class: 'grid', 'aria-label': `ตารางวันของเดือน${formatMonth(state.month)}`,
      onkeydown: (e) => onGridKey(e, handlers),
    }, keys.map((k) => dayCell(k, state, handlers, focusKey))),
    h('footer', { class: 'strip' },
      h('nav', { class: 'months', 'aria-label': 'เลือกเดือน' }, MONTHS.map((m) => {
        const { total, done } = monthStats(state.items, m);
        return h('button', {
          type: 'button', 'data-month': m, 'data-fk': `month:${m}`,
          'aria-current': m === state.month ? 'true' : null,
          'aria-label': `${formatMonth(m)}${total ? ` หน้าที่เสร็จ ${done} จาก ${total}` : ''}`,
          onclick: () => handlers.onMonth(m),
        }, formatShortMonth(m));
      })),
      h('div', { class: 'backup' },
        h('button', { class: 'link', type: 'button', 'data-fk': 'export', onclick: handlers.onExport }, 'สำรองข้อมูล'),
        h('label', { class: 'link' }, 'นำเข้าข้อมูล',
          h('input', { class: 'sr-only', type: 'file', accept: '.json,application/json', onchange: handlers.onImport })))),
  );
}
