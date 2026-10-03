package com.smartdelivery.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "pagos")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "metodo")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public abstract class Pago {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(precision = 12, scale = 2)
    private BigDecimal monto;
    @Enumerated(EnumType.STRING)
    private EstadoPago estado = EstadoPago.PENDIENTE;
    private LocalDateTime fechaProcesado;
    /** Número de comprobante del cobro (solo existe cuando el pago se completa). */
    private String idTransaccion;
    private String idReembolso;
    private LocalDateTime fechaReembolso;

    protected Pago(BigDecimal monto) { this.monto = monto; }

    /** Valida los datos del pago; lanza PagoInvalidoException si no son correctos. */
    public abstract void validar();

    public abstract MetodoPago getMetodo();

    /** Texto para mostrar al usuario, p. ej. "Visa •••• 4242" o "Efectivo contra entrega". */
    public String descripcionPublica() { return getMetodo().name(); }

    /** Líneas del comprobante (etiqueta -> valor). Nunca incluye datos sensibles. */
    public Map<String, String> getDetalle() { return Map.of(); }

    /** El efectivo se cobra al entregar; tarjeta y transferencia, al crear el pedido. */
    public boolean seProcesaAlEntregar() { return false; }

    /** ¿El banco pide verificación adicional (3-D Secure) antes de cobrar? */
    public boolean requiereAutenticacion() { return false; }

    /** Identifica el pago dentro de un desafío 3-D Secure. */
    public String claveDesafio() { return ""; }

    public void procesar() {
        this.estado = EstadoPago.COMPLETADO;
        this.fechaProcesado = LocalDateTime.now();
        this.idTransaccion = getMetodo().name().substring(0, 3) + "-" + codigoCorto();
    }

    /** Lo invoca el pedido al entregarse: solo los pagos contra entrega se completan aquí. */
    public void cobrarAlEntregar(BigDecimal efectivoRecibido) {
        if (seProcesaAlEntregar()) procesar();
    }

    /** Pedido cancelado o rechazado: reembolsa lo cobrado o anula lo que nunca se cobró. */
    public void cancelar() {
        if (estado == EstadoPago.COMPLETADO) {
            this.estado = EstadoPago.REEMBOLSADO;
            this.idReembolso = "RF-" + codigoCorto();
            this.fechaReembolso = LocalDateTime.now();
        } else if (estado == EstadoPago.PENDIENTE) {
            this.estado = EstadoPago.ANULADO;
        }
    }

    protected static String codigoCorto() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }
}
