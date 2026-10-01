package com.smartdelivery.exception;

public class RecursoNoEncontradoException extends NegocioException {
    public RecursoNoEncontradoException(String recurso, Object id) {
        super(recurso + " no encontrado: " + id);
    }
}
