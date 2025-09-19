'use client';

import { useState } from 'react';
import Link from 'next/link';
import { seedProducts } from '@/utils/seedProducts';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    setLoading(true);
    setMessage('');
    
    const result = await seedProducts();
    
    if (result.success) {
      setMessage('✅ Productos agregados exitosamente!');
    } else {
      setMessage(`❌ Error: ${result.error}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🌱 Poblar Base de Datos
          </h1>
          <p className="text-gray-600 mb-6">
            Haz clic en el botón para agregar productos de prueba a Firebase
          </p>
          
          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Agregando productos...' : 'Agregar Productos de Prueba'}
          </button>
          
          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}
          
          <div className="mt-6">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}