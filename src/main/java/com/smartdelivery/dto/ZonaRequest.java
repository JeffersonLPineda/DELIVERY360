package com.smartdelivery.dto;

import jakarta.validation.constraints.NotBlank;

public record ZonaRequest(@NotBlank String nombre, double latitud, double longitud) { }
