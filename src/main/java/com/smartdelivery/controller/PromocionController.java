package com.smartdelivery.controller;

import com.smartdelivery.dto.ActivoRequest;
import com.smartdelivery.dto.PromocionRequest;
import com.smartdelivery.dto.PromocionResponse;
import com.smartdelivery.service.PromocionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promociones")
@RequiredArgsConstructor
public class PromocionController {
    private final PromocionService promocionService;

    @GetMapping
    public List<PromocionResponse> activas() { return promocionService.listarActivas(); }

    @GetMapping("/todas")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PromocionResponse> todas() { return promocionService.listarTodas(); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public PromocionResponse crear(@Valid @RequestBody PromocionRequest req) { return promocionService.crear(req); }

    @PutMapping("/{id}/activa")
    @PreAuthorize("hasRole('ADMIN')")
    public PromocionResponse activa(@PathVariable Long id, @RequestBody ActivoRequest req) {
        return promocionService.cambiarActiva(id, req.activo());
    }
}
