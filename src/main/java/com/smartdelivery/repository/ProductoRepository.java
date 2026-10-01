package com.smartdelivery.repository;

import com.smartdelivery.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByComercioId(Long comercioId);
    List<Producto> findByComercioIdAndDisponibleTrue(Long comercioId);
}
