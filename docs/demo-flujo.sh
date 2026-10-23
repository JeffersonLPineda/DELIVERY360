#!/usr/bin/env bash
# Demo del flujo: invitado (sin cuenta) -> comercio -> asignación automática -> repartidor -> calificación.
# Requisitos: servidor corriendo en localhost:8080 con los datos de ejemplo.  Uso: bash docs/demo-flujo.sh
URL=http://localhost:8080/api

req() { # METODO RUTA TOKEN [BODY]
  curl -s -X "$1" "$URL$2" -H "Content-Type: application/json" ${3:+-H "Authorization: Bearer $3"} ${4:+-d "$4"}
}
token() { req POST /auth/login "" "{\"email\":\"$1\",\"password\":\"$2\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'; }
campo() { sed -n "s/.*\"$1\":\"\([^\"]*\)\".*/\1/p"; }

echo "== 1. Invitado (SIN sesión) ve los comercios y paga con tarjeta"
req GET /comercios; echo
PEDIDO=$(req POST /pedidos "" '{"comercioId":1,"items":[{"productoId":1,"cantidad":2},{"productoId":2,"cantidad":1}],"direccionEntrega":"Zona 1, Amatitlán","latEntrega":14.4850,"lonEntrega":-90.6100,"notasEntrega":"Casa azul","nombreContacto":"Ana López","telefonoContacto":"5555-1234","codigoPromocion":"BIENVENIDO10","pago":{"metodo":"TARJETA","numeroTarjeta":"4242424242424242","titular":"ANA LOPEZ","vencimiento":"12/30","cvv":"123"}}')
echo "$PEDIDO"; echo
ID=$(echo "$PEDIDO" | sed -n 's/^{"id":\([0-9]*\).*/\1/p')
CODIGO=$(echo "$PEDIDO" | campo codigoSeguimiento)
echo "Pedido #$ID, código de seguimiento: $CODIGO"; echo

echo "== 1b. Tarjeta rechazada (fondos insuficientes): NO se crea el pedido (402)"
req POST /pedidos "" '{"comercioId":1,"items":[{"productoId":1,"cantidad":1}],"direccionEntrega":"Zona 1","latEntrega":14.4850,"lonEntrega":-90.6100,"nombreContacto":"Ana","telefonoContacto":"5555-1234","pago":{"metodo":"TARJETA","numeroTarjeta":"4000000000009995","titular":"ANA LOPEZ","vencimiento":"12/30","cvv":"123"}}'; echo; echo

echo "== 2. Comercio acepta (se asigna repartidor automáticamente) y prepara"
TK=$(token comercio1@smartdelivery.com Comercio123)
RESP=$(req PUT /pedidos/$ID/estado "$TK" '{"estado":"CONFIRMADO"}')
echo "$RESP"; echo
req PUT /pedidos/$ID/estado "$TK" '{"estado":"EN_PREPARACION"}' > /dev/null
req PUT /pedidos/$ID/estado "$TK" '{"estado":"LISTO"}' > /dev/null

echo "== 3. Repartidor asignado actualiza estados"
TIPO=$(echo "$RESP" | sed -n 's/.*"tipoVehiculo":"\([A-Z]*\)".*/\1/p')
case "$TIPO" in MOTO) EM=moto;; BICICLETA) EM=bici;; AUTOMOVIL) EM=auto;; *) echo "Sin repartidor asignado"; exit 1;; esac
TR=$(token $EM@smartdelivery.com Repartidor123)
req PUT /pedidos/$ID/estado "$TR" '{"estado":"EN_CAMINO"}' > /dev/null
req PUT /pedidos/$ID/estado "$TR" '{"estado":"ENTREGADO"}'; echo; echo

echo "== 4. Transición inválida (debe responder 409 EstadoPedidoInvalido)"
req PUT /pedidos/$ID/estado "$TR" '{"estado":"EN_CAMINO"}'; echo; echo

echo "== 5. El invitado consulta y califica con su código (sin sesión)"
req GET "/publico/pedidos/$ID?codigo=$CODIGO" | campo estado; echo
req POST "/publico/pedidos/$ID/calificar?codigo=$CODIGO" "" "{\"pedidoId\":$ID,\"puntajeComercio\":5,\"puntajeRepartidor\":4,\"comentario\":\"Todo excelente\"}"; echo; echo

echo "== 6. Pedido en EFECTIVO: el pago queda PENDIENTE hasta que el repartidor entrega"
P2=$(req POST /pedidos "" '{"comercioId":1,"items":[{"productoId":3,"cantidad":1}],"direccionEntrega":"Zona 1, Amatitlán","latEntrega":14.4850,"lonEntrega":-90.6100,"nombreContacto":"Luis Pérez","telefonoContacto":"5555-9876","pago":{"metodo":"EFECTIVO"}}')
ID2=$(echo "$P2" | sed -n 's/^{"id":\([0-9]*\).*/\1/p')
echo "estadoPago al crear: $(echo "$P2" | campo estadoPago)"
RESP2=$(req PUT /pedidos/$ID2/estado "$TK" '{"estado":"CONFIRMADO"}')
req PUT /pedidos/$ID2/estado "$TK" '{"estado":"EN_PREPARACION"}' > /dev/null
req PUT /pedidos/$ID2/estado "$TK" '{"estado":"LISTO"}' > /dev/null
TIPO2=$(echo "$RESP2" | sed -n 's/.*"tipoVehiculo":"\([A-Z]*\)".*/\1/p')   # el motor puede asignar otro repartidor
case "$TIPO2" in MOTO) EM2=moto;; BICICLETA) EM2=bici;; AUTOMOVIL) EM2=auto;; *) echo "Sin repartidor asignado"; exit 1;; esac
TR=$(token $EM2@smartdelivery.com Repartidor123)
req PUT /pedidos/$ID2/estado "$TR" '{"estado":"EN_CAMINO"}' > /dev/null
echo "estadoPago en camino: $(req GET /pedidos/$ID2 "$TR" | campo estadoPago)"
req PUT /pedidos/$ID2/estado "$TR" '{"estado":"ENTREGADO","efectivoRecibido":100}' > /dev/null
echo "estadoPago tras la entrega: $(req GET /pedidos/$ID2 "$TR" | campo estadoPago)"; echo

echo "== 7. Reporte del administrador"
TA=$(token admin@smartdelivery.com Admin123)
req GET /admin/reportes "$TA"; echo
