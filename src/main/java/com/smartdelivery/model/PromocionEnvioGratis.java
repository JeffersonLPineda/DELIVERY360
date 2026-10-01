package com.smartdelivery.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.math.BigDecimal;

@Entity
@DiscriminatorValue("ENVIO_GRATIS")
public class PromocionEnvioGratis extends Promocion {
    protected PromocionEnvioGratis() { }

    public PromocionEnvioGratis(String codigo, String descripcion) { super(codigo, descripcion); }

    @Override
    public BigDecimal calcularDescuento(BigDecimal subtotal, BigDecimal costoEnvio) { return costoEnvio; }

    @Override public TipoPromocion getTipo() { return TipoPromocion.ENVIO_GRATIS; }
}
