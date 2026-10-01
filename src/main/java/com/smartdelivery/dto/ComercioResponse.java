package com.smartdelivery.dto;

import com.smartdelivery.model.Comercio;

public record ComercioResponse(Long id, String nombre, String direccion, double latitud, double longitud,
                               String zona, boolean abierto, int tiempoPreparacionMin,
                               double calificacion, int totalCalificaciones) {
    public static ComercioResponse de(Comercio c) {
        return new ComercioResponse(c.getId(), c.getNombre(), c.getDireccion(), c.getLatitud(), c.getLongitud(),
                c.getZona() == null ? null : c.getZona().getNombre(), c.isAbierto(), c.getTiempoPreparacionMin(),
                c.getCalificacionPromedio(), c.getTotalCalificaciones());
    }
}
