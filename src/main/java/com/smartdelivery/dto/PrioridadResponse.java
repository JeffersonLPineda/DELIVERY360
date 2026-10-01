package com.smartdelivery.dto;

public record PrioridadResponse(Long pedidoId, String comercio, String estado, double puntuacion,
                                double factorHora, double factorDistancia,
                                double factorPreparacion, double factorDisponibilidad) { }
