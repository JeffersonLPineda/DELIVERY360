package com.smartdelivery.dto;

import com.smartdelivery.model.TipoPromocion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PromocionRequest(
        @NotNull TipoPromocion tipo, @NotBlank String codigo, String descripcion,
        BigDecimal valor,            // % o monto fijo; ignorado en ENVIO_GRATIS
        LocalDate vigenteHasta, BigDecimal montoMinimo) { }
