package com.smartdelivery.repository;

import com.smartdelivery.model.Repartidor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RepartidorRepository extends JpaRepository<Repartidor, Long> {
    List<Repartidor> findByActivoTrueAndDisponibleTrue();
    long countByActivoTrueAndDisponibleTrue();
    long countByActivoTrueAndDisponibleTrueAndZonaId(Long zonaId);
}
