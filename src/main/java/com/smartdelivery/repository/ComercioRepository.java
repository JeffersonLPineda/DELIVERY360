package com.smartdelivery.repository;

import com.smartdelivery.model.Comercio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComercioRepository extends JpaRepository<Comercio, Long> {
    List<Comercio> findByAbiertoTrue();
}
