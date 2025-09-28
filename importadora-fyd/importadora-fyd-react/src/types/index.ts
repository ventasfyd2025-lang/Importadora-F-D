export interface Product {
  id: string;
  sku?: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  imagen?: string;
  stock: number;
  categoria: string;
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
  items: CartItem[];
  total: number;
  status: 'pending' | 'pending_verification' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
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
