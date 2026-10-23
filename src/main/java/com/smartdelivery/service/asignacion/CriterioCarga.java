package com.smartdelivery.service.asignacion;

import com.smartdelivery.model.EstadoPedido;
import com.smartdelivery.model.Pedido;
import com.smartdelivery.model.Repartidor;
import com.smartdelivery.repository.PedidoRepository;
import org.springframework.stereotype.Component;

import java.util.List;

/** 5. Carga actual: pedidos activos vs. capacidad del vehículo (comportamiento polimórfico). */
@Component
public class CriterioCarga implements CriterioAsignacion {
    private static final List<EstadoPedido> ACTIVOS =
            List.of(EstadoPedido.CONFIRMADO, EstadoPedido.EN_PREPARACION, EstadoPedido.LISTO, EstadoPedido.EN_CAMINO);

    private final PedidoRepository pedidoRepository;

    public CriterioCarga(PedidoRepository pedidoRepository) { this.pedidoRepository = pedidoRepository; }

    @Override public String nombre() { return "Carga de trabajo"; }
    @Override public double peso() { return 0.25; }

    private long activos(Repartidor r) { return pedidoRepository.countByRepartidorIdAndEstadoIn(r.getId(), ACTIVOS); }

    @Override public boolean esElegible(Repartidor r, Pedido p) { return activos(r) < r.getCapacidadMaxima(); }

    @Override public double puntuar(Repartidor r, Pedido p) {
        return 1.0 - ((double) activos(r) / r.getCapacidadMaxima());
    }
}
