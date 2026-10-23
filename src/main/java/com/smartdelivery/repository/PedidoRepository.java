package com.smartdelivery.repository;

import com.smartdelivery.model.EstadoPedido;
import com.smartdelivery.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findAllByOrderByFechaCreacionDesc();
    List<Pedido> findByClienteIdOrderByFechaCreacionDesc(Long clienteId);
    List<Pedido> findByComercioPropietarioIdOrderByFechaCreacionDesc(Long propietarioId);
    List<Pedido> findByRepartidorIdOrderByFechaCreacionDesc(Long repartidorId);
    List<Pedido> findByEstadoIn(Collection<EstadoPedido> estados);
    long countByRepartidorIdAndEstadoIn(Long repartidorId, Collection<EstadoPedido> estados);
}
