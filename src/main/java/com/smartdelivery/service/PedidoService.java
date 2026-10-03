package com.smartdelivery.service;

import com.smartdelivery.dto.*;
import com.smartdelivery.exception.PermisoDenegadoException;
import com.smartdelivery.exception.RecursoNoEncontradoException;
import com.smartdelivery.exception.ReglaNegocioException;
import com.smartdelivery.model.*;
import com.smartdelivery.repository.*;
import com.smartdelivery.util.DistanciaUtil;
import com.smartdelivery.util.TarifaEnvio;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {
    private static final Logger log = LoggerFactory.getLogger(PedidoService.class);
    private static final double MAX_KM_ENTREGA = 30.0;

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ComercioRepository comercioRepository;
    private final ProductoRepository productoRepository;
    private final PromocionRepository promocionRepository;
    private final AsignacionService asignacionService;
    private final Autenticacion3DSService autenticacion3DS;

    // ------------------------------------------------------------------ crear
    /** clienteId == null: pedido de invitado (sin cuenta). */
    @Transactional
    public PedidoResponse crear(Long clienteId, PedidoRequest req) {
        Usuario cliente = (clienteId == null) ? null : buscarUsuario(clienteId);
        Comercio comercio = comercioRepository.findById(req.comercioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Comercio", req.comercioId()));
        if (!comercio.isAbierto()) throw new ReglaNegocioException("El comercio no está recibiendo pedidos");
        validarUbicacion(req.latEntrega(), req.lonEntrega());

        // Datos de contacto: obligatorios; si hay sesión se completan con los de la cuenta
        String nombre = limpiar(req.nombreContacto());
        String telefono = limpiar(req.telefonoContacto());
        String email = limpiar(req.emailContacto());
        if (cliente != null) {
            if (nombre == null) nombre = cliente.getNombre();
            if (telefono == null) telefono = limpiar(cliente.getTelefono());
            if (email == null) email = cliente.getEmail();
        }
        if (nombre == null) throw new ReglaNegocioException("Indica el nombre de quien recibe el pedido");
        if (telefono == null || !telefono.matches("[0-9+()\\-\\s]{7,20}")) {
            throw new ReglaNegocioException("Indica un teléfono de contacto válido para el repartidor");
        }
        if (email != null && !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new ReglaNegocioException("El correo no tiene un formato válido");
        }

        Pedido pedido = new Pedido(cliente, comercio, req.direccionEntrega().trim(), req.latEntrega(), req.lonEntrega());
        pedido.registrarContacto(nombre, telefono, email, limpiar(req.notasEntrega()));
        for (ItemPedidoRequest item : req.items()) {
            Producto producto = productoRepository.findById(item.productoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto", item.productoId()));
            if (!producto.getComercio().getId().equals(comercio.getId())) {
                throw new ReglaNegocioException("El producto " + producto.getNombre() + " no pertenece a este comercio");
            }
            if (!producto.isDisponible()) {
                throw new ReglaNegocioException("El producto " + producto.getNombre() + " no está disponible");
            }
            pedido.agregarDetalle(producto, item.cantidad());
        }

        double km = DistanciaUtil.km(comercio.getLatitud(), comercio.getLongitud(), req.latEntrega(), req.lonEntrega());
        if (km > MAX_KM_ENTREGA) {
            throw new ReglaNegocioException(String.format("La ubicación está fuera del área de entrega (%.1f km; máximo %.0f km)", km, MAX_KM_ENTREGA));
        }
        BigDecimal envio = TarifaEnvio.calcular(km);
        pedido.aplicarCostos(envio, km, null);

        if (req.codigoPromocion() != null && !req.codigoPromocion().isBlank()) {
            Promocion promo = promocionRepository.findByCodigoIgnoreCase(req.codigoPromocion().trim())
                    .orElseThrow(() -> new ReglaNegocioException("El código de promoción no existe"));
            if (!promo.esAplicable(pedido.getSubtotal(), LocalDate.now())) {
                throw new ReglaNegocioException("La promoción no está vigente o no alcanza el monto mínimo (Q" + promo.getMontoMinimo() + ")");
            }
            pedido.aplicarCostos(envio, km, promo);
        }

        // Polimorfismo: cada método de pago valida y procesa a su manera
        Pago pago = req.pago().metodo().crear(req.pago(), pedido.getTotal());
        pago.validar();
        autenticacion3DS.exigir(pago, req.pago());            // 3-D Secure (solo tarjetas que lo exigen)
        if (!pago.seProcesaAlEntregar()) pago.procesar();     // tarjeta: autoriza y cobra; si el banco rechaza no se crea el pedido
        pedido.setPago(pago);

        pedidoRepository.save(pedido);
        comercio.notificar("Nuevo pedido #" + pedido.getId() + " por Q" + pedido.getTotal());
        return PedidoResponse.de(pedido, true);
    }

    // ---------------------------------------------------------------- consultar
    @Transactional(readOnly = true)
    public List<PedidoResponse> listar(Long usuarioId) {
        Usuario u = buscarUsuario(usuarioId);
        List<Pedido> pedidos = switch (u.getRol()) {
            case ADMIN -> pedidoRepository.findAllByOrderByFechaCreacionDesc();
            case CLIENTE -> pedidoRepository.findByClienteIdOrderByFechaCreacionDesc(usuarioId);
            case COMERCIO -> pedidoRepository.findByComercioPropietarioIdOrderByFechaCreacionDesc(usuarioId);
            case REPARTIDOR -> pedidoRepository.findByRepartidorIdOrderByFechaCreacionDesc(usuarioId);
        };
        return pedidos.stream().map(PedidoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public PedidoResponse obtener(Long pedidoId, Long usuarioId) {
        Pedido p = buscarPedido(pedidoId);
        if (!p.involucra(buscarUsuario(usuarioId))) throw new PermisoDenegadoException("No participas en este pedido");
        return PedidoResponse.de(p);
    }

    // ------------------------------------------------------ pedidos de invitado
    @Transactional(readOnly = true)
    public PedidoResponse seguimiento(Long pedidoId, String codigo) {
        return PedidoResponse.de(pedidoDeInvitado(pedidoId, codigo), true);
    }

    @Transactional
    public PedidoResponse cancelarInvitado(Long pedidoId, String codigo) {
        Pedido p = pedidoDeInvitado(pedidoId, codigo);
        if (p.getEstado() != EstadoPedido.CREADO && p.getEstado() != EstadoPedido.CONFIRMADO) {
            throw new ReglaNegocioException("Este pedido ya no se puede cancelar (estado: " + p.getEstado() + ")");
        }
        p.cambiarEstado(EstadoPedido.CANCELADO);
        aplicarEfectos(p, EstadoPedido.CANCELADO, null);
        return PedidoResponse.de(p, true);
    }

    /** Un código incorrecto responde igual que un pedido inexistente (no revela qué pedidos existen). */
    private Pedido pedidoDeInvitado(Long pedidoId, String codigo) {
        Pedido p = buscarPedido(pedidoId);
        if (!p.esInvitado() || !p.coincideCodigo(codigo)) throw new RecursoNoEncontradoException("Pedido", pedidoId);
        return p;
    }

    // ------------------------------------------------------------ cambio de estado
    @Transactional
    public PedidoResponse cambiarEstado(Long pedidoId, EstadoPedido nuevo, Long usuarioId, BigDecimal efectivoRecibido) {
        Usuario actor = buscarUsuario(usuarioId);
        Pedido p = buscarPedido(pedidoId);

        if (!p.involucra(actor)) throw new PermisoDenegadoException("No participas en este pedido");
        if (!actor.getRol().puedeCambiarA(nuevo)) {
            throw new PermisoDenegadoException("Un " + actor.getRol() + " no puede mover un pedido a " + nuevo);
        }

        p.cambiarEstado(nuevo);   // lanza EstadoPedidoInvalidoException si la transición no es legal
        if (nuevo == EstadoPedido.EN_CAMINO && p.getRepartidor() == null) {
            throw new ReglaNegocioException("El pedido aún no tiene repartidor asignado");
        }
        aplicarEfectos(p, nuevo, efectivoRecibido);
        return PedidoResponse.de(p);
    }

    private void aplicarEfectos(Pedido p, EstadoPedido nuevo, BigDecimal efectivoRecibido) {
        switch (nuevo) {
            case CONFIRMADO -> {
                avisar(p, "Tu pedido #" + p.getId() + " fue aceptado por " + p.getComercio().getNombre());
                asignacionService.asignar(p);   // asignación automática (si no hay repartidor, se reintenta en LISTO)
            }
            case EN_PREPARACION -> avisar(p, "Tu pedido #" + p.getId() + " está en preparación");
            case LISTO -> {
                if (p.getRepartidor() == null) asignacionService.asignar(p);
                avisar(p, "Tu pedido #" + p.getId() + " está listo para recogerse");
            }
            case EN_CAMINO -> avisar(p, "Tu pedido #" + p.getId() + " va en camino");
            case ENTREGADO -> {
                // Contra entrega: el pago pasa a COMPLETADO solo ahora, cuando el repartidor confirma el cobro
                boolean eraPendiente = p.getPago().getEstado() == EstadoPago.PENDIENTE;
                p.getPago().cobrarAlEntregar(efectivoRecibido);
                if (eraPendiente) p.anotar("Pago " + p.getPago().getEstado() + " - " + p.getPago().descripcionPublica());
                avisar(p, "Pedido #" + p.getId() + " entregado. ¡Califica el servicio!");
            }
            case CANCELADO, RECHAZADO -> {
                p.getPago().cancelar();
                p.anotar("Pago " + p.getPago().getEstado() + " - " + p.getPago().descripcionPublica());
                avisar(p, "Tu pedido #" + p.getId() + " fue " + nuevo.name().toLowerCase());
            }
            default -> { }
        }
    }

    /** Notifica al cliente con cuenta, o al contacto del invitado (simulado por log). */
    private void avisar(Pedido p, String mensaje) {
        if (p.getCliente() != null) {
            p.getCliente().notificar(mensaje);
        } else {
            String destino = (p.getEmailContacto() != null) ? p.getEmailContacto() : p.getTelefonoContacto();
            log.info("[NOTIFICACION -> {}] {}", destino, mensaje);
        }
    }

    // ------------------------------------------------------------ motor de asignación
    @Transactional
    public AsignacionResponse asignarRepartidor(Long pedidoId, Long usuarioId) {
        Usuario actor = buscarUsuario(usuarioId);
        Pedido p = buscarPedido(pedidoId);

        boolean autorizado = actor.getRol() == Rol.ADMIN || (actor.getRol() == Rol.COMERCIO && p.involucra(actor));
        if (!autorizado) throw new PermisoDenegadoException("Solo el administrador o el comercio del pedido pueden asignar");
        if (p.getEstado() == EstadoPedido.CREADO) throw new ReglaNegocioException("El comercio debe aceptar el pedido primero");
        if (p.getEstado().esFinal()) throw new ReglaNegocioException("El pedido ya está " + p.getEstado());
        if (p.getRepartidor() != null) throw new ReglaNegocioException("El pedido ya tiene repartidor: " + p.getRepartidor().getNombre());

        boolean asignado = asignacionService.asignar(p).isPresent();
        String msg = asignado ? "Repartidor asignado" : "No hay repartidores elegibles por ahora";
        return new AsignacionResponse(asignado, msg, PedidoResponse.de(p));
    }

    // ---------------------------------------------------------------- helpers
    private void validarUbicacion(double lat, double lon) {
        boolean fuera = lat < -90 || lat > 90 || lon < -180 || lon > 180;
        if (fuera || (lat == 0 && lon == 0)) throw new ReglaNegocioException("Elige la ubicación de entrega en el mapa");
    }

    private static String limpiar(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }

    private Usuario buscarUsuario(Long id) {
        return usuarioRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Usuario", id));
    }

    private Pedido buscarPedido(Long id) {
        return pedidoRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Pedido", id));
    }
}
