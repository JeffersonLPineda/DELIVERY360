package com.smartdelivery.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "repartidores_moto")
public class RepartidorMoto extends Repartidor {

    protected RepartidorMoto() { }

    public RepartidorMoto(String nombre, String email, String passwordHash, String telefono) {
        super(nombre, email, passwordHash, telefono);
    }

    @Override public String getTipoVehiculo() { return "MOTO"; }
    @Override public double getVelocidadPromedioKmH() { return 35; }
    @Override public int getCapacidadMaxima() { return 3; }
}
