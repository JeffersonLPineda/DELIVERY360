# SmartDelivery 360 — Backend (Spring Boot + API REST)

Backend central del proyecto: API REST en Java con Spring Boot, JPA, roles y seguridad por token.
La web y la app Android consumen **esta misma API** (sin lógica duplicada).

## Cómo ejecutarlo

Requisitos: **JDK 17+** y **Maven 3.9+** (o abrir el proyecto en IntelliJ/Eclipse/VS Code).

```bash
mvn spring-boot:run
```

Arranca en `http://localhost:8080` con **H2** (base en archivo `./data`, no necesitas instalar nada) y carga datos de ejemplo.
Consola de la BD: `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:file:./data/smartdelivery`, usuario `sa`, sin contraseña).

**Usar MySQL o PostgreSQL** (crea antes la base `smartdelivery`; ajusta usuario/clave en el archivo del perfil):

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=mysql      # o: postgres
```

**Script SQL (entregable):** descomenta las 2 líneas `schema-generation` de `application.properties`, arranca una vez y se genera `docs/schema.sql`.

## Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | admin@smartdelivery.com | Admin123 |
| COMERCIO | comercio1@smartdelivery.com (Pollo Express) / comercio2@ (Pizzería Roma) | Comercio123 |
| CLIENTE | cliente@smartdelivery.com | Cliente123 |
| REPARTIDOR | moto@ / bici@ / auto@smartdelivery.com | Repartidor123 |

Códigos de promoción: `BIENVENIDO10` (10%), `MENOS25` (Q25 desde Q100), `ENVIOGRATIS`.

## Demo del flujo obligatorio

Con el servidor corriendo: `bash docs/demo-flujo.sh` (login → pedido → comercio acepta → asignación automática →
repartidor entrega → transición inválida (409) → calificación → reporte).

## Autenticación

`POST /api/auth/login` devuelve un `token`. Envíalo en cada petición: `Authorization: Bearer <token>`.
(Los tokens viven en memoria: al reiniciar el servidor hay que volver a iniciar sesión.)
Desde tu JS usa `static/js/api.js` (`API.login(...)`, `API.get(...)`, `API.post(...)`).

## Endpoints

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | público | Inicia sesión |
| POST | `/api/auth/registro` | público | Registro de cliente |
| GET | `/api/auth/me` · POST `/api/auth/logout` | autenticado | Perfil / cerrar sesión |
| GET | `/api/comercios` | autenticado | Comercios abiertos |
| GET | `/api/comercios/{id}/productos` | autenticado | Catálogo |
| POST | `/api/comercios` | ADMIN | Crear comercio |
| PUT | `/api/comercios/{id}/abierto` | ADMIN, COMERCIO | Abrir/cerrar |
| POST/PUT | `/api/comercios/{id}/productos[/{pid}]` | ADMIN, COMERCIO(dueño) | Gestionar catálogo |
| POST | `/api/pedidos` | CLIENTE | Crear pedido (con promoción y pago) |
| GET | `/api/pedidos` | todos | Pedidos según el rol |
| GET | `/api/pedidos/{id}` | participantes | Detalle + historial + seguimiento |
| PUT | `/api/pedidos/{id}/estado` | según rol y transición | Cambiar estado |
| POST | `/api/pedidos/{id}/asignar-repartidor` | ADMIN, COMERCIO | Ejecuta el motor de asignación |
| GET | `/api/pedidos/prioridad` | ADMIN, COMERCIO | **Reto**: pedidos ordenados por puntuación |
| POST | `/api/calificaciones` | CLIENTE | Califica comercio y repartidor |
| PUT | `/api/repartidores/me/disponibilidad` · `/ubicacion` | REPARTIDOR | Disponibilidad y ubicación |
| GET/POST | `/api/promociones` | autenticado / ADMIN | Promociones |
| GET/POST/PUT | `/api/admin/usuarios`, `/zonas`, `/reportes` | ADMIN | Administración |

Quién puede mover el pedido a cada estado (`Rol.puedeCambiarA`): COMERCIO → CONFIRMADO, RECHAZADO, EN_PREPARACION, LISTO ·
CLIENTE → CANCELADO · REPARTIDOR → EN_CAMINO, ENTREGADO · ADMIN → todos. Además la transición debe ser legal según `EstadoPedido`.

```
CREADO → CONFIRMADO → EN_PREPARACION → LISTO → EN_CAMINO → ENTREGADO
   ├→ RECHAZADO (comercio)      CREADO/CONFIRMADO → CANCELADO (cliente)
```
Los estados finales no retroceden: el intento lanza `EstadoPedidoInvalidoException` (HTTP 409).

Ejemplo de creación de pedido:
```json
POST /api/pedidos
{ "comercioId": 1,
  "items": [ {"productoId": 1, "cantidad": 2} ],
  "direccionEntrega": "Zona 1, Amatitlán", "latEntrega": 14.485, "lonEntrega": -90.610,
  "codigoPromocion": "BIENVENIDO10",
  "pago": { "metodo": "TARJETA", "numeroTarjeta": "4111111111111111", "titular": "Ana López",
            "vencimiento": "12/30", "cvv": "123" } }
```
(`EFECTIVO` no necesita más datos; `TRANSFERENCIA` usa `referencia` y `montoTransferido`.)

## Dónde está cada concepto de Programación II (para la documentación)

| Concepto | Dónde |
|---|---|
| **Encapsulamiento** | Atributos privados; `Pedido.estado` sin setter, solo `cambiarEstado()`; colecciones de solo lectura (`getDetalles()`); datos de tarjeta `@Transient` |
| **Herencia + clase abstracta** | `Repartidor` (abstracta) → `RepartidorMoto/Bicicleta/Automovil`; `Pago` → 3 pagos; `Promocion` → 3 promociones; `Usuario` → `Repartidor` |
| **Interfaces** | `Rastreable` (Pedido, Repartidor), `Calificable` (Comercio, Repartidor), `Notificable` (Usuario, Comercio), `CriterioAsignacion` |
| **Polimorfismo / @Override** | `Pago.validar()/procesar()`, `Promocion.calcularDescuento()`, `Repartidor.getCapacidadMaxima()`, `MetodoPago.crear()`, criterios del motor — sin cadenas if/else por tipo |
| **Excepciones propias** | `EstadoPedidoInvalidoException`, `PagoInvalidoException`, `ReglaNegocioException`, `RecursoNoEncontradoException`, `PermisoDenegadoException` + `GlobalExceptionHandler` |
| **Colecciones** | `List<DetallePedido>`, `List<CriterioAsignacion>`, `EnumSet`, `Map` en reportes |
| **Motor de asignación (6 criterios)** | `service/asignacion/`: disponibilidad, sin pedido bloqueante, zona, distancia, carga, calificación → puntaje ponderado |

Paquetes: `controller`, `service`, `repository`, `model`, `dto`, `exception`, `interfaces`, `util`, `config`.

## Lo que falta del proyecto (no incluido aquí)

- **App Android (Java)**: debe consumir esta API (Retrofit + `Authorization: Bearer`). Para el emulador, la API está en `http://10.0.2.2:8080/api/`.
- ~~Frontend web~~ **Incluido**: abre `http://localhost:8080/` (`static/index.html`, `css/app.css`, `js/app.js` sobre `js/api.js`). Paneles por rol: cliente, comercio, repartidor y administrador.
- **Documentación**: `docs/diagramas.md` (UML y ER en Mermaid), el documento de conceptos POO (puedes partir de la tabla de arriba), manual de usuario y video.
