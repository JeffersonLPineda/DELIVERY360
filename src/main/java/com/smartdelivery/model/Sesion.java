package com.smartdelivery.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Sesión de login guardada en la base de datos: sobrevive a los reinicios del servidor. */
@Entity
@Table(name = "sesiones")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Sesion {
    @Id
    @Column(length = 64)
    private String token;
    @Column(nullable = false)
    private Long usuarioId;
    private LocalDateTime creada;
    private LocalDateTime expira;

    public Sesion(String token, Long usuarioId, LocalDateTime expira) {
        this.token = token;
        this.usuarioId = usuarioId;
        this.creada = LocalDateTime.now();
        this.expira = expira;
    }

    public boolean vigente() { return expira.isAfter(LocalDateTime.now()); }
}
