package com.smartdelivery.interfaces;

import org.slf4j.LoggerFactory;

/** Entidades que pueden recibir notificaciones (simuladas por log). */
public interface Notificable {
    String getDestinoNotificacion();

    default void notificar(String mensaje) {
        LoggerFactory.getLogger(getClass()).info("[NOTIFICACION -> {}] {}", getDestinoNotificacion(), mensaje);
    }
}
