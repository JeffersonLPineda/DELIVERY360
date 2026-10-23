package com.smartdelivery.exception;

import java.time.LocalDateTime;

public record ApiError(LocalDateTime fecha, int status, String error, String mensaje) {
    public static ApiError de(int status, String error, String mensaje) {
        return new ApiError(LocalDateTime.now(), status, error, mensaje);
    }
}
