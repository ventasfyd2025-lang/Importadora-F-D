export interface Product {
  id: string;
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
}

export interface CartItem {
  id: string;
  productId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
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
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress?: string;
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