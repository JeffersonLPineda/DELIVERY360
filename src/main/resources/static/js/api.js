/**
 * Cliente mínimo para la API REST de SmartDelivery 360.
 * Incluye este archivo ANTES de tus otros .js:  <script src="/js/api.js"></script>
 */
const API = {
  token: localStorage.getItem('token'),

  async request(method, url, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    const resp = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (resp.status === 204) return null;
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      if (resp.status === 401) { localStorage.clear(); this.token = null; }
      throw new Error((data && data.mensaje) || ('Error ' + resp.status));
    }
    return data;
  },

  get(url)        { return this.request('GET', url); },
  post(url, body) { return this.request('POST', url, body); },
  put(url, body)  { return this.request('PUT', url, body); },

  async login(email, password) {
    const r = await this.post('/api/auth/login', { email, password });
    this.token = r.token;
    localStorage.setItem('token', r.token);
    localStorage.setItem('rol', r.rol);
    localStorage.setItem('nombre', r.nombre);
    return r;
  },

  logout() { this.post('/api/auth/logout').finally(() => { localStorage.clear(); location.href = '/'; }); }
};

/* Ejemplos de uso:
   await API.login('cliente@smartdelivery.com', 'Cliente123');
   const comercios = await API.get('/api/comercios');
   const productos = await API.get('/api/comercios/1/productos');
   const pedido = await API.post('/api/pedidos', {
     comercioId: 1,
     items: [{ productoId: 1, cantidad: 2 }],
     direccionEntrega: 'Zona 1, Amatitlán', latEntrega: 14.48, lonEntrega: -90.61,
     codigoPromocion: 'BIENVENIDO10',
     pago: { metodo: 'EFECTIVO' }
   });
   await API.put('/api/pedidos/' + pedido.id + '/estado', { estado: 'CANCELADO' });
*/
