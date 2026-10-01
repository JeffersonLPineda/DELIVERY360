package com.smartdelivery.service.asignacion;

import com.smartdelivery.model.Pedido;
import com.smartdelivery.model.Repartidor;

/**
 * Un criterio del motor de asignación. Cada implementación es un bean independiente:
 * agregar un criterio nuevo no requiere tocar el motor (abierto/cerrado + polimorfismo).
 */
public interface CriterioAsignacion {
    String nombre();

    /** Peso relativo en la puntuación final. */
    double peso();

    /** Filtro duro: si devuelve false, el repartidor queda descartado. */
    default boolean esElegible(Repartidor repartidor, Pedido pedido) { return true; }

    /** Puntaje normalizado entre 0 y 1 (mayor es mejor). */
    double puntuar(Repartidor repartidor, Pedido pedido);
}
