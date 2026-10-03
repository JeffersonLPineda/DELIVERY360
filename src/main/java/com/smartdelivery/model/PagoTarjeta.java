package com.smartdelivery.model;

import com.smartdelivery.exception.PagoInvalidoException;
import com.smartdelivery.util.PasarelaSimulada;
import com.smartdelivery.util.PasarelaSimulada.Marca;
import com.smartdelivery.util.ValidadorTarjeta;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Transient;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Pago con tarjeta: valida el formato, pide autorización a la pasarela (simulada) y guarda solo lo que
 * guardaría un comercio real: marca, últimos 4 dígitos, titular y código de autorización.
 */
@Entity
@DiscriminatorValue("TARJETA")
public class PagoTarjeta extends Pago {
    private String marca;
    private String ultimos4;
    private String titular;
    private String codigoAutorizacion;

    // Datos sensibles: nunca se guardan en la base de datos
    @Transient private String numeroCompleto;
    @Transient private String vencimiento;
    @Transient private String cvv;

    protected PagoTarjeta() { }

    public PagoTarjeta(BigDecimal monto, String numero, String titular, String vencimiento, String cvv) {
        super(monto);
        this.numeroCompleto = (numero == null) ? null : numero.replaceAll("[\\s-]", "");
        this.titular = (titular == null) ? null : titular.trim().toUpperCase();
        this.vencimiento = vencimiento == null ? null : vencimiento.trim();
        this.cvv = cvv;
        this.marca = PasarelaSimulada.detectar(this.numeroCompleto).nombre();
        this.ultimos4 = (numeroCompleto != null && numeroCompleto.length() >= 4)
                ? numeroCompleto.substring(numeroCompleto.length() - 4) : "????";
    }

    @Override
    public void validar() {
        if (titular == null || !titular.matches("[\\p{L} .'-]{3,60}")) {
            throw new PagoInvalidoException("Escribe el nombre del titular tal como aparece en la tarjeta");
        }
        if (!ValidadorTarjeta.numeroValido(numeroCompleto)) throw new PagoInvalidoException("El número de tarjeta no es válido");
        Marca m = PasarelaSimulada.detectar(numeroCompleto);
        if (m == Marca.DESCONOCIDA || !PasarelaSimulada.largoValido(m, numeroCompleto)) {
            throw new PagoInvalidoException("Solo aceptamos Visa, Mastercard, American Express y Discover");
        }
        if (!ValidadorTarjeta.vigente(vencimiento)) throw new PagoInvalidoException("Tarjeta vencida o fecha inválida (usa MM/AA)");
        if (cvv == null || !cvv.matches("\\d{" + m.largoCvv() + "}")) {
            throw new PagoInvalidoException("El CVV de " + m.nombre() + " debe tener " + m.largoCvv() + " dígitos");
        }
    }

    @Override
    public boolean requiereAutenticacion() { return PasarelaSimulada.requiere3DS(numeroCompleto); }

    @Override
    public String claveDesafio() { return ultimos4; }

    /** Autorización + captura inmediata: si el "banco" rechaza, lanza PagoInvalidoException y no se crea el pedido. */
    @Override
    public void procesar() {
        PasarelaSimulada.Resultado r = PasarelaSimulada.autorizar(numeroCompleto, getMonto());
        if (!r.aprobado()) throw new PagoInvalidoException(r.mensaje());
        this.codigoAutorizacion = r.autorizacion();
        super.procesar();
    }

    @Override public MetodoPago getMetodo() { return MetodoPago.TARJETA; }
    @Override public String descripcionPublica() { return marca + " •••• " + ultimos4; }

    @Override
    public Map<String, String> getDetalle() {
        Map<String, String> d = new LinkedHashMap<>();
        d.put("Tarjeta", descripcionPublica());
        d.put("Titular", String.valueOf(titular));
        if (codigoAutorizacion != null) d.put("Código de autorización", codigoAutorizacion);
        return d;
    }

    public String getMarca() { return marca; }
    public String getUltimos4() { return ultimos4; }
    public String getTitular() { return titular; }
    public String getCodigoAutorizacion() { return codigoAutorizacion; }
}
