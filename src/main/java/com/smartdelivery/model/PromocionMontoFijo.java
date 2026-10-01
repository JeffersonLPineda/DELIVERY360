package com.smartdelivery.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.math.BigDecimal;

@Entity
@DiscriminatorValue("MONTO_FIJO")
public class PromocionMontoFijo extends Promocion {
    @Column(name = "monto_fijo", precision = 12, scale = 2)
    private BigDecimal monto;

    protected PromocionMontoFijo() { }

    public PromocionMontoFijo(String codigo, String descripcion, BigDecimal monto) {
        super(codigo, descripcion);
        this.monto = monto;
    }

    @Override
    public BigDecimal calcularDescuento(BigDecimal subtotal, BigDecimal costoEnvio) {
        return monto.min(subtotal);
    }

    @Override public TipoPromocion getTipo() { return TipoPromocion.MONTO_FIJO; }
    public BigDecimal getMonto() { return monto; }
}
