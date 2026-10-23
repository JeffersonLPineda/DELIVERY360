package com.smartdelivery.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CalificacionRequest(
        @NotNull Long pedidoId,
        @Min(1) @Max(5) int puntajeComercio,
        @Min(1) @Max(5) int puntajeRepartidor,
        String comentario) { }
