package com.smartdelivery.service;

import com.smartdelivery.dto.ComercioRequest;
import com.smartdelivery.dto.ComercioResponse;
import com.smartdelivery.dto.ProductoRequest;
import com.smartdelivery.dto.ProductoResponse;
import com.smartdelivery.exception.PermisoDenegadoException;
import com.smartdelivery.exception.RecursoNoEncontradoException;
import com.smartdelivery.exception.ReglaNegocioException;
import com.smartdelivery.model.*;
import com.smartdelivery.repository.ComercioRepository;
import com.smartdelivery.repository.ProductoRepository;
import com.smartdelivery.repository.UsuarioRepository;
import com.smartdelivery.repository.ZonaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ComercioService {
    private final ComercioRepository comercioRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ZonaRepository zonaRepository;

    @Transactional(readOnly = true)
    public List<ComercioResponse> listarAbiertos() {
        return comercioRepository.findByAbiertoTrue().stream().map(ComercioResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<ComercioResponse> listarTodos() {
        return comercioRepository.findAll().stream().map(ComercioResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<ComercioResponse> listarPropios(Long usuarioId) {
        return comercioRepository.findAll().stream()
                .filter(c -> c.getPropietario().getId().equals(usuarioId))
                .map(ComercioResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ComercioResponse obtener(Long id) { return ComercioResponse.de(buscar(id)); }

    @Transactional
    public ComercioResponse crear(ComercioRequest r) {
        Usuario dueno = usuarioRepository.findById(r.propietarioId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", r.propietarioId()));
        if (dueno.getRol() != Rol.COMERCIO) throw new ReglaNegocioException("El propietario debe tener rol COMERCIO");
        Zona zona = r.zonaId() == null ? null : zonaRepository.findById(r.zonaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Zona", r.zonaId()));
        int prep = r.tiempoPreparacionMin() == null ? 20 : r.tiempoPreparacionMin();
        Comercio c = new Comercio(r.nombre(), r.direccion(), r.latitud(), r.longitud(), zona, dueno, prep);
        return ComercioResponse.de(comercioRepository.save(c));
    }

    @Transactional
    public ComercioResponse cambiarAbierto(Long comercioId, boolean abierto, Usuario actor) {
        Comercio c = buscar(comercioId);
        verificarDueno(c, actor);
        c.setAbierto(abierto);
        return ComercioResponse.de(c);
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> productos(Long comercioId, boolean soloDisponibles) {
        buscar(comercioId);
        List<Producto> lista = soloDisponibles
                ? productoRepository.findByComercioIdAndDisponibleTrue(comercioId)
                : productoRepository.findByComercioId(comercioId);
        return lista.stream().map(ProductoResponse::de).toList();
    }

    @Transactional
    public ProductoResponse crearProducto(Long comercioId, ProductoRequest r, Usuario actor) {
        Comercio c = buscar(comercioId);
        verificarDueno(c, actor);
        Producto p = new Producto(r.nombre(), r.descripcion(), r.precio(), c);
        if (r.disponible() != null) p.setDisponible(r.disponible());
        return ProductoResponse.de(productoRepository.save(p));
    }

    @Transactional
    public ProductoResponse actualizarProducto(Long comercioId, Long productoId, ProductoRequest r, Usuario actor) {
        Comercio c = buscar(comercioId);
        verificarDueno(c, actor);
        Producto p = productoRepository.findById(productoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto", productoId));
        if (!p.getComercio().getId().equals(comercioId)) throw new ReglaNegocioException("El producto no pertenece a este comercio");
        p.setNombre(r.nombre());
        p.setDescripcion(r.descripcion());
        p.setPrecio(r.precio());
        if (r.disponible() != null) p.setDisponible(r.disponible());
        return ProductoResponse.de(p);
    }

    private Comercio buscar(Long id) {
        return comercioRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Comercio", id));
    }

    private void verificarDueno(Comercio c, Usuario actor) {
        boolean esDueno = c.getPropietario().getId().equals(actor.getId());
        if (actor.getRol() != Rol.ADMIN && !esDueno) throw new PermisoDenegadoException("No eres el dueño de este comercio");
    }
}
