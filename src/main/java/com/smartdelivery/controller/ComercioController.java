package com.smartdelivery.controller;

import com.smartdelivery.dto.*;
import com.smartdelivery.model.Usuario;
import com.smartdelivery.service.ComercioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comercios")
@RequiredArgsConstructor
public class ComercioController {
    private final ComercioService comercioService;

    /** Comercios disponibles (abiertos). Cualquier usuario autenticado. */
    @GetMapping
    public List<ComercioResponse> listar() { return comercioService.listarAbiertos(); }

    @GetMapping("/todos")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ComercioResponse> todos() { return comercioService.listarTodos(); }

    @GetMapping("/mis")
    @PreAuthorize("hasRole('COMERCIO')")
    public List<ComercioResponse> propios(@AuthenticationPrincipal Usuario u) { return comercioService.listarPropios(u.getId()); }

    @GetMapping("/{id}")
    public ComercioResponse obtener(@PathVariable Long id) { return comercioService.obtener(id); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ComercioResponse crear(@Valid @RequestBody ComercioRequest req) { return comercioService.crear(req); }

    @PutMapping("/{id}/abierto")
    @PreAuthorize("hasAnyRole('ADMIN','COMERCIO')")
    public ComercioResponse abierto(@PathVariable Long id, @RequestBody AbiertoRequest req, @AuthenticationPrincipal Usuario u) {
        return comercioService.cambiarAbierto(id, req.abierto(), u);
    }

    /** Catálogo. Clientes ven solo disponibles; comercio/admin ven todo. */
    @GetMapping("/{id}/productos")
    public List<ProductoResponse> productos(@PathVariable Long id, @AuthenticationPrincipal Usuario u) {
        boolean soloDisponibles = u.getRol() == com.smartdelivery.model.Rol.CLIENTE
                || u.getRol() == com.smartdelivery.model.Rol.REPARTIDOR;
        return comercioService.productos(id, soloDisponibles);
    }

    @PostMapping("/{id}/productos")
    @PreAuthorize("hasAnyRole('ADMIN','COMERCIO')")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoResponse crearProducto(@PathVariable Long id, @Valid @RequestBody ProductoRequest req,
                                          @AuthenticationPrincipal Usuario u) {
        return comercioService.crearProducto(id, req, u);
    }

    @PutMapping("/{id}/productos/{productoId}")
    @PreAuthorize("hasAnyRole('ADMIN','COMERCIO')")
    public ProductoResponse actualizarProducto(@PathVariable Long id, @PathVariable Long productoId,
                                               @Valid @RequestBody ProductoRequest req, @AuthenticationPrincipal Usuario u) {
        return comercioService.actualizarProducto(id, productoId, req, u);
    }
}
