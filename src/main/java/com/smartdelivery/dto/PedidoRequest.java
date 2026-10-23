package com.smartdelivery.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * nombreContacto/telefonoContacto/emailContacto: obligatorios para invitados; si el cliente tiene sesión se
 * completan con los datos de su cuenta cuando no se envían.
 */
public record PedidoRequest(
        @NotNull Long comercioId,
        @NotEmpty @Valid List<ItemPedidoRequest> items,
        @NotBlank @Size(max = 250) String direccionEntrega,
        double latEntrega, double lonEntrega,
        @Size(max = 250) String notasEntrega,
        @Size(max = 100) String nombreContacto,
        @Size(max = 30) String telefonoContacto,
        @Size(max = 120) String emailContacto,
        String codigoPromocion,
        @NotNull @Valid DatosPagoDTO pago) { }
