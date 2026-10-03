package com.smartdelivery.service;

import com.smartdelivery.dto.CalificacionRequest;
import com.smartdelivery.exception.PermisoDenegadoException;
import com.smartdelivery.exception.RecursoNoEncontradoException;
import com.smartdelivery.exception.ReglaNegocioException;
import com.smartdelivery.model.Calificacion;
import com.smartdelivery.model.EstadoPedido;
import com.smartdelivery.model.Pedido;
import com.smartdelivery.repository.CalificacionRepository;
import com.smartdelivery.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CalificacionService {
    private final CalificacionRepository calificacionRepository;
    private final PedidoRepository pedidoRepository;

    @Transactional
    public void registrar(Long clienteId, CalificacionRequest req) {
        Pedido p = pedidoRepository.findById(req.pedidoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Pedido", req.pedidoId()));
        if (p.getCliente() == null || !p.getCliente().getId().equals(clienteId)) throw new PermisoDenegadoException("Este pedido no es tuyo");
        calificar(p, req);
    }

    /** Invitado: se identifica con el número de pedido y su código de seguimiento. */
    @Transactional
    public void registrarInvitado(Long pedidoId, String codigo, CalificacionRequest req) {
        Pedido p = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pedido", pedidoId));
        if (!p.esInvitado() || !p.coincideCodigo(codigo)) throw new RecursoNoEncontradoException("Pedido", pedidoId);
        calificar(p, req);
    }

    private void calificar(Pedido p, CalificacionRequest req) {
        if (p.getEstado() != EstadoPedido.ENTREGADO) throw new ReglaNegocioException("Solo se califican pedidos ENTREGADOS");
        if (p.isCalificado() || calificacionRepository.existsByPedidoId(p.getId())) {
            throw new ReglaNegocioException("Este pedido ya fue calificado");
        }

        // Comercio y Repartidor implementan Calificable
        p.getComercio().registrarCalificacion(req.puntajeComercio());
        if (p.getRepartidor() != null) p.getRepartidor().registrarCalificacion(req.puntajeRepartidor());

        calificacionRepository.save(new Calificacion(p, req.puntajeComercio(), req.puntajeRepartidor(), req.comentario()));
        p.marcarCalificado();
    }
}
