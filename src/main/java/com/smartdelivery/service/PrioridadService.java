package com.smartdelivery.service;

import com.smartdelivery.dto.PrioridadResponse;
import com.smartdelivery.model.EstadoPedido;
import com.smartdelivery.model.Pedido;
import com.smartdelivery.model.Rol;
import com.smartdelivery.model.Usuario;
import com.smartdelivery.repository.PedidoRepository;
import com.smartdelivery.repository.RepartidorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;

/**
 * RETO ADICIONAL: prioridad de pedidos = 0.35 hora + 0.20 distancia + 0.20 tiempo de preparación
 * + 0.25 disponibilidad de repartidores. Cada factor está normalizado entre 0 y 1.
 */
@Service
@RequiredArgsConstructor
public class PrioridadService {
    private static final double W_HORA = 0.35, W_DISTANCIA = 0.20, W_PREPARACION = 0.20, W_DISPONIBILIDAD = 0.25;

    private final PedidoRepository pedidoRepository;
    private final RepartidorRepository repartidorRepository;

    @Transactional(readOnly = true)
    public List<PrioridadResponse> ordenar(Usuario actor) {
        return pedidoRepository.findByEstadoIn(EnumSet.of(EstadoPedido.CONFIRMADO, EstadoPedido.EN_PREPARACION, EstadoPedido.LISTO))
                .stream()
                .filter(p -> actor.getRol() == Rol.ADMIN || p.getComercio().getPropietario().getId().equals(actor.getId()))
                .map(this::calcular)
                .sorted(Comparator.comparingDouble(PrioridadResponse::puntuacion).reversed())
                .toList();
    }

    private PrioridadResponse calcular(Pedido p) {
        double minutosEspera = Duration.between(p.getFechaCreacion(), LocalDateTime.now()).toMinutes();
        double hora = Math.min(1.0, minutosEspera / 60.0);                              // más antiguo = más urgente
        double distancia = Math.max(0, 1 - p.getDistanciaKm() / 20.0);                  // más cerca = mejor
        double preparacion = Math.max(0, 1 - p.getComercio().getTiempoPreparacionMin() / 60.0); // más rápido = mejor
        long libres = (p.getComercio().getZona() == null)
                ? repartidorRepository.countByActivoTrueAndDisponibleTrue()
                : repartidorRepository.countByActivoTrueAndDisponibleTrueAndZonaId(p.getComercio().getZona().getId());
        double disponibilidad = Math.min(1.0, libres / 3.0);

        double puntuacion = W_HORA * hora + W_DISTANCIA * distancia + W_PREPARACION * preparacion + W_DISPONIBILIDAD * disponibilidad;
        return new PrioridadResponse(p.getId(), p.getComercio().getNombre(), p.getEstado().name(),
                redondear(puntuacion), redondear(hora), redondear(distancia), redondear(preparacion), redondear(disponibilidad));
    }

    private double redondear(double v) { return Math.round(v * 1000.0) / 1000.0; }
}
