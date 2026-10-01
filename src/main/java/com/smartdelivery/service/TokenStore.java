package com.smartdelivery.service;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Almacén simple de tokens de sesión en memoria (se pierden al reiniciar el servidor). */
@Component
public class TokenStore {
    private final Map<String, Long> tokens = new ConcurrentHashMap<>();

    public String emitir(Long usuarioId) {
        String token = UUID.randomUUID().toString();
        tokens.put(token, usuarioId);
        return token;
    }

    public Long resolver(String token) { return token == null ? null : tokens.get(token); }

    public void revocar(String token) { if (token != null) tokens.remove(token); }
}
