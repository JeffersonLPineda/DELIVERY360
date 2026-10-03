# SmartDelivery 360 — Backend (Spring Boot + API REST)

Backend central del proyecto: API REST en Java con Spring Boot, JPA, roles y seguridad por token.
La web y la app Android consumen **esta misma API** (sin lógica duplicada).

## Cómo ejecutarlo

Requisitos: **JDK 17+**, **Maven 3.9+** y **PostgreSQL** (con Docker es un solo comando).

```bash
docker compose up -d        # levanta PostgreSQL 16 con la base "smartdelivery" (datos persistentes en el volumen pgdata)
mvn spring-boot:run
```

Arranca en `http://localhost:8080`, crea las tablas la primera vez y carga datos de ejemplo **solo si la base está vacía**:
los datos (usuarios, pedidos, pagos, sesiones de login) se conservan al reiniciar el servidor.

- ¿Ya tienes PostgreSQL instalado? Crea la base (`CREATE DATABASE smartdelivery;`) y ajusta las variables de entorno
  `DB_URL`, `DB_USER` y `DB_PASSWORD` (por defecto: `jdbc:postgresql://localhost:5432/smartdelivery`, `postgres` / `postgres`).
- Para pruebas rápidas sin instalar nada: `mvn spring-boot:run -Dspring-boot.run.profiles=h2` (H2 en archivo `./data`, consola en `/h2-console`).
- Existe también el perfil `mysql` (`application-mysql.properties`).
- **Borrar todos los datos**: `docker compose down -v` y volver a levantar.

**Script SQL (entregable):** descomenta las 2 líneas `schema-generation` de `application.properties`, arranca una vez y se genera `docs/schema.sql`.

### Google Maps (opcional, capa gratuita)

Sin clave la web funciona igual, pero sin mapa interactivo (se usa el GPS del navegador o coordenadas manuales).
Con clave el cliente elige la ubicación de entrega en un mapa y el repartidor ve el destino en Google Maps.

1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto y habilita: **Maps JavaScript API**, **Places API (New)**, **Geocoding API** y **Maps Embed API**.
2. Crea una **API key** (Credenciales → Crear credenciales). Google pide vincular una cuenta de facturación aunque no se cobre mientras
   te mantengas dentro de la cuota gratuita mensual de cada producto (≈10 000 eventos por producto; Maps Embed es gratuita e ilimitada). Revisa la tarifa vigente en la página de precios de Google Maps Platform.
3. **Restringe la clave** por "HTTP referrers" (`http://localhost:8080/*` y tu dominio) y a esas 4 APIs; en Facturación fija un **presupuesto/cuota diaria** para evitar sorpresas.
4. Arranca con la clave (la clave viaja al navegador por diseño, por eso hay que restringirla):

```bash
# Linux / macOS
export GOOGLE_MAPS_API_KEY="tu_clave" && mvn spring-boot:run
# Windows PowerShell
$env:GOOGLE_MAPS_API_KEY="tu_clave"; mvn spring-boot:run
```
`GOOGLE_MAPS_REGION` (por defecto `gt`) limita las sugerencias de búsqueda a un país.

## Cuentas de prueba (solo documentación)

La pantalla de ingreso **no tiene botones de acceso rápido**; las cuentas existen en la base de datos y se usan escribiendo correo y contraseña:

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | admin@smartdelivery.com | Admin123 |
| COMERCIO | comercio1@smartdelivery.com (Pollo Express) / comercio2@ (Pizzería Roma) | Comercio123 |
| CLIENTE | cliente@smartdelivery.com | Cliente123 |
| REPARTIDOR | moto@ / bici@ / auto@smartdelivery.com | Repartidor123 |

Códigos de promoción: `BIENVENIDO10` (10%), `MENOS25` (Q25 desde Q100), `ENVIOGRATIS`.

## Pedidos sin cuenta (cliente opcional)

Cualquier visitante puede ver los comercios, armar su pedido y pagarlo **sin iniciar sesión**: solo debe indicar nombre y teléfono de contacto
(correo opcional). Comercio, repartidor y administrador siguen requiriendo cuenta.

Al terminar recibe un **número de pedido y un código de seguimiento** (8 caracteres). Con ellos puede, sin cuenta, consultar el estado,
**cancelar** (mientras esté CREADO o CONFIRMADO) y **calificar** (cuando esté ENTREGADO) en la pestaña *Rastrear mi pedido*.
El navegador recuerda esos pedidos; un código incorrecto responde igual que un pedido inexistente (404).

## Pagos

| Método | Cuándo se cobra | Estado del pago |
|---|---|---|
| **Tarjeta** | Al confirmar el pedido: validación (Luhn, marca, vencimiento, CVV de 3 o 4 dígitos), autorización del banco y captura | `COMPLETADO` con N.º de transacción y código de autorización. Si el banco rechaza, **no se crea el pedido** |
| **Efectivo (contra entrega)** | Cuando el repartidor marca **ENTREGADO** e indica el efectivo recibido (se calcula el cambio) | `PENDIENTE` ("se cobra al entregar") hasta la entrega; luego `COMPLETADO` |
| **Transferencia** | Al confirmar (referencia y monto) | `COMPLETADO` |

Si un pedido se cancela o rechaza: lo cobrado pasa a `REEMBOLSADO` (con N.º de reembolso) y lo que nunca se cobró a `ANULADO`.
Nunca se guarda el número completo de la tarjeta, el vencimiento ni el CVV: solo marca, últimos 4 dígitos, titular y autorización.

> La pasarela es **simulada** (`util/PasarelaSimulada`): imita una real pero no mueve dinero. Para usar una pasarela real basta reemplazar esa clase.

**Tarjetas de prueba** (cualquier vencimiento futuro, CVV de 3 dígitos; 4 para Amex):

| Número | Resultado |
|---|---|
| 4242 4242 4242 4242 | Visa aprobada |
| 5555 5555 5555 4444 | Mastercard aprobada |
| 3782 822463 10005 | American Express aprobada (CVV de 4 dígitos) |
| 6011 1111 1111 1117 | Discover aprobada |
| 4000 0025 0000 3155 | Exige **3-D Secure**: código SMS `123456` (3 intentos, vigencia 5 min) |
| 4000 0000 0000 0002 | Rechazada por el banco |
| 4000 0000 0000 9995 | Fondos insuficientes |
| 4000 0000 0000 0127 | CVV incorrecto |
| 4100 0000 0000 0019 | Tarjeta bloqueada |

## Demo del flujo obligatorio

Con el servidor corriendo: `bash docs/demo-flujo.sh` (pedido de invitado con tarjeta → comercio acepta → asignación automática →
repartidor entrega → transición inválida (409) → calificación con código de seguimiento → pedido en efectivo con cobro al entregar → reporte).

## Autenticación

`POST /api/auth/login` devuelve un `token`. Envíalo en cada petición: `Authorization: Bearer <token>`.
Los tokens se guardan en la base de datos (tabla `sesiones`, vigencia 7 días): sobreviven al reinicio del servidor.
Desde tu JS usa `static/js/api.js` (`API.login(...)`, `API.get(...)`, `API.post(...)`).

## Endpoints

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/config/publica` | público | Clave pública de Google Maps y región |
| POST | `/api/auth/login` | público | Inicia sesión |
| POST | `/api/auth/registro` | público | Registro de cliente |
| GET | `/api/auth/me` · POST `/api/auth/logout` | autenticado | Perfil / cerrar sesión |
| GET | `/api/comercios` | **público** | Comercios abiertos |
| GET | `/api/comercios/{id}/productos` | **público** | Catálogo |
| POST | `/api/comercios` | ADMIN | Crear comercio |
| PUT | `/api/comercios/{id}/abierto` | ADMIN, COMERCIO | Abrir/cerrar |
| POST/PUT | `/api/comercios/{id}/productos[/{pid}]` | ADMIN, COMERCIO(dueño) | Gestionar catálogo |
| POST | `/api/pedidos` | **público** (invitado o CLIENTE) | Crear pedido (con contacto, ubicación, promoción y pago). Tarjeta con 3-D Secure responde `402` con `requiere3ds` y `desafioId` |
| GET | `/api/publico/pedidos/{id}?codigo=` | público + código | Seguimiento de un pedido de invitado |
| POST | `/api/publico/pedidos/{id}/cancelar?codigo=` · `/calificar?codigo=` | público + código | Cancelar / calificar sin cuenta |
| GET | `/api/pedidos` | todos | Pedidos según el rol |
| GET | `/api/pedidos/{id}` | participantes | Detalle + historial + seguimiento |
| PUT | `/api/pedidos/{id}/estado` | según rol y transición | Cambiar estado (el repartidor puede enviar `efectivoRecibido` al marcar ENTREGADO) |
| POST | `/api/pedidos/{id}/asignar-repartidor` | ADMIN, COMERCIO | Ejecuta el motor de asignación |
| GET | `/api/pedidos/prioridad` | ADMIN, COMERCIO | **Reto**: pedidos ordenados por puntuación |
| POST | `/api/calificaciones` | CLIENTE | Califica comercio y repartidor |
| PUT | `/api/repartidores/me/disponibilidad` · `/ubicacion` | REPARTIDOR | Disponibilidad y ubicación |
| GET/POST | `/api/promociones` | público / ADMIN | Promociones |
| GET/POST/PUT | `/api/admin/usuarios`, `/zonas`, `/reportes` | ADMIN | Administración |

Quién puede mover el pedido a cada estado (`Rol.puedeCambiarA`): COMERCIO → CONFIRMADO, RECHAZADO, EN_PREPARACION, LISTO ·
CLIENTE → CANCELADO · REPARTIDOR → EN_CAMINO, ENTREGADO · ADMIN → todos. Además la transición debe ser legal según `EstadoPedido`.

```
CREADO → CONFIRMADO → EN_PREPARACION → LISTO → EN_CAMINO → ENTREGADO
   ├→ RECHAZADO (comercio)      CREADO/CONFIRMADO → CANCELADO (cliente)
```
Los estados finales no retroceden: el intento lanza `EstadoPedidoInvalidoException` (HTTP 409).

Ejemplo de creación de pedido (sin sesión):
```json
POST /api/pedidos
{ "comercioId": 1,
  "items": [ {"productoId": 1, "cantidad": 2} ],
  "direccionEntrega": "Zona 1, Amatitlán", "latEntrega": 14.485, "lonEntrega": -90.610,
  "notasEntrega": "Casa azul", "nombreContacto": "Ana López", "telefonoContacto": "5555-1234",
  "codigoPromocion": "BIENVENIDO10",
  "pago": { "metodo": "TARJETA", "numeroTarjeta": "4242424242424242", "titular": "ANA LOPEZ",
            "vencimiento": "12/30", "cvv": "123" } }
```
La respuesta incluye `codigoSeguimiento` (solo en la respuesta de creación). Para 3-D Secure se repite la misma petición añadiendo
`"desafioId"` y `"codigo3ds"` dentro de `pago`. (`EFECTIVO` no necesita más datos; `TRANSFERENCIA` usa `referencia` y `montoTransferido`.)

## Mapas

- **Cliente**: buscador con autocompletado, clic en el mapa, pin arrastrable o "Usar mi ubicación"; la dirección se completa sola (Geocoding).
- **Repartidor / comercio / admin**: botones **"Ir a la entrega"** e **"Ir al comercio"** que abren Google Maps con la ruta (URL oficial, sin costo ni clave)
  y, con clave configurada, un mapa incrustado de la ruta comercio → cliente en el detalle del pedido.
- Fuera de un radio de 30 km del comercio el pedido se rechaza.

## Dónde está cada concepto de Programación II (para la documentación)

| Concepto | Dónde |
|---|---|
| **Encapsulamiento** | Atributos privados; `Pedido.estado` sin setter, solo `cambiarEstado()`; colecciones de solo lectura (`getDetalles()`); datos de tarjeta `@Transient` |
| **Herencia + clase abstracta** | `Repartidor` (abstracta) → `RepartidorMoto/Bicicleta/Automovil`; `Pago` → 3 pagos; `Promocion` → 3 promociones; `Usuario` → `Repartidor` |
| **Interfaces** | `Rastreable` (Pedido, Repartidor), `Calificable` (Comercio, Repartidor), `Notificable` (Usuario, Comercio), `CriterioAsignacion` |
| **Polimorfismo / @Override** | `Pago.validar()/procesar()`, `Promocion.calcularDescuento()`, `Repartidor.getCapacidadMaxima()`, `MetodoPago.crear()`, criterios del motor — sin cadenas if/else por tipo |
| **Excepciones propias** | `EstadoPedidoInvalidoException`, `PagoInvalidoException`, `AutenticacionRequeridaException`, `ReglaNegocioException`, `RecursoNoEncontradoException`, `PermisoDenegadoException` + `GlobalExceptionHandler` |
| **Colecciones** | `List<DetallePedido>`, `List<CriterioAsignacion>`, `EnumSet`, `Map` en reportes |
| **Motor de asignación (6 criterios)** | `service/asignacion/`: disponibilidad, sin pedido bloqueante, zona, distancia, carga, calificación → puntaje ponderado |

Paquetes: `controller`, `service`, `repository`, `model`, `dto`, `exception`, `interfaces`, `util`, `config`.

## Lo que falta del proyecto (no incluido aquí)

- **App Android (Java)**: debe consumir esta API (Retrofit + `Authorization: Bearer`). Para el emulador, la API está en `http://10.0.2.2:8080/api/`.
- ~~Frontend web~~ **Incluido**: abre `http://localhost:8080/` (`static/index.html`, `css/app.css`, `js/app.js` sobre `js/api.js`). Paneles por rol: cliente, comercio, repartidor y administrador.
- **Documentación**: `docs/diagramas.md` (UML y ER en Mermaid), el documento de conceptos POO (puedes partir de la tabla de arriba), manual de usuario y video.
