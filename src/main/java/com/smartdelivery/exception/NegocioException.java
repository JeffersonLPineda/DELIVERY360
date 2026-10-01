package com.smartdelivery.exception;

/** Base de las excepciones de reglas de negocio. */
public class NegocioException extends RuntimeException {
    public NegocioException(String mensaje) { super(mensaje); }
}
