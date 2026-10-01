package com.smartdelivery.controller;

import com.smartdelivery.dto.LoginRequest;
import com.smartdelivery.dto.LoginResponse;
import com.smartdelivery.dto.RegistroRequest;
import com.smartdelivery.dto.UsuarioResponse;
import com.smartdelivery.model.Usuario;
import com.smartdelivery.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) { return authService.login(req); }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse registro(@Valid @RequestBody RegistroRequest req) { return authService.registrarCliente(req); }

    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal Usuario usuario) { return UsuarioResponse.de(usuario); }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String header) {
        if (header != null && header.startsWith("Bearer ")) authService.logout(header.substring(7));
        return ResponseEntity.noContent().build();
    }
}
