package com.smartdelivery.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Contratos de la API pública (/api/v1/public). Son DTOs propios y mínimos, distintos de los internos:
 * así un campo nuevo en una entidad o en un DTO interno nunca se publica por accidente.
 * Jamás incluyen datos personales (teléfono, correo, dirección o coordenadas de entrega), datos de pago,
 * IDs de usuarios ni propietarios de comercios.
 */
public final class ApiPublicaDtos {
    private ApiPublicaDtos() { }

    public record Pagina<T>(List<T> contenido, int pagina, int tamano, long total) { }

    public record ComercioPublico(Long id, String nombre, String direccion, double latitud, double longitud,
                                  String zona, boolean abierto, int tiempoPreparacionMin,
                                  double calificacion, int totalCalificaciones) { }

    public record ProductoPublico(Long id, String nombre, String descripcion, BigDecimal precio) { }

    public record PromocionPublica(String codigo, String descripcion, String tipo, LocalDate vigenteHasta,
                                   BigDecimal montoMinimo) { }

    /** Una etapa del pedido: solo el estado y su momento (sin notas internas ni nombres de personas). */
    public record Etapa(String estado, String fecha) { }

    /** Seguimiento de un pedido de invitado. Sin contacto, sin dirección de entrega, sin repartidor identificable. */
    public record SeguimientoPublico(Long pedidoId, String estado, boolean finalizado, String comercio,
                                     boolean repartidorAsignado, String tipoVehiculo, BigDecimal total,
                                     String metodoPago, String estadoPago, String fechaCreacion,
                                     List<Etapa> etapas) { }
}
