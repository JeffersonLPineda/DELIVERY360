package com.smartdelivery.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@DiscriminatorValue("PORCENTAJE")
public class PromocionPorcentaje extends Promocion {
    @Column(name = "porcentaje", precision = 5, scale = 2)
    private BigDecimal porcentaje;

    protected PromocionPorcentaje() { }

    public PromocionPorcentaje(String codigo, String descripcion, BigDecimal porcentaje) {
        super(codigo, descripcion);
        this.porcentaje = porcentaje;
    }

    @Override
    public BigDecimal calcularDescuento(BigDecimal subtotal, BigDecimal costoEnvio) {
        return subtotal.multiply(porcentaje).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    @Override public TipoPromocion getTipo() { return TipoPromocion.PORCENTAJE; }
    public BigDecimal getPorcentaje() { return porcentaje; }
}
