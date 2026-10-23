export const $ = s => document.querySelector(s);
export const pausa = ms => new Promise(r => setTimeout(r, ms));

const PATHS = {
  store: 'M3 9l1.5-5h15L21 9M3 9h18M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v8h14v-8M10 20v-5h4v5',
  bag: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0',
  package: 'M21 8l-9-5-9 5 9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.3-4.3',
  bolt: 'M13 2 3 14h9l-1 8 10-12h-9l1-8Z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14ZM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  truck: 'M3 6h11v10H3ZM14 9h4l3 3v4h-7M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  chart: 'M3 3v18h18M8 17v-5M13 17V8M18 17v-9',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14',
  tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8ZM7.5 7.5h.01',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  pin: 'M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z',
  card: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2ZM2 10h20M6 15h4',
  cash: 'M2 7h20v10H2ZM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6 10v4M18 10v4',
  bank: 'M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-6 10 6Z',
  back: 'M19 12H5M12 19l-7-7 7-7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  lock: 'M5 11h14v10H5ZM8 11V7a4 4 0 0 1 8 0v4',
  nav: 'M3 11l19-9-9 19-2-8-8-2Z',
  gps: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 2v3M12 19v3M2 12h3M19 12h3',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  power: 'M18.4 6.6a9 9 0 1 1-12.8 0M12 2v10',
  money: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10ZM9 12l2 2 4-4',
  hash: 'M4 9h16M4 15h16M10 3 8 21M16 3l-2 18',
  login: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  layers: 'M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5',
  receipt: 'M4 2v20l3-2 3 2 3-2 3 2 3-2 1 .7V2l-1 .7-3-2-3 2-3-2-3 2-3-2ZM8 7h8M8 11h8M8 15h5'
};

export function ico(name, cls = '') {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('class', 'ico ' + cls);
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', PATHS[name] || PATHS.info);
  s.append(p);
  return s;
}

export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat(Infinity).forEach(c => c != null && c !== false && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
}

export const Q = n => 'Q' + Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fecha = f => new Date(f).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
export const iniciales = t => (t || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();

export const ESTADOS = {
  CREADO: 'Recibido', CONFIRMADO: 'Confirmado', EN_PREPARACION: 'En preparación', LISTO: 'Listo',
  EN_CAMINO: 'En camino', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado', RECHAZADO: 'Rechazado'
};
export const FLUJO = ['CREADO', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'EN_CAMINO', 'ENTREGADO'];
export const badge = e => h('span', { class: 'badge e-' + e }, h('i'), ESTADOS[e] || e.replace(/_/g, ' '));

export function stepper(estado) {
  if (['CANCELADO', 'RECHAZADO'].includes(estado))
    return h('div', { class: 'stepper-off' }, ico('x'), estado === 'CANCELADO' ? 'Este pedido fue cancelado' : 'El comercio rechazó este pedido');
  const i = FLUJO.indexOf(estado);
  return h('ol', { class: 'stepper' }, FLUJO.map((e, k) =>
    h('li', { class: k < i ? 'done' : k === i ? 'now' : '' }, h('span', { class: 'dot' }, k < i ? ico('check') : null), h('small', {}, ESTADOS[e]))));
}

export function toast(msg, err) {
  const t = h('div', { class: 'toast' + (err ? ' err' : '') }, ico(err ? 'alert' : 'check'), h('span', {}, msg));
  $('#toast').append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 4500);
}

export function modal(titulo, cuerpo, botones = [], opts = {}) {
  const cerrar = () => { o.classList.add('out'); document.removeEventListener('keydown', esc); setTimeout(() => Element.prototype.remove.call(o), 180); };
  const esc = e => e.key === 'Escape' && cerrar();
  const o = h('div', { class: 'ov', onclick: e => e.target === o && cerrar() },
    h('div', { class: 'modal' + (opts.grande ? ' modal-lg' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo },
      h('div', { class: 'modal-head' }, h('div', {}, opts.sub ? h('small', { class: 'eyebrow' }, opts.sub) : null, h('h3', {}, titulo)),
        h('button', { class: 'icon-btn', 'aria-label': 'Cerrar', onclick: cerrar }, ico('x'))),
      h('div', { class: 'modal-body' }, cuerpo),
      h('div', { class: 'modal-foot' }, h('button', { class: 'btn btn-sec', onclick: cerrar }, opts.cerrarTxt || 'Cerrar'), ...botones)));
  o.remove = cerrar;
  document.addEventListener('keydown', esc);
  document.body.append(o);
  const f = o.querySelector('.modal-body input, .modal-body select');
  if (f) setTimeout(() => f.focus(), 50);
  return o;
}

export function confirmar(titulo, texto, etiqueta = 'Confirmar') {
  return new Promise(ok => {
    let listo = false;
    const fin = v => { if (!listo) { listo = true; ok(v); } };
    const o = modal(titulo, h('div', { class: 'confirm' }, h('span', { class: 'confirm-ico' }, ico('alert')), h('p', {}, texto)),
      [h('button', { class: 'btn btn-danger', onclick: () => { fin(true); o.remove(); } }, etiqueta)], { cerrarTxt: 'Volver' });
    new MutationObserver((_, mo) => { if (!o.isConnected) { mo.disconnect(); fin(false); } }).observe(document.body, { childList: true });
  });
}

export const campoEl = (l, input, ayuda) => h('div', { class: 'field' }, h('label', {}, l), input, ayuda ? h('small', { class: 'help' }, ayuda) : null);

export function formModal(titulo, campos, alEnviar, textoBoton = 'Guardar', safe) {
  const ins = campos.map(f => [f, f.opts
    ? h('select', {}, f.opts.map(o => h('option', { value: o[0] }, o[1])))
    : h('input', { type: f.t || 'text', step: 'any', value: f.v ?? '' })]);
  ins.forEach(([f, i]) => { if (f.opts && f.v != null) i.value = f.v; });
  const cuerpo = h('form', { class: 'form-grid', onsubmit: e => { e.preventDefault(); enviar(); } },
    ins.map(([f, i]) => campoEl(f.l, i)), h('button', { type: 'submit', hidden: true }));
  const btn = h('button', { class: 'btn', onclick: () => enviar() }, textoBoton);
  const enviar = () => safe(async () => {
    const d = {};
    ins.forEach(([f, i]) => {
      if (i.value === '') return;
      d[f.n] = f.t === 'number' ? Number(i.value) : f.bool ? i.value === 'true' : i.value;
    });
    btn.disabled = true;
    try { await alEnviar(d); o.remove(); } finally { btn.disabled = false; }
  });
  const o = modal(titulo, cuerpo, [btn]);
}

export const tabla = (cab, filas) => h('div', { class: 'table-wrap' }, h('table', {},
  h('thead', {}, h('tr', {}, cab.map(c => h('th', {}, c)))), h('tbody', {}, filas.map(f => h('tr', {}, f.map(c => h('td', {}, c)))))));

export const vacio = (t, icono = 'package', extra) => h('div', { class: 'empty' }, h('span', { class: 'empty-ico' }, ico(icono)), h('p', {}, t), extra || null);

export const pageHead = (titulo, sub, ...acciones) => h('div', { class: 'page-head' },
  h('div', {}, h('h1', {}, titulo), sub ? h('p', { class: 'lead' }, sub) : null),
  acciones.length ? h('div', { class: 'page-actions' }, acciones) : null);

export const skeleton = () => h('div', { class: 'skeleton-page' }, h('div', { class: 'sk sk-title' }),
  h('div', { class: 'sk-grid' }, [1, 2, 3].map(() => h('div', { class: 'sk sk-card' }))));

export const pill = (txt, cls = '') => h('span', { class: 'pill ' + cls }, txt);

export const haversine = (a, b, c, d) => {
  const r = x => x * Math.PI / 180, dl = r(c - a), dn = r(d - b);
  const k = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dn / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(k), Math.sqrt(1 - k));
};

const GRADS = ['g-green', 'g-blue', 'g-navy', 'g-teal'];
export const cover = (nombre, id, cls = '') => h('div', { class: `cover ${GRADS[(id || 0) % GRADS.length]} ${cls}` },
  h('span', { class: 'cover-ini' }, iniciales(nombre)), ico('store', 'cover-ico'));
