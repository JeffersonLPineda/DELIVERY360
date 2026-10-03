package com.smartdelivery.service;

import com.smartdelivery.model.Sesion;
import com.smartdelivery.repository.SesionRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

/** Almacén de tokens de sesión en la base de datos (persisten al reiniciar el servidor; duran 7 días). */
@Component
public class TokenStore {
    private static final long DIAS_VIGENCIA = 7;
    private final SesionRepository sesiones;

    public TokenStore(SesionRepository sesiones) { this.sesiones = sesiones; }

    public String emitir(Long usuarioId) {
        String token = UUID.randomUUID().toString();
        sesiones.save(new Sesion(token, usuarioId, LocalDateTime.now().plusDays(DIAS_VIGENCIA)));
        return token;
    }

    public Long resolver(String token) {
        if (token == null || token.isBlank() || token.length() > 64) return null;
        return sesiones.findById(token).map(s -> {
            if (s.vigente()) return s.getUsuarioId();
            sesiones.delete(s);          // sesión vencida: se elimina
            return null;
        }).orElse(null);
    }

    public void revocar(String token) {
        if (token != null) sesiones.findById(token).ifPresent(sesiones::delete);
    }
}
