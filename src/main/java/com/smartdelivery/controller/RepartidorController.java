package com.smartdelivery.controller;

import com.smartdelivery.dto.DisponibilidadRequest;
import com.smartdelivery.dto.UbicacionRequest;
import com.smartdelivery.dto.UsuarioResponse;
import com.smartdelivery.model.Usuario;
import com.smartdelivery.service.RepartidorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/repartidores/me")
@PreAuthorize("hasRole('REPARTIDOR')")
@RequiredArgsConstructor
public class RepartidorController {
    private final RepartidorService repartidorService;

    @PutMapping("/disponibilidad")
    public UsuarioResponse disponibilidad(@RequestBody DisponibilidadRequest req, @AuthenticationPrincipal Usuario u) {
        return repartidorService.cambiarDisponibilidad(u.getId(), req.disponible());
    }

    @PutMapping("/ubicacion")
    public UsuarioResponse ubicacion(@RequestBody UbicacionRequest req, @AuthenticationPrincipal Usuario u) {
        return repartidorService.actualizarUbicacion(u.getId(), req.latitud(), req.longitud());
    }
}
