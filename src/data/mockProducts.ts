const baseMockProducts = [
  // CALZADO
  {
    id: '1',
    nombre: 'Zapatillas Nike Air Max 270',
    marca: 'nike',
    categoria: 'Calzado',
    precio: 89990,
    precioOriginal: 119990,
    descripcion: 'Zapatillas deportivas con tecnología Air Max para máximo confort y estilo urbano.',
    stock: 25,
    rating: 4.8,
    reviewCount: 124,
    nuevo: false,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '2',
    nombre: 'Botines Adidas Predator Elite',
    marca: 'adidas',
    categoria: 'Calzado',
    precio: 129990,
    precioOriginal: 149990,
    descripcion: 'Botines de fútbol profesional con tecnología Primeknit para máximo rendimiento.',
    stock: 12,
    rating: 4.9,
    reviewCount: 89,
    nuevo: true,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '3',
    nombre: 'Zapatillas Converse Chuck 70',
    marca: 'converse',
    categoria: 'Calzado',
    precio: 69990,
    precioOriginal: null,
    descripcion: 'Clásicas zapatillas de lona con diseño atemporal y comodidad excepcional.',
    stock: 18,
    rating: 4.6,
    reviewCount: 203,
    nuevo: false,
    oferta: false,
    imagen: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '25',
    nombre: 'Zapatillas Running Asics Gel-Kayano 30',
    marca: 'asics',
    categoria: 'Calzado',
    precio: 139990,
    precioOriginal: 159990,
    descripcion: 'Zapatillas de running con tecnología GEL para máxima amortiguación y estabilidad.',
    stock: 16,
    rating: 4.7,
    reviewCount: 156,
    nuevo: true,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '26',
    nombre: 'Botas Dr. Martens 1460',
    marca: 'dr-martens',
    categoria: 'Calzado',
    precio: 179990,
    precioOriginal: null,
    descripcion: 'Icónicas botas Dr. Martens de cuero genuino con suela AirWair resistente.',
    stock: 14,
    rating: 4.8,
    reviewCount: 267,
    nuevo: false,
    oferta: false,
    imagen: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5a?w=500&h=500&fit=crop&crop=center'
  },

  // TECNOLOGÍA
  {
    id: '4',
    nombre: 'iPhone 15 Pro Max 256GB',
    marca: 'apple',
    categoria: 'Tecnología',
    precio: 1299990,
    precioOriginal: 1399990,
    descripcion: 'El iPhone más avanzado con chip A17 Pro, cámara de 48MP y pantalla Super Retina XDR.',
    stock: 8,
    rating: 4.9,
    reviewCount: 456,
    nuevo: true,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '5',
    nombre: 'Samsung Galaxy S24 Ultra',
    marca: 'samsung',
    categoria: 'Tecnología',
    precio: 1199990,
    precioOriginal: null,
    descripcion: 'Smartphone flagship con S Pen integrado, cámara de 200MP y pantalla Dynamic AMOLED 2X.',
    stock: 15,
    rating: 4.7,
    reviewCount: 312,
    nuevo: true,
    oferta: false,
    imagen: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '6',
    nombre: 'MacBook Air M3 13"',
    marca: 'apple',
    categoria: 'Tecnología',
    precio: 999990,
    precioOriginal: 1149990,
    descripcion: 'Laptop ultradelgada con chip M3, pantalla Liquid Retina y hasta 18 horas de batería.',
    stock: 6,
    rating: 4.8,
    reviewCount: 178,
    nuevo: false,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '10',
    nombre: 'Audífonos Sony WH-1000XM5',
    marca: 'sony',
    categoria: 'Tecnología',
    precio: 299990,
    precioOriginal: 349990,
    descripcion: 'Audífonos inalámbricos con cancelación de ruido líder en la industria.',
    stock: 30,
    rating: 4.9,
    reviewCount: 892,
    nuevo: false,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '27',
    nombre: 'iPad Pro 12.9" M2 256GB',
    marca: 'apple',
    categoria: 'Tecnología',
    precio: 899990,
    precioOriginal: 999990,
    descripcion: 'iPad Pro con chip M2, pantalla Liquid Retina XDR y soporte para Apple Pencil de 2da generación.',
    stock: 12,
    rating: 4.8,
    reviewCount: 234,
    nuevo: true,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '28',
    nombre: 'AirPods Pro 2da Generación',
    marca: 'apple',
    categoria: 'Tecnología',
    precio: 249990,
    precioOriginal: null,
    descripcion: 'AirPods Pro con cancelación activa de ruido, audio espacial personalizado y hasta 30 horas de reproducción.',
    stock: 25,
    rating: 4.7,
    reviewCount: 567,
    nuevo: false,
    oferta: false,
    imagen: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&h=500&fit=crop&crop=center'
  },

  // ELECTRO HOGAR
  {
    id: '7',
    nombre: 'Refrigerador LG InstaView 617L',
    marca: 'lg',
    categoria: 'Electro Hogar',
    precio: 899990,
    precioOriginal: 1099990,
    descripcion: 'Refrigerador side by side con tecnología InstaView Door-in-Door y dispensador de agua.',
    stock: 4,
    rating: 4.5,
    reviewCount: 67,
    nuevo: false,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '8',
    nombre: 'Lavadora Samsung AI EcoBubble 9kg',
    marca: 'samsung',
    categoria: 'Electro Hogar',
    precio: 549990,
    precioOriginal: 649990,
    descripcion: 'Lavadora con tecnología AI que optimiza el lavado según el tipo de ropa.',
    stock: 10,
    rating: 4.6,
    reviewCount: 145,
    nuevo: true,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '9',
    nombre: 'Microondas Panasonic Inverter 32L',
    marca: 'panasonic',
    categoria: 'Electro Hogar',
    precio: 159990,
    precioOriginal: null,
    descripcion: 'Microondas con tecnología Inverter para cocción uniforme y grill superior.',
    stock: 22,
    rating: 4.4,
    reviewCount: 98,
    nuevo: false,
    oferta: false,
    imagen: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '12',
    nombre: 'Aspiradora Robot iRobot Roomba j7+',
    marca: 'irobot',
    categoria: 'Electro Hogar',
    precio: 699990,
    precioOriginal: 799990,
    descripcion: 'Robot aspiradora inteligente con autovaciado y evita obstáculos con IA.',
    stock: 7,
    rating: 4.6,
    reviewCount: 234,
    nuevo: true,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '29',
    nombre: 'Smart TV Samsung 65" QLED 4K',
    marca: 'samsung',
    categoria: 'Electro Hogar',
    precio: 899990,
    precioOriginal: 1199990,
    descripcion: 'Smart TV Samsung QLED 4K con tecnología Quantum Dot, Tizen OS y HDR10+.',
    stock: 15,
    rating: 4.7,
    reviewCount: 189,
    nuevo: false,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop&crop=center'
  },

  // MODA HOMBRE
  {
    id: '30',
    nombre: 'Polera Tommy Hilfiger Classic Fit',
    marca: 'tommy-hilfiger',
    categoria: 'Moda',
    precio: 35990,
    precioOriginal: 45990,
    descripcion: 'Polera Tommy Hilfiger 100% algodón, corte clásico, cuello redondo y logo bordado.',
    stock: 25,
    rating: 4.3,
    reviewCount: 156,
    nuevo: false,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '31',
    nombre: 'Jeans Levi\'s 511 Slim Fit',
    marca: 'levis',
    categoria: 'Moda',
    precio: 59990,
    precioOriginal: null,
    descripcion: 'Jeans Levi\'s 511 corte slim, mezclilla de algodón con elastano, cinco bolsillos clásicos.',
    stock: 18,
    rating: 4.5,
    reviewCount: 298,
    nuevo: false,
    oferta: false,
    imagen: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '32',
    nombre: 'Chaqueta North Face Venture 2',
    marca: 'north-face',
    categoria: 'Moda',
    precio: 89990,
    precioOriginal: 109990,
    descripcion: 'Chaqueta impermeable The North Face con tecnología DryVent y capucha ajustable.',
    stock: 12,
    rating: 4.6,
    reviewCount: 124,
    nuevo: true,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&crop=center'
  },

  // MODA MUJER
  {
    id: '33',
    nombre: 'Vestido Midi Floral ZARA',
    marca: 'zara',
    categoria: 'Moda',
    precio: 45990,
    precioOriginal: null,
    descripcion: 'Vestido midi con estampado floral, corte en A, manga corta y cierre posterior con cremallera.',
    stock: 15,
    rating: 4.4,
    reviewCount: 89,
    nuevo: true,
    oferta: false,
    imagen: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '34',
    nombre: 'Cartera Michael Kors Jet Set',
    marca: 'michael-kors',
    categoria: 'Moda',
    precio: 129990,
    precioOriginal: 149990,
    descripcion: 'Cartera Michael Kors en cuero saffiano, con múltiples compartimentos y logo dorado.',
    stock: 12,
    rating: 4.7,
    reviewCount: 167,
    nuevo: false,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '35',
    nombre: 'Zapatillas Nike Air Force 1 Mujer',
    marca: 'nike',
    categoria: 'Calzado',
    precio: 79990,
    precioOriginal: 99990,
    descripcion: 'Icónicas zapatillas Nike Air Force 1 con upper de cuero y suela de goma clásica.',
    stock: 22,
    rating: 4.8,
    reviewCount: 345,
    nuevo: false,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&h=500&fit=crop&crop=center'
  },

  // HOGAR Y DECORACIÓN
  {
    id: '36',
    nombre: 'Sofá Modular Gris 3 Cuerpos',
    marca: 'homy',
    categoria: 'Hogar',
    precio: 499990,
    precioOriginal: 599990,
    descripcion: 'Sofá modular tapizado en tela gris, estructura de madera maciza, cojines desmontables.',
    stock: 5,
    rating: 4.5,
    reviewCount: 78,
    nuevo: true,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '37',
    nombre: 'Juego Sábanas Algodón 300 Hilos',
    marca: 'cannon',
    categoria: 'Hogar',
    precio: 79990,
    precioOriginal: null,
    descripcion: 'Juego de sábanas en algodón percal 300 hilos, incluye sábana ajustable, encimera y fundas.',
    stock: 40,
    rating: 4.3,
    reviewCount: 234,
    nuevo: false,
    oferta: false,
    imagen: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '38',
    nombre: 'Lámpara de Pie Moderna',
    marca: 'ilumina',
    categoria: 'Hogar',
    precio: 149990,
    precioOriginal: 179990,
    descripcion: 'Lámpara de pie con base de metal dorado, pantalla de tela blanca, ideal para living.',
    stock: 15,
    rating: 4.6,
    reviewCount: 92,
    nuevo: true,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=center'
  },

  // DEPORTES Y FITNESS
  {
    id: '39',
    nombre: 'Bicicleta Trek Mountain Bike',
    marca: 'trek',
    categoria: 'Deportes',
    precio: 599990,
    precioOriginal: 699990,
    descripcion: 'Bicicleta de montaña Trek con marco de aluminio, suspensión delantera, 21 velocidades.',
    stock: 8,
    rating: 4.7,
    reviewCount: 123,
    nuevo: true,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1544191696-15693df71b5b?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '40',
    nombre: 'Set Mancuernas Ajustables',
    marca: 'bowflex',
    categoria: 'Deportes',
    precio: 199990,
    precioOriginal: null,
    descripcion: 'Set de mancuernas ajustables con sistema de selección rápida, incluye base.',
    stock: 12,
    rating: 4.8,
    reviewCount: 89,
    nuevo: false,
    oferta: false,
    imagen: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop&crop=center'
  },

  // BELLEZA Y CUIDADO
  {
    id: '41',
    nombre: 'Perfume Chanel N°5 100ml',
    marca: 'chanel',
    categoria: 'Belleza',
    precio: 189990,
    precioOriginal: 219990,
    descripcion: 'Perfume Chanel N°5, fragancia floral aldehídica icónica, frasco de 100ml.',
    stock: 10,
    rating: 4.9,
    reviewCount: 245,
    nuevo: false,
    oferta: true,
    imagen: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop&crop=center'
  },
  {
    id: '42',
    nombre: 'Kit Skincare The Ordinary',
    marca: 'the-ordinary',
    categoria: 'Belleza',
    precio: 69990,
    precioOriginal: null,
    descripcion: 'Kit de skincare: limpiador, ácido hialurónico, niacinamida y crema hidratante.',
    stock: 25,
    rating: 4.6,
    reviewCount: 178,
    nuevo: true,
    oferta: false,
    imagen: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&h=500&fit=crop&crop=center'
  }
];

export const mockProducts = baseMockProducts.map((product, index) => ({
  ...product,
  sku: (product as any).sku || `SKU-${String(index + 1).padStart(5, '0')}`,
}));

export const heroSlides = [
  {
    id: 1,
    title: "Gran Liquidación Tecnología",
    subtitle: "Hasta 40% de descuento en smartphones y laptops",
    ctaText: "Ver Ofertas",
    ctaLink: "/?category=tecnologia&filter=ofertas",
    badge: "40% DCTO",
    gradient: "from-blue-600 to-purple-700"
  },
  {
    id: 2,
    title: "Nueva Colección Calzado",
    subtitle: "Las mejores marcas deportivas para esta temporada",
    ctaText: "Descubrir",
    ctaLink: "/?category=calzado",
    badge: "NUEVO",
    gradient: "from-orange-500 to-red-600"
  },
  {
    id: 3,
    title: "Electrohogar Inteligente",
    subtitle: "Transforma tu hogar con la última tecnología",
    ctaText: "Explorar",
    ctaLink: "/?category=electrohogar",
    badge: "SMART HOME",
    gradient: "from-green-500 to-teal-600"
  },
  {
    id: 4,
    title: "Black Friday Anticipado",
    subtitle: "Los mejores precios del año en todos los productos",
    ctaText: "Comprar Ahora",
    ctaLink: "/?filter=ofertas",
    badge: "BLACK FRIDAY",
    gradient: "from-gray-800 to-gray-900"
  }
];

export const categoryBanners = {
  calzado: [
    {
      id: 1,
      title: "Nike Air Max",
      subtitle: "Comodidad y estilo",
      image: null,
      gradient: "from-gray-800 to-black"
    },
    {
      id: 2,
      title: "Adidas Boost",
      subtitle: "Energía infinita",
      image: null,
      gradient: "from-blue-600 to-indigo-700"
    },
    {
      id: 3,
      title: "Running Collection",
      subtitle: "Para corredores",
      image: null,
      gradient: "from-green-500 to-emerald-600"
    }
  ],
  tecnologia: [
    {
      id: 1,
      title: "iPhone 15 Series",
      subtitle: "Innovación sin límites",
      image: null,
      gradient: "from-gray-700 to-gray-900"
    },
    {
      id: 2,
      title: "Gaming Setup",
      subtitle: "Para gamers pro",
      image: null,
      gradient: "from-purple-600 to-pink-600"
    },
    {
      id: 3,
      title: "Audio Premium",
      subtitle: "Sonido de calidad",
      image: null,
      gradient: "from-indigo-600 to-blue-700"
    }
  ],
  electrohogar: [
    {
      id: 1,
      title: "Smart Kitchen",
      subtitle: "Cocina inteligente",
      image: null,
      gradient: "from-orange-500 to-red-500"
    },
    {
      id: 2,
      title: "Clean Tech",
      subtitle: "Limpieza automática",
      image: null,
      gradient: "from-teal-500 to-cyan-600"
    },
    {
      id: 3,
      title: "Energy Efficient",
      subtitle: "Ahorro garantizado",
      image: null,
      gradient: "from-green-600 to-lime-600"
    }
  ]
};
