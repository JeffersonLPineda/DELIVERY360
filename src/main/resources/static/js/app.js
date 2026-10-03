/* SmartDelivery 360 - frontend (JS puro). Consume la API REST mediante js/api.js y los mapas mediante js/maps.js */
const $ = s => document.querySelector(s);
const S = { rol: null, nombre: null, tab: null };
const pausa = ms => new Promise(r => setTimeout(r, ms));

/* ---------- utilidades ---------- */
// Crea elementos DOM sin innerHTML (evita inyección de HTML desde datos del servidor)
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(c => c != null && c !== false && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
}
const Q = n => 'Q' + Number(n || 0).toFixed(2);
const fecha = f => new Date(f).toLocaleString('es-GT');
const badge = e => h('span', { class: 'badge e-' + e }, e.replace('_', ' '));
function toast(msg, err) {
  const t = h('div', { class: err ? 'err' : '' }, msg);
  $('#toast').append(t);
  setTimeout(() => t.remove(), 4500);
}
async function safe(fn) {
  try { return await fn(); }
  catch (e) { toast(e.message, true); if (!API.token && S.rol && S.rol !== 'INVITADO') modoInvitado(); }
}
function modal(titulo, cuerpo, botones = []) {
  const o = h('div', { class: 'ov', onclick: e => e.target === o && o.remove() },
    h('div', { class: 'modal' }, h('h3', {}, titulo), cuerpo,
      h('div', { class: 'acc' }, ...botones, h('button', { class: 'btn sec', onclick: () => o.remove() }, 'Cerrar'))));
  document.body.append(o);
  return o;
}
// Formulario genérico: campos {n:nombre, l:etiqueta, t:tipo, v:valor, opts:[[valor,texto]], bool:true}
function formModal(titulo, campos, alEnviar, textoBoton = 'Guardar') {
  const ins = campos.map(f => [f, f.opts
    ? h('select', {}, f.opts.map(o => h('option', { value: o[0] }, o[1])))
    : h('input', { type: f.t || 'text', step: 'any', value: f.v ?? '' })]);
  ins.forEach(([f, i]) => { if (f.opts && f.v != null) i.value = f.v; });
  const cuerpo = h('div', {}, ins.map(([f, i]) => [h('label', {}, f.l), i]));
  const o = modal(titulo, cuerpo, [h('button', { class: 'btn', onclick: () => safe(async () => {
    const d = {};
    ins.forEach(([f, i]) => {
      if (i.value === '') return;
      d[f.n] = f.t === 'number' ? Number(i.value) : f.bool ? i.value === 'true' : i.value;
    });
    await alEnviar(d);
    o.remove();
  }) }, textoBoton)]);
}
const tabla = (cab, filas) => h('div', { class: 'wrap' }, h('table', {},
  h('tr', {}, cab.map(c => h('th', {}, c))), filas.map(f => h('tr', {}, f.map(c => h('td', {}, c))))));
const vacio = t => h('p', { class: 'vacio' }, t);
const haversine = (a, b, c, d) => {
  const r = x => x * Math.PI / 180, dl = r(c - a), dn = r(d - b);
  const k = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dn / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(k), Math.sqrt(1 - k));
};

/* ---------- pedidos de invitado: se recuerdan en este navegador ---------- */
const INV = {
  lista() { try { return JSON.parse(localStorage.getItem('pedidosInvitado') || '[]'); } catch { return []; } },
  guardar(id, codigo) {
    const l = this.lista().filter(x => x.id !== id); l.unshift({ id, codigo });
    localStorage.setItem('pedidosInvitado', JSON.stringify(l.slice(0, 20)));
  },
  quitar(id) { localStorage.setItem('pedidosInvitado', JSON.stringify(this.lista().filter(x => x.id !== id))); }
};

/* ---------- sesión y navegación ---------- */
// Sin sesión se navega como INVITADO: se ven comercios y se puede pedir sin crear cuenta.
function modoInvitado() {
  S.rol = 'INVITADO'; S.nombre = null;
  $('#user').textContent = 'Invitado'; $('#salir').hidden = true; $('#entrar').hidden = false;
  montarTabs(); go('comercios');
}
function pantallaLogin() {
  S.tab = 'login';
  document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('on'));
  const email = h('input', { type: 'email', placeholder: 'correo@ejemplo.com', autocomplete: 'username' });
  const pass = h('input', { type: 'password', placeholder: 'Contraseña', autocomplete: 'current-password' });
  const entrar = async () => {
    try { const r = await API.login(email.value.trim(), pass.value); iniciarSesion(r.rol, r.nombre); }
    catch (e) { toast(e.message, true); }
  };
  pass.addEventListener('keydown', e => e.key === 'Enter' && entrar());
  $('#box').replaceChildren(h('div', { class: 'card login' },
    h('h2', {}, 'Ingresar'),
    h('p', { class: 'mut' }, 'La cuenta es opcional para pedir. Ingresa si eres cliente registrado, comercio, repartidor o administrador.'),
    h('label', {}, 'Correo'), email, h('label', {}, 'Contraseña'), pass,
    h('div', { class: 'acc' }, h('button', { class: 'btn', onclick: entrar }, 'Ingresar'),
      h('button', { class: 'btn sec', onclick: formRegistro }, 'Crear cuenta de cliente'),
      S.rol === 'INVITADO' ? h('button', { class: 'btn sec', onclick: () => go('comercios') }, 'Seguir sin cuenta') : null)));
}
function formRegistro() {
  formModal('Crear cuenta de cliente', [
    { n: 'nombre', l: 'Nombre' }, { n: 'email', l: 'Correo', t: 'email' },
    { n: 'password', l: 'Contraseña (mínimo 6)', t: 'password' }, { n: 'telefono', l: 'Teléfono' }],
  async d => { await API.post('/api/auth/registro', d); toast('Cuenta creada: ya puedes ingresar'); }, 'Crear cuenta');
}

const TABS = {
  INVITADO: [['comercios', 'Comercios', vComercios], ['rastrear', 'Rastrear mi pedido', vRastrear]],
  CLIENTE: [['comercios', 'Comercios', vComercios], ['pedidos', 'Mis pedidos', vPedidos]],
  COMERCIO: [['pedidos', 'Pedidos', vPedidos], ['prioridad', 'Prioridad', vPrioridad], ['catalogo', 'Mi catálogo', vCatalogo]],
  REPARTIDOR: [['entregas', 'Mis entregas', vRepartidor]],
  ADMIN: [['reporte', 'Reporte', vReporte], ['pedidos', 'Pedidos', vPedidos], ['prioridad', 'Prioridad', vPrioridad],
    ['usuarios', 'Usuarios', vUsuarios], ['comercios', 'Comercios', vAdminComercios],
    ['zonas', 'Zonas', vZonas], ['promos', 'Promociones', vPromos]]
};
function montarTabs() {
  $('#tabs').replaceChildren(...TABS[S.rol].map(([k, t]) => h('button', { 'data-k': k, onclick: () => go(k) }, t)));
}
function iniciarSesion(rol, nombre) {
  S.rol = rol; S.nombre = nombre;
  $('#user').textContent = nombre + ' (' + rol + ')';
  $('#salir').hidden = false; $('#entrar').hidden = true;
  montarTabs();
  go(TABS[rol][0][0]);
}
async function go(k, silencioso) {
  S.tab = k;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
  const vista = TABS[S.rol].find(t => t[0] === k)[2];
  await safe(async () => {
    const nuevo = h('div');
    await vista(nuevo);                      // se arma aparte y se reemplaza: sin parpadeo al refrescar
    if (S.tab === k) $('#box').replaceChildren(nuevo);
  });
}

/* ---------- pedidos (compartido por todos los roles) ---------- */
const ACC = {
  COMERCIO: { CREADO: [['CONFIRMADO', 'Aceptar'], ['RECHAZADO', 'Rechazar']], CONFIRMADO: [['EN_PREPARACION', 'Preparar']], EN_PREPARACION: [['LISTO', 'Marcar listo']] },
  CLIENTE: { CREADO: [['CANCELADO', 'Cancelar']], CONFIRMADO: [['CANCELADO', 'Cancelar']] },
  REPARTIDOR: { LISTO: [['EN_CAMINO', 'Salir a entregar']], EN_CAMINO: [['ENTREGADO', 'Marcar entregado']] }
};
ACC.ADMIN = {};
Object.values(ACC).slice(0, 3).forEach(m => Object.entries(m).forEach(([e, l]) => ACC.ADMIN[e] = (ACC.ADMIN[e] || []).concat(l)));

const activo = p => !['ENTREGADO', 'CANCELADO', 'RECHAZADO'].includes(p.estado);

const cambiar = (p, estado) => {
  if (['CANCELADO', 'RECHAZADO'].includes(estado) && !confirm('¿Seguro que deseas ' + estado.toLowerCase() + ' el pedido #' + p.id + '?')) return;
  return safe(async () => { await API.put(`/api/pedidos/${p.id}/estado`, { estado }); toast(`Pedido #${p.id}: ${estado}`); go(S.tab); });
};
// Pedido pagado en efectivo: el repartidor confirma cuánto recibió; el pago pasa a COMPLETADO solo en este momento.
function entregar(p) {
  if (p.metodoPago !== 'EFECTIVO' || p.estadoPago !== 'PENDIENTE') return cambiar(p, 'ENTREGADO');
  const rec = h('input', { type: 'number', step: '0.01', min: p.total, value: Number(p.total).toFixed(2) });
  const vuelto = h('div', { class: 'tot g' });
  const calc = () => {
    const c = Number(rec.value) - p.total;
    vuelto.replaceChildren(h('span', {}, c >= 0 ? 'Cambio a entregar' : 'Falta por cobrar'), Q(Math.abs(c)));
  };
  rec.addEventListener('input', calc); calc();
  let o;
  const confirmar = () => safe(async () => {
    await API.put(`/api/pedidos/${p.id}/estado`, { estado: 'ENTREGADO', efectivoRecibido: Number(rec.value) });
    o.remove(); toast(`Pedido #${p.id} entregado y cobrado`); go(S.tab);
  });
  o = modal('Entrega y cobro en efectivo',
    h('div', {}, h('p', {}, `Cobra ${Q(p.total)} al cliente. El pago se marcará como completado al confirmar la entrega.`),
      h('label', {}, 'Efectivo recibido (Q)'), rec, vuelto),
    [h('button', { class: 'btn', onclick: confirmar }, 'Confirmar entrega y cobro')]);
}
const asignar = p => safe(async () => {
  const r = await API.post(`/api/pedidos/${p.id}/asignar-repartidor`);
  toast(r.mensaje, !r.asignado); go(S.tab);
});
// codigo: solo para invitados (se califica con el código de seguimiento en lugar de la sesión)
function calificar(p, codigo) {
  const nota = n => ({ n, l: n === 'puntajeComercio' ? 'Comercio (1-5)' : 'Repartidor (1-5)', opts: [5, 4, 3, 2, 1].map(x => [x, x + ' ★']), v: 5 });
  formModal('Calificar pedido #' + p.id, [nota('puntajeComercio'), nota('puntajeRepartidor'), { n: 'comentario', l: 'Comentario (opcional)' }],
    async d => {
      const cuerpo = { pedidoId: p.id, puntajeComercio: +d.puntajeComercio, puntajeRepartidor: +d.puntajeRepartidor, comentario: d.comentario };
      await (codigo ? API.post(`/api/publico/pedidos/${p.id}/calificar?codigo=${encodeURIComponent(codigo)}`, cuerpo) : API.post('/api/calificaciones', cuerpo));
      toast('¡Gracias por calificar!'); go(S.tab);
    }, 'Enviar');
}
function botones(p) {
  const b = (ACC[S.rol][p.estado] || []).map(([e, t]) =>
    h('button', { class: 'btn ' + (/CANCEL|RECHAZ/.test(e) ? 'peligro' : ''), onclick: () => e === 'ENTREGADO' ? entregar(p) : cambiar(p, e) }, t));
  if (['COMERCIO', 'ADMIN'].includes(S.rol) && !p.repartidorId && ['CONFIRMADO', 'EN_PREPARACION', 'LISTO'].includes(p.estado))
    b.push(h('button', { class: 'btn sec', onclick: () => asignar(p) }, 'Asignar repartidor'));
  if (S.rol === 'CLIENTE' && p.estado === 'ENTREGADO' && !p.calificado)
    b.push(h('button', { class: 'btn', onclick: () => calificar(p) }, '★ Calificar'));
  return b;
}

// Estado del pago en lenguaje claro: el efectivo contra entrega solo figura como pagado cuando el repartidor entrega.
const pagoTxt = p => {
  const desc = p.pago ? p.pago.descripcion : p.metodoPago;
  const est = { PENDIENTE: p.metodoPago === 'EFECTIVO' ? 'se cobra al entregar' : 'pendiente', COMPLETADO: 'pagado ✔', REEMBOLSADO: 'reembolsado', ANULADO: 'anulado' }[p.estadoPago] || p.estadoPago;
  return `${desc} · ${est}`;
};
const enlace = (txt, url, cls = 'btn sec') => h('a', { class: cls, href: url, target: '_blank', rel: 'noopener' }, txt);
// Botones de Google Maps (URL oficial: gratis y sin clave). Abren la ruta desde la ubicación actual del repartidor.
const enlacesMapa = p => [
  enlace('📍 Ir a la entrega', Maps.urlRuta(p.latEntrega, p.lonEntrega), 'btn'),
  enlace('🏪 Ir al comercio', Maps.urlRuta(p.comercioLat, p.comercioLon))
];

const tarjetaPedido = p => {
  const staff = ['COMERCIO', 'ADMIN', 'REPARTIDOR'].includes(S.rol);
  const cobrar = p.metodoPago === 'EFECTIVO' && p.estadoPago === 'PENDIENTE' && activo(p);
  return h('div', { class: 'card' },
    h('div', { class: 'row' }, h('b', {}, `#${p.id} · ${p.comercioNombre}`), badge(p.estado)),
    h('div', { class: 'mut' }, `${fecha(p.fechaCreacion)} · Cliente: ${p.clienteNombre}${p.invitado ? ' (sin cuenta)' : ''}`),
    staff ? h('div', {}, '📍 ' + p.direccionEntrega + (p.notasEntrega ? ' — ' + p.notasEntrega : '')) : null,
    S.rol === 'REPARTIDOR' && p.telefonoContacto ? h('div', {}, 'Contacto: ', h('a', { href: 'tel:' + p.telefonoContacto }, p.telefonoContacto)) : null,
    h('div', {}, `Total ${Q(p.total)} · `, h('span', { class: 'badge pg-' + p.estadoPago }, pagoTxt(p))),
    cobrar && S.rol === 'REPARTIDOR' ? h('div', { class: 'cobro' }, `Cobrar ${Q(p.total)} en efectivo al entregar`) : null,
    h('div', { class: 'mut' }, p.repartidorNombre ? `Repartidor: ${p.repartidorNombre} (${p.tipoVehiculo})` : 'Sin repartidor asignado'),
    h('div', { class: 'acc' }, h('button', { class: 'btn sec', onclick: () => detalle(p.id) }, 'Ver detalle'), botones(p),
      staff && activo(p) ? enlacesMapa(p) : null));
};

async function vPedidos(box) {
  const ps = await API.get('/api/pedidos');
  box.append(h('h2', {}, S.rol === 'CLIENTE' ? 'Mis pedidos' : 'Pedidos'),
    ...(ps.length ? ps.map(tarjetaPedido) : [vacio('Aún no hay pedidos.')]));
}

const fila = (k, v) => h('div', { class: 'tot' }, h('span', {}, k), v);
function detalleModal(p) {
  const pg = p.pago || {};
  const lineasPago = Object.entries(pg.detalle || {}).map(([k, v]) => fila(k, v));
  if (pg.idTransaccion) lineasPago.push(fila('N.º de transacción', pg.idTransaccion));
  if (pg.fechaProcesado) lineasPago.push(fila('Fecha del cobro', fecha(pg.fechaProcesado)));
  if (pg.idReembolso) lineasPago.push(fila('N.º de reembolso', pg.idReembolso));
  const src = (p.latEntrega || p.lonEntrega)
    ? Maps.embedRuta({ lat: p.comercioLat, lon: p.comercioLon }, { lat: p.latEntrega, lon: p.lonEntrega }) : null;
  const staff = ['COMERCIO', 'ADMIN', 'REPARTIDOR'].includes(S.rol);
  modal('Pedido #' + p.id, h('div', {}, badge(p.estado),
    tabla(['Producto', 'Cant.', 'Subtotal'], p.detalles.map(d => [d.producto, d.cantidad, Q(d.subtotal)])),
    fila('Subtotal', Q(p.subtotal)),
    fila('Envío (' + p.distanciaKm.toFixed(1) + ' km)', Q(p.costoEnvio)),
    fila('Descuento' + (p.codigoPromocion ? ' ' + p.codigoPromocion : ''), '-' + Q(p.descuento)),
    h('div', { class: 'tot g' }, h('span', {}, 'Total'), Q(p.total)),
    h('h3', { style: 'margin-top:14px' }, 'Pago'),
    h('div', { class: 'recibo' }, fila('Estado', pagoTxt(p)), ...lineasPago),
    h('h3', {}, 'Entrega'),
    h('p', { class: 'mut' }, p.direccionEntrega + (p.notasEntrega ? ' — ' + p.notasEntrega : '')),
    h('p', {}, `Recibe: ${p.clienteNombre} · ${p.telefonoContacto || ''}`),
    src ? h('iframe', { class: 'mapa-embed', src, loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade', allowfullscreen: true }) : null,
    h('div', { class: 'acc' }, staff ? enlacesMapa(p) : enlace('Ver destino en Google Maps', Maps.urlLugar(p.latEntrega, p.lonEntrega))),
    h('p', {}, p.seguimiento),
    h('h3', {}, 'Historial'), h('ul', { class: 'mut' }, p.historial.map(x => h('li', {}, x)))));
}
const detalle = id => safe(async () => detalleModal(await API.get('/api/pedidos/' + id)));

/* ---------- CLIENTE / INVITADO ---------- */
let cart = {};
async function vComercios(box) {
  const cs = await API.get('/api/comercios');
  box.append(h('h2', {}, 'Comercios abiertos'),
    S.rol === 'INVITADO' ? h('p', { class: 'mut' }, 'Puedes pedir sin crear una cuenta. Si ya tienes una, usa “Ingresar”.') : null,
    h('div', { class: 'grid' }, cs.length ? cs.map(c => h('div', { class: 'card' },
      h('h3', {}, c.nombre), h('div', { class: 'mut' }, `${c.direccion || ''} · ${c.zona || ''}`),
      h('div', {}, `★ ${c.calificacion.toFixed(1)} (${c.totalCalificaciones}) · ${c.tiempoPreparacionMin} min`),
      h('div', { class: 'acc' }, h('button', { class: 'btn', onclick: () => abrirMenu(c) }, 'Ver menú')))) : [vacio('No hay comercios abiertos.')]));
}
function abrirMenu(c) {
  cart = {}; S.tab = 'menu';
  const box = $('#box'); box.replaceChildren();
  safe(() => vMenu(box, c));
}

const marcaDe = n => {
  const p2 = +n.slice(0, 2), p4 = +n.slice(0, 4);
  if (n[0] === '4') return 'Visa';
  if ((p2 >= 51 && p2 <= 55) || (p4 >= 2221 && p4 <= 2720)) return 'Mastercard';
  if (p2 === 34 || p2 === 37) return 'American Express';
  if (n.startsWith('6011') || p2 === 65) return 'Discover';
  return '';
};

async function vMenu(box, c) {
  const [prods, promos, yo] = await Promise.all([
    API.get(`/api/comercios/${c.id}/productos`), API.get('/api/promociones'),
    S.rol === 'CLIENTE' ? API.get('/api/auth/me') : Promise.resolve(null)]);
  const ub = { lat: c.latitud + 0.003, lon: c.longitud + 0.003 };   // punto inicial: cerca del comercio
  const f = {};
  const campo = (k, l, t = 'text', v = '', extra = {}) => [h('label', {}, l), f[k] = h('input', { type: t, value: v, ...extra })];
  const res = h('div');
  const btn = h('button', { class: 'btn', onclick: () => enviar() }, 'Confirmar pedido');
  let selector = null;

  const totales = () => {
    const sub = Object.values(cart).reduce((s, x) => s + x.p.precio * x.n, 0);
    const km = haversine(c.latitud, c.longitud, ub.lat, ub.lon), envio = 10 + 2.5 * km;
    return { sub, km, envio, total: sub + envio };
  };
  function etiquetaBoton() {
    btn.textContent = pago.value === 'TARJETA' ? `Pagar ${Q(totales().total)}` : 'Confirmar pedido';
  }
  function resumen() {
    const t = totales();
    res.replaceChildren(h('div', { class: 'tot' }, h('span', {}, 'Subtotal'), Q(t.sub)),
      h('div', { class: 'tot' }, h('span', {}, `Envío estimado (${t.km.toFixed(1)} km)`), Q(t.envio)),
      h('div', { class: 'tot g' }, h('span', {}, 'Total estimado'), Q(t.total)),
      t.km > 30 ? h('p', { class: 'aviso' }, 'Esta ubicación está a más de 30 km del comercio: queda fuera del área de entrega.') : null,
      h('p', { class: 'mut' }, 'El descuento y el total final los calcula el servidor al confirmar.'));
    if (f.mto && !f.mto.dataset.t) f.mto.value = (t.sub + t.envio).toFixed(2);
    etiquetaBoton();
  }

  /* --- productos --- */
  const lista = prods.map(p => {
    const n = h('b', {}, '0');
    const mover = d => () => { const x = cart[p.id] || (cart[p.id] = { p, n: 0 }); x.n = Math.max(0, x.n + d); n.textContent = x.n; resumen(); };
    return h('div', { class: 'card row' }, h('div', {}, h('b', {}, p.nombre), h('div', { class: 'mut' }, p.descripcion || '')), Q(p.precio),
      h('div', { class: 'qty' }, h('button', { class: 'btn sec', onclick: mover(-1) }, '−'), n, h('button', { class: 'btn sec', onclick: mover(1) }, '+')));
  });

  /* --- ubicación de entrega (Google Maps) --- */
  const coords = h('div', { class: 'mut' });
  const mostrarCoords = () => { coords.textContent = `Ubicación elegida: ${ub.lat.toFixed(5)}, ${ub.lon.toFixed(5)}`; };
  const alUbicar = ({ lat, lon, direccion }) => {
    ub.lat = lat; ub.lon = lon;
    if (direccion) f.dir.value = direccion;
    if (f.lat) { f.lat.value = lat.toFixed(5); f.lon.value = lon.toFixed(5); }
    mostrarCoords(); resumen();
  };
  const gps = () => navigator.geolocation
    ? navigator.geolocation.getCurrentPosition(x => {
        const la = x.coords.latitude, lo = x.coords.longitude;
        if (selector) selector.mover(la, lo); else alUbicar({ lat: la, lon: lo });
      }, () => toast('No se pudo obtener tu ubicación (revisa los permisos del navegador)', true))
    : toast('Tu navegador no permite geolocalización', true);
  const mapaBox = h('div');
  const manual = h('div', { class: 'f2' },
    h('div', {}, ...campo('lat', 'Latitud', 'number', ub.lat.toFixed(5), { step: 'any', oninput: () => { ub.lat = +f.lat.value; mostrarCoords(); resumen(); } })),
    h('div', {}, ...campo('lon', 'Longitud', 'number', ub.lon.toFixed(5), { step: 'any', oninput: () => { ub.lon = +f.lon.value; mostrarCoords(); resumen(); } })));

  /* --- pago --- */
  const marca = h('span', { class: 'marca' });
  const formatoNumero = () => {
    const d = f.num.value.replace(/\D/g, '').slice(0, 19), amex = /^3[47]/.test(d);
    f.num.value = amex ? [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ') : (d.match(/.{1,4}/g) || []).join(' ');
    marca.textContent = marcaDe(d);
    f.cvv.maxLength = amex ? 4 : 3;
  };
  const formatoVence = () => {
    let d = f.ven.value.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) d = d.slice(0, 2) + '/' + d.slice(2);
    f.ven.value = d;
  };
  const gT = h('div', { class: 'tarjeta-form' }, marca,
    ...campo('num', 'Número de tarjeta', 'text', '', { inputmode: 'numeric', autocomplete: 'cc-number', placeholder: '1234 5678 9012 3456', maxlength: 23, oninput: formatoNumero }),
    ...campo('tit', 'Nombre del titular (como aparece en la tarjeta)', 'text', '', { autocomplete: 'cc-name', oninput: () => { f.tit.value = f.tit.value.toUpperCase(); } }),
    h('div', { class: 'f2' },
      h('div', {}, ...campo('ven', 'Vencimiento (MM/AA)', 'text', '', { inputmode: 'numeric', autocomplete: 'cc-exp', placeholder: 'MM/AA', maxlength: 5, oninput: formatoVence })),
      h('div', {}, ...campo('cvv', 'CVV', 'password', '', { inputmode: 'numeric', autocomplete: 'cc-csc', maxlength: 4 }))),
    h('p', { class: 'mut' }, '🔒 Pasarela de pago simulada: no se hace ningún cargo real y los datos de la tarjeta no se guardan.'));
  const gX = h('div', { hidden: true }, ...campo('ref', 'Referencia (6-20 letras/números)'), ...campo('mto', 'Monto transferido', 'number'));
  const gE = h('div', { class: 'aviso', hidden: true },
    'Pagas en efectivo al repartidor cuando recibas tu pedido. Aparecerá como “pendiente” y se marcará como pagado cuando el repartidor confirme la entrega.');
  f.mto.addEventListener('keydown', () => { f.mto.dataset.t = 1; });   // si el cliente escribe el monto, ya no se autocompleta
  const metodos = [['TARJETA', 'Tarjeta de crédito o débito'], ['EFECTIVO', 'Efectivo contra entrega'], ['TRANSFERENCIA', 'Transferencia bancaria']];
  const pago = h('select', { onchange: () => {
    gT.hidden = pago.value !== 'TARJETA'; gX.hidden = pago.value !== 'TRANSFERENCIA'; gE.hidden = pago.value !== 'EFECTIVO'; etiquetaBoton();
  } }, metodos.map(([v, t]) => h('option', { value: v }, t)));
  const dl = h('datalist', { id: 'promos' }, promos.map(p => h('option', { value: p.codigo }, p.descripcion)));

  /* --- enviar --- */
  const construir = () => {
    const items = Object.values(cart).filter(x => x.n > 0).map(x => ({ productoId: x.p.id, cantidad: x.n }));
    if (!items.length) throw new Error('Agrega al menos un producto');
    if (!f.nom.value.trim()) throw new Error('Escribe el nombre de quien recibe el pedido');
    if (!f.tel.value.trim()) throw new Error('Escribe un teléfono de contacto');
    if (!f.dir.value.trim()) throw new Error('Escribe o elige en el mapa la dirección de entrega');
    const d = { metodo: pago.value };
    if (d.metodo === 'TARJETA') Object.assign(d, { numeroTarjeta: f.num.value.replace(/\s/g, ''), titular: f.tit.value, vencimiento: f.ven.value, cvv: f.cvv.value });
    if (d.metodo === 'TRANSFERENCIA') Object.assign(d, { referencia: f.ref.value, montoTransferido: Number(f.mto.value) });
    return { comercioId: c.id, items, direccionEntrega: f.dir.value, latEntrega: ub.lat, lonEntrega: ub.lon,
      notasEntrega: f.notas.value || null, nombreContacto: f.nom.value, telefonoContacto: f.tel.value, emailContacto: f.mail.value || null,
      codigoPromocion: f.promo.value || null, pago: d };
  };
  async function enviar() {
    let body;
    try { body = construir(); } catch (e) { return toast(e.message, true); }
    const tarjeta = pago.value === 'TARJETA';
    btn.disabled = true;
    btn.replaceChildren(h('span', { class: 'spin' }), tarjeta ? 'Procesando pago…' : 'Enviando pedido…');
    try {
      const [p] = await Promise.all([API.post('/api/pedidos', body), pausa(tarjeta ? 1200 : 0)]);
      pedidoCreado(p);
    } catch (e) {
      if (e.data && e.data.requiere3ds) pedir3ds(e.data, body); else toast(e.message, true);
    } finally { btn.disabled = false; etiquetaBoton(); }
  }

  box.append(h('div', { class: 'row' }, h('h2', {}, c.nombre), h('button', { class: 'btn sec', onclick: () => go('comercios') }, '← Comercios')),
    ...(lista.length ? lista : [vacio('Este comercio no tiene productos disponibles.')]),
    h('div', { class: 'card' }, h('h3', {}, 'Quién recibe'),
      S.rol === 'INVITADO' ? h('p', { class: 'mut' }, 'Pides como invitado: no necesitas cuenta. Al terminar recibirás un código para rastrear tu pedido.') : null,
      ...campo('nom', 'Nombre de quien recibe', 'text', yo ? yo.nombre : '', { autocomplete: 'name' }),
      ...campo('tel', 'Teléfono de contacto', 'tel', yo && yo.telefono ? yo.telefono : '', { autocomplete: 'tel' }),
      ...campo('mail', 'Correo (opcional, para avisos)', 'email', yo ? yo.email : '', { autocomplete: 'email' })),
    h('div', { class: 'card' }, h('h3', {}, 'Dónde entregamos'),
      mapaBox, coords,
      ...campo('dir', 'Dirección de entrega', 'text', '', { placeholder: 'Se completa al elegir en el mapa; puedes editarla', maxlength: 250 }),
      ...campo('notas', 'Indicaciones para el repartidor (opcional)', 'text', '', { placeholder: 'Casa azul, portón negro…', maxlength: 250 }),
      h('div', { class: 'acc' }, h('button', { class: 'btn sec', onclick: gps }, 'Usar mi ubicación'))),
    h('div', { class: 'card' }, h('h3', {}, 'Pago'),
      h('label', {}, 'Código de promoción (opcional)'), (f.promo = h('input', { list: 'promos', placeholder: 'BIENVENIDO10' })), dl,
      h('label', {}, 'Método de pago'), pago, gT, gX, gE, res,
      h('div', { class: 'acc' }, btn)));
  mostrarCoords(); resumen();

  if (Maps.activo) {
    Maps.selector(mapaBox, ub, alUbicar).then(s => { selector = s; })
      .catch(e => mapaBox.replaceChildren(h('div', { class: 'aviso' }, e.message + '. Puedes usar “Usar mi ubicación” o escribir las coordenadas.'), manual));
  } else {
    mapaBox.replaceChildren(h('div', { class: 'aviso' }, 'El mapa no está disponible (el servidor no tiene API key de Google Maps). Usa “Usar mi ubicación” o escribe las coordenadas.'), manual);
  }
}

// El banco pide verificar la compra (3-D Secure): se envía el código y se repite el pedido.
function pedir3ds(info, body) {
  const cod = h('input', { inputmode: 'numeric', maxlength: '6', placeholder: '123456', autocomplete: 'one-time-code' });
  const err = h('div', { class: 'err-inline' });
  let o;
  const confirmar = async () => {
    err.textContent = '';
    const cuerpo = { ...body, pago: { ...body.pago, desafioId: info.desafioId, codigo3ds: cod.value.trim() } };
    try {
      const [p] = await Promise.all([API.post('/api/pedidos', cuerpo), pausa(900)]);
      o.remove(); pedidoCreado(p);
    } catch (e) { err.textContent = e.message; }
  };
  o = modal('Verificación de tu banco (3-D Secure)',
    h('div', {}, h('p', {}, info.mensaje), h('label', {}, 'Código de verificación'), cod, err,
      h('p', { class: 'mut' }, 'Simulación: el código que enviaría el banco por SMS es 123456.')),
    [h('button', { class: 'btn', onclick: confirmar }, 'Verificar y pagar')]);
}

function pedidoCreado(p) {
  cart = {};
  if (p.invitado && p.codigoSeguimiento) INV.guardar(p.id, p.codigoSeguimiento);
  reciboModal(p);
  go(S.rol === 'INVITADO' ? 'rastrear' : 'pedidos');
}
function reciboModal(p) {
  const pg = p.pago || {};
  const lineas = Object.entries(pg.detalle || {}).map(([k, v]) => fila(k, v));
  if (pg.idTransaccion) lineas.push(fila('N.º de transacción', pg.idTransaccion));
  if (pg.fechaProcesado) lineas.push(fila('Fecha', fecha(pg.fechaProcesado)));
  modal('Pedido confirmado', h('div', {},
    h('p', {}, `Tu pedido #${p.id} fue enviado a ${p.comercioNombre}.`),
    p.estadoPago === 'COMPLETADO'
      ? h('div', { class: 'aviso', style: 'background:#dcfce7;border-color:#86efac;color:#166534' }, '✔ Pago aprobado')
      : h('div', { class: 'aviso' }, p.metodoPago === 'EFECTIVO'
        ? 'Pagarás en efectivo al repartidor. El pago se marcará como completado cuando entregue tu pedido.'
        : 'Pago pendiente de verificación.'),
    h('div', { class: 'recibo' }, fila('Total', Q(p.total)), ...lineas),
    p.codigoSeguimiento ? h('div', {}, h('p', {}, 'Guarda este código para rastrear tu pedido:'), h('div', { class: 'codigo' }, p.codigoSeguimiento),
      h('p', { class: 'mut' }, `Pedido #${p.id}. También queda guardado en este dispositivo, en “Rastrear mi pedido”.`)) : null));
}

/* ---------- INVITADO: rastrear pedidos sin cuenta ---------- */
const tarjetaInvitado = (p, codigo) => {
  const acc = [h('button', { class: 'btn sec', onclick: () => detalleModal(p) }, 'Ver detalle')];
  if (['CREADO', 'CONFIRMADO'].includes(p.estado)) {
    acc.push(h('button', { class: 'btn peligro', onclick: () => {
      if (!confirm('¿Seguro que deseas cancelar el pedido #' + p.id + '?')) return;
      safe(async () => { await API.post(`/api/publico/pedidos/${p.id}/cancelar?codigo=${encodeURIComponent(codigo)}`); toast('Pedido cancelado'); go('rastrear'); });
    } }, 'Cancelar'));
  }
  if (p.estado === 'ENTREGADO' && !p.calificado) acc.push(h('button', { class: 'btn', onclick: () => calificar(p, codigo) }, '★ Calificar'));
  return h('div', { class: 'card' },
    h('div', { class: 'row' }, h('b', {}, `#${p.id} · ${p.comercioNombre}`), badge(p.estado)),
    h('div', { class: 'mut' }, fecha(p.fechaCreacion)),
    h('div', {}, `Total ${Q(p.total)} · `, h('span', { class: 'badge pg-' + p.estadoPago }, pagoTxt(p))),
    h('div', { class: 'mut' }, p.repartidorNombre ? `Repartidor: ${p.repartidorNombre} (${p.tipoVehiculo})` : 'Sin repartidor asignado'),
    h('div', { class: 'acc' }, acc));
};
async function vRastrear(box) {
  const id = h('input', { type: 'number', min: '1', placeholder: 'Ej. 12' });
  const cod = h('input', { placeholder: 'Ej. K7M29QXA', maxlength: '8', style: 'text-transform:uppercase' });
  const buscar = () => safe(async () => {
    const p = await API.get(`/api/publico/pedidos/${Number(id.value)}?codigo=${encodeURIComponent(cod.value.trim())}`);
    INV.guardar(p.id, p.codigoSeguimiento || cod.value.trim().toUpperCase());
    toast(`Pedido #${p.id} agregado`); go('rastrear');
  });
  box.append(h('h2', {}, 'Rastrear mi pedido'),
    h('div', { class: 'card' }, h('h3', {}, 'Buscar un pedido'),
      h('div', { class: 'f2' }, h('div', {}, h('label', {}, 'N.º de pedido'), id), h('div', {}, h('label', {}, 'Código de seguimiento'), cod)),
      h('div', { class: 'acc' }, h('button', { class: 'btn', onclick: buscar }, 'Buscar'))));
  const guardados = INV.lista();
  if (!guardados.length) return box.append(vacio('Aún no tienes pedidos guardados en este dispositivo.'));
  const res = await Promise.allSettled(guardados.map(g => API.get(`/api/publico/pedidos/${g.id}?codigo=${encodeURIComponent(g.codigo)}`)));
  res.forEach((r, i) => {
    if (r.status === 'fulfilled') box.append(tarjetaInvitado(r.value, guardados[i].codigo));
    else if (r.reason && r.reason.status === 404) INV.quitar(guardados[i].id);   // ya no existe
  });
}

/* ---------- COMERCIO ---------- */
async function vPrioridad(box) {
  const ps = await API.get('/api/pedidos/prioridad');
  box.append(h('h2', {}, 'Pedidos por prioridad'), h('p', { class: 'mut' }, 'Puntuación = 35% antigüedad + 20% cercanía + 20% preparación + 25% repartidores libres.'),
    ps.length ? tabla(['Pedido', 'Comercio', 'Estado', 'Puntuación', 'Hora', 'Dist.', 'Prep.', 'Disp.'],
      ps.map(p => [`#${p.pedidoId}`, p.comercio, badge(p.estado), h('div', {}, p.puntuacion, h('div', { class: 'bar' }, h('i', { style: `width:${p.puntuacion * 100}%` }))),
        p.factorHora, p.factorDistancia, p.factorPreparacion, p.factorDisponibilidad]))
      : vacio('No hay pedidos pendientes de preparar.'));
}
async function vCatalogo(box) {
  const cs = await API.get('/api/comercios/mis');
  box.append(h('h2', {}, 'Mi catálogo'), ...(cs.length ? [] : [vacio('No tienes comercios asignados.')]));
  for (const c of cs) {
    const ps = await API.get(`/api/comercios/${c.id}/productos`);
    const campos = p => [{ n: 'nombre', l: 'Nombre', v: p?.nombre }, { n: 'descripcion', l: 'Descripción', v: p?.descripcion },
      { n: 'precio', l: 'Precio (Q)', t: 'number', v: p?.precio }];
    const guardar = (p, extra) => d => API[p ? 'put' : 'post'](`/api/comercios/${c.id}/productos${p ? '/' + p.id : ''}`, { ...d, ...extra }).then(() => { toast('Producto guardado'); go('catalogo'); });
    box.append(h('div', { class: 'card' },
      h('div', { class: 'row' }, h('h3', {}, c.nombre), h('button', { class: 'btn ' + (c.abierto ? 'peligro' : ''), onclick: () => safe(async () => {
        await API.put(`/api/comercios/${c.id}/abierto`, { abierto: !c.abierto }); go('catalogo'); }) }, c.abierto ? 'Cerrar comercio' : 'Abrir comercio')),
      h('p', { class: 'mut' }, c.abierto ? 'Abierto: recibe pedidos' : 'Cerrado: no aparece para los clientes'),
      ps.length ? tabla(['Producto', 'Precio', 'Estado', ''], ps.map(p => [p.nombre, Q(p.precio), p.disponible ? 'Disponible' : 'Agotado',
        h('div', { class: 'acc' }, h('button', { class: 'btn sec', onclick: () => formModal('Editar producto', campos(p), guardar(p, { disponible: p.disponible })) }, 'Editar'),
          h('button', { class: 'btn sec', onclick: () => safe(() => guardar(p, { disponible: !p.disponible })({ nombre: p.nombre, descripcion: p.descripcion, precio: p.precio })) }, p.disponible ? 'Marcar agotado' : 'Marcar disponible'))])) : vacio('Sin productos.'),
      h('div', { class: 'acc' }, h('button', { class: 'btn', onclick: () => formModal('Nuevo producto', campos(), guardar(null, {})) }, 'Agregar producto'))));
  }
}

/* ---------- REPARTIDOR ---------- */
async function vRepartidor(box) {
  const [yo, ps] = await Promise.all([API.get('/api/auth/me'), API.get('/api/pedidos')]);
  const ubic = (la, lo) => safe(async () => { await API.put('/api/repartidores/me/ubicacion', { latitud: la, longitud: lo }); toast('Ubicación actualizada'); });
  box.append(h('div', { class: 'card' }, h('div', { class: 'row' }, h('div', {}, h('h3', {}, yo.nombre + ' · ' + yo.tipoVehiculo),
    h('div', { class: 'mut' }, `★ ${(yo.calificacion || 0).toFixed(1)} · ${yo.disponible ? 'Disponible para pedidos' : 'No disponible: no recibirás pedidos nuevos'}`)),
    h('button', { class: 'btn ' + (yo.disponible ? 'peligro' : ''), onclick: () => safe(async () => {
      await API.put('/api/repartidores/me/disponibilidad', { disponible: !yo.disponible }); go('entregas'); }) }, yo.disponible ? 'Dejar de estar disponible' : 'Ponerme disponible')),
    h('div', { class: 'acc' }, h('button', { class: 'btn sec', onclick: () => navigator.geolocation
      ? navigator.geolocation.getCurrentPosition(x => ubic(x.coords.latitude, x.coords.longitude), () => toast('No se pudo obtener tu ubicación', true))
      : toast('Sin geolocalización', true) }, 'Usar mi ubicación'),
    h('button', { class: 'btn sec', onclick: () => formModal('Ubicación manual', [{ n: 'latitud', l: 'Latitud', t: 'number' }, { n: 'longitud', l: 'Longitud', t: 'number' }],
      d => ubic(d.latitud, d.longitud)) }, 'Ingresar coordenadas'))),
    h('h2', {}, 'Mis entregas'), ...(ps.length ? ps.map(tarjetaPedido) : [vacio('Aún no tienes pedidos asignados.')]));
}

/* ---------- ADMIN ---------- */
async function vReporte(box) {
  const r = await API.get('/api/admin/reportes');
  const max = Math.max(1, ...Object.values(r.pedidosPorEstado));
  const st = (n, v) => h('div', { class: 'card' }, h('div', { class: 'stat' }, v), h('div', { class: 'mut' }, n));
  box.append(h('h2', {}, 'Reporte general'), h('div', { class: 'grid' }, st('Pedidos totales', r.totalPedidos), st('Ingresos (entregados)', Q(r.ingresosEntregados)),
    st('Clientes', r.clientes), st('Comercios', r.comercios), st('Repartidores disponibles', r.repartidoresDisponibles)),
    h('div', { class: 'card', style: 'margin-top:12px' }, h('h3', {}, 'Pedidos por estado'), ...Object.entries(r.pedidosPorEstado).map(([e, n]) =>
      h('div', { class: 'row' }, badge(e), h('div', { class: 'bar', style: 'flex:1' }, h('i', { style: `width:${n / max * 100}%` })), h('b', {}, n)))));
}
async function vUsuarios(box) {
  const [us, zs] = await Promise.all([API.get('/api/admin/usuarios'), API.get('/api/admin/zonas')]);
  const o = (arr, sinValor) => (sinValor ? [['', sinValor]] : []).concat(arr);
  box.append(h('div', { class: 'row' }, h('h2', {}, 'Usuarios'), h('button', { class: 'btn', onclick: () => formModal('Nuevo usuario', [
    { n: 'nombre', l: 'Nombre' }, { n: 'email', l: 'Correo', t: 'email' }, { n: 'password', l: 'Contraseña (mínimo 6)', t: 'password' }, { n: 'telefono', l: 'Teléfono' },
    { n: 'rol', l: 'Rol', opts: ['CLIENTE', 'COMERCIO', 'REPARTIDOR', 'ADMIN'].map(x => [x, x]), v: 'CLIENTE' },
    { n: 'tipoVehiculo', l: 'Vehículo (solo repartidor)', opts: o(['MOTO', 'BICICLETA', 'AUTOMOVIL'].map(x => [x, x]), '—') },
    { n: 'zonaId', l: 'Zona (solo repartidor)', opts: o(zs.map(z => [z.id, z.nombre]), '—') }],
  async d => { await API.post('/api/admin/usuarios', d); toast('Usuario creado'); go('usuarios'); }, 'Crear') }, 'Nuevo usuario')),
  tabla(['ID', 'Nombre', 'Correo', 'Rol', 'Detalle', 'Activo', ''], us.map(u => [u.id, u.nombre, u.email, u.rol,
    u.tipoVehiculo ? `${u.tipoVehiculo} · ${u.disponible ? 'disponible' : 'no disp.'}` : '', u.activo ? 'Sí' : 'No',
    h('button', { class: 'btn sec', onclick: () => safe(async () => { await API.put(`/api/admin/usuarios/${u.id}/activo`, { activo: !u.activo }); go('usuarios'); }) }, u.activo ? 'Desactivar' : 'Activar')])));
}
async function vAdminComercios(box) {
  const [cs, us, zs] = await Promise.all([API.get('/api/comercios/todos'), API.get('/api/admin/usuarios'), API.get('/api/admin/zonas')]);
  box.append(h('div', { class: 'row' }, h('h2', {}, 'Comercios'), h('button', { class: 'btn', onclick: () => formModal('Nuevo comercio', [
    { n: 'nombre', l: 'Nombre' }, { n: 'direccion', l: 'Dirección' }, { n: 'latitud', l: 'Latitud', t: 'number', v: 14.4783 }, { n: 'longitud', l: 'Longitud', t: 'number', v: -90.6158 },
    { n: 'zonaId', l: 'Zona', opts: [['', '—']].concat(zs.map(z => [z.id, z.nombre])) },
    { n: 'propietarioId', l: 'Propietario (rol COMERCIO)', opts: us.filter(u => u.rol === 'COMERCIO').map(u => [u.id, u.nombre]) },
    { n: 'tiempoPreparacionMin', l: 'Minutos de preparación', t: 'number', v: 20 }],
  async d => { await API.post('/api/comercios', d); toast('Comercio creado'); go('comercios'); }, 'Crear') }, 'Nuevo comercio')),
  tabla(['ID', 'Nombre', 'Zona', 'Calificación', 'Estado', ''], cs.map(c => [c.id, c.nombre, c.zona || '—', `★ ${c.calificacion.toFixed(1)} (${c.totalCalificaciones})`, c.abierto ? 'Abierto' : 'Cerrado',
    h('button', { class: 'btn sec', onclick: () => safe(async () => { await API.put(`/api/comercios/${c.id}/abierto`, { abierto: !c.abierto }); go('comercios'); }) }, c.abierto ? 'Cerrar' : 'Abrir')])));
}
async function vZonas(box) {
  const zs = await API.get('/api/admin/zonas');
  box.append(h('div', { class: 'row' }, h('h2', {}, 'Zonas de operación'), h('button', { class: 'btn', onclick: () => formModal('Nueva zona', [
    { n: 'nombre', l: 'Nombre' }, { n: 'latitud', l: 'Latitud', t: 'number' }, { n: 'longitud', l: 'Longitud', t: 'number' }],
  async d => { await API.post('/api/admin/zonas', d); toast('Zona creada'); go('zonas'); }, 'Crear') }, 'Nueva zona')),
  tabla(['ID', 'Nombre', 'Latitud', 'Longitud'], zs.map(z => [z.id, z.nombre, z.latitud, z.longitud])));
}
async function vPromos(box) {
  const ps = await API.get('/api/promociones/todas');
  box.append(h('div', { class: 'row' }, h('h2', {}, 'Promociones'), h('button', { class: 'btn', onclick: () => formModal('Nueva promoción', [
    { n: 'tipo', l: 'Tipo', opts: [['PORCENTAJE', 'Porcentaje'], ['MONTO_FIJO', 'Monto fijo'], ['ENVIO_GRATIS', 'Envío gratis']] },
    { n: 'codigo', l: 'Código' }, { n: 'descripcion', l: 'Descripción' }, { n: 'valor', l: 'Valor (% o Q; no aplica a envío gratis)', t: 'number' },
    { n: 'montoMinimo', l: 'Compra mínima (Q)', t: 'number' }, { n: 'vigenteHasta', l: 'Vigente hasta', t: 'date' }],
  async d => { await API.post('/api/promociones', d); toast('Promoción creada'); go('promos'); }, 'Crear') }, 'Nueva promoción')),
  tabla(['Código', 'Descripción', 'Tipo', 'Mínimo', 'Hasta', 'Activa', ''], ps.map(p => [p.codigo, p.descripcion, p.tipo, Q(p.montoMinimo), p.vigenteHasta || '—', p.activa ? 'Sí' : 'No',
    h('button', { class: 'btn sec', onclick: () => safe(async () => { await API.put(`/api/promociones/${p.id}/activa`, { activo: !p.activa }); go('promos'); }) }, p.activa ? 'Desactivar' : 'Activar')])));
}

/* ---------- arranque ---------- */
$('#salir').addEventListener('click', () => API.logout());
$('#entrar').addEventListener('click', () => pantallaLogin());
setInterval(() => {   // refresco automático de pedidos cada 15 s (si no hay un formulario abierto)
  if (S.rol && ['pedidos', 'prioridad', 'entregas', 'rastrear'].includes(S.tab) && !document.querySelector('.ov') && !document.hidden) go(S.tab, true);
}, 15000);
(async () => {
  await Maps.iniciar();
  if (!API.token) return modoInvitado();
  try { const me = await API.get('/api/auth/me'); iniciarSesion(me.rol, me.nombre); }
  catch { modoInvitado(); }
})();
