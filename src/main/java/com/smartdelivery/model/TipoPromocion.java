package com.smartdelivery.model;

import com.smartdelivery.dto.PromocionRequest;

public enum TipoPromocion {
    PORCENTAJE {
        @Override public Promocion crear(PromocionRequest r) { return new PromocionPorcentaje(r.codigo(), r.descripcion(), r.valor()); }
    },
    MONTO_FIJO {
        @Override public Promocion crear(PromocionRequest r) { return new PromocionMontoFijo(r.codigo(), r.descripcion(), r.valor()); }
    },
    ENVIO_GRATIS {
        @Override public Promocion crear(PromocionRequest r) { return new PromocionEnvioGratis(r.codigo(), r.descripcion()); }
    };

    public abstract Promocion crear(PromocionRequest request);
}
