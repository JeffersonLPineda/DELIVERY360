package com.smartdelivery.controller;

import com.smartdelivery.dto.CalificacionRequest;
import com.smartdelivery.dto.PedidoResponse;
import com.smartdelivery.service.CalificacionService;
import com.smartdelivery.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Pedidos de invitados (sin cuenta). Se identifican con el número de pedido + el código de seguimiento
 * que recibieron al pedir. Un código incorrecto responde 404, igual que un pedido inexistente.
 */
@RestController
@RequestMapping("/api/publico/pedidos")
@RequiredArgsConstructor
public class PublicoController {
    private final PedidoService pedidoService;
    private final CalificacionService calificacionService;

    @GetMapping("/{id}")
    public PedidoResponse seguimiento(@PathVariable Long id, @RequestParam String codigo) {
        return pedidoService.seguimiento(id, codigo);
    }

    @PostMapping("/{id}/cancelar")
    public PedidoResponse cancelar(@PathVariable Long id, @RequestParam String codigo) {
        return pedidoService.cancelarInvitado(id, codigo);
    }

    @PostMapping("/{id}/calificar")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> calificar(@PathVariable Long id, @RequestParam String codigo,
                                         @Valid @RequestBody CalificacionRequest req) {
        calificacionService.registrarInvitado(id, codigo, req);
        return Map.of("mensaje", "Calificación registrada. ¡Gracias!");
    }
}
