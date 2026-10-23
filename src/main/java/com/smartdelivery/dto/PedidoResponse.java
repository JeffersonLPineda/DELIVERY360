package com.smartdelivery.dto;

import com.smartdelivery.model.Pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponse(
        Long id, String estado,
        Long clienteId, String clienteNombre, String telefonoContacto, String emailContacto, boolean invitado,
        Long comercioId, String comercioNombre, String comercioDireccion, double comercioLat, double comercioLon,
        Long repartidorId, String repartidorNombre, String tipoVehiculo,
        List<DetalleResponse> detalles,
        BigDecimal subtotal, BigDecimal descuento, BigDecimal costoEnvio, BigDecimal total,
        double distanciaKm, String direccionEntrega, String notasEntrega, double latEntrega, double lonEntrega,
        String metodoPago, String estadoPago, PagoResponse pago, String codigoPromocion,
        boolean calificado, String codigoSeguimiento, LocalDateTime fechaCreacion,
        List<String> historial, String seguimiento) {

    /** Respuesta normal: NO incluye el código de seguimiento (solo lo ve quien crea el pedido). */
    public static PedidoResponse de(Pedido p) { return de(p, false); }

    /** Debe invocarse dentro de una transacción (accede a colecciones LAZY). */
    public static PedidoResponse de(Pedido p, boolean incluirCodigo) {
        var r = p.getRepartidor();
        var c = p.getComercio();
        var pg = p.getPago();
        return new PedidoResponse(
                p.getId(), p.getEstado().name(),
                p.getCliente() == null ? null : p.getCliente().getId(), p.getNombreContacto(),
                p.getTelefonoContacto(), p.getEmailContacto(), p.esInvitado(),
                c.getId(), c.getNombre(), c.getDireccion(), c.getLatitud(), c.getLongitud(),
                r == null ? null : r.getId(), r == null ? null : r.getNombre(), r == null ? null : r.getTipoVehiculo(),
                p.getDetalles().stream().map(DetalleResponse::de).toList(),
                p.getSubtotal(), p.getDescuento(), p.getCostoEnvio(), p.getTotal(),
                p.getDistanciaKm(), p.getDireccionEntrega(), p.getNotasEntrega(), p.getLatEntrega(), p.getLonEntrega(),
                pg == null ? null : pg.getMetodo().name(),
                pg == null ? null : pg.getEstado().name(),
                PagoResponse.de(pg),
                p.getPromocion() == null ? null : p.getPromocion().getCodigo(),
                p.isCalificado(), incluirCodigo ? p.getCodigoSeguimiento() : null, p.getFechaCreacion(),
                List.copyOf(p.getHistorial()), p.obtenerSeguimiento());
    }
}
