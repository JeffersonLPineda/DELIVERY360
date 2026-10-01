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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {
    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ComercioRepository comercioRepository;
    private final ProductoRepository productoRepository;
    private final PromocionRepository promocionRepository;
    private final AsignacionService asignacionService;

    // ------------------------------------------------------------------ crear
    @Transactional
    public PedidoResponse crear(Long clienteId, PedidoRequest req) {
        Usuario cliente = buscarUsuario(clienteId);
        Comercio comercio = comercioRepository.findById(req.comercioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Comercio", req.comercioId()));
        if (!comercio.isAbierto()) throw new ReglaNegocioException("El comercio no está recibiendo pedidos");

        Pedido pedido = new Pedido(cliente, comercio, req.direccionEntrega(), req.latEntrega(), req.lonEntrega());
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
        if (!pago.seProcesaAlEntregar()) pago.procesar();
        pedido.setPago(pago);

        pedidoRepository.save(pedido);
        comercio.notificar("Nuevo pedido #" + pedido.getId() + " por Q" + pedido.getTotal());
        return PedidoResponse.de(pedido);
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

    // ------------------------------------------------------------ cambio de estado
    @Transactional
    public PedidoResponse cambiarEstado(Long pedidoId, EstadoPedido nuevo, Long usuarioId) {
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
        aplicarEfectos(p, nuevo);
        return PedidoResponse.de(p);
    }

    private void aplicarEfectos(Pedido p, EstadoPedido nuevo) {
        Usuario cliente = p.getCliente();
        switch (nuevo) {
            case CONFIRMADO -> {
                cliente.notificar("Tu pedido #" + p.getId() + " fue aceptado por " + p.getComercio().getNombre());
                asignacionService.asignar(p);   // asignación automática (si no hay repartidor, se reintenta en LISTO)
            }
            case EN_PREPARACION -> cliente.notificar("Tu pedido #" + p.getId() + " está en preparación");
            case LISTO -> {
                if (p.getRepartidor() == null) asignacionService.asignar(p);
                cliente.notificar("Tu pedido #" + p.getId() + " está listo para recogerse");
            }
            case EN_CAMINO -> cliente.notificar("Tu pedido #" + p.getId() + " va en camino");
            case ENTREGADO -> {
                if (p.getPago().seProcesaAlEntregar()) p.getPago().procesar();   // efectivo se cobra aquí
                cliente.notificar("Pedido #" + p.getId() + " entregado. ¡Califica el servicio!");
            }
            case CANCELADO, RECHAZADO -> {
                p.getPago().reembolsar();
                cliente.notificar("Tu pedido #" + p.getId() + " fue " + nuevo.name().toLowerCase());
            }
            default -> { }
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
    private Usuario buscarUsuario(Long id) {
        return usuarioRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Usuario", id));
    }

    private Pedido buscarPedido(Long id) {
        return pedidoRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Pedido", id));
    }
}
