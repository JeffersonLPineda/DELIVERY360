package com.smartdelivery.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "repartidores_bicicleta")
public class RepartidorBicicleta extends Repartidor {

    protected RepartidorBicicleta() { }

    public RepartidorBicicleta(String nombre, String email, String passwordHash, String telefono) {
        super(nombre, email, passwordHash, telefono);
    }

    @Override public String getTipoVehiculo() { return "BICICLETA"; }
    @Override public double getVelocidadPromedioKmH() { return 15; }
    @Override public int getCapacidadMaxima() { return 2; }
}
