package com.smartdelivery.controller;

import com.smartdelivery.dto.*;
import com.smartdelivery.exception.PermisoDenegadoException;
import com.smartdelivery.model.Rol;
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

    /** Público: puede crearlo un invitado (sin sesión) o un cliente con cuenta. Los demás roles no hacen pedidos. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PedidoResponse crear(@Valid @RequestBody PedidoRequest req, @AuthenticationPrincipal Usuario u) {
        if (u != null && u.getRol() != Rol.CLIENTE) {
            throw new PermisoDenegadoException("Solo los clientes o invitados pueden hacer pedidos");
        }
        return pedidoService.crear(u == null ? null : u.getId(), req);
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
        return pedidoService.cambiarEstado(id, req.estado(), u.getId(), req.efectivoRecibido());
    }

    @PostMapping("/{id}/asignar-repartidor")
    @PreAuthorize("hasAnyRole('ADMIN','COMERCIO')")
    public AsignacionResponse asignar(@PathVariable Long id, @AuthenticationPrincipal Usuario u) {
        return pedidoService.asignarRepartidor(id, u.getId());
    }
}
