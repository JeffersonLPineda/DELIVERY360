package com.smartdelivery.service.asignacion;

import com.smartdelivery.model.Pedido;
import com.smartdelivery.model.Repartidor;
import org.springframework.stereotype.Component;

/** 6. Calificación histórica (sin calificaciones previas se asume un valor neutro). */
@Component
public class CriterioCalificacion implements CriterioAsignacion {
    @Override public String nombre() { return "Calificación histórica"; }
    @Override public double peso() { return 0.30; }

    @Override public double puntuar(Repartidor r, Pedido p) {
        return r.getTotalCalificaciones() == 0 ? 0.7 : r.getCalificacionPromedio() / 5.0;
    }
}
