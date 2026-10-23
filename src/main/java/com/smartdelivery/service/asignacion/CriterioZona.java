package com.smartdelivery.service.asignacion;

import com.smartdelivery.model.Pedido;
import com.smartdelivery.model.Repartidor;
import org.springframework.stereotype.Component;

/** 3. Zona de operación: el repartidor debe operar en la zona del comercio. */
@Component
public class CriterioZona implements CriterioAsignacion {
    @Override public String nombre() { return "Zona de operación"; }
    @Override public double peso() { return 0.10; }

    @Override public boolean esElegible(Repartidor r, Pedido p) {
        if (p.getComercio().getZona() == null || r.getZona() == null) return true;
        return r.getZona().getId().equals(p.getComercio().getZona().getId());
    }
    @Override public double puntuar(Repartidor r, Pedido p) { return 1; }
}
