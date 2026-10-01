#!/usr/bin/env bash
# Demo del flujo obligatorio: cliente -> comercio -> asignación automática -> repartidor -> calificación.
# Requisitos: servidor corriendo en localhost:8080 con los datos de ejemplo.  Uso: bash docs/demo-flujo.sh
URL=http://localhost:8080/api

req() { # METODO RUTA TOKEN [BODY]
  curl -s -X "$1" "$URL$2" -H "Content-Type: application/json" ${3:+-H "Authorization: Bearer $3"} ${4:+-d "$4"}
}
token() { req POST /auth/login "" "{\"email\":\"$1\",\"password\":\"$2\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'; }

echo "== 1. Cliente inicia sesión y crea el pedido"
TC=$(token cliente@smartdelivery.com Cliente123)
req GET /comercios "$TC"; echo
PEDIDO=$(req POST /pedidos "$TC" '{"comercioId":1,"items":[{"productoId":1,"cantidad":2},{"productoId":2,"cantidad":1}],"direccionEntrega":"Zona 1, Amatitlán","latEntrega":14.4850,"lonEntrega":-90.6100,"codigoPromocion":"BIENVENIDO10","pago":{"metodo":"EFECTIVO"}}')
echo "$PEDIDO"; echo
ID=$(echo "$PEDIDO" | sed -n 's/^{"id":\([0-9]*\).*/\1/p')

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

echo "== 5. Cliente califica"
req POST /calificaciones "$TC" "{\"pedidoId\":$ID,\"puntajeComercio\":5,\"puntajeRepartidor\":4,\"comentario\":\"Todo excelente\"}"; echo; echo

echo "== 6. Reporte del administrador"
TA=$(token admin@smartdelivery.com Admin123)
req GET /admin/reportes "$TA"; echo
