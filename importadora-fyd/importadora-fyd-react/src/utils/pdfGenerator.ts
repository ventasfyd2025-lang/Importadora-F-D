import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlySalesReport } from '@/types/reports';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateMonthlySalesPDF(report: MonthlySalesReport) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(234, 88, 12); // Orange color
  doc.text('IMPORTADORA F&D', 20, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Reporte de Ventas Mensual', 20, 35);
  
  doc.setFontSize(12);
  doc.text(`Período: ${formatMonth(report.month)}`, 20, 45);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CL')}`, 20, 55);
  
  // Summary statistics
  doc.setFontSize(14);
  doc.text('Resumen Ejecutivo', 20, 75);
  
  const summaryData = [
    ['Ingresos Totales', `$${report.totalRevenue.toLocaleString('es-CL')}`],
    ['Pedidos Totales', report.totalOrders.toString()],
    ['Valor Promedio por Pedido', `$${Math.round(report.avgOrderValue).toLocaleString('es-CL')}`],
    ['Días con Ventas', report.dailyReports.length.toString()]
  ];
  
  autoTable(doc, {
    head: [['Métrica', 'Valor']],
    body: summaryData,
    startY: 85,
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12] },
    margin: { left: 20, right: 20 }
  });
  
  // Top products table
  const finalY = (doc as any).lastAutoTable.finalY || 140;
  
  doc.setFontSize(14);
  doc.text('Top 10 Productos Más Vendidos', 20, finalY + 20);
  
  const productData = report.topProducts.slice(0, 10).map((product, index) => [
    (index + 1).toString(),
    product.productName,
    product.quantity.toString(),
    `$${product.revenue.toLocaleString('es-CL')}`,
    product.category
  ]);
  
  autoTable(doc, {
    head: [['#', 'Producto', 'Cantidad', 'Ingresos', 'Categoría']],
    body: productData,
    startY: finalY + 30,
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 10 }
  });
  
  // Payment methods (if there's space, otherwise add new page)
  const productTableY = (doc as any).lastAutoTable.finalY || 200;
  
  if (productTableY > 240) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Métodos de Pago', 20, 30);
    
    const paymentData = report.paymentMethodsBreakdown.map(method => [
      method.method,
      method.count.toString(),
      `$${method.amount.toLocaleString('es-CL')}`,
      `${((method.amount / report.totalRevenue) * 100).toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      head: [['Método', 'Transacciones', 'Monto', '% del Total']],
      body: paymentData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] },
      margin: { left: 20, right: 20 }
    });
  } else {
    doc.setFontSize(14);
    doc.text('Métodos de Pago', 20, productTableY + 20);
    
    const paymentData = report.paymentMethodsBreakdown.map(method => [
      method.method,
      method.count.toString(),
      `$${method.amount.toLocaleString('es-CL')}`,
      `${((method.amount / report.totalRevenue) * 100).toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      head: [['Método', 'Transacciones', 'Monto', '% del Total']],
      body: paymentData,
      startY: productTableY + 30,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] },
      margin: { left: 20, right: 20 }
    });
  }
  
  // Daily breakdown on new page
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Resumen Diario', 20, 30);
  
  const dailyData = report.dailyReports.map(daily => [
    formatDate(daily.date),
    daily.totalOrders.toString(),
    `$${daily.totalRevenue.toLocaleString('es-CL')}`,
    daily.totalOrders > 0 ? `$${Math.round(daily.totalRevenue / daily.totalOrders).toLocaleString('es-CL')}` : '$0'
  ]);
  
  autoTable(doc, {
    head: [['Fecha', 'Pedidos', 'Ingresos', 'Promedio']],
    body: dailyData,
    startY: 40,
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 10 }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Página ${i} de ${pageCount}`, 20, doc.internal.pageSize.height - 10);
    doc.text('Importadora F&D - Reporte Confidencial', doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 10);
  }
  
  // Save the PDF
  const fileName = `reporte_ventas_${report.month.replace('-', '_')}.pdf`;
  doc.save(fileName);
}

function formatMonth(monthString: string): string {
  const [year, month] = monthString.split('-');
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}