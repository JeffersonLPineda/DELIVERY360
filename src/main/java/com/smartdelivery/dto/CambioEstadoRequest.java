package com.smartdelivery.dto;

import com.smartdelivery.model.EstadoPedido;
import jakarta.validation.constraints.NotNull;

public record CambioEstadoRequest(@NotNull EstadoPedido estado) { }
