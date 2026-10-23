package com.smartdelivery.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Límite de peticiones por IP (ventana fija de 1 minuto) solo para /api/v1/public/**.
 * Hay un tope general y otro, más estricto, para el seguimiento de pedidos (frena la adivinanza de códigos).
 * Detrás de un proxy/balanceador configura server.forward-headers-strategy=native para que la IP sea la real.
 */
public class RateLimitFilter extends OncePerRequestFilter {
    private static final String PREFIJO = "/api/v1/public/";
    private static final long VENTANA_MS = 60_000L;
    private static final int MAX_CLAVES = 50_000;

    private static final class Ventana {
        final long inicio;
        final AtomicInteger usos = new AtomicInteger();
        Ventana(long inicio) { this.inicio = inicio; }
    }

    private final int limiteGeneral;
    private final int limiteSeguimiento;
    private final ConcurrentHashMap<String, Ventana> ventanas = new ConcurrentHashMap<>();

    public RateLimitFilter(int limiteGeneral, int limiteSeguimiento) {
        this.limiteGeneral = limiteGeneral;
        this.limiteSeguimiento = limiteSeguimiento;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(PREFIJO) || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String ip = request.getRemoteAddr();
        long espera = consumir("g:" + ip, limiteGeneral);
        if (espera == 0 && request.getRequestURI().endsWith("/seguimiento")) {
            espera = consumir("s:" + ip, limiteSeguimiento);
        }
        if (espera > 0) {
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(espera));
            response.setContentType("application/json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"mensaje\":"
                    + "\"Demasiadas solicitudes. Intenta de nuevo en " + espera + " segundos.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    /** Devuelve 0 si la petición se permite, o los segundos que faltan para que se libere la ventana. */
    private long consumir(String clave, int limite) {
        long ahora = System.currentTimeMillis();
        if (ventanas.size() > MAX_CLAVES) {
            ventanas.entrySet().removeIf(e -> ahora - e.getValue().inicio >= VENTANA_MS);
        }
        Ventana v = ventanas.compute(clave,
                (k, actual) -> (actual == null || ahora - actual.inicio >= VENTANA_MS) ? new Ventana(ahora) : actual);
        if (v.usos.incrementAndGet() <= limite) return 0;
        return Math.max(1, (VENTANA_MS - (ahora - v.inicio)) / 1000 + 1);
    }
}
