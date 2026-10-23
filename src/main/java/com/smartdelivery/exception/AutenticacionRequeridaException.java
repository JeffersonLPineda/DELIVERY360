package com.smartdelivery.exception;

/** El banco pide verificar la compra (3-D Secure): el cliente debe enviar el código y repetir la petición. */
public class AutenticacionRequeridaException extends NegocioException {
    private final String desafioId;

    public AutenticacionRequeridaException(String desafioId, String mensaje) {
        super(mensaje);
        this.desafioId = desafioId;
    }

    public String getDesafioId() { return desafioId; }
}
