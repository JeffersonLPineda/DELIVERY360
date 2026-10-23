package com.smartdelivery.model;

import java.util.EnumSet;
import java.util.Set;

import static com.smartdelivery.model.EstadoPedido.*;

/** Roles del sistema y los estados de pedido que cada uno puede provocar. */
public enum Rol {
    ADMIN(EnumSet.allOf(EstadoPedido.class)),
    COMERCIO(EnumSet.of(CONFIRMADO, RECHAZADO, EN_PREPARACION, LISTO)),
    CLIENTE(EnumSet.of(CANCELADO)),
    REPARTIDOR(EnumSet.of(EN_CAMINO, ENTREGADO));

    private final Set<EstadoPedido> estadosPermitidos;

    Rol(Set<EstadoPedido> estadosPermitidos) { this.estadosPermitidos = estadosPermitidos; }

    public boolean puedeCambiarA(EstadoPedido estado) { return estadosPermitidos.contains(estado); }
}
