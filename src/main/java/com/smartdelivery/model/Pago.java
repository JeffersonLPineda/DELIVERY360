package com.smartdelivery.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    protected Pago(BigDecimal monto) { this.monto = monto; }

    /** Valida los datos del pago; lanza PagoInvalidoException si no son correctos. */
    public abstract void validar();

    public abstract MetodoPago getMetodo();

    /** El efectivo se cobra al entregar; tarjeta y transferencia, al crear el pedido. */
    public boolean seProcesaAlEntregar() { return false; }

    public void procesar() {
        this.estado = EstadoPago.COMPLETADO;
        this.fechaProcesado = LocalDateTime.now();
    }

    public void reembolsar() {
        if (estado == EstadoPago.COMPLETADO) this.estado = EstadoPago.REEMBOLSADO;
    }
}
