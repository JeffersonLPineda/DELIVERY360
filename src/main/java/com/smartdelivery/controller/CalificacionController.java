package com.smartdelivery.controller;

import com.smartdelivery.dto.CalificacionRequest;
import com.smartdelivery.model.Usuario;
import com.smartdelivery.service.CalificacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/calificaciones")
@RequiredArgsConstructor
public class CalificacionController {
    private final CalificacionService calificacionService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENTE')")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> calificar(@Valid @RequestBody CalificacionRequest req, @AuthenticationPrincipal Usuario u) {
        calificacionService.registrar(u.getId(), req);
        return Map.of("mensaje", "Calificación registrada. ¡Gracias!");
    }
}
