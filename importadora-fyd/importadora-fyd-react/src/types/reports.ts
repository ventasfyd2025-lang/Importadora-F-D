// Tipos para el sistema de reportes de ventas

export interface DailySalesReport {
  id: string;
  date: string; // YYYY-MM-DD format
  totalSales: number;
  totalOrders: number;
  totalRevenue: number;
  topProducts: ProductSale[];
  paymentMethods: PaymentMethodSummary[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSale {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  category: string;
}

export interface PaymentMethodSummary {
  method: string;
  count: number;
  amount: number;
}

export interface MonthlySalesReport {
  month: string; // YYYY-MM format
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  dailyReports: DailySalesReport[];
  topProducts: ProductSale[];
  paymentMethodsBreakdown: PaymentMethodSummary[];
  growthPercentage?: number;
}

export interface SalesFilters {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  category?: string;
}