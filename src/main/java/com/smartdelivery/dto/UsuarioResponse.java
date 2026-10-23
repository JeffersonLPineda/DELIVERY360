package com.smartdelivery.dto;

import com.smartdelivery.model.Repartidor;
import com.smartdelivery.model.Usuario;

public record UsuarioResponse(Long id, String nombre, String email, String telefono, String rol,
                              boolean activo, String tipoVehiculo, Boolean disponible, Double calificacion) {
    public static UsuarioResponse de(Usuario u) {
        if (u instanceof Repartidor r) {
            return new UsuarioResponse(r.getId(), r.getNombre(), r.getEmail(), r.getTelefono(), r.getRol().name(),
                    r.isActivo(), r.getTipoVehiculo(), r.isDisponible(), r.getCalificacionPromedio());
        }
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getTelefono(), u.getRol().name(),
                u.isActivo(), null, null, null);
    }
}
