package com.smartdelivery.model;

import com.smartdelivery.dto.DatosPagoDTO;

import java.math.BigDecimal;

/** Cada método sabe construir su propio Pago (polimorfismo, sin switch por tipo). */
public enum MetodoPago {
    EFECTIVO {
        @Override public Pago crear(DatosPagoDTO d, BigDecimal monto) { return new PagoEfectivo(monto); }
    },
    TARJETA {
        @Override public Pago crear(DatosPagoDTO d, BigDecimal monto) {
            return new PagoTarjeta(monto, d.numeroTarjeta(), d.titular(), d.vencimiento(), d.cvv());
        }
    },
    TRANSFERENCIA {
        @Override public Pago crear(DatosPagoDTO d, BigDecimal monto) {
            return new PagoTransferencia(monto, d.referencia(), d.montoTransferido());
        }
    };

    public abstract Pago crear(DatosPagoDTO datos, BigDecimal monto);
}
