package com.smartdelivery.model;

import com.smartdelivery.exception.PagoInvalidoException;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/** Pago contra entrega: permanece PENDIENTE hasta que el repartidor entrega el pedido y cobra. */
@Entity
@DiscriminatorValue("EFECTIVO")
public class PagoEfectivo extends Pago {
    @Column(precision = 12, scale = 2)
    private BigDecimal montoRecibido;
    @Column(precision = 12, scale = 2)
    private BigDecimal cambio;

    protected PagoEfectivo() { }
    public PagoEfectivo(BigDecimal monto) { super(monto); }

    @Override public void validar() { /* nada que validar: se cobra contra entrega */ }
    @Override public MetodoPago getMetodo() { return MetodoPago.EFECTIVO; }
    @Override public boolean seProcesaAlEntregar() { return true; }
    @Override public String descripcionPublica() { return "Efectivo contra entrega"; }

    /** El repartidor confirma cuánto efectivo recibió; si no lo indica se asume el monto exacto. */
    @Override
    public void cobrarAlEntregar(BigDecimal efectivoRecibido) {
        BigDecimal recibido = (efectivoRecibido == null) ? getMonto() : efectivoRecibido;
        if (recibido.compareTo(getMonto()) < 0) {
            throw new PagoInvalidoException("El efectivo recibido (Q" + recibido + ") no cubre el total del pedido (Q" + getMonto() + ")");
        }
        this.montoRecibido = recibido;
        this.cambio = recibido.subtract(getMonto());
        procesar();
    }

    @Override
    public Map<String, String> getDetalle() {
        Map<String, String> d = new LinkedHashMap<>();
        if (montoRecibido != null) {
            d.put("Efectivo recibido", "Q" + montoRecibido.setScale(2, java.math.RoundingMode.HALF_UP));
            d.put("Cambio entregado", "Q" + cambio.setScale(2, java.math.RoundingMode.HALF_UP));
        }
        return d;
    }
}
