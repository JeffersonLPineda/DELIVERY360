package com.smartdelivery.model;

import com.smartdelivery.interfaces.Notificable;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "usuarios")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Usuario implements Notificable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String nombre;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String passwordHash;
    private String telefono;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rol rol;
    private boolean activo = true;

    public Usuario(String nombre, String email, String passwordHash, String telefono, Rol rol) {
        this.nombre = nombre;
        this.email = email.toLowerCase();
        this.passwordHash = passwordHash;
        this.telefono = telefono;
        this.rol = rol;
    }

    @Override
    public String getDestinoNotificacion() { return email; }
}
