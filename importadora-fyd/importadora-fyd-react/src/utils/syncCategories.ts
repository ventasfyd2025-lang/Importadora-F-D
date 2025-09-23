import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Icon mapping for categories
const categoryIcons: Record<string, string> = {
  'calzado': '👟',
  'tecnología': '💻',
  'electro hogar': '🏠',
  'electrohogar': '🏠',
  'moda': '👕',
  'hogar': '🏠',
  'ropa': '👕',
  'deportes': '🏃‍♂️',
  'fitness': '🏃‍♂️',
  'cocina': '🍳',
  'muebles': '🪑',
  'belleza': '💄',
  'libros': '📚',
  'juguetes': '🧸',
  'musica': '🎵',
  'automovil': '🚗',
  'jardin': '🌱',
  'tecnologia': '💻'
};

export async function syncCategoriesToFirebase() {
  try {
    console.log('🔄 Iniciando sincronización de categorías...');

    // Obtener todos los productos para extraer las categorías únicas
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const categories = new Set<string>();

    productsSnapshot.forEach((doc) => {
      const product = doc.data();
      if (product.categoria) {
        categories.add(product.categoria);
      }
    });

    console.log('📦 Categorías encontradas en productos:', Array.from(categories));

    // Verificar qué categorías ya existen en Firebase
    const categoriasSnapshot = await getDocs(collection(db, 'categorias'));
    const existingCategories = new Set<string>();
    
    categoriasSnapshot.forEach((doc) => {
      existingCategories.add(doc.id);
    });

    console.log('🔥 Categorías existentes en Firebase:', Array.from(existingCategories));

    // Sincronizar categorías
    const syncPromises = Array.from(categories).map(async (categoryName) => {
      const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
      
      // Solo crear la categoría si no existe
      if (!existingCategories.has(categoryId)) {
        const categoryData = {
          name: categoryName,
          nombre: categoryName,
          active: true,
          activa: true,
          icon: categoryIcons[categoryName.toLowerCase()] || '📦',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await setDoc(doc(db, 'categorias', categoryId), categoryData);
        console.log(`✅ Categoría creada: ${categoryName} (${categoryId})`);
      } else {
        console.log(`ℹ️ Categoría ya existe: ${categoryName} (${categoryId})`);
      }
    });

    await Promise.all(syncPromises);
    console.log('🎉 Sincronización de categorías completada');

    return {
      success: true,
      message: `Sincronización completada. ${categories.size} categorías procesadas.`
    };

  } catch (error) {
    console.error('❌ Error sincronizando categorías:', error);
    return {
      success: false,
      message: `Error: ${error}`
    };
  }
}

// También crear una función para agregar categorías manualmente
export async function addCategory(name: string, active: boolean = true) {
  try {
    const categoryId = name.toLowerCase().replace(/\s+/g, '-');
    
    const categoryData = {
      name: name,
      nombre: name,
      active: active,
      activa: active,
      icon: categoryIcons[name.toLowerCase()] || '📦',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'categorias', categoryId), categoryData);
    console.log(`✅ Categoría agregada: ${name}`);
    
    return { success: true, message: `Categoría "${name}" agregada correctamente` };
  } catch (error) {
    console.error('❌ Error agregando categoría:', error);
    return { success: false, message: `Error: ${error}` };
  }
}