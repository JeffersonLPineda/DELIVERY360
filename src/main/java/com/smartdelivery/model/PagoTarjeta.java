package com.smartdelivery.model;

import com.smartdelivery.exception.PagoInvalidoException;
import com.smartdelivery.util.ValidadorTarjeta;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Transient;

import java.math.BigDecimal;

@Entity
@DiscriminatorValue("TARJETA")
public class PagoTarjeta extends Pago {
    private static final BigDecimal LIMITE_SIMULADO = new BigDecimal("50000");

    private String ultimos4;
    private String titular;

    // Datos sensibles: nunca se guardan en la base de datos
    @Transient private String numeroCompleto;
    @Transient private String vencimiento;
    @Transient private String cvv;

    protected PagoTarjeta() { }

    public PagoTarjeta(BigDecimal monto, String numero, String titular, String vencimiento, String cvv) {
        super(monto);
        this.numeroCompleto = numero;
        this.titular = titular;
        this.vencimiento = vencimiento;
        this.cvv = cvv;
        this.ultimos4 = (numero != null && numero.length() >= 4) ? numero.substring(numero.length() - 4) : "????";
    }

    @Override
    public void validar() {
        if (titular == null || titular.isBlank()) throw new PagoInvalidoException("Falta el titular de la tarjeta");
        if (!ValidadorTarjeta.numeroValido(numeroCompleto)) throw new PagoInvalidoException("Número de tarjeta inválido");
        if (!ValidadorTarjeta.vigente(vencimiento)) throw new PagoInvalidoException("Tarjeta vencida o con formato inválido (MM/yy)");
        if (!ValidadorTarjeta.cvvValido(cvv)) throw new PagoInvalidoException("CVV inválido");
    }

    @Override
    public void procesar() {
        if (getMonto().compareTo(LIMITE_SIMULADO) > 0) {
            throw new PagoInvalidoException("Cobro rechazado por el banco (monto sobre el límite simulado)");
        }
        super.procesar();
    }

    @Override public MetodoPago getMetodo() { return MetodoPago.TARJETA; }
    public String getUltimos4() { return ultimos4; }
    public String getTitular() { return titular; }
}
