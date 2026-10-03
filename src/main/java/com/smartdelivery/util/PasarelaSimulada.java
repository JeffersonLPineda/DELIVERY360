package com.smartdelivery.util;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.Map;

/**
 * Pasarela de pagos SIMULADA: imita el comportamiento de una real (detección de marca, autorización del banco,
 * rechazos con motivo, código de autorización y verificación 3-D Secure) sin mover dinero ni contactar a nadie.
 * Para integrar una pasarela real (Stripe, Recurrente, etc.) solo habría que reemplazar esta clase.
 *
 * Tarjetas de prueba (todas pasan el algoritmo de Luhn):
 *   4242424242424242  Visa aprobada          5555555555554444  Mastercard aprobada
 *   378282246310005   Amex aprobada (CVV 4)  6011111111111117  Discover aprobada
 *   4000002500003155  Visa que exige 3-D Secure (código SMS: 123456)
 *   4000000000000002  Rechazada por el banco     4000000000009995  Fondos insuficientes
 *   4000000000000127  CVV incorrecto             4100000000000019  Tarjeta bloqueada por robo/extravío
 */
public final class PasarelaSimulada {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final BigDecimal LIMITE = new BigDecimal("50000");
    private static final String TARJETA_3DS = "4000002500003155";

    public enum Marca {
        VISA("Visa", 3), MASTERCARD("Mastercard", 3), AMEX("American Express", 4), DISCOVER("Discover", 3), DESCONOCIDA("Tarjeta", 3);

        private final String nombre;
        private final int largoCvv;

        Marca(String nombre, int largoCvv) { this.nombre = nombre; this.largoCvv = largoCvv; }
        public String nombre() { return nombre; }
        public int largoCvv() { return largoCvv; }
    }

    public record Resultado(boolean aprobado, String codigo, String mensaje, String autorizacion) {
        static Resultado ok(String autorizacion) { return new Resultado(true, "00", "Aprobada", autorizacion); }
        static Resultado rechazo(String codigo, String mensaje) { return new Resultado(false, codigo, mensaje, null); }
    }

    private static final Map<String, Resultado> RECHAZOS = Map.of(
            "4000000000000002", Resultado.rechazo("05", "Tu banco rechazó el pago. Comunícate con él o prueba con otra tarjeta."),
            "4000000000009995", Resultado.rechazo("51", "Fondos insuficientes en la tarjeta."),
            "4000000000000127", Resultado.rechazo("82", "El código de seguridad (CVV) es incorrecto."),
            "4100000000000019", Resultado.rechazo("43", "La tarjeta está bloqueada por el banco. Usa otra tarjeta."));

    private PasarelaSimulada() { }

    public static Marca detectar(String numero) {
        if (numero == null || numero.length() < 4 || !numero.matches("\\d+")) return Marca.DESCONOCIDA;
        int p2 = Integer.parseInt(numero.substring(0, 2));
        int p4 = Integer.parseInt(numero.substring(0, 4));
        if (numero.startsWith("4")) return Marca.VISA;
        if ((p2 >= 51 && p2 <= 55) || (p4 >= 2221 && p4 <= 2720)) return Marca.MASTERCARD;
        if (p2 == 34 || p2 == 37) return Marca.AMEX;
        if (numero.startsWith("6011") || p2 == 65) return Marca.DISCOVER;
        return Marca.DESCONOCIDA;
    }

    /** Largo del número que acepta cada marca. */
    public static boolean largoValido(Marca marca, String numero) {
        int n = numero.length();
        return switch (marca) {
            case AMEX -> n == 15;
            case VISA -> n == 16 || n == 19;
            case MASTERCARD, DISCOVER -> n == 16;
            case DESCONOCIDA -> false;
        };
    }

    public static boolean requiere3DS(String numero) { return TARJETA_3DS.equals(numero); }

    /** Pide autorización al "banco emisor". */
    public static Resultado autorizar(String numero, BigDecimal monto) {
        if (monto.compareTo(LIMITE) > 0) {
            return Resultado.rechazo("61", "El monto excede el límite permitido para esta tarjeta.");
        }
        Resultado rechazo = RECHAZOS.get(numero);
        if (rechazo != null) return rechazo;
        return Resultado.ok(String.format("%06d", RANDOM.nextInt(1_000_000)));
    }
}
