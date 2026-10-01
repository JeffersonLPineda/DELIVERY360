package com.smartdelivery.util;

public final class PromedioUtil {
    private PromedioUtil() { }

    /** Promedio acumulado al agregar una nueva calificación. */
    public static double actualizar(double promedioActual, int total, int nuevoPuntaje) {
        double nuevo = ((promedioActual * total) + nuevoPuntaje) / (total + 1);
        return Math.round(nuevo * 100.0) / 100.0;
    }
}
