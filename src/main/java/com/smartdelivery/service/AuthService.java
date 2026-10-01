package com.smartdelivery.service;

import com.smartdelivery.dto.LoginRequest;
import com.smartdelivery.dto.LoginResponse;
import com.smartdelivery.dto.RegistroRequest;
import com.smartdelivery.dto.UsuarioResponse;
import com.smartdelivery.exception.CredencialesInvalidasException;
import com.smartdelivery.exception.ReglaNegocioException;
import com.smartdelivery.model.Rol;
import com.smartdelivery.model.Usuario;
import com.smartdelivery.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenStore tokenStore;

    public LoginResponse login(LoginRequest req) {
        Usuario u = usuarioRepository.findByEmail(req.email().trim().toLowerCase())
                .orElseThrow(CredencialesInvalidasException::new);
        if (!u.isActivo() || !passwordEncoder.matches(req.password(), u.getPasswordHash())) {
            throw new CredencialesInvalidasException();
        }
        return new LoginResponse(tokenStore.emitir(u.getId()), u.getId(), u.getNombre(), u.getRol().name());
    }

    /** Autorregistro: solo crea clientes. Los demás roles los crea el administrador. */
    public UsuarioResponse registrarCliente(RegistroRequest req) {
        String email = req.email().trim().toLowerCase();
        if (usuarioRepository.existsByEmail(email)) throw new ReglaNegocioException("Ese correo ya está registrado");
        Usuario u = new Usuario(req.nombre(), email, passwordEncoder.encode(req.password()), req.telefono(), Rol.CLIENTE);
        return UsuarioResponse.de(usuarioRepository.save(u));
    }

    public void logout(String token) { tokenStore.revocar(token); }
}
