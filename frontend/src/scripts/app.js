import { API } from './api.js';
import { Maps } from './maps.js';
import {
  $, h, ico, Q, fecha, iniciales, badge, stepper, toast, modal, confirmar, formModal as fm, campoEl, tabla, vacio,
  pageHead, skeleton, pill, haversine, cover, pausa, ESTADOS
} from './ui.js';

const S = { rol: null, nombre: null, tab: null };

async function safe(fn) {
  try { return await fn(); }
  catch (e) { toast(e.message, true); if (!API.token && S.rol && S.rol !== 'INVITADO') modoInvitado(); }
}
const formModal = (t, c, f, b) => fm(t, c, f, b, safe);
const refrescar = () => go(S.tab, true);

const INV = {
  lista() { try { return JSON.parse(localStorage.getItem('pedidosInvitado') || '[]'); } catch { return []; } },
  guardar(id, codigo) {
    const l = this.lista().filter(x => x.id !== id); l.unshift({ id, codigo });
    localStorage.setItem('pedidosInvitado', JSON.stringify(l.slice(0, 20)));
  },
  quitar(id) { localStorage.setItem('pedidosInvitado', JSON.stringify(this.lista().filter(x => x.id !== id))); }
};

const ROLES = { INVITADO: 'Sin cuenta', CLIENTE: 'Cliente', COMERCIO: 'Comercio', REPARTIDOR: 'Repartidor', ADMIN: 'Administrador' };

function pintarUsuario() {
  const inv = S.rol === 'INVITADO';
  $('#user-name').textContent = inv ? 'Invitado' : S.nombre;
  $('#user-rol').textContent = ROLES[S.rol] || S.rol;
  $('#avatar').textContent = inv ? '' : iniciales(S.nombre);
  if (inv) $('#avatar').replaceChildren(ico('user'));
  $('#sb-rol').textContent = inv ? 'Explorar' : 'Panel · ' + ROLES[S.rol];
  $('#salir').hidden = inv; $('#entrar').hidden = !inv;
}
function modoInvitado() {
  S.rol = 'INVITADO'; S.nombre = null;
  pintarUsuario(); montarTabs(); go('comercios');
}

function pantallaLogin() {
  S.tab = 'login'; cerrarMenu();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('on'));
  const email = h('input', { type: 'email', placeholder: 'correo@ejemplo.com', autocomplete: 'username' });
  const pass = h('input', { type: 'password', placeholder: '••••••••', autocomplete: 'current-password' });
  const btn = h('button', { class: 'btn btn-lg btn-block', type: 'submit' }, 'Ingresar');
  const entrar = async e => {
    e.preventDefault();
    btn.disabled = true; btn.replaceChildren(h('span', { class: 'spin' }), 'Ingresando…');
    try { const r = await API.login(email.value.trim(), pass.value); iniciarSesion(r.rol, r.nombre); toast('Hola, ' + r.nombre); }
    catch (err) { toast(err.message, true); }
    finally { btn.disabled = false; btn.textContent = 'Ingresar'; }
  };
  const punto = (i, t, d) => h('li', {}, h('span', { class: 'auth-ico' }, ico(i)), h('div', {}, h('b', {}, t), h('small', {}, d)));
  $('#box').replaceChildren(h('section', { class: 'auth' },
    h('div', { class: 'auth-side' },
      h('small', { class: 'eyebrow light' }, 'SmartDelivery 360'),
      h('h2', {}, 'Todo tu delivery en un solo lugar'),
      h('p', {}, 'Un panel para cada rol: clientes, comercios, repartidores y administración.'),
      h('ul', { class: 'auth-list' },
        punto('bag', 'Clientes', 'Pide, paga y sigue tu pedido'),
        punto('store', 'Comercios', 'Gestiona pedidos y catálogo'),
        punto('truck', 'Repartidores', 'Rutas y cobros en la calle'),
        punto('chart', 'Administración', 'Reportes, zonas y promociones'))),
    h('form', { class: 'auth-form', onsubmit: entrar },
      h('h1', {}, 'Ingresar'),
      h('p', { class: 'lead' }, 'La cuenta es opcional para pedir. Ingresa si eres cliente registrado, comercio, repartidor o administrador.'),
      campoEl('Correo', email), campoEl('Contraseña', pass), btn,
      h('div', { class: 'auth-alt' },
        h('button', { type: 'button', class: 'btn btn-sec btn-block', onclick: formRegistro }, 'Crear cuenta de cliente'),
        S.rol === 'INVITADO' ? h('button', { type: 'button', class: 'link', onclick: () => go('comercios') }, 'Seguir sin cuenta') : null))));
  email.focus();
}
function formRegistro() {
  formModal('Crear cuenta de cliente', [
    { n: 'nombre', l: 'Nombre' }, { n: 'email', l: 'Correo', t: 'email' },
    { n: 'password', l: 'Contraseña (mínimo 6)', t: 'password' }, { n: 'telefono', l: 'Teléfono' }],
  async d => { await API.post('/api/auth/registro', d); toast('Cuenta creada: ya puedes ingresar'); }, 'Crear cuenta');
}

const TABS = {
  INVITADO: [['comercios', 'Comercios', vComercios, 'store'], ['rastrear', 'Rastrear mi pedido', vRastrear, 'search']],
  CLIENTE: [['comercios', 'Comercios', vComercios, 'store'], ['pedidos', 'Mis pedidos', vPedidos, 'package']],
  COMERCIO: [['pedidos', 'Pedidos', vPedidos, 'package'], ['prioridad', 'Prioridad', vPrioridad, 'bolt'], ['catalogo', 'Mi catálogo', vCatalogo, 'book']],
  REPARTIDOR: [['entregas', 'Mis entregas', vRepartidor, 'truck']],
  ADMIN: [['reporte', 'Reporte', vReporte, 'chart'], ['pedidos', 'Pedidos', vPedidos, 'package'], ['prioridad', 'Prioridad', vPrioridad, 'bolt'],
    ['usuarios', 'Usuarios', vUsuarios, 'users'], ['comercios', 'Comercios', vAdminComercios, 'store'],
    ['zonas', 'Zonas', vZonas, 'map'], ['promos', 'Promociones', vPromos, 'tag']]
};
function montarTabs() {
  $('#tabs').replaceChildren(...TABS[S.rol].map(([k, t, , i]) => h('button', { 'data-k': k, onclick: () => go(k) }, ico(i), h('span', {}, t))));
}
function iniciarSesion(rol, nombre) {
  S.rol = rol; S.nombre = nombre;
  pintarUsuario(); montarTabs();
  go(TABS[rol][0][0]);
}
async function go(k, silencioso) {
  S.tab = k; cerrarMenu();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
  const vista = TABS[S.rol].find(t => t[0] === k)[2];
  if (!silencioso) { $('#box').replaceChildren(skeleton()); window.scrollTo({ top: 0 }); }
  await safe(async () => {
    const nuevo = h('div', { class: 'view' });
    await vista(nuevo);
    if (S.tab === k) $('#box').replaceChildren(nuevo);
  });
}

const abrirMenuLat = () => document.body.classList.add('menu-open');
const cerrarMenu = () => document.body.classList.remove('menu-open');

const ACC = {
  COMERCIO: { CREADO: [['CONFIRMADO', 'Aceptar'], ['RECHAZADO', 'Rechazar']], CONFIRMADO: [['EN_PREPARACION', 'Preparar']], EN_PREPARACION: [['LISTO', 'Marcar listo']] },
  CLIENTE: { CREADO: [['CANCELADO', 'Cancelar']], CONFIRMADO: [['CANCELADO', 'Cancelar']] },
  REPARTIDOR: { LISTO: [['EN_CAMINO', 'Salir a entregar']], EN_CAMINO: [['ENTREGADO', 'Marcar entregado']] }
};
ACC.ADMIN = {};
Object.values(ACC).slice(0, 3).forEach(m => Object.entries(m).forEach(([e, l]) => ACC.ADMIN[e] = (ACC.ADMIN[e] || []).concat(l)));

const activo = p => !['ENTREGADO', 'CANCELADO', 'RECHAZADO'].includes(p.estado);

const cambiar = async (p, estado) => {
  if (['CANCELADO', 'RECHAZADO'].includes(estado)) {
    const v = estado === 'CANCELADO' ? 'cancelar' : 'rechazar';
    if (!await confirmar(`¿${v[0].toUpperCase() + v.slice(1)} el pedido #${p.id}?`, 'Esta acción no se puede deshacer. Si el pedido ya fue cobrado, el pago se reembolsa.', 'Sí, ' + v)) return;
  }
  return safe(async () => { await API.put(`/api/pedidos/${p.id}/estado`, { estado }); toast(`Pedido #${p.id}: ${ESTADOS[estado]}`); refrescar(); });
};
function entregar(p) {
  if (p.metodoPago !== 'EFECTIVO' || p.estadoPago !== 'PENDIENTE') return cambiar(p, 'ENTREGADO');
  const rec = h('input', { type: 'number', step: '0.01', min: p.total, value: Number(p.total).toFixed(2), class: 'input-lg' });
  const vuelto = h('div', { class: 'change' });
  const calc = () => {
    const c = Number(rec.value) - p.total;
    vuelto.className = 'change' + (c < 0 ? ' neg' : '');
    vuelto.replaceChildren(h('span', {}, c >= 0 ? 'Cambio a entregar' : 'Falta por cobrar'), h('b', {}, Q(Math.abs(c))));
  };
  rec.addEventListener('input', calc); calc();
  let o;
  const confirmarEntrega = () => safe(async () => {
    await API.put(`/api/pedidos/${p.id}/estado`, { estado: 'ENTREGADO', efectivoRecibido: Number(rec.value) });
    o.remove(); toast(`Pedido #${p.id} entregado y cobrado`); refrescar();
  });
  o = modal('Entrega y cobro en efectivo',
    h('div', {}, h('div', { class: 'charge' }, h('small', {}, 'Cobrar al cliente'), h('b', {}, Q(p.total))),
      h('p', { class: 'muted' }, 'El pago se marcará como completado al confirmar la entrega.'),
      campoEl('Efectivo recibido (Q)', rec), vuelto),
    [h('button', { class: 'btn', onclick: confirmarEntrega }, ico('check'), 'Confirmar entrega y cobro')], { sub: 'Pedido #' + p.id });
}
const asignar = p => safe(async () => {
  const r = await API.post(`/api/pedidos/${p.id}/asignar-repartidor`);
  toast(r.mensaje, !r.asignado); refrescar();
});
function calificar(p, codigo) {
  const nota = n => ({ n, l: n === 'puntajeComercio' ? 'Comercio' : 'Repartidor', opts: [5, 4, 3, 2, 1].map(x => [x, '★'.repeat(x) + '☆'.repeat(5 - x) + '  ' + x]), v: 5 });
  formModal('Calificar pedido #' + p.id, [nota('puntajeComercio'), nota('puntajeRepartidor'), { n: 'comentario', l: 'Comentario (opcional)' }],
    async d => {
      const cuerpo = { pedidoId: p.id, puntajeComercio: +d.puntajeComercio, puntajeRepartidor: +d.puntajeRepartidor, comentario: d.comentario };
      await (codigo ? API.post(`/api/publico/pedidos/${p.id}/calificar?codigo=${encodeURIComponent(codigo)}`, cuerpo) : API.post('/api/calificaciones', cuerpo));
      toast('¡Gracias por calificar!'); refrescar();
    }, 'Enviar calificación');
}
function botones(p) {
  const b = (ACC[S.rol][p.estado] || []).map(([e, t]) =>
    h('button', { class: 'btn ' + (/CANCEL|RECHAZ/.test(e) ? 'btn-danger-soft' : ''), onclick: () => e === 'ENTREGADO' ? entregar(p) : cambiar(p, e) }, t));
  if (['COMERCIO', 'ADMIN'].includes(S.rol) && !p.repartidorId && ['CONFIRMADO', 'EN_PREPARACION', 'LISTO'].includes(p.estado))
    b.push(h('button', { class: 'btn btn-sec', onclick: () => asignar(p) }, ico('truck'), 'Asignar repartidor'));
  if (S.rol === 'CLIENTE' && p.estado === 'ENTREGADO' && !p.calificado)
    b.push(h('button', { class: 'btn btn-amber', onclick: () => calificar(p) }, ico('star'), 'Calificar'));
  return b;
}

const pagoTxt = p => {
  const desc = p.pago ? p.pago.descripcion : p.metodoPago;
  const est = { PENDIENTE: p.metodoPago === 'EFECTIVO' ? 'se cobra al entregar' : 'pendiente', COMPLETADO: 'pagado', REEMBOLSADO: 'reembolsado', ANULADO: 'anulado' }[p.estadoPago] || p.estadoPago;
  return `${desc} · ${est}`;
};
const metodoIco = m => ({ TARJETA: 'card', EFECTIVO: 'cash', TRANSFERENCIA: 'bank' })[m] || 'card';
const enlace = (txt, url, cls = 'btn btn-sec', i) => h('a', { class: cls, href: url, target: '_blank', rel: 'noopener' }, i ? ico(i) : null, txt);
const enlacesMapa = p => [
  enlace('Ir a la entrega', Maps.urlRuta(p.latEntrega, p.lonEntrega), 'btn', 'nav'),
  enlace('Ir al comercio', Maps.urlRuta(p.comercioLat, p.comercioLon), 'btn btn-sec', 'store')
];
const meta = (i, txt) => h('span', { class: 'meta' }, ico(i), txt);

const tarjetaPedido = p => {
  const staff = ['COMERCIO', 'ADMIN', 'REPARTIDOR'].includes(S.rol);
  const cobrar = p.metodoPago === 'EFECTIVO' && p.estadoPago === 'PENDIENTE' && activo(p);
  return h('article', { class: 'card order' + (activo(p) ? '' : ' closed') },
    h('header', { class: 'order-head' },
      h('div', { class: 'order-title' }, h('span', { class: 'order-id' }, '#' + p.id), h('div', {}, h('b', {}, p.comercioNombre),
        h('small', {}, fecha(p.fechaCreacion)))),
      h('div', { class: 'order-total' }, badge(p.estado), h('b', {}, Q(p.total)))),
    stepper(p.estado),
    h('div', { class: 'order-meta' },
      meta('user', p.clienteNombre + (p.invitado ? ' (sin cuenta)' : '')),
      meta(metodoIco(p.metodoPago), h('span', { class: 'pg pg-' + p.estadoPago }, pagoTxt(p))),
      meta('truck', p.repartidorNombre ? `${p.repartidorNombre} · ${p.tipoVehiculo}` : 'Sin repartidor asignado'),
      staff ? meta('pin', p.direccionEntrega + (p.notasEntrega ? ' — ' + p.notasEntrega : '')) : null,
      S.rol === 'REPARTIDOR' && p.telefonoContacto ? meta('phone', h('a', { href: 'tel:' + p.telefonoContacto }, p.telefonoContacto)) : null),
    cobrar && S.rol === 'REPARTIDOR' ? h('div', { class: 'callout warn' }, ico('cash'), `Cobrar ${Q(p.total)} en efectivo al entregar`) : null,
    h('footer', { class: 'actions' }, h('button', { class: 'btn btn-sec', onclick: () => detalle(p.id) }, ico('eye'), 'Ver detalle'), botones(p),
      staff && activo(p) ? enlacesMapa(p) : null));
};

async function vPedidos(box) {
  const ps = await API.get('/api/pedidos');
  const act = ps.filter(activo), hist = ps.filter(p => !activo(p));
  const titulo = S.rol === 'CLIENTE' ? 'Mis pedidos' : 'Pedidos';
  box.append(pageHead(titulo, S.rol === 'CLIENTE' ? 'Sigue el estado de tus pedidos en tiempo real.' : 'Gestiona el flujo de pedidos de principio a fin.'));
  if (!ps.length) return box.append(vacio('Aún no hay pedidos.', 'package',
    S.rol === 'CLIENTE' ? h('button', { class: 'btn', onclick: () => go('comercios') }, 'Explorar comercios') : null));
  const seccion = (t, l) => l.length ? [h('h2', { class: 'section-title' }, t, h('span', { class: 'count' }, l.length)), h('div', { class: 'stack' }, l.map(tarjetaPedido))] : [];
  box.append(...seccion('En curso', act), ...seccion('Historial', hist));
}

const fila = (k, v) => h('div', { class: 'line' }, h('span', {}, k), h('span', {}, v));
function detalleModal(p) {
  const pg = p.pago || {};
  const lineasPago = Object.entries(pg.detalle || {}).map(([k, v]) => fila(k, v));
  if (pg.idTransaccion) lineasPago.push(fila('N.º de transacción', pg.idTransaccion));
  if (pg.fechaProcesado) lineasPago.push(fila('Fecha del cobro', fecha(pg.fechaProcesado)));
  if (pg.idReembolso) lineasPago.push(fila('N.º de reembolso', pg.idReembolso));
  const src = (p.latEntrega || p.lonEntrega)
    ? Maps.embedRuta({ lat: p.comercioLat, lon: p.comercioLon }, { lat: p.latEntrega, lon: p.lonEntrega }) : null;
  const staff = ['COMERCIO', 'ADMIN', 'REPARTIDOR'].includes(S.rol);
  modal('Pedido #' + p.id, h('div', { class: 'detail' },
    h('div', { class: 'detail-top' }, badge(p.estado), h('span', { class: 'muted' }, p.comercioNombre)),
    stepper(p.estado),
    h('div', { class: 'detail-grid' },
      h('section', {},
        h('h4', {}, 'Productos'),
        tabla(['Producto', 'Cant.', 'Subtotal'], p.detalles.map(d => [d.producto, d.cantidad, Q(d.subtotal)])),
        h('div', { class: 'totals' },
          fila('Subtotal', Q(p.subtotal)),
          fila('Envío (' + p.distanciaKm.toFixed(1) + ' km)', Q(p.costoEnvio)),
          fila('Descuento' + (p.codigoPromocion ? ' · ' + p.codigoPromocion : ''), '-' + Q(p.descuento)),
          h('div', { class: 'line total' }, h('span', {}, 'Total'), h('span', {}, Q(p.total)))),
        h('h4', {}, 'Pago'),
        h('div', { class: 'receipt' }, fila('Estado', pagoTxt(p)), ...lineasPago)),
      h('section', {},
        h('h4', {}, 'Entrega'),
        h('p', { class: 'addr' }, ico('pin'), h('span', {}, p.direccionEntrega + (p.notasEntrega ? ' — ' + p.notasEntrega : ''))),
        h('p', { class: 'addr' }, ico('user'), h('span', {}, `${p.clienteNombre}${p.telefonoContacto ? ' · ' + p.telefonoContacto : ''}`)),
        src ? h('iframe', { class: 'map-embed', src, loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade', allowfullscreen: true }) : null,
        h('div', { class: 'actions' }, staff ? enlacesMapa(p) : enlace('Ver destino en Google Maps', Maps.urlLugar(p.latEntrega, p.lonEntrega), 'btn btn-sec', 'map')),
        p.seguimiento ? h('div', { class: 'callout info' }, ico('info'), p.seguimiento) : null,
        h('h4', {}, 'Historial'),
        h('ol', { class: 'timeline' }, p.historial.map(x => h('li', {}, x)))))),
  [], { grande: true, sub: p.comercioNombre });
}
const detalle = id => safe(async () => detalleModal(await API.get('/api/pedidos/' + id)));

let cart = {};
async function vComercios(box) {
  const cs = await API.get('/api/comercios');
  const grid = h('div', { class: 'stores' });
  const pintar = q => {
    const f = cs.filter(c => (c.nombre + ' ' + (c.zona || '') + ' ' + (c.direccion || '')).toLowerCase().includes(q.toLowerCase()));
    grid.replaceChildren(...(f.length ? f.map(c => h('button', { class: 'store', onclick: () => abrirMenu(c) },
      cover(c.nombre, c.id),
      h('div', { class: 'store-body' },
        h('div', { class: 'store-row' }, h('h3', {}, c.nombre), h('span', { class: 'rating' }, ico('star'), c.calificacion.toFixed(1))),
        h('p', { class: 'muted' }, [c.direccion, c.zona].filter(Boolean).join(' · ') || 'Sin dirección'),
        h('div', { class: 'store-foot' }, meta('clock', c.tiempoPreparacionMin + ' min'), meta('users', c.totalCalificaciones + ' reseñas'),
          h('span', { class: 'store-cta' }, 'Ver menú', ico('back', 'flip')))))) : [vacio(cs.length ? 'Ningún comercio coincide con tu búsqueda.' : 'No hay comercios abiertos en este momento.', 'store')]));
  };
  const buscar = h('input', { type: 'search', placeholder: 'Busca un comercio o una zona', oninput: () => pintar(buscar.value), 'aria-label': 'Buscar comercios' });
  const feat = (i, t) => h('li', {}, ico(i), t);
  box.append(h('section', { class: 'hero' },
    h('div', { class: 'hero-txt' },
      h('small', { class: 'eyebrow light' }, S.rol === 'CLIENTE' ? 'Hola, ' + S.nombre : 'Delivery a domicilio'),
      h('h1', {}, 'Tu comida favorita, ', h('span', {}, 'en camino.')),
      h('p', {}, S.rol === 'INVITADO' ? 'Pide sin crear cuenta. Al terminar recibes un código para rastrear tu pedido.' : 'Elige un comercio, arma tu pedido y síguelo en tiempo real.'),
      h('label', { class: 'hero-search' }, ico('search'), buscar),
      h('ul', { class: 'hero-feats' }, feat('shield', 'Pago seguro con 3-D Secure'), feat('clock', 'Seguimiento en vivo'), feat('bag', 'Sin cuenta obligatoria'))),
    h('div', { class: 'hero-art', 'aria-hidden': 'true' },
      h('div', { class: 'hero-card c1' }, ico('store'), h('div', {}, h('b', {}, cs.length + ' comercios'), h('small', {}, 'abiertos ahora'))),
      h('div', { class: 'hero-card c2' }, ico('truck'), h('div', {}, h('b', {}, 'En camino'), h('small', {}, 'Tu pedido llega pronto'))),
      h('div', { class: 'hero-card c3' }, ico('check'), h('div', {}, h('b', {}, 'Pago aprobado'), h('small', {}, 'Tarjeta · Visa'))))),
    h('div', { class: 'section-head' }, h('h2', { class: 'section-title' }, 'Comercios abiertos', h('span', { class: 'count' }, cs.length))),
    grid);
  pintar('');
}
function abrirMenu(c) {
  cart = {}; S.tab = 'menu';
  window.scrollTo({ top: 0 });
  const box = $('#box'); box.replaceChildren(skeleton());
  const v = h('div', { class: 'view' });
  safe(async () => { await vMenu(v, c); box.replaceChildren(v); });
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
  const ub = { lat: c.latitud + 0.003, lon: c.longitud + 0.003 };
  const f = {};
  const campo = (k, l, t = 'text', v = '', extra = {}) => campoEl(l, f[k] = h('input', { type: t, value: v, ...extra }));
  const res = h('div', { class: 'totals' });
  const lineas = h('div', { class: 'cart-lines' });
  const btn = h('button', { class: 'btn btn-lg btn-block', onclick: () => enviar() }, 'Confirmar pedido');
  const barra = h('div', { class: 'mobile-bar', hidden: true });
  let selector = null, metodo = 'TARJETA';

  const totales = () => {
    const sub = Object.values(cart).reduce((s, x) => s + x.p.precio * x.n, 0);
    const km = haversine(c.latitud, c.longitud, ub.lat, ub.lon), envio = 10 + 2.5 * km;
    return { sub, km, envio, total: sub + envio };
  };
  function etiquetaBoton() {
    btn.replaceChildren(...(metodo === 'TARJETA' ? [ico('lock'), `Pagar ${Q(totales().total)}`] : ['Confirmar pedido']));
  }
  function resumen() {
    const t = totales();
    const items = Object.values(cart).filter(x => x.n > 0);
    const unidades = items.reduce((s, x) => s + x.n, 0);
    lineas.replaceChildren(...(items.length
      ? items.map(x => h('div', { class: 'cart-line' }, h('span', { class: 'qty-chip' }, x.n + '×'), h('span', {}, x.p.nombre), h('b', {}, Q(x.p.precio * x.n))))
      : [h('p', { class: 'cart-empty' }, ico('bag'), 'Agrega productos del menú')]));
    res.replaceChildren(...[fila('Subtotal', Q(t.sub)), fila(`Envío estimado (${t.km.toFixed(1)} km)`, Q(t.envio)),
      h('div', { class: 'line total' }, h('span', {}, 'Total estimado'), h('span', {}, Q(t.total))),
      t.km > 30 ? h('div', { class: 'callout warn' }, ico('alert'), 'Esta ubicación está a más de 30 km del comercio: queda fuera del área de entrega.') : null,
      h('small', { class: 'help' }, 'El descuento y el total final los calcula el servidor al confirmar.')].filter(Boolean));
    if (f.mto && !f.mto.dataset.t) f.mto.value = (t.sub + t.envio).toFixed(2);
    barra.hidden = !unidades;
    barra.replaceChildren(h('span', {}, h('b', {}, unidades + (unidades === 1 ? ' producto' : ' productos')), h('small', {}, Q(t.total))),
      h('button', { class: 'btn', onclick: () => $('#checkout').scrollIntoView({ behavior: 'smooth' }) }, 'Ver pedido'));
    etiquetaBoton();
  }

  const lista = prods.map(p => {
    const n = h('b', { class: 'qty-n' }, '0');
    const fila = h('div', { class: 'product' });
    const mover = d => () => {
      const x = cart[p.id] || (cart[p.id] = { p, n: 0 }); x.n = Math.max(0, x.n + d);
      n.textContent = x.n; fila.classList.toggle('in', x.n > 0); resumen();
    };
    fila.append(h('div', { class: 'product-info' }, h('b', {}, p.nombre), h('p', { class: 'muted' }, p.descripcion || ''), h('span', { class: 'price' }, Q(p.precio))),
      h('div', { class: 'stepper-qty' }, h('button', { class: 'qbtn', 'aria-label': 'Quitar', onclick: mover(-1) }, ico('minus')), n,
        h('button', { class: 'qbtn add', 'aria-label': 'Agregar', onclick: mover(1) }, ico('plus'))));
    return fila;
  });

  const coords = h('small', { class: 'help coords' });
  const mostrarCoords = () => { coords.replaceChildren(ico('pin'), `Ubicación elegida: ${ub.lat.toFixed(5)}, ${ub.lon.toFixed(5)}`); };
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
  const mapaBox = h('div', { class: 'map-box' });
  const manual = h('div', { class: 'f2' },
    campo('lat', 'Latitud', 'number', ub.lat.toFixed(5), { step: 'any', oninput: () => { ub.lat = +f.lat.value; mostrarCoords(); resumen(); } }),
    campo('lon', 'Longitud', 'number', ub.lon.toFixed(5), { step: 'any', oninput: () => { ub.lon = +f.lon.value; mostrarCoords(); resumen(); } }));

  const marca = h('span', { class: 'brand-chip' });
  const formatoNumero = () => {
    const d = f.num.value.replace(/\D/g, '').slice(0, 19), amex = /^3[47]/.test(d);
    f.num.value = amex ? [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ') : (d.match(/.{1,4}/g) || []).join(' ');
    marca.textContent = marcaDe(d);
    marca.hidden = !marca.textContent;
    f.cvv.maxLength = amex ? 4 : 3;
  };
  const formatoVence = () => {
    let d = f.ven.value.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) d = d.slice(0, 2) + '/' + d.slice(2);
    f.ven.value = d;
  };
  marca.hidden = true;
  const gT = h('div', { class: 'card-form' }, h('div', { class: 'card-form-head' }, h('span', {}, ico('card'), 'Datos de la tarjeta'), marca),
    campo('num', 'Número de tarjeta', 'text', '', { inputmode: 'numeric', autocomplete: 'cc-number', placeholder: '1234 5678 9012 3456', maxlength: 23, oninput: formatoNumero }),
    campo('tit', 'Nombre del titular', 'text', '', { autocomplete: 'cc-name', placeholder: 'COMO APARECE EN LA TARJETA', oninput: () => { f.tit.value = f.tit.value.toUpperCase(); } }),
    h('div', { class: 'f2' },
      campo('ven', 'Vencimiento', 'text', '', { inputmode: 'numeric', autocomplete: 'cc-exp', placeholder: 'MM/AA', maxlength: 5, oninput: formatoVence }),
      campo('cvv', 'CVV', 'password', '', { inputmode: 'numeric', autocomplete: 'cc-csc', maxlength: 4, placeholder: '•••' })),
    h('small', { class: 'help secure' }, ico('lock'), 'Pasarela simulada: no se hace ningún cargo real y los datos de la tarjeta no se guardan.'));
  const gX = h('div', { class: 'stack-sm', hidden: true }, campo('ref', 'Referencia (6-20 letras/números)'), campo('mto', 'Monto transferido', 'number'));
  const gE = h('div', { class: 'callout warn', hidden: true }, ico('cash'),
    'Pagas en efectivo al repartidor cuando recibas tu pedido. Aparecerá como pendiente y se marcará como pagado cuando el repartidor confirme la entrega.');
  f.mto.addEventListener('keydown', () => { f.mto.dataset.t = 1; });
  const metodos = [['TARJETA', 'Tarjeta', 'card'], ['EFECTIVO', 'Efectivo', 'cash'], ['TRANSFERENCIA', 'Transferencia', 'bank']];
  const seg = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': 'Método de pago' });
  const elegir = v => {
    metodo = v;
    seg.querySelectorAll('button').forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    gT.hidden = v !== 'TARJETA'; gX.hidden = v !== 'TRANSFERENCIA'; gE.hidden = v !== 'EFECTIVO'; etiquetaBoton();
  };
  seg.append(...metodos.map(([v, t, i]) => h('button', { type: 'button', role: 'radio', 'data-v': v, onclick: () => elegir(v) }, ico(i), t)));
  const dl = h('datalist', { id: 'promos' }, promos.map(p => h('option', { value: p.codigo }, p.descripcion)));

  const construir = () => {
    const items = Object.values(cart).filter(x => x.n > 0).map(x => ({ productoId: x.p.id, cantidad: x.n }));
    if (!items.length) throw new Error('Agrega al menos un producto');
    if (!f.nom.value.trim()) throw new Error('Escribe el nombre de quien recibe el pedido');
    if (!f.tel.value.trim()) throw new Error('Escribe un teléfono de contacto');
    if (!f.dir.value.trim()) throw new Error('Escribe o elige en el mapa la dirección de entrega');
    const d = { metodo };
    if (d.metodo === 'TARJETA') Object.assign(d, { numeroTarjeta: f.num.value.replace(/\s/g, ''), titular: f.tit.value, vencimiento: f.ven.value, cvv: f.cvv.value });
    if (d.metodo === 'TRANSFERENCIA') Object.assign(d, { referencia: f.ref.value, montoTransferido: Number(f.mto.value) });
    return { comercioId: c.id, items, direccionEntrega: f.dir.value, latEntrega: ub.lat, lonEntrega: ub.lon,
      notasEntrega: f.notas.value || null, nombreContacto: f.nom.value, telefonoContacto: f.tel.value, emailContacto: f.mail.value || null,
      codigoPromocion: f.promo.value || null, pago: d };
  };
  async function enviar() {
    let body;
    try { body = construir(); } catch (e) { return toast(e.message, true); }
    const tarjeta = metodo === 'TARJETA';
    btn.disabled = true;
    btn.replaceChildren(h('span', { class: 'spin' }), tarjeta ? 'Procesando pago…' : 'Enviando pedido…');
    try {
      const [p] = await Promise.all([API.post('/api/pedidos', body), pausa(tarjeta ? 1200 : 0)]);
      pedidoCreado(p);
    } catch (e) {
      if (e.data && e.data.requiere3ds) pedir3ds(e.data, body); else toast(e.message, true);
    } finally { btn.disabled = false; etiquetaBoton(); }
  }

  const paso = (n, t) => h('h3', { class: 'step-title' }, h('span', { class: 'step-n' }, n), t);
  box.append(
    h('button', { class: 'back', onclick: () => go('comercios') }, ico('back'), 'Comercios'),
    h('section', { class: 'store-hero' }, cover(c.nombre, c.id, 'big'),
      h('div', {}, h('h1', {}, c.nombre),
        h('div', { class: 'store-hero-meta' }, h('span', { class: 'rating' }, ico('star'), c.calificacion.toFixed(1), h('small', {}, ` (${c.totalCalificaciones})`)),
          meta('clock', c.tiempoPreparacionMin + ' min de preparación'), c.zona ? meta('map', c.zona) : null, c.direccion ? meta('pin', c.direccion) : null))),
    h('div', { class: 'checkout' },
      h('div', { class: 'checkout-main' },
        h('section', { class: 'card' }, paso(1, 'Elige tus productos'),
          h('div', { class: 'products' }, lista.length ? lista : vacio('Este comercio no tiene productos disponibles.', 'bag'))),
        h('section', { class: 'card' }, paso(2, 'Quién recibe'),
          S.rol === 'INVITADO' ? h('div', { class: 'callout info' }, ico('info'), 'Pides como invitado: no necesitas cuenta. Al terminar recibirás un código para rastrear tu pedido.') : null,
          h('div', { class: 'f2' },
            campo('nom', 'Nombre de quien recibe', 'text', yo ? yo.nombre : '', { autocomplete: 'name' }),
            campo('tel', 'Teléfono de contacto', 'tel', yo && yo.telefono ? yo.telefono : '', { autocomplete: 'tel' })),
          campo('mail', 'Correo (opcional, para avisos)', 'email', yo ? yo.email : '', { autocomplete: 'email' })),
        h('section', { class: 'card' }, h('div', { class: 'card-row' }, paso(3, 'Dónde entregamos'),
          h('button', { class: 'btn btn-sec btn-sm', onclick: gps }, ico('gps'), 'Usar mi ubicación')),
          mapaBox, coords,
          campo('dir', 'Dirección de entrega', 'text', '', { placeholder: 'Se completa al elegir en el mapa; puedes editarla', maxlength: 250 }),
          campo('notas', 'Indicaciones para el repartidor (opcional)', 'text', '', { placeholder: 'Casa azul, portón negro…', maxlength: 250 }))),
      h('aside', { class: 'checkout-side', id: 'checkout' },
        h('section', { class: 'card summary' },
          h('h3', { class: 'summary-title' }, ico('receipt'), 'Tu pedido'),
          lineas,
          h('div', { class: 'field' }, h('label', {}, 'Código de promoción'),
            h('div', { class: 'input-ico' }, ico('tag'), (f.promo = h('input', { list: 'promos', placeholder: 'BIENVENIDO10' })), dl)),
          h('div', { class: 'field' }, h('label', {}, 'Método de pago'), seg),
          gT, gX, gE, res, btn))),
    barra);
  elegir('TARJETA');
  mostrarCoords(); resumen();
  new IntersectionObserver(([e]) => barra.classList.toggle('away', e.isIntersecting)).observe(btn);

  const sinMapa = msg => mapaBox.replaceChildren(h('div', { class: 'callout warn' }, ico('map'), msg), manual);
  if (Maps.activo) {
    Maps.selector(mapaBox, ub, alUbicar).then(s => { selector = s; })
      .catch(e => sinMapa(e.message + '. Puedes usar "Usar mi ubicación" o escribir las coordenadas.'));
  } else {
    sinMapa('El mapa no está disponible (el servidor no tiene API key de Google Maps). Usa "Usar mi ubicación" o escribe las coordenadas.');
  }
}

function pedir3ds(info, body) {
  const cod = h('input', { inputmode: 'numeric', maxlength: '6', placeholder: '000000', autocomplete: 'one-time-code', class: 'otp' });
  const err = h('div', { class: 'err-inline' });
  const b = h('button', { class: 'btn', onclick: () => confirmar3ds() }, ico('shield'), 'Verificar y pagar');
  let o;
  const confirmar3ds = async () => {
    err.textContent = '';
    b.disabled = true;
    const cuerpo = { ...body, pago: { ...body.pago, desafioId: info.desafioId, codigo3ds: cod.value.trim() } };
    try {
      const [p] = await Promise.all([API.post('/api/pedidos', cuerpo), pausa(900)]);
      o.remove(); pedidoCreado(p);
    } catch (e) { err.textContent = e.message; } finally { b.disabled = false; }
  };
  cod.addEventListener('keydown', e => e.key === 'Enter' && confirmar3ds());
  o = modal('Verificación de tu banco', h('div', { class: 'tds' },
    h('span', { class: 'tds-ico' }, ico('shield')),
    h('p', {}, info.mensaje), campoEl('Código de verificación', cod), err,
    h('small', { class: 'help' }, 'Simulación: el código que enviaría el banco por SMS es 123456.')), [b], { sub: '3-D Secure' });
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
  const ok = p.estadoPago === 'COMPLETADO';
  modal('Pedido confirmado', h('div', { class: 'success' },
    h('span', { class: 'success-ico' }, ico('check')),
    h('p', { class: 'success-txt' }, `Tu pedido #${p.id} fue enviado a `, h('b', {}, p.comercioNombre), '.'),
    h('div', { class: 'callout ' + (ok ? 'ok' : 'warn') }, ico(ok ? 'check' : 'info'), ok ? 'Pago aprobado' : p.metodoPago === 'EFECTIVO'
      ? 'Pagarás en efectivo al repartidor. El pago se marcará como completado cuando entregue tu pedido.'
      : 'Pago pendiente de verificación.'),
    h('div', { class: 'receipt' }, h('div', { class: 'line total' }, h('span', {}, 'Total'), h('span', {}, Q(p.total))), ...lineas),
    p.codigoSeguimiento ? h('div', { class: 'track-code' }, h('small', {}, 'Tu código de seguimiento'), h('div', { class: 'code' }, p.codigoSeguimiento),
      h('small', { class: 'help' }, `Pedido #${p.id}. Guárdalo: también queda en este dispositivo, en "Rastrear mi pedido".`)) : null), [], { cerrarTxt: 'Listo' });
}

const tarjetaInvitado = (p, codigo) => {
  const acc = [h('button', { class: 'btn btn-sec', onclick: () => detalleModal(p) }, ico('eye'), 'Ver detalle')];
  if (['CREADO', 'CONFIRMADO'].includes(p.estado)) {
    acc.push(h('button', { class: 'btn btn-danger-soft', onclick: async () => {
      if (!await confirmar(`¿Cancelar el pedido #${p.id}?`, 'Si ya fue cobrado, el pago se reembolsa.', 'Sí, cancelar')) return;
      safe(async () => { await API.post(`/api/publico/pedidos/${p.id}/cancelar?codigo=${encodeURIComponent(codigo)}`); toast('Pedido cancelado'); refrescar(); });
    } }, 'Cancelar'));
  }
  if (p.estado === 'ENTREGADO' && !p.calificado) acc.push(h('button', { class: 'btn btn-amber', onclick: () => calificar(p, codigo) }, ico('star'), 'Calificar'));
  return h('article', { class: 'card order' + (activo(p) ? '' : ' closed') },
    h('header', { class: 'order-head' },
      h('div', { class: 'order-title' }, h('span', { class: 'order-id' }, '#' + p.id), h('div', {}, h('b', {}, p.comercioNombre), h('small', {}, fecha(p.fechaCreacion)))),
      h('div', { class: 'order-total' }, badge(p.estado), h('b', {}, Q(p.total)))),
    stepper(p.estado),
    h('div', { class: 'order-meta' },
      meta(metodoIco(p.metodoPago), h('span', { class: 'pg pg-' + p.estadoPago }, pagoTxt(p))),
      meta('truck', p.repartidorNombre ? `${p.repartidorNombre} · ${p.tipoVehiculo}` : 'Sin repartidor asignado'),
      meta('hash', 'Código ' + codigo)),
    h('footer', { class: 'actions' }, acc));
};
async function vRastrear(box) {
  const id = h('input', { type: 'number', min: '1', placeholder: 'Ej. 12' });
  const cod = h('input', { placeholder: 'Ej. K7M29QXA', maxlength: '8', class: 'upper' });
  const buscar = e => { e.preventDefault(); safe(async () => {
    const p = await API.get(`/api/publico/pedidos/${Number(id.value)}?codigo=${encodeURIComponent(cod.value.trim())}`);
    INV.guardar(p.id, p.codigoSeguimiento || cod.value.trim().toUpperCase());
    toast(`Pedido #${p.id} agregado`); refrescar();
  }); };
  box.append(pageHead('Rastrear mi pedido', 'Consulta, cancela o califica tus pedidos sin necesidad de una cuenta.'),
    h('form', { class: 'card track-form', onsubmit: buscar },
      h('div', { class: 'track-ico' }, ico('search')),
      h('div', { class: 'track-fields' }, campoEl('N.º de pedido', id), campoEl('Código de seguimiento', cod)),
      h('button', { class: 'btn btn-lg', type: 'submit' }, 'Buscar')));
  const guardados = INV.lista();
  if (!guardados.length) return box.append(vacio('Aún no tienes pedidos guardados en este dispositivo.', 'package',
    h('button', { class: 'btn btn-sec', onclick: () => go('comercios') }, 'Hacer un pedido')));
  const res = await Promise.allSettled(guardados.map(g => API.get(`/api/publico/pedidos/${g.id}?codigo=${encodeURIComponent(g.codigo)}`)));
  const lista = h('div', { class: 'stack' });
  res.forEach((r, i) => {
    if (r.status === 'fulfilled') lista.append(tarjetaInvitado(r.value, guardados[i].codigo));
    else if (r.reason && r.reason.status === 404) INV.quitar(guardados[i].id);
  });
  box.append(h('h2', { class: 'section-title' }, 'Guardados en este dispositivo', h('span', { class: 'count' }, lista.children.length)), lista);
}

const barra = (v, cls = '') => h('div', { class: 'bar ' + cls }, h('i', { style: `width:${Math.max(0, Math.min(100, v * 100))}%` }));
async function vPrioridad(box) {
  const ps = await API.get('/api/pedidos/prioridad');
  const num = v => h('span', { class: 'num' }, typeof v === 'number' ? v.toFixed(2) : v);
  box.append(pageHead('Pedidos por prioridad', 'Orden sugerido para preparar y despachar.'),
    h('div', { class: 'formula' }, ['35% antigüedad', '20% cercanía', '20% preparación', '25% repartidores libres'].map(t => pill(t))),
    ps.length ? tabla(['Pedido', 'Comercio', 'Estado', 'Puntuación', 'Hora', 'Dist.', 'Prep.', 'Disp.'],
      ps.map((p, i) => [h('b', {}, (i === 0 ? '▲ ' : '') + '#' + p.pedidoId), p.comercio, badge(p.estado),
        h('div', { class: 'score' }, h('b', {}, Number(p.puntuacion).toFixed(2)), barra(p.puntuacion, p.puntuacion > .66 ? 'hi' : p.puntuacion > .33 ? 'mid' : 'lo')),
        num(p.factorHora), num(p.factorDistancia), num(p.factorPreparacion), num(p.factorDisponibilidad)]))
      : vacio('No hay pedidos pendientes de preparar.', 'bolt'));
}
async function vCatalogo(box) {
  const cs = await API.get('/api/comercios/mis');
  box.append(pageHead('Mi catálogo', 'Abre o cierra tu local y administra tus productos.'), ...(cs.length ? [] : [vacio('No tienes comercios asignados.', 'store')]));
  for (const c of cs) {
    const ps = await API.get(`/api/comercios/${c.id}/productos`);
    const campos = p => [{ n: 'nombre', l: 'Nombre', v: p?.nombre }, { n: 'descripcion', l: 'Descripción', v: p?.descripcion },
      { n: 'precio', l: 'Precio (Q)', t: 'number', v: p?.precio }];
    const guardar = (p, extra) => d => API[p ? 'put' : 'post'](`/api/comercios/${c.id}/productos${p ? '/' + p.id : ''}`, { ...d, ...extra }).then(() => { toast('Producto guardado'); refrescar(); });
    box.append(h('section', { class: 'card' },
      h('div', { class: 'card-row' },
        h('div', { class: 'store-mini' }, cover(c.nombre, c.id, 'mini'), h('div', {}, h('h3', {}, c.nombre),
          h('span', { class: 'status ' + (c.abierto ? 'on' : 'off') }, h('i'), c.abierto ? 'Abierto · recibe pedidos' : 'Cerrado · no aparece para los clientes'))),
        h('div', { class: 'actions' },
          h('button', { class: 'btn ' + (c.abierto ? 'btn-danger-soft' : ''), onclick: () => safe(async () => {
            await API.put(`/api/comercios/${c.id}/abierto`, { abierto: !c.abierto }); refrescar(); }) }, ico('power'), c.abierto ? 'Cerrar comercio' : 'Abrir comercio'),
          h('button', { class: 'btn btn-sec', onclick: () => formModal('Nuevo producto', campos(), guardar(null, {})) }, ico('plus'), 'Agregar producto'))),
      ps.length ? tabla(['Producto', 'Precio', 'Estado', ''], ps.map(p => [h('div', {}, h('b', {}, p.nombre), h('small', { class: 'muted block' }, p.descripcion || '')), Q(p.precio),
        pill(p.disponible ? 'Disponible' : 'Agotado', p.disponible ? 'ok' : 'off'),
        h('div', { class: 'actions end' }, h('button', { class: 'btn btn-sec btn-sm', onclick: () => formModal('Editar producto', campos(p), guardar(p, { disponible: p.disponible })) }, ico('edit'), 'Editar'),
          h('button', { class: 'btn btn-ghost btn-sm', onclick: () => safe(() => guardar(p, { disponible: !p.disponible })({ nombre: p.nombre, descripcion: p.descripcion, precio: p.precio })) }, p.disponible ? 'Marcar agotado' : 'Marcar disponible'))])) : vacio('Sin productos.', 'book')));
  }
}

async function vRepartidor(box) {
  const [yo, ps] = await Promise.all([API.get('/api/auth/me'), API.get('/api/pedidos')]);
  const ubic = (la, lo) => safe(async () => { await API.put('/api/repartidores/me/ubicacion', { latitud: la, longitud: lo }); toast('Ubicación actualizada'); });
  const sw = h('button', { class: 'switch' + (yo.disponible ? ' on' : ''), role: 'switch', 'aria-checked': !!yo.disponible, onclick: () => safe(async () => {
    await API.put('/api/repartidores/me/disponibilidad', { disponible: !yo.disponible }); refrescar(); }) }, h('i'));
  const act = ps.filter(activo), hist = ps.filter(p => !activo(p));
  box.append(pageHead('Mis entregas', 'Tus pedidos asignados, rutas y cobros.'),
    h('section', { class: 'card rider' },
      h('div', { class: 'rider-id' }, h('span', { class: 'avatar lg' }, iniciales(yo.nombre)),
        h('div', {}, h('h3', {}, yo.nombre), h('div', { class: 'rider-meta' }, pill(yo.tipoVehiculo || 'Repartidor'),
          h('span', { class: 'rating' }, ico('star'), (yo.calificacion || 0).toFixed(1))))),
      h('label', { class: 'avail' }, h('span', {}, h('b', {}, yo.disponible ? 'Disponible' : 'No disponible'),
        h('small', {}, yo.disponible ? 'Recibes pedidos nuevos' : 'No recibirás pedidos nuevos')), sw),
      h('div', { class: 'actions' }, h('button', { class: 'btn btn-sec', onclick: () => navigator.geolocation
        ? navigator.geolocation.getCurrentPosition(x => ubic(x.coords.latitude, x.coords.longitude), () => toast('No se pudo obtener tu ubicación', true))
        : toast('Sin geolocalización', true) }, ico('gps'), 'Usar mi ubicación'),
      h('button', { class: 'btn btn-ghost', onclick: () => formModal('Ubicación manual', [{ n: 'latitud', l: 'Latitud', t: 'number' }, { n: 'longitud', l: 'Longitud', t: 'number' }],
        d => ubic(d.latitud, d.longitud)) }, ico('pin'), 'Ingresar coordenadas'))));
  if (!ps.length) return box.append(vacio('Aún no tienes pedidos asignados.', 'truck'));
  const seccion = (t, l) => l.length ? [h('h2', { class: 'section-title' }, t, h('span', { class: 'count' }, l.length)), h('div', { class: 'stack' }, l.map(tarjetaPedido))] : [];
  box.append(...seccion('En curso', act), ...seccion('Completadas', hist));
}

async function vReporte(box) {
  const r = await API.get('/api/admin/reportes');
  const ent = Object.entries(r.pedidosPorEstado);
  const tot = Math.max(1, ent.reduce((s, [, n]) => s + n, 0)), max = Math.max(1, ...ent.map(([, n]) => n));
  const st = (n, v, i, cls) => h('div', { class: 'kpi ' + cls }, h('span', { class: 'kpi-ico' }, ico(i)), h('div', {}, h('small', {}, n), h('b', {}, v)));
  box.append(pageHead('Reporte general', 'Resumen de la operación de la plataforma.'),
    h('div', { class: 'kpis' }, st('Pedidos totales', r.totalPedidos, 'package', 'k-navy'), st('Ingresos (entregados)', Q(r.ingresosEntregados), 'money', 'k-green'),
      st('Clientes', r.clientes, 'users', 'k-blue'), st('Comercios', r.comercios, 'store', 'k-teal'), st('Repartidores disponibles', r.repartidoresDisponibles, 'truck', 'k-amber')),
    h('section', { class: 'card' }, h('div', { class: 'card-row' }, h('h3', {}, 'Pedidos por estado'), h('small', { class: 'muted' }, tot + ' pedidos')),
      h('div', { class: 'dist' }, ent.map(([e, n]) => h('div', { class: 'dist-row' }, badge(e),
        h('div', { class: 'bar e-bar-' + e }, h('i', { style: `width:${n / max * 100}%` })),
        h('b', {}, n), h('small', { class: 'muted' }, Math.round(n / tot * 100) + '%'))))));
}
const rolPill = r => pill(r, 'r-' + r);
async function vUsuarios(box) {
  const [us, zs] = await Promise.all([API.get('/api/admin/usuarios'), API.get('/api/admin/zonas')]);
  const o = (arr, sinValor) => (sinValor ? [['', sinValor]] : []).concat(arr);
  const cuerpo = h('div');
  const pintar = q => cuerpo.replaceChildren(tabla(['ID', 'Usuario', 'Rol', 'Detalle', 'Estado', ''], us
    .filter(u => (u.nombre + ' ' + u.email + ' ' + u.rol).toLowerCase().includes(q.toLowerCase()))
    .map(u => [h('span', { class: 'muted' }, u.id), h('div', { class: 'who' }, h('span', { class: 'avatar sm' }, iniciales(u.nombre)), h('div', {}, h('b', {}, u.nombre), h('small', { class: 'muted block' }, u.email))),
      rolPill(u.rol), u.tipoVehiculo ? `${u.tipoVehiculo} · ${u.disponible ? 'disponible' : 'no disp.'}` : h('span', { class: 'muted' }, '—'),
      h('span', { class: 'status ' + (u.activo ? 'on' : 'off') }, h('i'), u.activo ? 'Activo' : 'Inactivo'),
      h('button', { class: 'btn btn-ghost btn-sm', onclick: () => safe(async () => { await API.put(`/api/admin/usuarios/${u.id}/activo`, { activo: !u.activo }); refrescar(); }) }, u.activo ? 'Desactivar' : 'Activar')])));
  const q = h('input', { type: 'search', placeholder: 'Buscar por nombre, correo o rol', oninput: () => pintar(q.value) });
  box.append(pageHead('Usuarios', us.length + ' cuentas registradas', h('button', { class: 'btn', onclick: () => formModal('Nuevo usuario', [
    { n: 'nombre', l: 'Nombre' }, { n: 'email', l: 'Correo', t: 'email' }, { n: 'password', l: 'Contraseña (mínimo 6)', t: 'password' }, { n: 'telefono', l: 'Teléfono' },
    { n: 'rol', l: 'Rol', opts: ['CLIENTE', 'COMERCIO', 'REPARTIDOR', 'ADMIN'].map(x => [x, x]), v: 'CLIENTE' },
    { n: 'tipoVehiculo', l: 'Vehículo (solo repartidor)', opts: o(['MOTO', 'BICICLETA', 'AUTOMOVIL'].map(x => [x, x]), '—') },
    { n: 'zonaId', l: 'Zona (solo repartidor)', opts: o(zs.map(z => [z.id, z.nombre]), '—') }],
  async d => { await API.post('/api/admin/usuarios', d); toast('Usuario creado'); refrescar(); }, 'Crear') }, ico('plus'), 'Nuevo usuario')),
  h('label', { class: 'search' }, ico('search'), q), cuerpo);
  pintar('');
}
async function vAdminComercios(box) {
  const [cs, us, zs] = await Promise.all([API.get('/api/comercios/todos'), API.get('/api/admin/usuarios'), API.get('/api/admin/zonas')]);
  box.append(pageHead('Comercios', cs.length + ' comercios en la plataforma', h('button', { class: 'btn', onclick: () => formModal('Nuevo comercio', [
    { n: 'nombre', l: 'Nombre' }, { n: 'direccion', l: 'Dirección' }, { n: 'latitud', l: 'Latitud', t: 'number', v: 14.4783 }, { n: 'longitud', l: 'Longitud', t: 'number', v: -90.6158 },
    { n: 'zonaId', l: 'Zona', opts: [['', '—']].concat(zs.map(z => [z.id, z.nombre])) },
    { n: 'propietarioId', l: 'Propietario (rol COMERCIO)', opts: us.filter(u => u.rol === 'COMERCIO').map(u => [u.id, u.nombre]) },
    { n: 'tiempoPreparacionMin', l: 'Minutos de preparación', t: 'number', v: 20 }],
  async d => { await API.post('/api/comercios', d); toast('Comercio creado'); refrescar(); }, 'Crear') }, ico('plus'), 'Nuevo comercio')),
  tabla(['ID', 'Comercio', 'Zona', 'Calificación', 'Estado', ''], cs.map(c => [h('span', { class: 'muted' }, c.id),
    h('div', { class: 'who' }, cover(c.nombre, c.id, 'xs'), h('b', {}, c.nombre)), c.zona || '—',
    h('span', { class: 'rating' }, ico('star'), c.calificacion.toFixed(1), h('small', { class: 'muted' }, ` (${c.totalCalificaciones})`)),
    h('span', { class: 'status ' + (c.abierto ? 'on' : 'off') }, h('i'), c.abierto ? 'Abierto' : 'Cerrado'),
    h('button', { class: 'btn btn-ghost btn-sm', onclick: () => safe(async () => { await API.put(`/api/comercios/${c.id}/abierto`, { abierto: !c.abierto }); refrescar(); }) }, c.abierto ? 'Cerrar' : 'Abrir')])));
}
async function vZonas(box) {
  const zs = await API.get('/api/admin/zonas');
  box.append(pageHead('Zonas de operación', 'Áreas donde operan comercios y repartidores.', h('button', { class: 'btn', onclick: () => formModal('Nueva zona', [
    { n: 'nombre', l: 'Nombre' }, { n: 'latitud', l: 'Latitud', t: 'number' }, { n: 'longitud', l: 'Longitud', t: 'number' }],
  async d => { await API.post('/api/admin/zonas', d); toast('Zona creada'); refrescar(); }, 'Crear') }, ico('plus'), 'Nueva zona')),
  zs.length ? h('div', { class: 'zones' }, zs.map(z => h('a', { class: 'card zone', href: Maps.urlLugar(z.latitud, z.longitud), target: '_blank', rel: 'noopener' },
    h('span', { class: 'zone-ico' }, ico('map')), h('div', {}, h('b', {}, z.nombre), h('small', { class: 'muted block' }, `${z.latitud}, ${z.longitud}`)),
    h('span', { class: 'muted zone-id' }, '#' + z.id)))) : vacio('No hay zonas registradas.', 'map'));
}
async function vPromos(box) {
  const ps = await API.get('/api/promociones/todas');
  const tipo = { PORCENTAJE: 'Porcentaje', MONTO_FIJO: 'Monto fijo', ENVIO_GRATIS: 'Envío gratis' };
  box.append(pageHead('Promociones', 'Códigos de descuento disponibles para los clientes.', h('button', { class: 'btn', onclick: () => formModal('Nueva promoción', [
    { n: 'tipo', l: 'Tipo', opts: [['PORCENTAJE', 'Porcentaje'], ['MONTO_FIJO', 'Monto fijo'], ['ENVIO_GRATIS', 'Envío gratis']] },
    { n: 'codigo', l: 'Código' }, { n: 'descripcion', l: 'Descripción' }, { n: 'valor', l: 'Valor (% o Q; no aplica a envío gratis)', t: 'number' },
    { n: 'montoMinimo', l: 'Compra mínima (Q)', t: 'number' }, { n: 'vigenteHasta', l: 'Vigente hasta', t: 'date' }],
  async d => { await API.post('/api/promociones', d); toast('Promoción creada'); refrescar(); }, 'Crear') }, ico('plus'), 'Nueva promoción')),
  ps.length ? h('div', { class: 'promos' }, ps.map(p => h('article', { class: 'card promo' + (p.activa ? '' : ' off') },
    h('div', { class: 'promo-top' }, h('span', { class: 'promo-code' }, ico('tag'), p.codigo), h('span', { class: 'status ' + (p.activa ? 'on' : 'off') }, h('i'), p.activa ? 'Activa' : 'Inactiva')),
    h('p', {}, p.descripcion),
    h('div', { class: 'promo-meta' }, pill(tipo[p.tipo] || p.tipo), h('small', { class: 'muted' }, 'Mínimo ' + Q(p.montoMinimo)), h('small', { class: 'muted' }, 'Hasta ' + (p.vigenteHasta || 'sin límite'))),
    h('button', { class: 'btn btn-ghost btn-sm', onclick: () => safe(async () => { await API.put(`/api/promociones/${p.id}/activa`, { activo: !p.activa }); refrescar(); }) }, p.activa ? 'Desactivar' : 'Activar')))) : vacio('No hay promociones.', 'tag'));
}

$('#salir').addEventListener('click', () => API.logout());
$('#entrar').addEventListener('click', () => pantallaLogin());
$('#sb-open').addEventListener('click', abrirMenuLat);
$('#sb-close').addEventListener('click', cerrarMenu);
$('#sb-backdrop').addEventListener('click', cerrarMenu);
setInterval(() => {
  if (S.rol && ['pedidos', 'prioridad', 'entregas', 'rastrear'].includes(S.tab) && !document.querySelector('.ov') && !document.hidden) go(S.tab, true);
}, 15000);
(async () => {
  await Maps.iniciar();
  if (!API.token) return modoInvitado();
  try { const me = await API.get('/api/auth/me'); iniciarSesion(me.rol, me.nombre); }
  catch { modoInvitado(); }
})();
