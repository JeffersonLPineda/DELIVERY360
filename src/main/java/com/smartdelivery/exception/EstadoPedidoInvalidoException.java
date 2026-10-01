package com.smartdelivery.exception;

import com.smartdelivery.model.EstadoPedido;

public class EstadoPedidoInvalidoException extends NegocioException {
    public EstadoPedidoInvalidoException(EstadoPedido actual, EstadoPedido destino) {
        super("Transición inválida: un pedido en estado " + actual + " no puede pasar a " + destino);
    }
}
