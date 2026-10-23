package com.smartdelivery.service.asignacion;

import com.smartdelivery.model.Pedido;
import com.smartdelivery.model.Repartidor;
import org.springframework.stereotype.Component;

/** 1. Solo repartidores activos y marcados como disponibles. */
@Component
public class CriterioDisponibilidad implements CriterioAsignacion {
    @Override public String nombre() { return "Disponibilidad"; }
    @Override public double peso() { return 0; }
    @Override public boolean esElegible(Repartidor r, Pedido p) { return r.isActivo() && r.isDisponible(); }
    @Override public double puntuar(Repartidor r, Pedido p) { return 1; }
}
