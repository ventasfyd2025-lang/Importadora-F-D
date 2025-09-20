'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

export default function SeedPage() {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const updateProducts = async () => {
    setStatus('loading');
    try {
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      
      if (productsSnapshot.empty) {
        setStatus('error');
        console.error("No products found to update.");
        return;
      }

      const batch = writeBatch(db);

      productsSnapshot.forEach(doc => {
        const productRef = doc.ref;
        batch.update(productRef, { 
          precio: 500,
          envioGratis: true
        });
      });

      await batch.commit();
      setStatus('success');

    } catch (error) {
      console.error("Error updating products: ", error);
      setStatus('error');
    }
  };

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Actualización de Productos</h1>
      <p className="mb-4">Haz clic en el botón para actualizar todos los productos a un precio de 500 y con envío gratis.</p>
      
      <button 
        onClick={updateProducts}
        disabled={status === 'loading'}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
      >
        {status === 'loading' ? 'Actualizando...' : 'Actualizar Productos'}
      </button>

      {status === 'success' && (
        <p className="text-green-500 mt-4">¡Productos actualizados correctamente!</p>
      )}
      {status === 'error' && (
        <p className="text-red-500 mt-4">Hubo un error al actualizar los productos. Revisa la consola.</p>
      )}
    </div>
  );
}