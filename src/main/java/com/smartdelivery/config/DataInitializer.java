package com.smartdelivery.config;

import com.smartdelivery.model.*;
import com.smartdelivery.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Datos de ejemplo para poder probar el flujo completo desde el primer arranque. */
@Component
public class DataInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UsuarioRepository usuarios;
    private final RepartidorRepository repartidores;
    private final ZonaRepository zonas;
    private final ComercioRepository comercios;
    private final ProductoRepository productos;
    private final PromocionRepository promociones;
    private final PasswordEncoder encoder;

    public DataInitializer(UsuarioRepository usuarios, RepartidorRepository repartidores, ZonaRepository zonas,
                           ComercioRepository comercios, ProductoRepository productos,
                           PromocionRepository promociones, PasswordEncoder encoder) {
        this.usuarios = usuarios;
        this.repartidores = repartidores;
        this.zonas = zonas;
        this.comercios = comercios;
        this.productos = productos;
        this.promociones = promociones;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (usuarios.count() > 0) return;

        Zona amatitlan = zonas.save(new Zona("Amatitlán", 14.4783, -90.6158));
        zonas.save(new Zona("Villa Nueva", 14.5269, -90.5875));

        usuarios.save(new Usuario("Administrador", "admin@smartdelivery.com", encoder.encode("Admin123"), "5555-0000", Rol.ADMIN));
        Usuario duenoPollo = usuarios.save(new Usuario("Dueño Pollo Express", "comercio1@smartdelivery.com", encoder.encode("Comercio123"), "5555-0001", Rol.COMERCIO));
        Usuario duenoPizza = usuarios.save(new Usuario("Dueño Pizzería Roma", "comercio2@smartdelivery.com", encoder.encode("Comercio123"), "5555-0002", Rol.COMERCIO));
        usuarios.save(new Usuario("Cliente Demo", "cliente@smartdelivery.com", encoder.encode("Cliente123"), "5555-1111", Rol.CLIENTE));

        crearRepartidor(new RepartidorMoto("Moto Carlos", "moto@smartdelivery.com", encoder.encode("Repartidor123"), "5555-2001"), amatitlan, 0.004);
        crearRepartidor(new RepartidorBicicleta("Bici Ana", "bici@smartdelivery.com", encoder.encode("Repartidor123"), "5555-2002"), amatitlan, 0.010);
        crearRepartidor(new RepartidorAutomovil("Auto Luis", "auto@smartdelivery.com", encoder.encode("Repartidor123"), "5555-2003"), amatitlan, 0.007);

        Comercio pollo = comercios.save(new Comercio("Pollo Express Amatitlán", "Centro de Amatitlán", 14.4790, -90.6150, amatitlan, duenoPollo, 20));
        productos.save(new Producto("Combo pollo frito", "2 piezas, papas y gaseosa", new BigDecimal("45.00"), pollo));
        productos.save(new Producto("Alitas BBQ", "8 alitas con salsa", new BigDecimal("38.00"), pollo));
        productos.save(new Producto("Hamburguesa clásica", "Carne, queso y vegetales", new BigDecimal("32.00"), pollo));

        Comercio pizza = comercios.save(new Comercio("Pizzería Roma", "Calzada Amatitlán", 14.4815, -90.6120, amatitlan, duenoPizza, 30));
        productos.save(new Producto("Pizza mediana", "Pepperoni o queso", new BigDecimal("75.00"), pizza));
        productos.save(new Producto("Pizza familiar", "Hasta 3 ingredientes", new BigDecimal("120.00"), pizza));
        productos.save(new Producto("Refresco 2L", "Bebida gaseosa", new BigDecimal("18.00"), pizza));

        promociones.save(new PromocionPorcentaje("BIENVENIDO10", "10% de descuento", new BigDecimal("10")));
        PromocionMontoFijo fijo = new PromocionMontoFijo("MENOS25", "Q25 de descuento en compras desde Q100", new BigDecimal("25"));
        fijo.setMontoMinimo(new BigDecimal("100"));
        promociones.save(fijo);
        promociones.save(new PromocionEnvioGratis("ENVIOGRATIS", "Envío gratis"));

        log.info("Datos de ejemplo cargados. Usuarios: admin@/comercio1@/comercio2@/cliente@/moto@/bici@/auto@smartdelivery.com");
    }

    private void crearRepartidor(Repartidor r, Zona zona, double desplazamiento) {
        r.setZona(zona);
        r.setDisponible(true);
        r.actualizarUbicacion(zona.getLatitud() + desplazamiento, zona.getLongitud() + desplazamiento);
        repartidores.save(r);
    }
}
