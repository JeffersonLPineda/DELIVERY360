package com.smartdelivery.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ItemPedidoRequest(@NotNull Long productoId, @Min(1) int cantidad) { }
