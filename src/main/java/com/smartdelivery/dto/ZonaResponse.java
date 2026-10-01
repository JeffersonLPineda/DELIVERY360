package com.smartdelivery.dto;

import com.smartdelivery.model.Zona;

public record ZonaResponse(Long id, String nombre, double latitud, double longitud) {
    public static ZonaResponse de(Zona z) { return new ZonaResponse(z.getId(), z.getNombre(), z.getLatitud(), z.getLongitud()); }
}
