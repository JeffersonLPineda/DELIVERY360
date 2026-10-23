package com.smartdelivery.dto;

import com.smartdelivery.model.EstadoPedido;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** efectivoRecibido: solo lo usa el repartidor al marcar ENTREGADO un pedido pagado contra entrega. */
public record CambioEstadoRequest(@NotNull EstadoPedido estado, BigDecimal efectivoRecibido) { }
