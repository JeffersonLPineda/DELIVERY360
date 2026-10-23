package com.smartdelivery.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Configuración pública para el frontend. La API key de Google Maps JavaScript es pública por diseño
 * (viaja al navegador): protégela en Google Cloud restringiéndola por "HTTP referrers" y a las APIs necesarias.
 */
@RestController
@RequestMapping("/api/config")
public class ConfigController {
    @Value("${google.maps.api-key:}")
    private String mapsApiKey;
    @Value("${google.maps.region-code:}")
    private String regionCode;

    @GetMapping("/publica")
    public Map<String, String> publica() {
        return Map.of("googleMapsApiKey", mapsApiKey == null ? "" : mapsApiKey.trim(),
                      "regionCode", regionCode == null ? "" : regionCode.trim());
    }
}
