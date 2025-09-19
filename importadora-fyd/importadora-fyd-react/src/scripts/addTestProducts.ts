import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const testProducts = [
  {
    nombre: 'Smartphone Samsung Galaxy A54',
    precio: 299990,
    descripcion: 'Smartphone con pantalla de 6.4" Super AMOLED, cámara triple de 50MP y batería de 5000mAh',
    imagen: 'https://images.samsung.com/is/image/samsung/p6pim/cl/2302/gallery/cl-galaxy-a54-5g-sm-a546-sm-a546ezklltc-534845094',
    stock: 15,
    categoria: 'electronicos',
    nuevo: true,
    oferta: false,
    activo: true,
    fechaCreacion: new Date().toISOString()
  },
  {
    nombre: 'Auriculares Sony WH-CH720N',
    precio: 159990,
    descripcion: 'Auriculares inalámbricos con cancelación de ruido, hasta 35 horas de batería',
    imagen: 'https://www.sony.cl/image/5d02da5df552836db894cad34f4d8e2c?fmt=pjpeg&wid=330&bgcolor=FFFFFF&bgc=FFFFFF',
    stock: 8,
    categoria: 'electronicos',
    nuevo: false,
    oferta: true,
    activo: true,
    fechaCreacion: new Date().toISOString()
  },
  {
    nombre: 'Cafetera Nespresso Essenza Mini',
    precio: 89990,
    descripcion: 'Cafetera compacta para cápsulas Nespresso, ideal para espacios pequeños',
    imagen: 'https://www.nespresso.com/shared_res/agility/global/images/products/machines/essenza-mini/essenza-mini-black.png',
    stock: 12,
    categoria: 'hogar',
    nuevo: false,
    oferta: false,
    activo: true,
    fechaCreacion: new Date().toISOString()
  },
  {
    nombre: 'Zapatillas Nike Air Max 270',
    precio: 129990,
    descripcion: 'Zapatillas deportivas con tecnología Air Max para máxima comodidad',
    imagen: 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/awjogtdnqxniqqk0wpgf/air-max-270-shoes-9B2pSM.png',
    stock: 20,
    categoria: 'deportes',
    nuevo: true,
    oferta: true,
    activo: true,
    fechaCreacion: new Date().toISOString()
  },
  {
    nombre: 'Polera Básica Uniqlo',
    precio: 12990,
    descripcion: 'Polera de algodón 100%, corte regular, disponible en varios colores',
    imagen: 'https://www.uniqlo.com/jp/api/cloudfronturl/images/goods/422990/item/09_422990.jpg',
    stock: 50,
    categoria: 'ropa',
    nuevo: false,
    oferta: false,
    activo: true,
    fechaCreacion: new Date().toISOString()
  }
];

export async function addTestProducts() {
  try {
    for (const product of testProducts) {
      const docRef = await addDoc(collection(db, 'products'), product);
    }
  } catch (error) {
    // Error adding test products
  }
}

// Run this function when this file is executed directly
if (typeof window === 'undefined') {
  addTestProducts();
}