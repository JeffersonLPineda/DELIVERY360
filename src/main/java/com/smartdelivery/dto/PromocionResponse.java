package com.smartdelivery.dto;

import com.smartdelivery.model.Promocion;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PromocionResponse(Long id, String codigo, String descripcion, String tipo, boolean activa,
                                LocalDate vigenteHasta, BigDecimal montoMinimo) {
    public static PromocionResponse de(Promocion p) {
        return new PromocionResponse(p.getId(), p.getCodigo(), p.getDescripcion(), p.getTipo().name(),
                p.isActiva(), p.getVigenteHasta(), p.getMontoMinimo());
    }
}
