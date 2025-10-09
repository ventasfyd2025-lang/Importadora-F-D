'use client';

import { useState, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DailySalesReport, MonthlySalesReport, ProductSale, PaymentMethodSummary } from '@/types/reports';

export function useSalesReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generar reporte diario basado en pedidos del día
  const generateDailyReport = useCallback(async (date: string = new Date().toISOString().split('T')[0]) => {
    try {
      setLoading(true);
      setError(null);

      // Usar la función utilitaria
      // const { generateDailyReportUtil } = await import('@/utils/reportUtils');
      // const dailyReport = await generateDailyReportUtil(date);
      const dailyReport = null;

      return dailyReport;
    } catch (error) {
      setError('Error generando reporte diario');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener reporte diario
  const getDailyReport = useCallback(async (date: string) => {
    try {
      const reportDoc = await getDoc(doc(db, 'daily_reports', `daily_${date}`));
      if (reportDoc.exists()) {
        return reportDoc.data() as DailySalesReport;
      }
      return null;
    } catch (error) {
      setError('Error obteniendo reporte diario');
      throw error;
    }
  }, []);

  // Generar reporte mensual
  const generateMonthlyReport = useCallback(async (month: string) => {
    try {
      setLoading(true);
      setError(null);

      const startDate = `${month}-01`;
      const endDate = new Date(new Date(month).getFullYear(), new Date(month).getMonth() + 1, 0)
        .toISOString().split('T')[0];

      // Obtener reportes diarios del mes
      const dailyReportsQuery = query(
        collection(db, 'daily_reports'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date')
      );

      const dailyReportsSnapshot = await getDocs(dailyReportsQuery);
      const dailyReports = dailyReportsSnapshot.docs.map(doc => doc.data()) as DailySalesReport[];

      // Calcular estadísticas mensuales
      const totalRevenue = dailyReports.reduce((sum, report) => sum + report.totalRevenue, 0);
      const totalOrders = dailyReports.reduce((sum, report) => sum + report.totalOrders, 0);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Agregar productos del mes
      const monthlyProducts: { [key: string]: ProductSale } = {};
      const monthlyPaymentMethods: { [key: string]: PaymentMethodSummary } = {};

      dailyReports.forEach(report => {
        report.topProducts.forEach(product => {
          if (!monthlyProducts[product.productId]) {
            monthlyProducts[product.productId] = { ...product };
          } else {
            monthlyProducts[product.productId].quantity += product.quantity;
            monthlyProducts[product.productId].revenue += product.revenue;
          }
        });

        report.paymentMethods.forEach(payment => {
          if (!monthlyPaymentMethods[payment.method]) {
            monthlyPaymentMethods[payment.method] = { ...payment };
          } else {
            monthlyPaymentMethods[payment.method].count += payment.count;
            monthlyPaymentMethods[payment.method].amount += payment.amount;
          }
        });
      });

      const topProducts = Object.values(monthlyProducts)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 20);

      const paymentMethodsBreakdown = Object.values(monthlyPaymentMethods);

      const monthlyReport: MonthlySalesReport = {
        month,
        totalRevenue,
        totalOrders,
        avgOrderValue,
        dailyReports,
        topProducts,
        paymentMethodsBreakdown
      };

      return monthlyReport;
    } catch (error) {
      setError('Error generando reporte mensual');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener reportes de un rango de fechas
  const getReportsInRange = useCallback(async (startDate: string, endDate: string) => {
    try {
      const reportsQuery = query(
        collection(db, 'daily_reports'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date')
      );

      const snapshot = await getDocs(reportsQuery);
      return snapshot.docs.map(doc => doc.data()) as DailySalesReport[];
    } catch (error) {
      setError('Error obteniendo reportes');
      throw error;
    }
  }, []);

  return {
    loading,
    error,
    generateDailyReport,
    getDailyReport,
    generateMonthlyReport,
    getReportsInRange
  };
}