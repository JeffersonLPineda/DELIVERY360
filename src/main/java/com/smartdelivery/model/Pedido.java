package com.smartdelivery.model;

import com.smartdelivery.exception.EstadoPedidoInvalidoException;
import com.smartdelivery.exception.ReglaNegocioException;
import com.smartdelivery.interfaces.Rastreable;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Encapsulamiento: el estado NO tiene setter público; solo cambia mediante cambiarEstado(),
 * que valida la transición y lanza EstadoPedidoInvalidoException si no es legal.
 */
@Entity
@Table(name = "pedidos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Pedido implements Rastreable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /** null cuando el pedido lo hizo un invitado (la cuenta de cliente es opcional). */
    @ManyToOne
    private Usuario cliente;
    @ManyToOne(optional = false)
    private Comercio comercio;
    @ManyToOne
    private Repartidor repartidor;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPedido estado = EstadoPedido.CREADO;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetallePedido> detalles = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "pedido_historial", joinColumns = @JoinColumn(name = "pedido_id"))
    @Column(name = "evento")
    private List<String> historial = new ArrayList<>();

    @Column(precision = 12, scale = 2) private BigDecimal subtotal = BigDecimal.ZERO;
    @Column(precision = 12, scale = 2) private BigDecimal descuento = BigDecimal.ZERO;
    @Column(precision = 12, scale = 2) private BigDecimal costoEnvio = BigDecimal.ZERO;
    @Column(precision = 12, scale = 2) private BigDecimal total = BigDecimal.ZERO;
    private double distanciaKm;
    private String direccionEntrega;
    private String notasEntrega;
    private double latEntrega;
    private double lonEntrega;
    // Datos de contacto de quien recibe (siempre presentes, tenga o no cuenta)
    private String nombreContacto;
    private String telefonoContacto;
    private String emailContacto;
    /** Clave secreta para que un invitado consulte, cancele o califique su pedido sin iniciar sesión. */
    @Column(length = 16)
    private String codigoSeguimiento;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    @ManyToOne
    private Promocion promocion;
    @OneToOne(cascade = CascadeType.ALL)
    private Pago pago;
    private boolean calificado = false;

    public Pedido(Usuario cliente, Comercio comercio, String direccionEntrega, double latEntrega, double lonEntrega) {
        this.cliente = cliente;
        this.comercio = comercio;
        this.direccionEntrega = direccionEntrega;
        this.latEntrega = latEntrega;
        this.lonEntrega = lonEntrega;
        this.fechaCreacion = LocalDateTime.now();
        this.fechaActualizacion = this.fechaCreacion;
        this.codigoSeguimiento = generarCodigo();
        registrar(cliente == null ? "Pedido creado (invitado)" : "Pedido creado");
    }

    public void registrarContacto(String nombre, String telefono, String email, String notasEntrega) {
        this.nombreContacto = nombre;
        this.telefonoContacto = telefono;
        this.emailContacto = email;
        this.notasEntrega = notasEntrega;
    }

    public boolean esInvitado() { return cliente == null; }

    /** Comparación en tiempo constante del código de seguimiento. */
    public boolean coincideCodigo(String codigo) {
        return codigoSeguimiento != null && codigo != null
                && MessageDigest.isEqual(codigoSeguimiento.getBytes(StandardCharsets.UTF_8),
                                         codigo.trim().toUpperCase().getBytes(StandardCharsets.UTF_8));
    }

    private static String generarCodigo() {
        final String alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // sin O/0/I/1 para evitar confusiones
        SecureRandom rnd = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) sb.append(alfabeto.charAt(rnd.nextInt(alfabeto.length())));
        return sb.toString();
    }

    public void agregarDetalle(Producto producto, int cantidad) {
        if (cantidad <= 0) throw new ReglaNegocioException("La cantidad debe ser mayor a cero");
        detalles.add(new DetallePedido(this, producto, cantidad));
    }

    public void aplicarCostos(BigDecimal envio, double distanciaKm, Promocion promo) {
        this.subtotal = detalles.stream().map(DetallePedido::getSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        this.costoEnvio = envio;
        this.distanciaKm = distanciaKm;
        this.promocion = promo;
        this.descuento = (promo == null) ? BigDecimal.ZERO : promo.calcularDescuento(subtotal, envio);
        this.total = subtotal.add(envio).subtract(descuento).max(BigDecimal.ZERO);
    }

    public void setPago(Pago pago) {
        this.pago = pago;
        registrar("Pago " + pago.getEstado() + " - " + pago.descripcionPublica());
    }

    /** Deja una nota en el historial del pedido. */
    public void anotar(String evento) { registrar(evento); }

    public void cambiarEstado(EstadoPedido nuevo) {
        if (nuevo == null || !estado.puedeTransicionarA(nuevo)) {
            throw new EstadoPedidoInvalidoException(estado, nuevo);
        }
        this.estado = nuevo;
        this.fechaActualizacion = LocalDateTime.now();
        registrar("Estado -> " + nuevo);
    }

    public void asignarRepartidor(Repartidor r) {
        if (estado.esFinal()) throw new ReglaNegocioException("No se puede asignar repartidor a un pedido " + estado);
        this.repartidor = r;
        registrar("Repartidor asignado: " + r.getNombre() + " (" + r.getTipoVehiculo() + ")");
    }

    public void marcarCalificado() { this.calificado = true; }

    /** ¿El usuario participa en este pedido (o es administrador)? */
    public boolean involucra(Usuario u) {
        return u.getRol() == Rol.ADMIN
                || (cliente != null && cliente.getId().equals(u.getId()))
                || comercio.getPropietario().getId().equals(u.getId())
                || (repartidor != null && repartidor.getId().equals(u.getId()));
    }

    private void registrar(String evento) {
        historial.add(LocalDateTime.now().withNano(0) + " - " + evento);
    }

    @Override
    public String obtenerSeguimiento() {
        String base = "Pedido #" + id + ": " + estado;
        return (repartidor == null) ? base + " (sin repartidor asignado)" : base + " | " + repartidor.obtenerSeguimiento();
    }

    // Colecciones de solo lectura hacia afuera
    public List<DetallePedido> getDetalles() { return Collections.unmodifiableList(detalles); }
    public List<String> getHistorial() { return Collections.unmodifiableList(historial); }
}
