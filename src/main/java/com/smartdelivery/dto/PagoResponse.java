package com.smartdelivery.dto;

import com.smartdelivery.model.Pago;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/** Comprobante del pago. Nunca incluye número completo, vencimiento ni CVV. */
public record PagoResponse(String metodo, String estado, BigDecimal monto, String descripcion,
                           String idTransaccion, LocalDateTime fechaProcesado, String idReembolso,
                           Map<String, String> detalle) {
    public static PagoResponse de(Pago p) {
        if (p == null) return null;
        return new PagoResponse(p.getMetodo().name(), p.getEstado().name(), p.getMonto(), p.descripcionPublica(),
                p.getIdTransaccion(), p.getFechaProcesado(), p.getIdReembolso(), p.getDetalle());
    }
}
