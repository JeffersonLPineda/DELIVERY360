package com.smartdelivery.service;

import com.smartdelivery.dto.ReporteResponse;
import com.smartdelivery.model.EstadoPedido;
import com.smartdelivery.model.Pedido;
import com.smartdelivery.model.Rol;
import com.smartdelivery.repository.ComercioRepository;
import com.smartdelivery.repository.PedidoRepository;
import com.smartdelivery.repository.RepartidorRepository;
import com.smartdelivery.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReporteService {
    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ComercioRepository comercioRepository;
    private final RepartidorRepository repartidorRepository;

    @Transactional(readOnly = true)
    public ReporteResponse generar() {
        List<Pedido> todos = pedidoRepository.findAll();
        Map<String, Long> porEstado = todos.stream()
                .collect(Collectors.groupingBy(p -> p.getEstado().name(), TreeMap::new, Collectors.counting()));
        BigDecimal ingresos = todos.stream()
                .filter(p -> p.getEstado() == EstadoPedido.ENTREGADO)
                .map(Pedido::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ReporteResponse(todos.size(), porEstado, ingresos,
                usuarioRepository.countByRol(Rol.CLIENTE), comercioRepository.count(),
                repartidorRepository.countByActivoTrueAndDisponibleTrue());
    }
}
