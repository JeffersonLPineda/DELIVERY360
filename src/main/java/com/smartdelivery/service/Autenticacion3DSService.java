package com.smartdelivery.service;

import com.smartdelivery.dto.DatosPagoDTO;
import com.smartdelivery.exception.AutenticacionRequeridaException;
import com.smartdelivery.exception.PagoInvalidoException;
import com.smartdelivery.model.Pago;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simula el reto 3-D Secure del banco: la primera petición recibe un desafío y la segunda debe traer el código
 * (en la simulación siempre es 123456, como si llegara por SMS). Los desafíos viven 5 minutos y admiten 3 intentos.
 */
@Service
public class Autenticacion3DSService {
    static final String CODIGO_SIMULADO = "123456";
    private static final long VIGENCIA_SEG = 300;

    private record Desafio(String clave, Instant expira, AtomicInteger intentos) { }

    private final Map<String, Desafio> desafios = new ConcurrentHashMap<>();

    public void exigir(Pago pago, DatosPagoDTO datos) {
        if (!pago.requiereAutenticacion()) return;
        limpiarVencidos();
        String clave = pago.claveDesafio() + "|" + pago.getMonto().toPlainString();

        if (datos.desafioId() == null || datos.desafioId().isBlank()) {
            String id = "3ds_" + UUID.randomUUID().toString().replace("-", "");
            desafios.put(id, new Desafio(clave, Instant.now().plusSeconds(VIGENCIA_SEG), new AtomicInteger()));
            throw new AutenticacionRequeridaException(id,
                    "Tu banco necesita verificar esta compra. Ingresa el código de 6 dígitos que te enviaron por SMS.");
        }

        Desafio d = desafios.get(datos.desafioId());
        if (d == null || d.expira().isBefore(Instant.now()) || !d.clave().equals(clave)) {
            desafios.remove(datos.desafioId());
            throw new PagoInvalidoException("La verificación expiró o no corresponde a este pago. Vuelve a intentarlo.");
        }
        if (!CODIGO_SIMULADO.equals(datos.codigo3ds() == null ? null : datos.codigo3ds().trim())) {
            if (d.intentos().incrementAndGet() >= 3) {
                desafios.remove(datos.desafioId());
                throw new PagoInvalidoException("Demasiados intentos fallidos. El pago fue cancelado por seguridad.");
            }
            throw new PagoInvalidoException("El código de verificación es incorrecto.");
        }
        desafios.remove(datos.desafioId());   // un desafío solo sirve una vez
    }

    private void limpiarVencidos() {
        Instant ahora = Instant.now();
        desafios.values().removeIf(d -> d.expira().isBefore(ahora));
    }
}
