package com.smartdelivery.service;

import com.smartdelivery.dto.ZonaRequest;
import com.smartdelivery.dto.ZonaResponse;
import com.smartdelivery.model.Zona;
import com.smartdelivery.repository.ZonaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ZonaService {
    private final ZonaRepository zonaRepository;

    public List<ZonaResponse> listar() { return zonaRepository.findAll().stream().map(ZonaResponse::de).toList(); }

    public ZonaResponse crear(ZonaRequest r) {
        return ZonaResponse.de(zonaRepository.save(new Zona(r.nombre(), r.latitud(), r.longitud())));
    }
}
