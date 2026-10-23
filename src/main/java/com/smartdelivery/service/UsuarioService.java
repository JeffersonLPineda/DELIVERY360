package com.smartdelivery.service;

import com.smartdelivery.dto.UsuarioAdminRequest;
import com.smartdelivery.dto.UsuarioResponse;
import com.smartdelivery.exception.RecursoNoEncontradoException;
import com.smartdelivery.exception.ReglaNegocioException;
import com.smartdelivery.model.Repartidor;
import com.smartdelivery.model.Usuario;
import com.smartdelivery.model.Zona;
import com.smartdelivery.repository.UsuarioRepository;
import com.smartdelivery.repository.ZonaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final ZonaRepository zonaRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream().map(UsuarioResponse::de).toList();
    }

    @Transactional
    public UsuarioResponse crear(UsuarioAdminRequest req) {
        String email = req.email().trim().toLowerCase();
        if (usuarioRepository.existsByEmail(email)) throw new ReglaNegocioException("Ese correo ya está registrado");
        String hash = passwordEncoder.encode(req.password());

        Usuario nuevo;
        if (req.rol() == com.smartdelivery.model.Rol.REPARTIDOR) {
            if (req.tipoVehiculo() == null) throw new ReglaNegocioException("Un repartidor requiere tipoVehiculo");
            Repartidor rep = req.tipoVehiculo().crear(req.nombre(), email, hash, req.telefono());
            if (req.zonaId() != null) {
                Zona zona = zonaRepository.findById(req.zonaId())
                        .orElseThrow(() -> new RecursoNoEncontradoException("Zona", req.zonaId()));
                rep.setZona(zona);
                rep.actualizarUbicacion(zona.getLatitud(), zona.getLongitud());
            }
            nuevo = rep;
        } else {
            nuevo = new Usuario(req.nombre(), email, hash, req.telefono(), req.rol());
        }
        return UsuarioResponse.de(usuarioRepository.save(nuevo));
    }

    @Transactional
    public UsuarioResponse cambiarActivo(Long id, boolean activo) {
        Usuario u = usuarioRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Usuario", id));
        u.setActivo(activo);
        return UsuarioResponse.de(u);
    }
}
