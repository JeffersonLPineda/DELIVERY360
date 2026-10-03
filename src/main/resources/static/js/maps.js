/**
 * Integración con Google Maps (capa gratuita).
 *  - Selector de ubicación para el cliente: Maps JavaScript API + Places (autocompletado) + Geocoding (dirección al mover el pin).
 *  - Repartidor: enlaces "Abrir en Google Maps" (URL oficial, sin costo ni clave) y mapa incrustado con la Maps Embed API (gratuita).
 * La clave llega desde el servidor (/api/config/publica). Si no hay clave, todo sigue funcionando sin mapa interactivo.
 */
const Maps = {
  key: '',
  region: '',
  _carga: null,

  async iniciar() {
    try {
      const c = await fetch('/api/config/publica').then(r => r.json());
      this.key = c.googleMapsApiKey || '';
      this.region = c.regionCode || '';
    } catch { /* sin configuración: modo sin mapa */ }
  },

  get activo() { return !!this.key; },

  /** Carga el script de Google Maps una sola vez. */
  cargar() {
    if (!this.key) return Promise.reject(new Error('Falta la API key de Google Maps'));
    if (this._carga) return this._carga;
    this._carga = new Promise((ok, fallo) => {
      window.__gmapsListo = () => ok();
      window.gm_authFailure = () => { this._carga = null; fallo(new Error('Google Maps rechazó la API key (revisa restricciones y APIs habilitadas)')); };
      const s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(this.key) + '&v=weekly&loading=async&callback=__gmapsListo';
      s.async = true;
      s.onerror = () => { this._carga = null; fallo(new Error('No se pudo cargar Google Maps')); };
      document.head.append(s);
    });
    return this._carga;
  },

  /* ---------- enlaces y mapas para el repartidor (no requieren cargar el script) ---------- */
  urlRuta(lat, lon) { return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`; },
  urlLugar(lat, lon) { return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`; },

  /** Mapa incrustado con la ruta comercio -> cliente (Maps Embed API). null si no hay clave. */
  embedRuta(origen, destino) {
    if (!this.key) return null;
    const u = 'https://www.google.com/maps/embed/v1/directions?key=' + encodeURIComponent(this.key)
      + `&origin=${origen.lat},${origen.lon}&destination=${destino.lat},${destino.lon}&mode=driving`;
    return u;
  },
  embedLugar(lat, lon) {
    if (!this.key) return null;
    return 'https://www.google.com/maps/embed/v1/place?key=' + encodeURIComponent(this.key) + `&q=${lat},${lon}&zoom=16`;
  },

  /**
   * Selector de ubicación. Dibuja en `cont` un buscador, un mapa con pin arrastable y toca `alCambiar({lat, lon, direccion})`
   * cuando el cliente elige un lugar (buscando, haciendo clic en el mapa, arrastrando el pin o con su GPS).
   * Devuelve { mover(lat, lon) }.
   */
  async selector(cont, inicial, alCambiar) {
    await this.cargar();
    const { Map: GMap } = await google.maps.importLibrary('maps');
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
    const { PlaceAutocompleteElement } = await google.maps.importLibrary('places');
    const { Geocoder } = await google.maps.importLibrary('geocoding');
    const geocoder = new Geocoder();

    const buscador = document.createElement('div');
    buscador.className = 'buscador-mapa';
    const div = document.createElement('div');
    div.className = 'mapa';
    cont.replaceChildren(buscador, div);

    const mapa = new GMap(div, {
      center: { lat: inicial.lat, lng: inicial.lon }, zoom: 15, mapId: 'DEMO_MAP_ID',
      streetViewControl: false, mapTypeControl: false, fullscreenControl: false
    });
    const pin = new AdvancedMarkerElement({ map: mapa, position: { lat: inicial.lat, lng: inicial.lon }, gmpDraggable: true, title: 'Entregar aquí' });

    const num = v => (typeof v === 'function' ? v() : v);
    const colocar = async (lat, lon, direccion, centrar) => {
      pin.position = { lat, lng: lon };
      if (centrar) mapa.panTo({ lat, lng: lon });
      let dir = direccion;
      if (!dir) {
        try { const r = await geocoder.geocode({ location: { lat, lng: lon } }); dir = r.results && r.results[0] && r.results[0].formatted_address; }
        catch { /* Geocoding API no habilitada: se conserva la dirección escrita */ }
      }
      alCambiar({ lat, lon, direccion: dir || null });
    };

    mapa.addListener('click', e => colocar(e.latLng.lat(), e.latLng.lng(), null, false));
    pin.addListener('dragend', () => { const p = pin.position; colocar(num(p.lat), num(p.lng), null, false); });

    const opciones = { requestedLanguage: 'es' };
    if (this.region) opciones.includedRegionCodes = [this.region];
    const ac = new PlaceAutocompleteElement(opciones);
    ac.addEventListener('gmp-select', async ({ placePrediction }) => {
      const lugar = placePrediction.toPlace();
      await lugar.fetchFields({ fields: ['formattedAddress', 'location'] });
      if (lugar.location) { mapa.setZoom(17); colocar(lugar.location.lat(), lugar.location.lng(), lugar.formattedAddress, true); }
    });
    buscador.append(ac);

    return { mover: (lat, lon) => colocar(lat, lon, null, true) };
  }
};
