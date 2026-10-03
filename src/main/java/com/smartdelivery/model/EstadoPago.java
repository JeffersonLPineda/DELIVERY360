package com.smartdelivery.model;

/** PENDIENTE: aún no se cobra (efectivo contra entrega) · COMPLETADO: cobrado · REEMBOLSADO: devuelto · ANULADO: nunca se cobró y el pedido se canceló. */
public enum EstadoPago { PENDIENTE, COMPLETADO, REEMBOLSADO, ANULADO }
