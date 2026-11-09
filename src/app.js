import { FIRST_DAY, LAST_DAY, MONTHS, addDays, clampMonth, daysBetween, formatMonth, formatWeekday, fromKey, inRange, monthOf, toKey } from './dates.js';
import { h } from './dom.js';
import { getAll, putItem } from './store.js';
import { dropSheet, saveOrWarn, swapMonth, tearSheet } from './fx.js';
import { onWindowFitChange, renderCalendar } from './calendar.js';
import { addImages, openItemForm, renderPad } from './pad.js';
import { exportBackup, importBackup, toDataUrl } from './backup.js';
import { openCreateCode, openEnterCode } from './share-dialog.js';
import { isMuted, paperWhoosh, setMuted } from './sound.js';

const clampDay = (key) => (key < FIRST_DAY ? FIRST_DAY : key > LAST_DAY ? LAST_DAY : key);

const today = toKey(new Date());
const state = {
  today,
  selected: clampDay(today),
  month: clampMonth(new Date()),
  items: [],
  images: [],
  justAdded: null,
};

const padEl = h('aside', { id: 'pad', 'aria-label': 'แผ่นปฏิทินรายวัน' });
const mainEl = h('main', {});
const imageUrls = new Map();

function imageUrl(image) {
  if (!imageUrls.has(image.id)) imageUrls.set(image.id, URL.createObjectURL(image.blob));
  return imageUrls.get(image.id);
}

function forgetImage(id) {
  URL.revokeObjectURL(imageUrls.get(id));
  imageUrls.delete(id);
}

function render() {
  const focused = document.activeElement?.dataset?.fk;
  const hadFocus = document.getElementById('app').contains(document.activeElement);
  const scroll = padEl.querySelector('.page-body')?.scrollTop ?? 0;
  renderPad(padEl, ctx);
  renderCalendar(mainEl, state, handlers);
  const body = padEl.querySelector('.page-body');
  if (body) body.scrollTop = scroll;
  state.justAdded = null;
  if (hadFocus) (document.querySelector(`[data-fk="${focused}"]:not([disabled])`) ?? document.querySelector('.day-open[tabindex="0"]'))?.focus();
}

async function refresh() {
  Object.assign(state, await getAll());
  // SVGs render from data: URLs: a blob: URL opened in its own tab would run the SVG's scripts with this app's origin and data.
  await Promise.all(state.images
    .filter((i) => i.type === 'image/svg+xml' && !imageUrls.has(i.id))
    .map(async (i) => imageUrls.set(i.id, await toDataUrl(i.blob))));
  render();
}

function select(key, { dy = 0 } = {}) {
  if (!inRange(key) || key === state.selected) return;
  const page = padEl.querySelector('.page');
  const forward = key > state.selected;
  if (forward) tearSheet(page, { dy });
  state.selected = key;
  state.month = monthOf(key);
  render();
  if (!forward) dropSheet(padEl.querySelector('.page'));
}

const focusDay = () => document.querySelector(`.day[data-date="${state.selected}"] .day-open`)?.focus();

const ctx = {
  state,
  refresh,
  select,
  imageUrl,
  forgetImage,
  focusDay,
  tearNext: (dy) => select(addDays(state.selected, 1), { dy }),
  // Thickness of the remaining pad: real days left in the range, 1 when the range is untouched.
  remainingRatio: () => (daysBetween(state.selected, LAST_DAY) / daysBetween(FIRST_DAY, LAST_DAY)).toFixed(3),
};

function goToMonth(month) {
  if (month === state.month) return;
  const direction = month > state.month ? 'forward' : 'back';
  paperWhoosh(direction === 'forward' ? 1 : -1);
  swapMonth(() => { state.month = month; render(); }, direction);
}

const handlers = {
  imageUrl,
  onDayClick: (key) => (key === state.selected ? openItemForm(ctx, { date: key }) : select(key)),
  onMonth: goToMonth,
  onMonthStep: (step) => { const m = MONTHS[MONTHS.indexOf(state.month) + step]; if (m) goToMonth(m); },
  onToday: () => { select(state.today); goToMonth(monthOf(state.today)); },
  onAdd: () => openItemForm(ctx, { date: state.selected }),
  onDropFiles: (key, files) => addImages(files, key, ctx),
  onMoveItem: async (id, key) => {
    const item = state.items.find((i) => i.id === id);
    if (!item || item.date === key) return;
    await saveOrWarn(putItem({ ...item, date: key }));
    await refresh();
  },
  onExport: exportBackup,
  onCreateCode: () => openCreateCode(ctx),
  onEnterCode: () => openEnterCode(ctx),
  soundOn: () => !isMuted(),
  onToggleSound: () => { setMuted(!isMuted()); render(); },
  onImport: async (e) => {
    const [file] = e.target.files;
    e.target.value = '';
    if (!file || !(await importBackup(file))) return;
    [...imageUrls.keys()].forEach(forgetImage);
    await refresh();
  },
};

function readLastSeen() {
  try { return localStorage.getItem('lastSeen'); } catch { return null; }
}
function writeLastSeen(key) {
  try { localStorage.setItem('lastSeen', key); } catch { /* private window: the tear-on-new-day flourish just skips */ }
}

// A new day since the last visit: yesterday's page falls off by itself.
function tearYesterday(lastSeen) {
  tearSheet(padEl.querySelector('.page'), {
    mutate: (clone) => {
      clone.querySelector('.numeral').textContent = String(fromKey(lastSeen).getDate());
      clone.querySelector('.weekday').textContent = formatWeekday(lastSeen);
      clone.querySelector('.monthline').textContent = formatMonth(monthOf(lastSeen));
      clone.querySelector('.page-body').replaceChildren();
    },
  });
}

async function checkDay() {
  const now = toKey(new Date());
  if (now === state.today) return refresh();
  const wasOnToday = state.selected === state.today;
  state.today = now;
  writeLastSeen(now);
  await refresh();
  if (wasOnToday) select(now);
}

// A window left open overnight never fires visibilitychange, so also wake just after local midnight.
function scheduleMidnight() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  setTimeout(() => { checkDay(); scheduleMidnight(); }, next - now);
}

document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkDay(); });
window.addEventListener('focus', () => { if (toKey(new Date()) !== state.today) checkDay(); });

onWindowFitChange(() => render());

document.addEventListener('paste', (e) => {
  if (document.querySelector('dialog[open]') || !e.clipboardData?.files.length) return;
  addImages([...e.clipboardData.files], state.selected, ctx);
});

let pressedBackdrop = false;

// Close only when the press also started on the backdrop: a text selection dragged out of a field must not discard the form.
const paperDialog = (id, onclose) => h('dialog', {
  id,
  class: 'paper-dialog',
  onclose,
  onpointerdown: (e) => { pressedBackdrop = e.target === e.currentTarget; },
  onclick: (e) => { if (pressedBackdrop && e.target === e.currentTarget) e.currentTarget.close(); },
});

function mountDialogs() {
  const form = paperDialog('item-form', () => focusDay());
  const share = paperDialog('share');
  const lightbox = h('dialog', {
    id: 'lightbox',
    onclick: (e) => e.currentTarget.close(),
  });
  document.body.append(form, share, lightbox);
}

const app = document.getElementById('app');
if (location.protocol !== 'file:') {
  mountDialogs();
  app.append(padEl, mainEl);
  navigator.storage?.persist?.();
  const lastSeen = readLastSeen();
  writeLastSeen(state.today);
  await refresh();
  scheduleMidnight();
  if (lastSeen && lastSeen < state.today && inRange(state.today)) tearYesterday(lastSeen);
}
