package com.smartdelivery.dto;

import com.smartdelivery.model.Pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponse(
        Long id, String estado,
        Long clienteId, String clienteNombre,
        Long comercioId, String comercioNombre,
        Long repartidorId, String repartidorNombre, String tipoVehiculo,
        List<DetalleResponse> detalles,
        BigDecimal subtotal, BigDecimal descuento, BigDecimal costoEnvio, BigDecimal total,
        double distanciaKm, String direccionEntrega,
        String metodoPago, String estadoPago, String codigoPromocion,
        boolean calificado, LocalDateTime fechaCreacion,
        List<String> historial, String seguimiento) {

    /** Debe invocarse dentro de una transacción (accede a colecciones LAZY). */
    public static PedidoResponse de(Pedido p) {
        var r = p.getRepartidor();
        return new PedidoResponse(
                p.getId(), p.getEstado().name(),
                p.getCliente().getId(), p.getCliente().getNombre(),
                p.getComercio().getId(), p.getComercio().getNombre(),
                r == null ? null : r.getId(), r == null ? null : r.getNombre(), r == null ? null : r.getTipoVehiculo(),
                p.getDetalles().stream().map(DetalleResponse::de).toList(),
                p.getSubtotal(), p.getDescuento(), p.getCostoEnvio(), p.getTotal(),
                p.getDistanciaKm(), p.getDireccionEntrega(),
                p.getPago() == null ? null : p.getPago().getMetodo().name(),
                p.getPago() == null ? null : p.getPago().getEstado().name(),
                p.getPromocion() == null ? null : p.getPromocion().getCodigo(),
                p.isCalificado(), p.getFechaCreacion(),
                List.copyOf(p.getHistorial()), p.obtenerSeguimiento());
    }
}
