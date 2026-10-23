package com.smartdelivery.model;

import java.util.EnumSet;
import java.util.Set;

/** Ciclo de vida de un pedido. Las transiciones válidas viven aquí, no dispersas en if/else. */
public enum EstadoPedido {
    CREADO, CONFIRMADO, EN_PREPARACION, LISTO, EN_CAMINO, ENTREGADO, CANCELADO, RECHAZADO;

    public Set<EstadoPedido> siguientes() {
        return switch (this) {
            case CREADO -> EnumSet.of(CONFIRMADO, RECHAZADO, CANCELADO);
            case CONFIRMADO -> EnumSet.of(EN_PREPARACION, CANCELADO);
            case EN_PREPARACION -> EnumSet.of(LISTO);
            case LISTO -> EnumSet.of(EN_CAMINO);
            case EN_CAMINO -> EnumSet.of(ENTREGADO);
            case ENTREGADO, CANCELADO, RECHAZADO -> EnumSet.noneOf(EstadoPedido.class);
        };
    }

    public boolean puedeTransicionarA(EstadoPedido destino) { return siguientes().contains(destino); }

    public boolean esFinal() { return siguientes().isEmpty(); }
}
