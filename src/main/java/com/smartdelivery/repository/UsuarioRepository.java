package com.smartdelivery.repository;

import com.smartdelivery.model.Rol;
import com.smartdelivery.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRol(Rol rol);
    List<Usuario> findByRol(Rol rol);
}
