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
      if (resp.status === 401 && this.token) this.limpiarSesion();
      const err = new Error((data && data.mensaje) || ('Error ' + resp.status));
      err.status = resp.status;
      err.data = data;          // p. ej. { requiere3ds: true, desafioId: '...' }
      throw err;
    }
    return data;
  },

  // Solo se borra la sesión: los pedidos de invitado guardados en este navegador se conservan
  limpiarSesion() {
    ['token', 'rol', 'nombre'].forEach(k => localStorage.removeItem(k));
    this.token = null;
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

  logout() { this.post('/api/auth/logout').catch(() => {}).finally(() => { this.limpiarSesion(); location.href = '/'; }); }
};
