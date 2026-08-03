export interface ProductCatalogItem {
  id: number;
  title: string;
  description: string;
  price: number;
  stock: number;
}

type ProductSpec = readonly [
  title: string,
  description: string,
  price: number,
  stock: number
];

interface ProductGroup {
  category: string;
  products: readonly ProductSpec[];
}

const productGroups = [
  {
    category: 'Electrónica y oficina',
    products: [
      ['Audífonos inalámbricos con estuche de carga', 'Bluetooth 5.3, autonomía total de 30 horas y control táctil.', 699, 38],
      ['Bocina Bluetooth portátil resistente a salpicaduras', 'Potencia de 20 W, autonomía de 12 horas y protección IPX5.', 899, 24],
      ['Cargador USB-C GaN de 65 W', 'Carga rápida para teléfonos y computadoras; incluye cable trenzado.', 749, 41],
      ['Batería externa de 20 000 mAh', 'Dos puertos USB y pantalla digital de nivel de carga.', 899, 30],
      ['Cámara web Full HD con micrófono', 'Video 1080p, enfoque automático y cubierta física de privacidad.', 799, 19],
      ['Teclado mecánico compacto retroiluminado', 'Formato 75 %, interruptores táctiles y conexión USB-C.', 1099, 16],
      ['Mouse inalámbrico ergonómico', 'Seis botones, receptor USB y batería de larga duración.', 449, 47],
      ['Base ajustable de aluminio para laptop', 'Altura regulable, ventilación abierta y protectores antideslizantes.', 599, 34],
      ['Hub USB-C multipuerto con HDMI', 'HDMI 4K, USB 3.0 y lector de tarjetas SD.', 999, 22],
      ['Lámpara LED de escritorio con carga inalámbrica', 'Cinco niveles de brillo, temporizador y puerto USB-C.', 829, 27]
    ]
  },
  {
    category: 'Cocina y comedor',
    products: [
      ['Freidora de aire digital de 5.5 L', 'Ocho programas, canasta antiadherente y control de temperatura.', 1899, 18],
      ['Cafetera programable de 12 tazas', 'Temporizador de 24 horas, filtro reutilizable y placa caliente.', 1299, 21],
      ['Licuadora de vaso de 1.5 L', 'Motor de 700 W, cinco velocidades y vaso resistente.', 999, 25],
      ['Juego de sartenes antiadherentes de 3 piezas', 'Diámetros de 20, 24 y 28 cm; mangos de tacto frío.', 1399, 14],
      ['Báscula digital de cocina', 'Precisión de un gramo, función tara y pantalla iluminada.', 349, 52],
      ['Hervidor eléctrico de acero de 1.7 L', 'Apagado automático, base giratoria y filtro removible.', 699, 31],
      ['Contenedores herméticos de 10 piezas', 'Tapas de cierre firme y tamaños apilables para despensa.', 799, 35],
      ['Cuchillo de chef de acero de 8 pulgadas', 'Hoja afilada, mango ergonómico y funda protectora.', 529, 29],
      ['Tabla de bambú con canal para jugos', 'Superficie amplia, reversible y fácil de limpiar.', 399, 44],
      ['Termo de acero inoxidable de 950 ml', 'Aislamiento al vacío y tapa antiderrames con asa.', 579, 48]
    ]
  },
  {
    category: 'Hogar y organización',
    products: [
      ['Juego de sábanas de microfibra matrimonial', 'Incluye sábana plana, ajustable y dos fundas de almohada.', 749, 26],
      ['Almohada viscoelástica cervical', 'Contorno ergonómico y funda removible lavable.', 699, 33],
      ['Organizador modular para clóset de 12 cubos', 'Paneles resistentes y armado configurable sin herramientas.', 899, 17],
      ['Aspiradora vertical inalámbrica', 'Dos velocidades, filtro lavable y accesorios para rincones.', 2499, 12],
      ['Ventilador de torre con temporizador', 'Tres velocidades, oscilación y control remoto.', 1899, 10],
      ['Cortina blackout de 140 x 220 cm', 'Tela térmica con ojillos metálicos que bloquea la luz.', 649, 39],
      ['Toallas de algodón de 4 piezas', 'Dos toallas de baño y dos de manos, suaves y absorbentes.', 799, 28],
      ['Cesto plegable para ropa de 90 L', 'Estructura ligera, asas reforzadas y tapa superior.', 429, 42],
      ['Difusor ultrasónico de aromas de 300 ml', 'Luz ambiental, temporizador y apagado sin agua.', 549, 36],
      ['Set de focos LED cálidos de 6 piezas', 'Luz de 9 W, base estándar y bajo consumo.', 399, 60]
    ]
  },
  {
    category: 'Cuidado personal',
    products: [
      ['Secadora iónica para cabello de 1600 W', 'Tres temperaturas, dos velocidades y boquilla concentradora.', 1199, 20],
      ['Recortadora recargable multiuso', 'Cuchillas lavables y seis peines para barba y cabello.', 899, 23],
      ['Cepillo facial sónico resistente al agua', 'Tres intensidades y cabezal de silicón suave.', 649, 31],
      ['Espejo de maquillaje LED ajustable', 'Tres tonos de luz, aumento lateral y carga USB.', 749, 27],
      ['Báscula corporal digital de vidrio', 'Capacidad de 180 kg y encendido automático.', 499, 49],
      ['Masajeador cervical con calor', 'Rotación bidireccional y correa para ajustar la intensidad.', 1299, 15],
      ['Irrigador dental portátil', 'Tres modos, depósito de 250 ml y cinco boquillas.', 999, 18],
      ['Cepillo alisador de cerámica', 'Cinco temperaturas, calentamiento rápido y cable giratorio.', 899, 24],
      ['Organizador acrílico para cosméticos', 'Cajones transparentes y compartimentos de varios tamaños.', 449, 40],
      ['Juego de manicure de acero de 12 piezas', 'Estuche compacto con herramientas para manos y pies.', 379, 45]
    ]
  },
  {
    category: 'Deportes y ejercicio',
    products: [
      ['Tapete de yoga antiderrapante de 6 mm', 'Superficie texturizada, correa de transporte y fácil limpieza.', 599, 37],
      ['Mancuernas ajustables, par de 10 kg', 'Discos intercambiables y barras con agarre antideslizante.', 1799, 13],
      ['Bandas de resistencia, set de 5', 'Cinco niveles de tensión con bolsa de transporte.', 399, 55],
      ['Botella deportiva térmica de 750 ml', 'Acero inoxidable, boquilla abatible y tapa sin fugas.', 449, 50],
      ['Mochila deportiva impermeable de 30 L', 'Compartimento para calzado y bolsillos ventilados.', 749, 32],
      ['Rodillo de espuma para recuperación muscular', 'Textura de densidad media para masaje y movilidad.', 499, 44],
      ['Cuerda para saltar con baleros', 'Longitud ajustable y mangos ergonómicos de espuma.', 299, 61],
      ['Balón de fútbol número 5 para entrenamiento', 'Cubierta cosida, cámara reforzada y buen control.', 499, 35],
      ['Banco plegable para abdominales', 'Respaldo ajustable, rodillos acolchados y estructura estable.', 1599, 11],
      ['Reloj deportivo con monitor de actividad', 'Registra pasos, sueño, ritmo cardiaco y entrenamientos.', 1299, 19]
    ]
  },
  {
    category: 'Herramientas y mejoras del hogar',
    products: [
      ['Taladro inalámbrico de 20 V con batería', 'Dos velocidades, mandril de 10 mm y maletín rígido.', 2199, 15],
      ['Juego de destornilladores de precisión de 32 piezas', 'Puntas magnéticas para electrónica, lentes y reparaciones finas.', 449, 39],
      ['Caja de herramientas doméstica de 85 piezas', 'Pinzas, llaves, martillo, puntas y estuche organizado.', 1499, 17],
      ['Flexómetro reforzado de 8 m', 'Cinta ancha, freno seguro y gancho magnético.', 299, 65],
      ['Pistola de silicón de 60 W con barras', 'Calentamiento rápido, soporte estable e incluye diez barras.', 399, 42],
      ['Multímetro digital portátil', 'Mide voltaje, corriente, resistencia y continuidad.', 649, 25],
      ['Linterna recargable de alta potencia', 'Cinco modos, enfoque ajustable y cuerpo de aluminio.', 549, 46],
      ['Escalera plegable de aluminio de 4 peldaños', 'Escalones amplios, seguros laterales y patas antideslizantes.', 1699, 10],
      ['Juego de brocas para metal y madera de 50 piezas', 'Medidas variadas en estuche con divisiones etiquetadas.', 799, 22],
      ['Nivel láser autonivelante', 'Proyecta líneas horizontal y vertical; incluye soporte.', 1299, 14]
    ]
  },
  {
    category: 'Bebés y primera infancia',
    products: [
      ['Pañalera mochila con cambiador', 'Compartimentos térmicos, apertura amplia y correas para carriola.', 899, 25],
      ['Silla alta plegable para bebé', 'Charola removible, arnés de cinco puntos y altura ajustable.', 1799, 12],
      ['Monitor de bebé con pantalla de 3.5 pulgadas', 'Visión nocturna, audio bidireccional y sensor de temperatura.', 2199, 9],
      ['Esterilizador eléctrico para biberones', 'Ciclo rápido y capacidad para seis biberones y accesorios.', 1499, 13],
      ['Almohada de lactancia lavable', 'Relleno firme y funda suave con cierre.', 649, 29],
      ['Vajilla infantil de silicón de 6 piezas', 'Plato con succión, vaso, tazón y cubiertos suaves.', 499, 37],
      ['Barrera de seguridad ajustable', 'Instalación a presión y cierre de doble acción.', 999, 18],
      ['Tapete acolchado plegable para juego', 'Superficie reversible, impermeable y fácil de guardar.', 1399, 14],
      ['Portabebé ergonómico ajustable', 'Cuatro posiciones, soporte lumbar y tela transpirable.', 1199, 16],
      ['Luz nocturna infantil recargable', 'Brillo regulable, tacto suave y temporizador.', 399, 43]
    ]
  },
  {
    category: 'Mascotas',
    products: [
      ['Cama acolchada para mascota mediana', 'Base antideslizante y funda removible lavable.', 899, 27],
      ['Fuente automática para mascotas de 2.5 L', 'Filtro reemplazable, bomba silenciosa y ventana de nivel.', 799, 22],
      ['Comedero doble de acero con base', 'Tazones removibles y soporte antiderrapante.', 499, 36],
      ['Transportadora rígida para mascota pequeña', 'Puerta metálica, ventilación lateral y asa reforzada.', 999, 18],
      ['Rascador vertical para gato de 90 cm', 'Postes de sisal, plataforma y juguete colgante.', 1199, 14],
      ['Correa retráctil para perro de 5 m', 'Freno de un toque y mango de agarre cómodo.', 449, 41],
      ['Cepillo removedor de pelo para mascota', 'Cerdas finas, botón de limpieza y mango antideslizante.', 299, 52],
      ['Juguetes interactivos para gato de 8 piezas', 'Pelotas, ratones y varita para estimulación diaria.', 379, 48],
      ['Tapete absorbente lavable para mascota', 'Cuatro capas, base impermeable y secado rápido.', 499, 34],
      ['Cortauñas con luz LED para mascota', 'Guía de corte, lima integrada y mango seguro.', 349, 38]
    ]
  },
  {
    category: 'Automotriz',
    products: [
      ['Compresor de aire portátil de 12 V', 'Pantalla digital, apagado automático y luz de emergencia.', 999, 20],
      ['Soporte magnético para celular de automóvil', 'Montaje en ventilación y giro de 360 grados.', 329, 58],
      ['Cámara para tablero Full HD', 'Grabación en bucle, sensor de impacto y visión nocturna.', 1299, 16],
      ['Arrancador portátil para batería de 12 000 mAh', 'Pinzas protegidas, linterna y salida USB.', 1799, 11],
      ['Aspiradora compacta para automóvil', 'Cable de 12 V, filtro lavable y tres boquillas.', 799, 24],
      ['Organizador plegable para cajuela', 'Divisiones ajustables, asas y base antiderrapante.', 549, 37],
      ['Cargador vehicular USB-C doble', 'Carga rápida de 48 W y protección contra sobrecarga.', 399, 53],
      ['Cubierta protectora para asiento trasero', 'Tela impermeable, ventana de malla y anclajes firmes.', 699, 28],
      ['Kit de limpieza automotriz de 9 piezas', 'Cepillos, paños de microfibra, esponja y aplicadores.', 649, 32],
      ['Medidor digital de presión de llantas', 'Pantalla iluminada y lectura en cuatro unidades.', 299, 62]
    ]
  },
  {
    category: 'Jardín y exterior',
    products: [
      ['Manguera expandible para jardín de 15 m', 'Conector metálico y boquilla con ocho patrones.', 699, 33],
      ['Tijeras de poda con seguro', 'Cuchilla de acero, resorte suave y mango ergonómico.', 399, 47],
      ['Lámparas solares para exterior de 8 piezas', 'Encendido automático y estaca resistente a la intemperie.', 799, 29],
      ['Hielera rígida de 28 L', 'Aislamiento grueso, asa plegable y drenaje inferior.', 1199, 15],
      ['Hamaca doble de algodón con bolsa', 'Tejido reforzado y capacidad para dos personas.', 899, 21],
      ['Silla plegable de camping con portavasos', 'Estructura de acero, bolsa de transporte y bolsillo lateral.', 699, 26],
      ['Kit de jardinería de 10 piezas', 'Palas, cultivador, guantes y bolsa organizadora.', 749, 31],
      ['Aspersor giratorio de tres brazos', 'Cobertura ajustable y base estable con conexión rápida.', 449, 42],
      ['Macetas autorregables medianas, set de 3', 'Depósito inferior y visor de nivel de agua.', 599, 36],
      ['Parrilla portátil de carbón', 'Rejilla cromada, ventilación ajustable y patas plegables.', 1299, 13]
    ]
  }
] satisfies readonly ProductGroup[];

const productsWithoutIds: Omit<ProductCatalogItem, 'id'>[] = productGroups.flatMap(
  (group) => group.products.map(([title, description, price, stock]) => ({
    title,
    description: `${group.category}. ${description}`,
    price,
    stock
  }))
);

export const productCatalog: ProductCatalogItem[] = productsWithoutIds.map(
  (product, index) => ({ id: index + 1, ...product })
);

if (productCatalog.length !== 100) {
  throw new Error(`El catálogo debe contener 100 productos; contiene ${productCatalog.length}.`);
}
