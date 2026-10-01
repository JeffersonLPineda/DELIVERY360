package com.smartdelivery.dto;

import java.math.BigDecimal;
import java.util.Map;

public record ReporteResponse(long totalPedidos, Map<String, Long> pedidosPorEstado, BigDecimal ingresosEntregados,
                              long clientes, long comercios, long repartidoresDisponibles) { }
