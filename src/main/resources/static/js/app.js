/* SmartDelivery 360 - frontend (JS puro). Consume la API REST mediante js/api.js */
const $ = s => document.querySelector(s);
const S = { rol: null, nombre: null, tab: null };

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
  setTimeout(() => t.remove(), 4000);
}
async function safe(fn) {
  try { return await fn(); }
  catch (e) { toast(e.message, true); if (!API.token) pantallaLogin(); }
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

/* ---------- sesión y navegación ---------- */
function pantallaLogin() {
  S.rol = null; S.tab = null;
  $('#tabs').replaceChildren(); $('#user').textContent = ''; $('#salir').hidden = true;
  const email = h('input', { type: 'email', placeholder: 'correo@ejemplo.com' });
  const pass = h('input', { type: 'password', placeholder: 'Contraseña' });
  const demo = [['Cliente', 'cliente@', 'Cliente123'], ['Comercio', 'comercio1@', 'Comercio123'],
    ['Repartidor', 'moto@', 'Repartidor123'], ['Admin', 'admin@', 'Admin123']];
  const entrar = async () => {
    try { const r = await API.login(email.value.trim(), pass.value); iniciarSesion(r.rol, r.nombre); }
    catch (e) { toast(e.message, true); }
  };
  pass.addEventListener('keydown', e => e.key === 'Enter' && entrar());
  $('#box').replaceChildren(h('div', { class: 'card login' },
    h('h2', {}, 'Ingresar'), h('label', {}, 'Correo'), email, h('label', {}, 'Contraseña'), pass,
    h('div', { class: 'acc' }, h('button', { class: 'btn', onclick: entrar }, 'Ingresar'),
      h('button', { class: 'btn sec', onclick: formRegistro }, 'Crear cuenta de cliente')),
    h('p', { class: 'mut' }, 'Usuarios de prueba:'),
    h('div', { class: 'chips' }, demo.map(([n, e, p]) => h('button', { class: 'btn sec', onclick: () => {
      email.value = e + 'smartdelivery.com'; pass.value = p; } }, n)))));
}
function formRegistro() {
  formModal('Crear cuenta', [
    { n: 'nombre', l: 'Nombre' }, { n: 'email', l: 'Correo', t: 'email' },
    { n: 'password', l: 'Contraseña (mínimo 6)', t: 'password' }, { n: 'telefono', l: 'Teléfono' }],
  async d => { await API.post('/api/auth/registro', d); toast('Cuenta creada: ya puedes ingresar'); }, 'Crear cuenta');
}

const TABS = {
  CLIENTE: [['comercios', 'Comercios', vComercios], ['pedidos', 'Mis pedidos', vPedidos]],
  COMERCIO: [['pedidos', 'Pedidos', vPedidos], ['prioridad', 'Prioridad', vPrioridad], ['catalogo', 'Mi catálogo', vCatalogo]],
  REPARTIDOR: [['entregas', 'Mis entregas', vRepartidor]],
  ADMIN: [['reporte', 'Reporte', vReporte], ['pedidos', 'Pedidos', vPedidos], ['prioridad', 'Prioridad', vPrioridad],
    ['usuarios', 'Usuarios', vUsuarios], ['comercios', 'Comercios', vAdminComercios],
    ['zonas', 'Zonas', vZonas], ['promos', 'Promociones', vPromos]]
};
function iniciarSesion(rol, nombre) {
  S.rol = rol; S.nombre = nombre;
  $('#user').textContent = nombre + ' (' + rol + ')';
  $('#salir').hidden = false;
  $('#tabs').replaceChildren(...TABS[rol].map(([k, t]) => h('button', { 'data-k': k, onclick: () => go(k) }, t)));
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

const cambiar = (p, estado) => {
  if (['CANCELADO', 'RECHAZADO'].includes(estado) && !confirm('¿Seguro que deseas ' + estado.toLowerCase() + ' el pedido #' + p.id + '?')) return;
  return safe(async () => { await API.put(`/api/pedidos/${p.id}/estado`, { estado }); toast(`Pedido #${p.id}: ${estado}`); go(S.tab); });
};
const asignar = p => safe(async () => {
  const r = await API.post(`/api/pedidos/${p.id}/asignar-repartidor`);
  toast(r.mensaje, !r.asignado); go(S.tab);
});
function calificar(p) {
  const nota = n => ({ n, l: n === 'puntajeComercio' ? 'Comercio (1-5)' : 'Repartidor (1-5)', opts: [5, 4, 3, 2, 1].map(x => [x, x + ' ★']), v: 5 });
  formModal('Calificar pedido #' + p.id, [nota('puntajeComercio'), nota('puntajeRepartidor'), { n: 'comentario', l: 'Comentario (opcional)' }],
    async d => {
      await API.post('/api/calificaciones', { pedidoId: p.id, puntajeComercio: +d.puntajeComercio, puntajeRepartidor: +d.puntajeRepartidor, comentario: d.comentario });
      toast('¡Gracias por calificar!'); go(S.tab);
    }, 'Enviar');
}
function botones(p) {
  const b = (ACC[S.rol][p.estado] || []).map(([e, t]) =>
    h('button', { class: 'btn ' + (/CANCEL|RECHAZ/.test(e) ? 'peligro' : ''), onclick: () => cambiar(p, e) }, t));
  if (['COMERCIO', 'ADMIN'].includes(S.rol) && !p.repartidorId && ['CONFIRMADO', 'EN_PREPARACION', 'LISTO'].includes(p.estado))
    b.push(h('button', { class: 'btn sec', onclick: () => asignar(p) }, 'Asignar repartidor'));
  if (S.rol === 'CLIENTE' && p.estado === 'ENTREGADO' && !p.calificado)
    b.push(h('button', { class: 'btn', onclick: () => calificar(p) }, '★ Calificar'));
  return b;
}
const tarjetaPedido = p => h('div', { class: 'card' },
  h('div', { class: 'row' }, h('b', {}, `#${p.id} · ${p.comercioNombre}`), badge(p.estado)),
  h('div', { class: 'mut' }, `${fecha(p.fechaCreacion)} · Cliente: ${p.clienteNombre}`),
  h('div', {}, `Total ${Q(p.total)} · ${p.metodoPago} (${p.estadoPago})`),
  h('div', { class: 'mut' }, p.repartidorNombre ? `Repartidor: ${p.repartidorNombre} (${p.tipoVehiculo})` : 'Sin repartidor asignado'),
  h('div', { class: 'acc' }, h('button', { class: 'btn sec', onclick: () => detalle(p.id) }, 'Ver detalle'), botones(p)));

async function vPedidos(box) {
  const ps = await API.get('/api/pedidos');
  box.append(h('h2', {}, S.rol === 'CLIENTE' ? 'Mis pedidos' : 'Pedidos'),
    ...(ps.length ? ps.map(tarjetaPedido) : [vacio('Aún no hay pedidos.')]));
}
const detalle = id => safe(async () => {
  const p = await API.get('/api/pedidos/' + id);
  modal('Pedido #' + p.id, h('div', {}, badge(p.estado),
    tabla(['Producto', 'Cant.', 'Subtotal'], p.detalles.map(d => [d.producto, d.cantidad, Q(d.subtotal)])),
    h('div', { class: 'tot' }, h('span', {}, 'Subtotal'), Q(p.subtotal)),
    h('div', { class: 'tot' }, h('span', {}, 'Envío (' + p.distanciaKm.toFixed(1) + ' km)'), Q(p.costoEnvio)),
    h('div', { class: 'tot' }, h('span', {}, 'Descuento' + (p.codigoPromocion ? ' ' + p.codigoPromocion : '')), '-' + Q(p.descuento)),
    h('div', { class: 'tot g' }, h('span', {}, 'Total'), Q(p.total)),
    h('p', { class: 'mut' }, 'Entrega: ' + p.direccionEntrega), h('p', {}, p.seguimiento),
    h('h3', {}, 'Historial'), h('ul', { class: 'mut' }, p.historial.map(x => h('li', {}, x)))));
});

/* ---------- CLIENTE ---------- */
let cart = {};
async function vComercios(box) {
  const cs = await API.get('/api/comercios');
  box.append(h('h2', {}, 'Comercios abiertos'), h('div', { class: 'grid' }, cs.length ? cs.map(c => h('div', { class: 'card' },
    h('h3', {}, c.nombre), h('div', { class: 'mut' }, `${c.direccion || ''} · ${c.zona || ''}`),
    h('div', {}, `★ ${c.calificacion.toFixed(1)} (${c.totalCalificaciones}) · ${c.tiempoPreparacionMin} min`),
    h('div', { class: 'acc' }, h('button', { class: 'btn', onclick: () => abrirMenu(c) }, 'Ver menú')))) : [vacio('No hay comercios abiertos.')]));
}
function abrirMenu(c) {
  cart = {}; S.tab = 'menu';
  const box = $('#box'); box.replaceChildren();
  safe(() => vMenu(box, c));
}
async function vMenu(box, c) {
  const [prods, promos] = await Promise.all([API.get(`/api/comercios/${c.id}/productos`), API.get('/api/promociones')]);
  const f = {};
  const campo = (k, l, t = 'text', v = '') => [h('label', {}, l), f[k] = h('input', { type: t, value: v, step: 'any', oninput: resumen })];
  const res = h('div');
  function resumen() {
    const sub = Object.values(cart).reduce((s, x) => s + x.p.precio * x.n, 0);
    const km = haversine(c.latitud, c.longitud, +f.lat.value, +f.lon.value), envio = 10 + 2.5 * km;
    res.replaceChildren(h('div', { class: 'tot' }, h('span', {}, 'Subtotal'), Q(sub)),
      h('div', { class: 'tot' }, h('span', {}, `Envío estimado (${km.toFixed(1)} km)`), Q(envio)),
      h('div', { class: 'tot g' }, h('span', {}, 'Total estimado'), Q(sub + envio)),
      h('p', { class: 'mut' }, 'El descuento y el total final los calcula el servidor al confirmar.'));
    if (f.mto && !f.mto.dataset.t) f.mto.value = (sub + envio).toFixed(2);
  }
  const lista = prods.map(p => {
    const n = h('b', {}, '0');
    const mover = d => () => { const x = cart[p.id] || (cart[p.id] = { p, n: 0 }); x.n = Math.max(0, x.n + d); n.textContent = x.n; resumen(); };
    return h('div', { class: 'card row' }, h('div', {}, h('b', {}, p.nombre), h('div', { class: 'mut' }, p.descripcion || '')), Q(p.precio),
      h('div', { class: 'qty' }, h('button', { class: 'btn sec', onclick: mover(-1) }, '−'), n, h('button', { class: 'btn sec', onclick: mover(1) }, '+')));
  });
  const gT = h('div', { hidden: true }, ...campo('num', 'Número de tarjeta'), ...campo('tit', 'Titular'), ...campo('ven', 'Vence (MM/yy)'), ...campo('cvv', 'CVV', 'password'));
  const gX = h('div', { hidden: true }, ...campo('ref', 'Referencia (6-20 letras/números)'), ...campo('mto', 'Monto transferido', 'number'));
  f.mto.addEventListener('keydown', () => f.mto.dataset.t = 1);   // si el cliente escribe el monto, ya no se autocompleta
  const pago = h('select', { onchange: () => { gT.hidden = pago.value !== 'TARJETA'; gX.hidden = pago.value !== 'TRANSFERENCIA'; } },
    ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'].map(m => h('option', { value: m }, m)));
  const dl = h('datalist', { id: 'promos' }, promos.map(p => h('option', { value: p.codigo }, p.descripcion)));
  const gps = () => navigator.geolocation
    ? navigator.geolocation.getCurrentPosition(x => { f.lat.value = x.coords.latitude; f.lon.value = x.coords.longitude; resumen(); }, () => toast('No se pudo obtener tu ubicación', true))
    : toast('Tu navegador no permite geolocalización', true);
  const enviar = () => safe(async () => {
    const items = Object.values(cart).filter(x => x.n > 0).map(x => ({ productoId: x.p.id, cantidad: x.n }));
    if (!items.length) throw new Error('Agrega al menos un producto');
    const d = { metodo: pago.value };
    if (d.metodo === 'TARJETA') Object.assign(d, { numeroTarjeta: f.num.value.replace(/\s/g, ''), titular: f.tit.value, vencimiento: f.ven.value, cvv: f.cvv.value });
    if (d.metodo === 'TRANSFERENCIA') Object.assign(d, { referencia: f.ref.value, montoTransferido: Number(f.mto.value) });
    const p = await API.post('/api/pedidos', { comercioId: c.id, items, direccionEntrega: f.dir.value, latEntrega: +f.lat.value, lonEntrega: +f.lon.value, codigoPromocion: f.promo.value || null, pago: d });
    toast(`Pedido #${p.id} creado. Total ${Q(p.total)}`); cart = {}; go('pedidos');
  });
  box.append(h('div', { class: 'row' }, h('h2', {}, c.nombre), h('button', { class: 'btn sec', onclick: () => go('comercios') }, '← Comercios')),
    ...(lista.length ? lista : [vacio('Este comercio no tiene productos disponibles.')]),
    h('div', { class: 'card' }, h('h3', {}, 'Entrega y pago'),
      ...campo('dir', 'Dirección de entrega', 'text', 'Zona 1, Amatitlán'),
      h('div', { class: 'f2' }, h('div', {}, ...campo('lat', 'Latitud', 'number', c.latitud + 0.003)), h('div', {}, ...campo('lon', 'Longitud', 'number', c.longitud + 0.003))),
      h('div', { class: 'acc' }, h('button', { class: 'btn sec', onclick: gps }, 'Usar mi ubicación')),
      h('label', {}, 'Código de promoción (opcional)'), (f.promo = h('input', { list: 'promos', placeholder: 'BIENVENIDO10' })), dl,
      h('label', {}, 'Método de pago'), pago, gT, gX, res,
      h('div', { class: 'acc' }, h('button', { class: 'btn', onclick: enviar }, 'Confirmar pedido'))));
  resumen();
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
setInterval(() => {   // refresco automático de pedidos cada 15 s (si no hay un formulario abierto)
  if (S.rol && ['pedidos', 'prioridad', 'entregas'].includes(S.tab) && !document.querySelector('.ov') && !document.hidden) go(S.tab, true);
}, 15000);
(async () => {
  if (!API.token) return pantallaLogin();
  try { const me = await API.get('/api/auth/me'); iniciarSesion(me.rol, me.nombre); }
  catch { pantallaLogin(); }
})();
