package com.smartdelivery.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<ApiError> respuesta(HttpStatus st, String mensaje) {
        return ResponseEntity.status(st).body(ApiError.de(st.value(), st.getReasonPhrase(), mensaje));
    }

    @ExceptionHandler(EstadoPedidoInvalidoException.class)
    public ResponseEntity<ApiError> estado(EstadoPedidoInvalidoException e) { return respuesta(HttpStatus.CONFLICT, e.getMessage()); }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ApiError> noEncontrado(RecursoNoEncontradoException e) { return respuesta(HttpStatus.NOT_FOUND, e.getMessage()); }

    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<ApiError> credenciales(CredencialesInvalidasException e) { return respuesta(HttpStatus.UNAUTHORIZED, e.getMessage()); }

    @ExceptionHandler({PermisoDenegadoException.class, AccessDeniedException.class})
    public ResponseEntity<ApiError> prohibido(RuntimeException e) { return respuesta(HttpStatus.FORBIDDEN, "No tienes permiso para esta acción"); }

    /** Pago rechazado por el banco o con datos inválidos: 402 Payment Required. */
    @ExceptionHandler(PagoInvalidoException.class)
    public ResponseEntity<ApiError> pagoInvalido(PagoInvalidoException e) { return respuesta(HttpStatus.PAYMENT_REQUIRED, e.getMessage()); }

    /** 3-D Secure: el cliente debe enviar el código del banco y repetir la petición con el desafioId. */
    @ExceptionHandler(AutenticacionRequeridaException.class)
    public ResponseEntity<Map<String, Object>> autenticacion(AutenticacionRequeridaException e) {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("fecha", LocalDateTime.now());
        cuerpo.put("status", HttpStatus.PAYMENT_REQUIRED.value());
        cuerpo.put("error", "Autenticación requerida");
        cuerpo.put("mensaje", e.getMessage());
        cuerpo.put("requiere3ds", true);
        cuerpo.put("desafioId", e.getDesafioId());
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(cuerpo);
    }

    @ExceptionHandler(NegocioException.class)
    public ResponseEntity<ApiError> negocio(NegocioException e) { return respuesta(HttpStatus.BAD_REQUEST, e.getMessage()); }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validacion(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return respuesta(HttpStatus.BAD_REQUEST, msg);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> jsonInvalido(HttpMessageNotReadableException e) {
        return respuesta(HttpStatus.BAD_REQUEST, "JSON mal formado o con valores no válidos");
    }
}
