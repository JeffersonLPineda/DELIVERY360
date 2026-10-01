package com.smartdelivery.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class TarifaEnvio {
    private static final double BASE = 10.0;
    private static final double POR_KM = 2.5;

    private TarifaEnvio() { }

    public static BigDecimal calcular(double km) {
        return BigDecimal.valueOf(BASE + POR_KM * km).setScale(2, RoundingMode.HALF_UP);
    }
}
