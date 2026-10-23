package com.smartdelivery.service.asignacion;

import com.smartdelivery.model.Pedido;
import com.smartdelivery.model.Repartidor;
import com.smartdelivery.util.DistanciaUtil;
import org.springframework.stereotype.Component;

/** 4. Distancia simulada repartidor → comercio (más cerca, mejor puntaje). */
@Component
public class CriterioDistancia implements CriterioAsignacion {
    private static final double DISTANCIA_MAXIMA_KM = 20.0;

    @Override public String nombre() { return "Distancia al comercio"; }
    @Override public double peso() { return 0.35; }

    @Override public double puntuar(Repartidor r, Pedido p) {
        double km = DistanciaUtil.km(r.getLatitud(), r.getLongitud(),
                p.getComercio().getLatitud(), p.getComercio().getLongitud());
        return Math.max(0, 1 - km / DISTANCIA_MAXIMA_KM);
    }
}
