package com.smartdelivery.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.math.BigDecimal;

@Entity
@DiscriminatorValue("EFECTIVO")
public class PagoEfectivo extends Pago {
    protected PagoEfectivo() { }
    public PagoEfectivo(BigDecimal monto) { super(monto); }

    @Override public void validar() { /* nada que validar: se cobra contra entrega */ }
    @Override public MetodoPago getMetodo() { return MetodoPago.EFECTIVO; }
    @Override public boolean seProcesaAlEntregar() { return true; }
}
