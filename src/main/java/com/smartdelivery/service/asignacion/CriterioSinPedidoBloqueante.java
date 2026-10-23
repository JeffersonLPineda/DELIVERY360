package com.smartdelivery.service.asignacion;

import com.smartdelivery.model.EstadoPedido;
import com.smartdelivery.model.Pedido;
import com.smartdelivery.model.Repartidor;
import com.smartdelivery.repository.PedidoRepository;
import org.springframework.stereotype.Component;

import java.util.List;

/** 2. Un repartidor con un pedido EN_CAMINO está ocupado y no se le asigna otro. */
@Component
public class CriterioSinPedidoBloqueante implements CriterioAsignacion {
    private final PedidoRepository pedidoRepository;

    public CriterioSinPedidoBloqueante(PedidoRepository pedidoRepository) { this.pedidoRepository = pedidoRepository; }

    @Override public String nombre() { return "Sin pedidos bloqueantes"; }
    @Override public double peso() { return 0; }
    @Override public boolean esElegible(Repartidor r, Pedido p) {
        return pedidoRepository.countByRepartidorIdAndEstadoIn(r.getId(), List.of(EstadoPedido.EN_CAMINO)) == 0;
    }
    @Override public double puntuar(Repartidor r, Pedido p) { return 1; }
}
