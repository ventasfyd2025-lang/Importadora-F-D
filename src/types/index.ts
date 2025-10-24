export interface Product {
  id: string;
  sku?: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  imagen?: string; // Primera imagen (por compatibilidad)
  imagenes?: string[]; // Todas las imágenes del producto
  stock: number;
  minStock?: number; // Minimum stock threshold for alerts
  categoria: string; // Primary category (for backwards compatibility)
  categorias?: string[]; // Multiple categories support
  subcategoria?: string;
  nuevo?: boolean;
  oferta?: boolean;
  activo?: boolean;
  fechaCreacion?: string;
  envioGratis?: boolean;
  // Additional fields for enhanced display
  precioOriginal?: number;
  rating?: number;
  reviews?: number;
  marca?: string;
  // Etiquetas con duración
  nuevoDesde?: string; // Timestamp cuando se activa etiqueta "Nuevo"
  nuevoDuracionHoras?: number; // Duración en horas para etiqueta "Nuevo"
  ofertaDesde?: string; // Timestamp cuando se activa etiqueta "Oferta"
  ofertaDuracionHoras?: number; // Duración en horas para etiqueta "Oferta"
}

export interface CartItem {
  id: string;
  productId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
  sku?: string;
}

export interface Subcategory {
  id: string;
  nombre: string;
  activa: boolean;
}

export interface Category {
  id: string;
  nombre: string;
  activa: boolean;
  fechaCreacion?: string;
  subcategorias?: Subcategory[];
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerRut?: string; // RUT del cliente
  items: CartItem[];
  total: number;
  status: 'pending' | 'pending_verification' | 'pending_payment' | 'confirmed' | 'preparing' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  createdAt: string;
  shippingAddress?: string;
  paymentMethod?: string;
  paymentProof?: string; // URL del comprobante de pago
}

export interface SiteConfig {
  banner?: {
    title: string;
    text: string;
    active: boolean;
    image?: string;
  };
  store?: {
    title: string;
    logo?: string;
  };
  contact?: {
    phone: string;
    email: string;
    address: string;
  };
  shipping?: {
    cost: number;
    freeMin: number;
  };
}

export type LayoutPatternVariant = 'small' | 'vertical' | 'large' | 'horizontal';

export type LayoutPatternSpan = '1x1' | '2x1' | '1x2' | '2x2';

export interface LayoutPatternRule {
  variant: LayoutPatternVariant;
  enabled: boolean;
  interval: number;
  span: LayoutPatternSpan;
}

export interface LayoutPatternsConfig {
  rules: LayoutPatternRule[];
  updatedAt?: string;
}

// B2B Purchase Orders Types
export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}

export interface B2BCustomer {
  id: string;
  companyName: string;
  businessType: string;
  rut: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  contactPerson: {
    name: string;
    position: string;
    email: string;
    phone: string;
  };
  creditLimit: number;
  creditTerms: number; // days
  discount: number; // percentage
  isActive: boolean;
  registrationDate: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalValue: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // PO-YYYY-NNNN format
  customerId: string;
  customerInfo: B2BCustomer;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number; // percentage or amount
  taxes: number;
  shipping: number;
  total: number;
  status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentTerms: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  requestedDeliveryDate?: string;
  actualDeliveryDate?: string;
  shippingAddress?: string;
  notes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // user ID
  approvedBy?: string; // user ID
  approvalDate?: string;
}

export interface B2BQuote {
  id: string;
  quoteNumber: string; // QT-YYYY-NNNN format
  customerId: string;
  customerInfo: B2BCustomer;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number;
  taxes: number;
  shipping: number;
  total: number;
  validUntil: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  convertedToPO?: string; // PO ID if converted
}

// Discount/Coupon Types
export interface Discount {
  id: string;
  codigo: string; // Ej: "REGALO20" (case-insensitive)
  descripcion?: string;
  descuento: number; // Porcentaje (20) o monto fijo (5000)
  tipo: 'porcentaje' | 'fijo'; // Tipo de descuento
  productosAplicables: string[]; // IDs de productos donde aplica
  fechaInicio: string; // ISO 8601
  fechaFin: string; // ISO 8601
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface DiscountValidation {
  valido: boolean;
  mensaje: string;
  descuento?: Discount;
}
