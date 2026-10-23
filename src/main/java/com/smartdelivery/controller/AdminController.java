package com.smartdelivery.controller;

import com.smartdelivery.dto.*;
import com.smartdelivery.service.ReporteService;
import com.smartdelivery.service.UsuarioService;
import com.smartdelivery.service.ZonaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    private final UsuarioService usuarioService;
    private final ZonaService zonaService;
    private final ReporteService reporteService;

    @GetMapping("/usuarios")
    public List<UsuarioResponse> usuarios() { return usuarioService.listar(); }

    @PostMapping("/usuarios")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse crearUsuario(@Valid @RequestBody UsuarioAdminRequest req) { return usuarioService.crear(req); }

    @PutMapping("/usuarios/{id}/activo")
    public UsuarioResponse activo(@PathVariable Long id, @RequestBody ActivoRequest req) {
        return usuarioService.cambiarActivo(id, req.activo());
    }

    @GetMapping("/zonas")
    public List<ZonaResponse> zonas() { return zonaService.listar(); }

    @PostMapping("/zonas")
    @ResponseStatus(HttpStatus.CREATED)
    public ZonaResponse crearZona(@Valid @RequestBody ZonaRequest req) { return zonaService.crear(req); }

    @GetMapping("/reportes")
    public ReporteResponse reportes() { return reporteService.generar(); }
}
