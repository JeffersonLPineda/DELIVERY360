package com.smartdelivery.interfaces;

/** Entidades que reciben calificaciones (comercios y repartidores). */
public interface Calificable {
    void registrarCalificacion(int puntaje);
    double getCalificacionPromedio();
    int getTotalCalificaciones();
}
