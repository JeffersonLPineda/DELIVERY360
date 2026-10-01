package com.smartdelivery.model;

import com.smartdelivery.exception.PagoInvalidoException;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Transient;

import java.math.BigDecimal;

@Entity
@DiscriminatorValue("TRANSFERENCIA")
public class PagoTransferencia extends Pago {
    private String referencia;
    @Transient private BigDecimal montoTransferido;

    protected PagoTransferencia() { }

    public PagoTransferencia(BigDecimal monto, String referencia, BigDecimal montoTransferido) {
        super(monto);
        this.referencia = referencia;
        this.montoTransferido = montoTransferido;
    }

    @Override
    public void validar() {
        if (referencia == null || !referencia.matches("[A-Za-z0-9]{6,20}")) {
            throw new PagoInvalidoException("Referencia de transferencia inválida (6 a 20 caracteres alfanuméricos)");
        }
        if (montoTransferido == null || montoTransferido.compareTo(getMonto()) < 0) {
            throw new PagoInvalidoException("El monto transferido no cubre el total del pedido");
        }
    }

    @Override public MetodoPago getMetodo() { return MetodoPago.TRANSFERENCIA; }
    public String getReferencia() { return referencia; }
}
