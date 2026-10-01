package com.smartdelivery.service;

import com.smartdelivery.model.Pedido;
import com.smartdelivery.model.Repartidor;
import com.smartdelivery.repository.RepartidorRepository;
import com.smartdelivery.service.asignacion.CriterioAsignacion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/** Motor de asignación: filtra con los criterios elegibles y elige el de mayor puntaje ponderado. */
@Service
@RequiredArgsConstructor
public class AsignacionService {
    private final RepartidorRepository repartidorRepository;
    private final List<CriterioAsignacion> criterios;   // Spring inyecta todos los beans del criterio

    public Optional<Repartidor> seleccionarMejor(Pedido pedido) {
        return repartidorRepository.findByActivoTrueAndDisponibleTrue().stream()
                .filter(r -> criterios.stream().allMatch(c -> c.esElegible(r, pedido)))
                .max(Comparator.comparingDouble(r -> puntuar(r, pedido)));
    }

    public double puntuar(Repartidor repartidor, Pedido pedido) {
        double pesoTotal = criterios.stream().mapToDouble(CriterioAsignacion::peso).sum();
        double suma = criterios.stream().mapToDouble(c -> c.peso() * c.puntuar(repartidor, pedido)).sum();
        return pesoTotal == 0 ? 0 : suma / pesoTotal;
    }

    @Transactional
    public Optional<Repartidor> asignar(Pedido pedido) {
        Optional<Repartidor> elegido = seleccionarMejor(pedido);
        elegido.ifPresent(r -> {
            pedido.asignarRepartidor(r);
            r.notificar("Se te asignó el pedido #" + pedido.getId() + " en " + pedido.getComercio().getNombre());
        });
        return elegido;
    }
}
