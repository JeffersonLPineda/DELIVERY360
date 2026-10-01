package com.smartdelivery.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "promociones")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "tipo")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public abstract class Promocion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String codigo;
    private String descripcion;
    private boolean activa = true;
    private LocalDate vigenteHasta;
    @Column(precision = 12, scale = 2)
    private BigDecimal montoMinimo = BigDecimal.ZERO;

    protected Promocion(String codigo, String descripcion) {
        this.codigo = codigo.toUpperCase();
        this.descripcion = descripcion;
    }

    public boolean esAplicable(BigDecimal subtotal, LocalDate hoy) {
        boolean vigente = vigenteHasta == null || !hoy.isAfter(vigenteHasta);
        return activa && vigente && subtotal.compareTo(montoMinimo) >= 0;
    }

    public abstract BigDecimal calcularDescuento(BigDecimal subtotal, BigDecimal costoEnvio);
    public abstract TipoPromocion getTipo();
}
