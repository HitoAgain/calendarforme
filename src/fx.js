import { h } from './dom.js';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Everything outside an open modal dialog is inert, so overlays must live inside it.
const host = () => document.querySelector('dialog[open]') ?? document.body;

let toastEl;
let toastTimer;

export function toast(message, { undo } = {}) {
  toastEl?.remove();
  clearTimeout(toastTimer);
  const close = () => { toastEl?.remove(); toastEl = null; clearTimeout(toastTimer); };
  toastEl = h('div', { class: 'toast', role: 'status' },
    h('span', {}, message),
    undo && h('button', { type: 'button', onclick: () => { close(); undo(); } }, 'เลิกทำ'));
  host().append(toastEl);
  toastTimer = setTimeout(close, undo ? 6000 : 5000);
}

export async function saveOrWarn(promise) {
  try {
    await promise;
    return true;
  } catch (err) {
    console.error(err);
    toast('บันทึกไม่สำเร็จ พื้นที่อาจเต็ม ลองลบรูปที่ไม่ใช้แล้วลองใหม่');
    return false;
  }
}

function burst(x, y, count, spread, parent = host()) {
  for (let i = 0; i < count; i++) {
    const size = 5 + Math.random() * 7;
    const scrap = h('i', { class: 'confetti', 'aria-hidden': 'true', style: `left:${x}px;top:${y}px;width:${size}px;height:${size * (0.5 + Math.random())}px;background:${i % 3 ? 'var(--red)' : 'var(--ink)'}` });
    parent.append(scrap);
    const dx = (Math.random() - 0.5) * spread;
    const up = 30 + Math.random() * spread * 0.5;
    const anim = scrap.animate([
      { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * 0.6}px), calc(-50% - ${up}px)) rotate(${Math.random() * 180}deg)`, opacity: 1, offset: 0.35 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${140 + Math.random() * 120}px)) rotate(${200 + Math.random() * 400}deg)`, opacity: 0 },
    ], { duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.3,.5,.6,1)' });
    anim.onfinish = () => scrap.remove();
  }
}

export function celebrate(x, y) {
  if (!reducedMotion()) burst(x, y, 16, 170);
}

// The page rips along its perforated top edge and falls with paper weight.
export function tearSheet(pageEl, { dy = 0, mutate } = {}) {
  if (reducedMotion()) return;
  const rect = pageEl.getBoundingClientRect();
  const styles = getComputedStyle(pageEl);
  const clone = pageEl.cloneNode(true);
  clone.inert = true;
  clone.querySelectorAll('input[type="file"]').forEach((el) => el.remove());
  clone.setAttribute('aria-hidden', 'true');
  clone.style.cssText = `background:${styles.backgroundColor};color:${styles.color}`;
  mutate?.(clone);
  const sheet = h('div', { class: 'sheet-falling', 'aria-hidden': 'true', style: `left:${rect.left}px;top:${rect.top - dy}px;width:${rect.width}px;height:${rect.height}px` }, clone);
  document.body.append(sheet);
  const fall = window.innerHeight - rect.top + 80;
  const anim = sheet.animate([
    { transform: `translateY(${dy}px) rotate(0deg)`, offset: 0 },
    { transform: `translate(6px, ${dy + 14}px) rotate(-3deg)`, offset: 0.2 },
    { transform: `translate(-34px, ${dy + fall * 0.45}px) rotate(7deg)`, offset: 0.6 },
    { transform: `translate(30px, ${dy + fall}px) rotate(19deg)`, offset: 1 },
  ], { duration: 760, easing: 'cubic-bezier(.45,.05,.8,.5)' });
  anim.onfinish = () => sheet.remove();
  burst(rect.left + rect.width / 2, rect.top + 4, 10, rect.width, document.body);
}

export function dropSheet(pageEl) {
  if (reducedMotion()) return;
  pageEl.animate([
    { transform: 'translateY(-104%) rotate(-1.5deg)' },
    { transform: 'none' },
  ], { duration: 460, easing: 'cubic-bezier(.16,1,.3,1)' });
}

export function swapMonth(fn, direction) {
  document.documentElement.dataset.dir = direction;
  document.startViewTransition?.(fn) ?? fn();
}
