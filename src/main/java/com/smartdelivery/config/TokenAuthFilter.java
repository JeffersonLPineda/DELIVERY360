package com.smartdelivery.config;

import com.smartdelivery.model.Usuario;
import com.smartdelivery.repository.UsuarioRepository;
import com.smartdelivery.service.TokenStore;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/** Lee "Authorization: Bearer <token>" y autentica al usuario con su rol. */
public class TokenAuthFilter extends OncePerRequestFilter {
    private final TokenStore tokenStore;
    private final UsuarioRepository usuarioRepository;

    public TokenAuthFilter(TokenStore tokenStore, UsuarioRepository usuarioRepository) {
        this.tokenStore = tokenStore;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            Long usuarioId = tokenStore.resolver(header.substring(7));
            if (usuarioId != null) {
                usuarioRepository.findById(usuarioId).filter(Usuario::isActivo).ifPresent(u -> {
                    var auth = new UsernamePasswordAuthenticationToken(
                            u, null, List.of(new SimpleGrantedAuthority("ROLE_" + u.getRol().name())));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        }
        chain.doFilter(request, response);
    }
}
