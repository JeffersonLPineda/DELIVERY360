package com.smartdelivery.model;

public enum TipoVehiculo {
    MOTO {
        @Override public Repartidor crear(String n, String e, String h, String t) { return new RepartidorMoto(n, e, h, t); }
    },
    BICICLETA {
        @Override public Repartidor crear(String n, String e, String h, String t) { return new RepartidorBicicleta(n, e, h, t); }
    },
    AUTOMOVIL {
        @Override public Repartidor crear(String n, String e, String h, String t) { return new RepartidorAutomovil(n, e, h, t); }
    };

    public abstract Repartidor crear(String nombre, String email, String passwordHash, String telefono);
}
