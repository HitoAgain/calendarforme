import { h } from './dom.js';
import { saveOrWarn, toast } from './fx.js';
import { decodeCode, encodeCode } from './share.js';
import { replaceAll } from './store.js';

const dialog = () => document.getElementById('share');

function show(body) {
  dialog().replaceChildren(body);
  dialog().showModal();
}

export async function openCreateCode(ctx) {
  const code = await encodeCode(ctx.state.items);
  const field = h('textarea', { id: 's-code', readOnly: true, rows: 6, spellcheck: false, value: code, onfocus: (e) => e.target.select() });
  const copy = h('button', {
    class: 'btn primary', type: 'button',
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        field.select();
        document.execCommand('copy');
      }
      copy.textContent = 'คัดลอกแล้ว';
    },
  }, 'คัดลอกโค้ด');
  show(h('div', {},
    h('h2', {}, 'โค้ดปฏิทินของคุณ'),
    h('p', { class: 'share-hint' }, 'นำโค้ดนี้ไปกด "ใส่โค้ด" ในเครื่องหรือเบราว์เซอร์อื่น จะได้รายการชุดเดียวกันทันที รูปภาพไม่รวมอยู่ในโค้ด ถ้าต้องการรูปด้วยให้ใช้สำรองข้อมูล'),
    h('label', { class: 'field', htmlFor: 's-code' }, 'โค้ด'), field,
    h('p', { class: 'share-meta' }, `${ctx.state.items.length} รายการ · ${code.length.toLocaleString('th-TH')} ตัวอักษร`),
    h('div', { class: 'form-actions' },
      h('button', { class: 'btn', type: 'button', onclick: () => dialog().close() }, 'ปิด'),
      copy)));
  field.focus();
}

export function openEnterCode(ctx) {
  const error = h('p', { class: 'form-error', id: 's-error', role: 'alert' });
  const field = h('textarea', { id: 's-code', rows: 6, spellcheck: false, placeholder: 'CAL1-…', 'aria-describedby': 's-error' });
  let busy = false;
  const apply = async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    try {
      const result = await decodeCode(field.value);
      if (!result.ok) {
        error.textContent = result.error;
        field.setAttribute('aria-invalid', 'true');
        field.focus();
        return;
      }
      const current = ctx.state.items.length;
      if (current && !confirm(`แทนที่ ${current} รายการตอนนี้ด้วย ${result.items.length} รายการจากโค้ด? รูปภาพยังอยู่เหมือนเดิม`)) return;
      // Same transaction as backup import: items are swapped, this browser's own images are written back untouched.
      if (!(await saveOrWarn(replaceAll({ items: result.items, images: ctx.state.images })))) return;
      dialog().close();
      await ctx.refresh();
      toast(`ได้ปฏิทินจากโค้ดแล้ว ${result.items.length} รายการ`);
    } finally {
      busy = false;
    }
  };
  show(h('form', { onsubmit: apply },
    h('h2', {}, 'ใส่โค้ดปฏิทิน'),
    h('p', { class: 'share-hint' }, 'รายการทั้งหมดตอนนี้จะถูกแทนด้วยรายการในโค้ด รูปภาพในเครื่องนี้ยังอยู่เหมือนเดิม'),
    h('label', { class: 'field', htmlFor: 's-code' }, 'โค้ด'), field, error,
    h('div', { class: 'form-actions' },
      h('button', { class: 'btn', type: 'button', onclick: () => dialog().close() }, 'ยกเลิก'),
      h('button', { class: 'btn primary', type: 'submit' }, 'ใช้โค้ดนี้'))));
  field.focus();
}
