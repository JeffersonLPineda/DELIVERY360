package com.smartdelivery.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "productos")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Producto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String nombre;
    private String descripcion;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;
    private boolean disponible = true;
    @ManyToOne(optional = false)
    private Comercio comercio;

    public Producto(String nombre, String descripcion, BigDecimal precio, Comercio comercio) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.comercio = comercio;
    }
}
