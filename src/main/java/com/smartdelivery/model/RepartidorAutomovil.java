package com.smartdelivery.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "repartidores_automovil")
public class RepartidorAutomovil extends Repartidor {

    protected RepartidorAutomovil() { }

    public RepartidorAutomovil(String nombre, String email, String passwordHash, String telefono) {
        super(nombre, email, passwordHash, telefono);
    }

    @Override public String getTipoVehiculo() { return "AUTOMOVIL"; }
    @Override public double getVelocidadPromedioKmH() { return 30; }
    @Override public int getCapacidadMaxima() { return 4; }
}
