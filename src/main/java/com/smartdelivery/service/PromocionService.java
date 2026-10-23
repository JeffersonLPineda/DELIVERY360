package com.smartdelivery.service;

import com.smartdelivery.dto.PromocionRequest;
import com.smartdelivery.dto.PromocionResponse;
import com.smartdelivery.exception.RecursoNoEncontradoException;
import com.smartdelivery.exception.ReglaNegocioException;
import com.smartdelivery.model.Promocion;
import com.smartdelivery.model.TipoPromocion;
import com.smartdelivery.repository.PromocionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PromocionService {
    private final PromocionRepository promocionRepository;

    @Transactional(readOnly = true)
    public List<PromocionResponse> listarActivas() {
        return promocionRepository.findByActivaTrue().stream().map(PromocionResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<PromocionResponse> listarTodas() {
        return promocionRepository.findAll().stream().map(PromocionResponse::de).toList();
    }

    @Transactional
    public PromocionResponse crear(PromocionRequest r) {
        if (promocionRepository.existsByCodigoIgnoreCase(r.codigo())) throw new ReglaNegocioException("El código ya existe");
        if (r.tipo() != TipoPromocion.ENVIO_GRATIS && (r.valor() == null || r.valor().signum() <= 0)) {
            throw new ReglaNegocioException("Esta promoción requiere un valor mayor a cero");
        }
        if (r.tipo() == TipoPromocion.PORCENTAJE && r.valor().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new ReglaNegocioException("El porcentaje no puede superar 100");
        }
        Promocion p = r.tipo().crear(r);
        p.setVigenteHasta(r.vigenteHasta());
        if (r.montoMinimo() != null) p.setMontoMinimo(r.montoMinimo());
        return PromocionResponse.de(promocionRepository.save(p));
    }

    @Transactional
    public PromocionResponse cambiarActiva(Long id, boolean activa) {
        Promocion p = promocionRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Promoción", id));
        p.setActiva(activa);
        return PromocionResponse.de(p);
    }
}
