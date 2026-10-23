package com.smartdelivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ComercioRequest(
        @NotBlank String nombre, String direccion, double latitud, double longitud,
        Long zonaId, @NotNull Long propietarioId, Integer tiempoPreparacionMin) { }
