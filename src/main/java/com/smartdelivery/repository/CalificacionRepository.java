package com.smartdelivery.repository;

import com.smartdelivery.model.Calificacion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalificacionRepository extends JpaRepository<Calificacion, Long> {
    boolean existsByPedidoId(Long pedidoId);
}
