package com.smartdelivery.service;

import com.smartdelivery.dto.UsuarioResponse;
import com.smartdelivery.exception.RecursoNoEncontradoException;
import com.smartdelivery.model.Repartidor;
import com.smartdelivery.repository.RepartidorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RepartidorService {
    private final RepartidorRepository repartidorRepository;

    @Transactional
    public UsuarioResponse cambiarDisponibilidad(Long id, boolean disponible) {
        Repartidor r = buscar(id);
        r.setDisponible(disponible);
        return UsuarioResponse.de(r);
    }

    @Transactional
    public UsuarioResponse actualizarUbicacion(Long id, double lat, double lon) {
        Repartidor r = buscar(id);
        r.actualizarUbicacion(lat, lon);
        return UsuarioResponse.de(r);
    }

    private Repartidor buscar(Long id) {
        return repartidorRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Repartidor", id));
    }
}
