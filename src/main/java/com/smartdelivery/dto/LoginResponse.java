package com.smartdelivery.dto;

public record LoginResponse(String token, Long usuarioId, String nombre, String rol) { }
