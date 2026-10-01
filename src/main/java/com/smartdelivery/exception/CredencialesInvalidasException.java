package com.smartdelivery.exception;

public class CredencialesInvalidasException extends NegocioException {
    public CredencialesInvalidasException() { super("Correo o contraseña incorrectos"); }
}
