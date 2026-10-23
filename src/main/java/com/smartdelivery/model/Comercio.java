package com.smartdelivery.model;

import com.smartdelivery.interfaces.Calificable;
import com.smartdelivery.interfaces.Notificable;
import com.smartdelivery.util.PromedioUtil;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "comercios")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comercio implements Calificable, Notificable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String nombre;
    private String direccion;
    private double latitud;
    private double longitud;
    @ManyToOne
    private Zona zona;
    @ManyToOne(optional = false)
    private Usuario propietario;
    private boolean abierto = true;
    private int tiempoPreparacionMin = 20;
    private double calificacionPromedio = 0;
    private int totalCalificaciones = 0;

    public Comercio(String nombre, String direccion, double latitud, double longitud,
                    Zona zona, Usuario propietario, int tiempoPreparacionMin) {
        this.nombre = nombre;
        this.direccion = direccion;
        this.latitud = latitud;
        this.longitud = longitud;
        this.zona = zona;
        this.propietario = propietario;
        this.tiempoPreparacionMin = tiempoPreparacionMin;
    }

    @Override
    public void registrarCalificacion(int puntaje) {
        this.calificacionPromedio = PromedioUtil.actualizar(calificacionPromedio, totalCalificaciones, puntaje);
        this.totalCalificaciones++;
    }

    @Override
    public String getDestinoNotificacion() { return propietario.getEmail(); }
}
