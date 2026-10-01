package com.smartdelivery.dto;

import com.smartdelivery.model.DetallePedido;

import java.math.BigDecimal;

public record DetalleResponse(Long productoId, String producto, int cantidad, BigDecimal precioUnitario, BigDecimal subtotal) {
    public static DetalleResponse de(DetallePedido d) {
        return new DetalleResponse(d.getProducto().getId(), d.getProducto().getNombre(), d.getCantidad(),
                d.getPrecioUnitario(), d.getSubtotal());
    }
}
