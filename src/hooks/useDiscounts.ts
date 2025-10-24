'use client';

import { useCallback, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  getFirestore,
} from 'firebase/firestore';
import type { Discount, DiscountValidation } from '@/types';

export const useDiscounts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore();

  /**
   * Valida un código de descuento
   * Verifica: existencia, vigencia, estado activo
   */
  const validateDiscount = useCallback(
    async (codigo: string): Promise<DiscountValidation> => {
      try {
        setLoading(true);
        setError(null);

        // Normalizar código (mayúsculas)
        const codigoNormalizado = codigo.trim().toUpperCase();

        if (!codigoNormalizado) {
          return {
            valido: false,
            mensaje: 'Por favor ingresa un código de descuento',
          };
        }

        // Buscar descuento por código
        const q = query(
          collection(db, 'discounts'),
          where('codigo', '==', codigoNormalizado)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          return {
            valido: false,
            mensaje: 'Código inválido',
          };
        }

        const descuento = snapshot.docs[0].data() as Discount;
        const docId = snapshot.docs[0].id;

        // Validar que esté activo
        if (!descuento.activo) {
          return {
            valido: false,
            mensaje: 'Código inválido',
          };
        }

        // Validar vigencia (fecha inicio y fin)
        const ahora = new Date();
        const fechaInicio = new Date(descuento.fechaInicio);
        const fechaFin = new Date(descuento.fechaFin);

        if (ahora < fechaInicio || ahora > fechaFin) {
          return {
            valido: false,
            mensaje: 'Código expirado',
          };
        }

        return {
          valido: true,
          mensaje: 'Código válido',
          descuento: {
            ...descuento,
            id: docId,
          },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al validar código';
        setError(message);
        return {
          valido: false,
          mensaje: 'Error al validar código',
        };
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  /**
   * Calcula el descuento a aplicar en un producto específico
   */
  const calculateDiscount = useCallback(
    (
      productId: string,
      precioOriginal: number,
      descuento: Discount
    ): { montoDescuento: number; precioFinal: number } => {
      // Verificar si el producto está en los aplicables
      if (!descuento.productosAplicables.includes(productId)) {
        return { montoDescuento: 0, precioFinal: precioOriginal };
      }

      let montoDescuento = 0;

      if (descuento.tipo === 'porcentaje') {
        montoDescuento = (precioOriginal * descuento.descuento) / 100;
      } else if (descuento.tipo === 'fijo') {
        montoDescuento = descuento.descuento;
      }

      // Asegurar que no reste más de lo que cuesta
      montoDescuento = Math.min(montoDescuento, precioOriginal);

      return {
        montoDescuento,
        precioFinal: Math.max(0, precioOriginal - montoDescuento),
      };
    },
    []
  );

  /**
   * Obtiene todos los descuentos activos y vigentes (para admin)
   */
  const getActiveDiscounts = useCallback(async (): Promise<Discount[]> => {
    try {
      setLoading(true);
      setError(null);

      const ahora = new Date();

      const q = query(
        collection(db, 'discounts'),
        where('activo', '==', true)
      );

      const snapshot = await getDocs(q);
      const descuentos: Discount[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as Discount;
        const fechaFin = new Date(data.fechaFin);

        // Solo retornar descuentos no expirados
        if (ahora <= fechaFin) {
          descuentos.push({
            ...data,
            id: doc.id,
          });
        }
      });

      return descuentos;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener descuentos';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [db]);

  return {
    validateDiscount,
    calculateDiscount,
    getActiveDiscounts,
    loading,
    error,
  };
};
