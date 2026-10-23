package com.smartdelivery.controller;

import com.smartdelivery.dto.ApiPublicaDtos.*;
import com.smartdelivery.service.ApiPublicaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * API pública única (v1) para sistemas externos. Reglas de diseño:
 *  - SOLO lectura (GET). Nada de crear pedidos, pagos, cancelar, calificar, login, usuarios ni administración.
 *  - Sin autenticación, protegida por límite de peticiones por IP (RateLimitFilter) y CORS configurable.
 *  - DTOs propios y mínimos (ApiPublicaDtos): sin datos personales ni de pago.
 */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class ApiPublicaController {
    private static final CacheControl CACHE_CATALOGO = CacheControl.maxAge(30, TimeUnit.SECONDS).cachePublic();

    private final ApiPublicaService servicio;

    @GetMapping("/salud")
    public Map<String, String> salud() {
        return Map.of("estado", "UP", "servicio", "smartdelivery360", "version", "v1",
                "hora", LocalDateTime.now().withNano(0).toString());
    }

    @GetMapping("/comercios")
    public ResponseEntity<Pagina<ComercioPublico>> comercios(@RequestParam(required = false) String zona,
                                                             @RequestParam(defaultValue = "0") int pagina,
                                                             @RequestParam(defaultValue = "50") int tamano) {
        return ResponseEntity.ok().cacheControl(CACHE_CATALOGO).body(servicio.comercios(zona, pagina, tamano));
    }

    @GetMapping("/comercios/{id}")
    public ResponseEntity<ComercioPublico> comercio(@PathVariable Long id) {
        return ResponseEntity.ok().cacheControl(CACHE_CATALOGO).body(servicio.comercio(id));
    }

    @GetMapping("/comercios/{id}/productos")
    public ResponseEntity<List<ProductoPublico>> productos(@PathVariable Long id) {
        return ResponseEntity.ok().cacheControl(CACHE_CATALOGO).body(servicio.productos(id));
    }

    @GetMapping("/promociones")
    public ResponseEntity<List<PromocionPublica>> promociones() {
        return ResponseEntity.ok().cacheControl(CACHE_CATALOGO).body(servicio.promociones());
    }

    /** El código va como parámetro opcional: si falta responde 404 igual que un código incorrecto. */
    @GetMapping("/pedidos/{id}/seguimiento")
    public ResponseEntity<SeguimientoPublico> seguimiento(@PathVariable Long id,
                                                          @RequestParam(required = false) String codigo) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(servicio.seguimiento(id, codigo));
    }
}
