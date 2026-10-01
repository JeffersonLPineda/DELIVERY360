package com.smartdelivery.controller;

import com.smartdelivery.dto.*;
import com.smartdelivery.model.Usuario;
import com.smartdelivery.service.PedidoService;
import com.smartdelivery.service.PrioridadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {
    private final PedidoService pedidoService;
    private final PrioridadService prioridadService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENTE')")
    @ResponseStatus(HttpStatus.CREATED)
    public PedidoResponse crear(@Valid @RequestBody PedidoRequest req, @AuthenticationPrincipal Usuario u) {
        return pedidoService.crear(u.getId(), req);
    }

    /** Lista según el rol: cliente (los suyos), comercio (los de su local), repartidor (los asignados), admin (todos). */
    @GetMapping
    public List<PedidoResponse> listar(@AuthenticationPrincipal Usuario u) { return pedidoService.listar(u.getId()); }

    /** Reto adicional: pedidos pendientes ordenados por puntuación de prioridad. */
    @GetMapping("/prioridad")
    @PreAuthorize("hasAnyRole('ADMIN','COMERCIO')")
    public List<PrioridadResponse> prioridad(@AuthenticationPrincipal Usuario u) { return prioridadService.ordenar(u); }

    @GetMapping("/{id}")
    public PedidoResponse obtener(@PathVariable Long id, @AuthenticationPrincipal Usuario u) {
        return pedidoService.obtener(id, u.getId());
    }

    @PutMapping("/{id}/estado")
    public PedidoResponse cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambioEstadoRequest req,
                                        @AuthenticationPrincipal Usuario u) {
        return pedidoService.cambiarEstado(id, req.estado(), u.getId());
    }

    @PostMapping("/{id}/asignar-repartidor")
    @PreAuthorize("hasAnyRole('ADMIN','COMERCIO')")
    public AsignacionResponse asignar(@PathVariable Long id, @AuthenticationPrincipal Usuario u) {
        return pedidoService.asignarRepartidor(id, u.getId());
    }
}
