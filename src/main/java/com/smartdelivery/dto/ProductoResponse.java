package com.smartdelivery.dto;

import com.smartdelivery.model.Producto;

import java.math.BigDecimal;

public record ProductoResponse(Long id, String nombre, String descripcion, BigDecimal precio, boolean disponible) {
    public static ProductoResponse de(Producto p) {
        return new ProductoResponse(p.getId(), p.getNombre(), p.getDescripcion(), p.getPrecio(), p.isDisponible());
    }
}
