export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else if (key === 'class') el.className = value;
    else if (key in el) el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}

const ICONS = {
  prev: '<path d="M10 3 5 8l5 5"/>',
  next: '<path d="m6 3 5 5-5 5"/>',
  plus: '<path d="M8 3v10M3 8h10"/>',
  down: '<path d="M8 3v9M4 8.5 8 12.5l4-4"/>',
  close: '<path d="m4 4 8 8M12 4l-8 8"/>',
  edit: '<path d="m3 13 .8-3L10.5 3.3l2.2 2.2L6 12.2 3 13Z"/>',
};

export function icon(name) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">${ICONS[name]}</svg>`;
  return span;
}
