package com.smartdelivery.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "calificaciones")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Calificacion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(optional = false)
    private Pedido pedido;
    private int puntajeComercio;
    private int puntajeRepartidor;
    private String comentario;
    private LocalDateTime fecha = LocalDateTime.now();

    public Calificacion(Pedido pedido, int puntajeComercio, int puntajeRepartidor, String comentario) {
        this.pedido = pedido;
        this.puntajeComercio = puntajeComercio;
        this.puntajeRepartidor = puntajeRepartidor;
        this.comentario = comentario;
    }
}
