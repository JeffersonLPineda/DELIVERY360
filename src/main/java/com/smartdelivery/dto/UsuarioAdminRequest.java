package com.smartdelivery.dto;

import com.smartdelivery.model.Rol;
import com.smartdelivery.model.TipoVehiculo;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioAdminRequest(
        @NotBlank String nombre,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6) String password,
        String telefono,
        @NotNull Rol rol,
        TipoVehiculo tipoVehiculo,   // obligatorio si rol = REPARTIDOR
        Long zonaId) { }
