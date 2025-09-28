import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DailySalesReport, ProductSale, PaymentMethodSummary } from '@/types/reports';

// Función utilitaria para generar reporte diario (sin usar hooks)
export async function generateDailyReportUtil(date: string = new Date().toISOString().split('T')[0]) {
  try {
    // Obtener pedidos del día específico
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', new Date(date + 'T00:00:00')),
      where('createdAt', '<=', new Date(date + 'T23:59:59'))
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filtrar pedidos que cuentan como ventas (excluir pending y cancelled)
    const orders = allOrders.filter(order =>
      (order as any).status &&
      !['pending', 'cancelled'].includes((order as any).status.toLowerCase())
    );

    // Calcular estadísticas
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + ((order as any).total || 0), 0);
    
    // Calcular productos más vendidos
    const productSales: { [key: string]: ProductSale } = {};
    const paymentMethods: { [key: string]: PaymentMethodSummary } = {};

    orders.forEach(order => {
      // Procesar productos
      ((order as any).items || []).forEach((item: any) => {
        const key = item.productId || item.id;
        if (!productSales[key]) {
          productSales[key] = {
            productId: key,
            productName: item.name || item.title,
            quantity: 0,
            revenue: 0,
            category: item.category || 'Sin categoría'
          };
        }
        productSales[key].quantity += item.quantity || 1;
        productSales[key].revenue += (item.price || 0) * (item.quantity || 1);
      });

      // Procesar métodos de pago
      const method = (order as any).paymentMethod || 'No especificado';
      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          method,
          count: 0,
          amount: 0
        };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].amount += (order as any).total || 0;
    });

    // Convertir a arrays y ordenar
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const paymentMethodsArray = Object.values(paymentMethods);

    // Crear reporte diario
    const dailyReport: DailySalesReport = {
      id: `daily_${date}`,
      date,
      totalSales: totalOrders,
      totalOrders,
      totalRevenue,
      topProducts,
      paymentMethods: paymentMethodsArray,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Guardar en Firestore
    await setDoc(doc(db, 'daily_reports', dailyReport.id), dailyReport);

    // console.log(`✅ Reporte diario generado para ${date}: ${totalOrders} pedidos, $${totalRevenue.toLocaleString('es-CL')}`);
    
    return dailyReport;
  } catch (error) {
    console.error('Error generando reporte diario:', error);
    throw error;
  }
}