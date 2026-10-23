# API pública única — SmartDelivery 360 (v1)

Base: `http://localhost:8080/api/v1/public` · Sin autenticación · Solo lectura (`GET`) · JSON

## Endpoints

| Método | Ruta | Qué devuelve |
|---|---|---|
| GET | `/salud` | Estado del servicio (`UP`), versión y hora |
| GET | `/comercios?zona=&pagina=0&tamano=50` | Comercios **abiertos**, paginados (tamaño máx. 100); filtro opcional por zona |
| GET | `/comercios/{id}` | Un comercio abierto |
| GET | `/comercios/{id}/productos` | Catálogo con solo productos **disponibles** |
| GET | `/promociones` | Promociones activas y vigentes |
| GET | `/pedidos/{id}/seguimiento?codigo=XXXXXXXX` | Estado y etapas de un pedido de **invitado** (requiere el código secreto) |

Ejemplos:

```bash
curl http://localhost:8080/api/v1/public/salud
curl "http://localhost:8080/api/v1/public/comercios?tamano=10"
curl http://localhost:8080/api/v1/public/comercios/1/productos
curl "http://localhost:8080/api/v1/public/pedidos/15/seguimiento?codigo=K7M2QX9A"
```

Errores: `404` (no existe / cerrado / código incorrecto), `429` (límite de peticiones, con `Retry-After`).
Cualquier método distinto de `GET` bajo `/api/v1/public/**` responde `401`.

## Qué NO está en la API pública (y por qué)

| Excluido | Motivo |
|---|---|
| `POST /api/pedidos` (crear pedido) | Recibe datos de tarjeta y dispara cobros; abierto a cualquier sistema permitiría spam de pedidos y pruebas de tarjetas |
| Cancelar / calificar pedido, cambiar estado, asignar repartidor | Operaciones que modifican datos |
| `/api/auth/*` (login, registro, me, logout) | Credenciales y tokens; el registro abierto a terceros facilita cuentas falsas |
| `/api/admin/**`, `/api/repartidores/me/**`, `/api/comercios/todos`, `/mis`, `/api/promociones/todas` | Datos internos y por rol (usuarios, reportes, ubicación en vivo de repartidores) |
| `/api/config/publica` | Entrega la clave de Google Maps; solo la necesita el frontend propio |
| Lista general de pedidos | Contiene teléfono, correo y direcciones de clientes |

## Qué se oculta en lo que sí se expone

- **Seguimiento**: no incluye nombre, teléfono, correo, dirección ni coordenadas de entrega, notas, nombre del repartidor, datos de pago ni el historial interno (solo las etapas de estado con su hora).
- Un código incorrecto, un pedido inexistente y un pedido de cliente con cuenta responden **igual** (404): no se puede averiguar qué pedidos existen.
- **Comercios**: nada del propietario. **Productos**: solo disponibles. Un comercio cerrado se trata como inexistente.

## Protecciones

- **Límite por IP** (ventana de 1 min): `API_PUBLICA_LIMITE` (por defecto 120) en general y `API_PUBLICA_LIMITE_SEGUIMIENTO` (por defecto 15) para seguimiento; el código tiene 8 caracteres aleatorios de un alfabeto de 32 (≈ 10¹² combinaciones), por lo que adivinarlo no es viable con ese límite.
- **CORS** de la API pública: solo `GET`/`OPTIONS`, sin credenciales. Por defecto cualquier origen (`*`); para restringirlo: `API_PUBLICA_ORIGENES=https://socio1.com,https://socio2.com`.
- Detrás de un proxy o balanceador, añade `server.forward-headers-strategy=native` para que el límite use la IP real del cliente (solo si de verdad hay un proxy de confianza delante).
- Respuestas del catálogo con caché pública de 30 s; el seguimiento con `no-store`.

## Códigos de pruebas

Los datos de ejemplo (comercios y promociones) los crea `DataInitializer`; el código de seguimiento se obtiene al crear un pedido como invitado desde el frontend.
