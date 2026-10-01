package com.smartdelivery.model;

import com.smartdelivery.interfaces.Calificable;
import com.smartdelivery.interfaces.Rastreable;
import com.smartdelivery.util.PromedioUtil;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Clase abstracta: comportamiento común; cada vehículo especializa velocidad y capacidad. */
@Entity
@Table(name = "repartidores")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public abstract class Repartidor extends Usuario implements Rastreable, Calificable {
    private boolean disponible = false;
    private double latitud;
    private double longitud;
    @ManyToOne
    private Zona zona;
    private double calificacionPromedio = 0;
    private int totalCalificaciones = 0;

    protected Repartidor(String nombre, String email, String passwordHash, String telefono) {
        super(nombre, email, passwordHash, telefono, Rol.REPARTIDOR);
    }

    public abstract String getTipoVehiculo();
    public abstract double getVelocidadPromedioKmH();
    public abstract int getCapacidadMaxima();

    /** Método concreto compartido que usa el comportamiento polimórfico de la subclase. */
    public double calcularTiempoEstimadoMin(double distanciaKm) {
        return (distanciaKm / getVelocidadPromedioKmH()) * 60.0;
    }

    public void actualizarUbicacion(double latitud, double longitud) {
        this.latitud = latitud;
        this.longitud = longitud;
    }

    @Override
    public void registrarCalificacion(int puntaje) {
        this.calificacionPromedio = PromedioUtil.actualizar(calificacionPromedio, totalCalificaciones, puntaje);
        this.totalCalificaciones++;
    }

    @Override
    public String obtenerSeguimiento() {
        return String.format("%s %s en (%.5f, %.5f)", getTipoVehiculo(), getNombre(), latitud, longitud);
    }
}
