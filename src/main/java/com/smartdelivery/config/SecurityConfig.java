package com.smartdelivery.config;

import com.smartdelivery.repository.UsuarioRepository;
import com.smartdelivery.service.TokenStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, TokenStore tokenStore, UsuarioRepository usuarioRepository,
            @Value("${api.publica.limite-por-minuto:120}") int limitePublico,
            @Value("${api.publica.limite-seguimiento-por-minuto:15}") int limiteSeguimiento)
            throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(h -> h.frameOptions(f -> f.sameOrigin()))   // consola H2
            .authorizeHttpRequests(a -> a
                // API pública única (solo lectura): únicamente GET. Cualquier otro método cae en /api/** -> autenticado.
                .requestMatchers(HttpMethod.GET, "/api/v1/public/**").permitAll()
                .requestMatchers("/api/auth/login", "/api/auth/registro", "/api/config/**", "/api/publico/**").permitAll()
                // Visitantes sin cuenta: ver comercios, catálogo y promociones, y hacer pedidos
                .requestMatchers(HttpMethod.GET, "/api/comercios", "/api/comercios/*/productos", "/api/promociones").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/pedidos").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll())                       // HTML/JS/CSS estáticos y consola H2
            .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .addFilterBefore(new RateLimitFilter(limitePublico, limiteSeguimiento), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(new TokenAuthFilter(tokenStore, usuarioRepository), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${api.publica.origenes-permitidos:*}") String origenesPublicos) {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOriginPatterns(List.of("*"));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cfg);

        // API pública: solo GET/OPTIONS, sin credenciales; los orígenes se limitan con api.publica.origenes-permitidos
        CorsConfiguration pub = new CorsConfiguration();
        pub.setAllowedOriginPatterns(List.of(origenesPublicos.split("\\s*,\\s*")));
        pub.setAllowedMethods(List.of("GET", "OPTIONS"));
        pub.setAllowedHeaders(List.of("Content-Type", "Accept"));
        pub.setAllowCredentials(false);
        pub.setMaxAge(3600L);
        source.registerCorsConfiguration("/api/v1/public/**", pub);
        return source;
    }
}
