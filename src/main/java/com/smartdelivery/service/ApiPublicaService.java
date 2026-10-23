package com.smartdelivery.service;

import com.smartdelivery.dto.ApiPublicaDtos.*;
import com.smartdelivery.exception.RecursoNoEncontradoException;
import com.smartdelivery.model.Comercio;
import com.smartdelivery.model.Pedido;
import com.smartdelivery.model.Promocion;
import com.smartdelivery.repository.ComercioRepository;
import com.smartdelivery.repository.PedidoRepository;
import com.smartdelivery.repository.ProductoRepository;
import com.smartdelivery.repository.PromocionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Lógica de solo lectura de la API pública. Todo es de solo lectura y filtra lo que no debe verse:
 * comercios cerrados, productos no disponibles, promociones vencidas/inactivas y pedidos que no son de invitado.
 */
@Service
@RequiredArgsConstructor
public class ApiPublicaService {
    private static final int TAMANO_MAXIMO = 100;
    private static final int LARGO_MAXIMO_CODIGO = 16;
    private static final String MARCA_ESTADO = " - Estado -> ";

    private final ComercioRepository comercioRepository;
    private final ProductoRepository productoRepository;
    private final PromocionRepository promocionRepository;
    private final PedidoRepository pedidoRepository;

    @Transactional(readOnly = true)
    public Pagina<ComercioPublico> comercios(String zona, int pagina, int tamano) {
        int t = Math.min(Math.max(tamano, 1), TAMANO_MAXIMO);
        int pg = Math.max(pagina, 0);
        List<ComercioPublico> todos = comercioRepository.findByAbiertoTrue().stream()
                .map(ApiPublicaService::aPublico)
                .filter(c -> zona == null || zona.isBlank() || zona.trim().equalsIgnoreCase(c.zona()))
                .sorted(Comparator.comparing(ComercioPublico::nombre,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
        List<ComercioPublico> contenido = todos.stream().skip((long) pg * t).limit(t).toList();
        return new Pagina<>(contenido, pg, t, todos.size());
    }

    @Transactional(readOnly = true)
    public ComercioPublico comercio(Long id) {
        return aPublico(comercioAbierto(id));
    }

    @Transactional(readOnly = true)
    public List<ProductoPublico> productos(Long comercioId) {
        comercioAbierto(comercioId);
        return productoRepository.findByComercioIdAndDisponibleTrue(comercioId).stream()
                .map(p -> new ProductoPublico(p.getId(), p.getNombre(), p.getDescripcion(), p.getPrecio()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PromocionPublica> promociones() {
        LocalDate hoy = LocalDate.now();
        return promocionRepository.findByActivaTrue().stream()
                .filter(p -> p.getVigenteHasta() == null || !hoy.isAfter(p.getVigenteHasta()))
                .map(ApiPublicaService::aPublica)
                .toList();
    }

    /**
     * Seguimiento de un pedido de invitado con su código secreto. Un código incorrecto, un pedido inexistente
     * y un pedido de cliente con cuenta responden exactamente igual (404), para no revelar qué pedidos existen.
     */
    @Transactional(readOnly = true)
    public SeguimientoPublico seguimiento(Long pedidoId, String codigo) {
        Pedido p = pedidoRepository.findById(pedidoId)
                .filter(x -> codigo != null && !codigo.isBlank() && codigo.length() <= LARGO_MAXIMO_CODIGO)
                .filter(x -> x.esInvitado() && x.coincideCodigo(codigo))
                .orElseThrow(() -> new RecursoNoEncontradoException("Pedido", pedidoId));

        List<Etapa> etapas = new ArrayList<>();
        etapas.add(new Etapa("CREADO", p.getFechaCreacion().withNano(0).toString()));
        for (String linea : p.getHistorial()) {
            int i = linea.indexOf(MARCA_ESTADO);
            if (i > 0) etapas.add(new Etapa(linea.substring(i + MARCA_ESTADO.length()).trim(), linea.substring(0, i)));
        }
        var r = p.getRepartidor();
        var pg = p.getPago();
        return new SeguimientoPublico(p.getId(), p.getEstado().name(), p.getEstado().esFinal(),
                p.getComercio().getNombre(), r != null, r == null ? null : r.getTipoVehiculo(),
                p.getTotal(),
                pg == null ? null : pg.getMetodo().name(),
                pg == null ? null : pg.getEstado().name(),
                p.getFechaCreacion().withNano(0).toString(), List.copyOf(etapas));
    }

    // ------------------------------------------------------------------ helpers
    /** Un comercio cerrado o inexistente se trata igual: no existe para el público. */
    private Comercio comercioAbierto(Long id) {
        return comercioRepository.findById(id).filter(Comercio::isAbierto)
                .orElseThrow(() -> new RecursoNoEncontradoException("Comercio", id));
    }

    private static ComercioPublico aPublico(Comercio c) {
        return new ComercioPublico(c.getId(), c.getNombre(), c.getDireccion(), c.getLatitud(), c.getLongitud(),
                c.getZona() == null ? null : c.getZona().getNombre(), c.isAbierto(), c.getTiempoPreparacionMin(),
                c.getCalificacionPromedio(), c.getTotalCalificaciones());
    }

    private static PromocionPublica aPublica(Promocion p) {
        return new PromocionPublica(p.getCodigo(), p.getDescripcion(), p.getTipo().name(),
                p.getVigenteHasta(), p.getMontoMinimo());
    }
}
