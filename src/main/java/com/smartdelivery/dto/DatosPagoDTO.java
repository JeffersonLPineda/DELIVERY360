package com.smartdelivery.dto;

import com.smartdelivery.model.MetodoPago;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** Solo se usan los campos que correspondan al método elegido. */
public record DatosPagoDTO(
        @NotNull MetodoPago metodo,
        String numeroTarjeta, String titular, String vencimiento, String cvv,
        String referencia, BigDecimal montoTransferido) { }
