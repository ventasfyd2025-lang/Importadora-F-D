'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSalesReports } from '@/hooks/useSalesReports';
import { DailySalesReport, MonthlySalesReport } from '@/types/reports';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  TrophyIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

export default function SalesReportsComponent() {
  const { 
    loading, 
    error, 
    generateDailyReport, 
    getDailyReport, 
    generateMonthlyReport,
    getReportsInRange 
  } = useSalesReports();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dailyReport, setDailyReport] = useState<DailySalesReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlySalesReport | null>(null);
  const [recentReports, setRecentReports] = useState<DailySalesReport[]>([]);

  // Cargar reporte diario
  const loadDailyReport = useCallback(async (date: string) => {
    try {
      let report = await getDailyReport(date);
      if (!report) {
        report = await generateDailyReport(date);
      }
      setDailyReport(report);
    } catch (error) {
      console.error('Error cargando reporte diario:', error);
    }
  }, [getDailyReport, generateDailyReport]);

  // Cargar reporte mensual
  const loadMonthlyReport = useCallback(async (month: string) => {
    try {
      const report = await generateMonthlyReport(month);
      setMonthlyReport(report);
    } catch (error) {
      console.error('Error cargando reporte mensual:', error);
    }
  }, [generateMonthlyReport]);

  // Cargar reportes recientes
  const loadRecentReports = useCallback(async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const reports = await getReportsInRange(startDate, endDate);
      setRecentReports(reports);
    } catch (error) {
      console.error('Error cargando reportes recientes:', error);
    }
  }, [getReportsInRange]);

  // Generar reporte PDF
  const generatePDF = async () => {
    if (!monthlyReport) {
      alert('No hay reporte mensual disponible para generar PDF');
      return;
    }

    try {
      // Dynamic import para reducir bundle size
      const { generateMonthlySalesPDF } = await import('@/utils/pdfGenerator');
      generateMonthlySalesPDF(monthlyReport);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor intenta nuevamente.');
    }
  };

  useEffect(() => {
    loadDailyReport(selectedDate);
    loadRecentReports();
  }, [selectedDate, loadDailyReport, loadRecentReports]);

  useEffect(() => {
    if (selectedMonth) {
      loadMonthlyReport(selectedMonth);
    }
  }, [selectedMonth, loadMonthlyReport]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header Mejorado */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 rounded-xl shadow-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <ChartBarIcon className="h-10 w-10 mr-3" />
              Dashboard de Ventas
            </h1>
            <p className="text-orange-100 mt-2 text-lg">Resumen ejecutivo de tu negocio</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-orange-100 text-sm">Última actualización</p>
              <p className="text-white font-medium">{new Date().toLocaleDateString('es-CL')}</p>
            </div>
            <button
              onClick={generatePDF}
              disabled={!monthlyReport}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg transition-all"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <span className="ml-4 text-lg text-gray-600">Cargando datos...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-6 rounded-lg mb-8">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium">Error al cargar reportes</h3>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas Principales - Resumen Ejecutivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dailyReport && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${dailyReport.totalRevenue.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pedidos Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{dailyReport.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${dailyReport.totalOrders > 0 ? Math.round(dailyReport.totalRevenue / dailyReport.totalOrders).toLocaleString('es-CL') : '0'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {monthlyReport && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <CalendarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${monthlyReport.totalRevenue.toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controles de Fecha Simplificados */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <ClockIcon className="h-6 w-6 mr-2 text-gray-600" />
          Período de Análisis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Reporte Diario
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Reporte Mensual
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Top Productos - Información Clave */}
      {dailyReport && dailyReport.topProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <TrophyIcon className="h-6 w-6 mr-2 text-yellow-500" />
            🏆 Productos Estrella del Día
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyReport.topProducts.slice(0, 6).map((product, index) => (
              <div key={product.productId} className={`p-4 rounded-lg border-l-4 ${
                index === 0 ? 'bg-yellow-50 border-yellow-400' :
                index === 1 ? 'bg-gray-50 border-gray-400' :
                index === 2 ? 'bg-orange-50 border-orange-400' :
                'bg-blue-50 border-blue-400'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <span className={`text-lg font-bold mr-2 ${
                        index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-600' :
                        index === 2 ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        #{index + 1}
                      </span>
                      <p className="font-semibold text-gray-900">{product.productName}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {product.quantity} vendidos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${product.revenue.toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métodos de Pago - Información Simple */}
      {dailyReport && dailyReport.paymentMethods.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <CreditCardIcon className="h-6 w-6 mr-2 text-green-500" />
            💳 Métodos de Pago del Día
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dailyReport.paymentMethods.map((method) => (
              <div key={method.method} className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center">
                  <p className="font-semibold text-gray-900 text-lg">{method.method}</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    ${method.amount.toLocaleString('es-CL')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {method.count} transacciones
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen Mensual Simplificado */}
      {monthlyReport && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-indigo-500" />
            📈 Resumen del Mes - {monthlyReport.month}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Ingresos</p>
              <p className="text-2xl font-bold text-indigo-600">
                ${monthlyReport.totalRevenue.toLocaleString('es-CL')}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Pedidos</p>
              <p className="text-2xl font-bold text-blue-600">{monthlyReport.totalOrders}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold text-green-600">
                ${Math.round(monthlyReport.avgOrderValue).toLocaleString('es-CL')}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Días con Ventas</p>
              <p className="text-2xl font-bold text-purple-600">{monthlyReport.dailyReports.length}</p>
            </div>
          </div>

          {/* Top 5 Productos del Mes */}
          {monthlyReport.topProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">🏅 Top 5 Productos del Mes</h3>
              <div className="space-y-3">
                {monthlyReport.topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <span className={`text-lg font-bold mr-4 w-8 h-8 rounded-full flex items-center justify-center text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-500' :
                        index === 2 ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{product.productName}</p>
                        <p className="text-sm text-gray-600">{product.quantity} vendidos • {product.category}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      ${product.revenue.toLocaleString('es-CL')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}