package com.smartdelivery.util;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public final class ValidadorTarjeta {
    private static final DateTimeFormatter FORMATO = DateTimeFormatter.ofPattern("MM/yy");

    private ValidadorTarjeta() { }

    /** Algoritmo de Luhn. */
    public static boolean numeroValido(String numero) {
        if (numero == null || !numero.matches("\\d{13,19}")) return false;
        int suma = 0;
        boolean duplicar = false;
        for (int i = numero.length() - 1; i >= 0; i--) {
            int d = numero.charAt(i) - '0';
            if (duplicar) {
                d *= 2;
                if (d > 9) d -= 9;
            }
            suma += d;
            duplicar = !duplicar;
        }
        return suma % 10 == 0;
    }

    public static boolean vigente(String vencimiento) {
        try {
            return !YearMonth.parse(vencimiento, FORMATO).isBefore(YearMonth.now());
        } catch (DateTimeParseException | NullPointerException e) {
            return false;
        }
    }

    public static boolean cvvValido(String cvv) {
        return cvv != null && cvv.matches("\\d{3,4}");
    }
}
