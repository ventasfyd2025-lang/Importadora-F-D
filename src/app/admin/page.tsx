'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { useFooterConfig } from '@/hooks/useFooterConfig';
import { useBankConfig } from '@/hooks/useBankConfig';
import { useLayoutPatterns, DEFAULT_LAYOUT_PATTERNS } from '@/hooks/useLayoutPatterns';
import { useUserAuth, UserProfile } from '@/hooks/useUserAuth';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import optimizeImageFile from '@/utils/imageProcessing';
import { normalizeCategoryValue } from '@/utils/category';
import MainBannerCarousel from '@/components/MainBannerCarousel';
import { defaultMiddleBanners } from '@/components/home/bannerData';
import { cleanAllData } from '@/scripts/cleanData';
import AdminChatPopup from '@/components/AdminChatPopup';
import StockAlerts from '@/components/StockAlerts';
import StockManagement from '@/components/StockManagement';
import B2BOrderManagement from '@/components/B2BOrderManagement';
// import { syncCategoriesToFirebase } from '@/utils/syncCategories'; // Unused import
import type { LayoutPatternsConfig, LayoutPatternVariant, LayoutPatternSpan, LayoutPatternRule, Product } from '@/types';
import type { Order } from '@/types';
import { 
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  CreditCardIcon,
  CubeIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const LAYOUT_VARIANT_ORDER: LayoutPatternVariant[] = ['large', 'horizontal', 'vertical', 'small'];

type CategoryOption = {
  id: string;
  name: string;
};

type PopupSize = '1x1' | '2x1' | '2x2' | '3x1' | '3x3' | '6x4' | '6x6';

const POPUP_SIZE_PRESETS: Record<PopupSize, { width: number; height: number; label: string }> = {
  '1x1': { width: 320, height: 320, label: '1x1 · Cuadrado compacto' },
  '2x1': { width: 560, height: 280, label: '2x1 · Banner horizontal' },
  '2x2': { width: 480, height: 480, label: '2x2 · Cuadrado mediano' },
  '3x1': { width: 720, height: 240, label: '3x1 · Súper horizontal' },
  '3x3': { width: 640, height: 640, label: '3x3 · Cuadrado grande' },
  '6x4': { width: 960, height: 640, label: '6x4 · Rectángulo destacado' },
  '6x6': { width: 960, height: 960, label: '6x6 · Hero cuadrado' },
};

const POPUP_LEGACY_SIZE_MAP: Record<string, PopupSize> = {
  small: '1x1',
  medium: '2x2',
  large: '6x6',
};

const isPopupSize = (value: unknown): value is PopupSize =>
  typeof value === 'string' && Object.hasOwn(POPUP_SIZE_PRESETS, value);

const POPUP_PREVIEW_POSITION_CLASSES: Record<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center', string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
};

const LAYOUT_VARIANT_META: Record<LayoutPatternVariant, {
  title: string;
  description: string;
  icon: string;
  spanOptions: Array<{ value: LayoutPatternSpan; label: string }>;
}> = {
  large: {
    title: 'Bloque Hero (2x2)',
    description: 'Destaca productos premium ocupando más espacio en la grilla.',
    icon: '🧱',
    spanOptions: [
      { value: '2x2', label: 'Grande 2x2' },
      { value: '2x1', label: 'Horizontal 2x1' },
    ],
  },
  horizontal: {
    title: 'Banner Horizontal',
    description: 'Ideal para promociones o productos que necesitan más ancho visual.',
    icon: '🪟',
    spanOptions: [
      { value: '2x1', label: 'Horizontal 2x1' },
      { value: '1x1', label: 'Normal 1x1' },
      { value: '2x2', label: 'Hero 2x2' },
    ],
  },
  vertical: {
    title: 'Bloque Vertical',
    description: 'Resalta productos con fotografías verticales o descripciones largas.',
    icon: '📏',
    spanOptions: [
      { value: '1x2', label: 'Vertical 1x2' },
      { value: '1x1', label: 'Normal 1x1' },
      { value: '2x2', label: 'Hero 2x2' },
    ],
  },
  small: {
    title: 'Bloque Compacto',
    description: 'Introduce variedad con bloques más pequeños y ritmo visual.',
    icon: '🔹',
    spanOptions: [
      { value: '1x1', label: 'Normal 1x1' },
      { value: '2x1', label: 'Horizontal 2x1' },
    ],
  },
};

const cloneLayoutPatterns = (config: LayoutPatternsConfig): LayoutPatternsConfig => ({
  rules: LAYOUT_VARIANT_ORDER.map((variant) => {
    const match = config.rules.find((rule) => rule.variant === variant);
    return match ? { ...match } : getDefaultLayoutRule(variant);
  }),
  updatedAt: config.updatedAt,
});

type PromotionalSectionState = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkType: 'category' | 'product' | 'filter' | 'url';
  linkValue: string;
  badgeText: string;
  position: 'large' | 'tall' | 'wide' | 'normal';
  selectedProducts?: string[];
};

type MiddleBannerState = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  linkType?: 'category' | 'product' | 'filter' | 'url' | 'popup-ofertas';
  linkValue?: string;
  badgeText: string;
};

type HomepageContentState = {
  featuredProducts: string[];
  offerProducts: string[];
  promotionalSections: PromotionalSectionState[];
  middleBanners: MiddleBannerState[];
};

const clonePromotionalSection = (section: PromotionalSectionState): PromotionalSectionState => ({
  ...section,
  selectedProducts: Array.isArray(section.selectedProducts) ? [...section.selectedProducts] : [],
});

const cloneMiddleBanner = (banner: MiddleBannerState): MiddleBannerState => ({
  ...banner,
});

const DEFAULT_PROMOTIONAL_SECTIONS: PromotionalSectionState[] = [
  {
    id: 'electronics',
    title: 'Electrónicos',
    description: 'Smartphones, laptops y más',
    imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&h=600&fit=crop&crop=center',
    linkType: 'category' as const,
    linkValue: 'tecnologia',
    badgeText: 'HASTA 50% OFF',
    position: 'large' as const,
    selectedProducts: [],
  },
  {
    id: 'fashion',
    title: 'Moda',
    description: 'Ropa y accesorios',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&h=700&fit=crop&crop=center',
    linkType: 'category' as const,
    linkValue: 'moda',
    badgeText: 'NUEVA COLECCIÓN',
    position: 'tall' as const,
    selectedProducts: [],
  },
  {
    id: 'home',
    title: 'Electrohogar',
    description: 'Cocina y limpieza',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=400&fit=crop&crop=center',
    linkType: 'category' as const,
    linkValue: 'electrohogar',
    badgeText: 'OFERTAS',
    position: 'wide' as const,
    selectedProducts: [],
  },
  {
    id: 'sports',
    title: 'Deportes',
    description: 'Equipamiento deportivo',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=400&fit=crop&crop=center',
    linkType: 'category' as const,
    linkValue: 'deportes',
    badgeText: 'FITNESS',
    position: 'normal' as const,
    selectedProducts: [],
  },
].map(clonePromotionalSection);

const DEFAULT_MIDDLE_BANNERS: MiddleBannerState[] = defaultMiddleBanners.map((banner) => cloneMiddleBanner(banner));

const MIDDLE_BANNER_LINK_OPTIONS = [
  { label: 'Inicio', value: '/' },
  { label: 'Productos en oferta', value: '/?filter=ofertas' },
  { label: 'Productos nuevos', value: '/?filter=nuevos' },
  { label: 'Contacto', value: '/contacto' },
  { label: 'Carrito', value: '/carrito' },
];

const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'electronicos', name: 'Electrónicos' },
  { id: 'hogar', name: 'Hogar' },
  { id: 'ropa', name: 'Ropa' },
  { id: 'deportes', name: 'Deportes' },
];

const normalizePromotionalSections = (raw: unknown): PromotionalSectionState[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_PROMOTIONAL_SECTIONS.map(clonePromotionalSection);
  }

  return raw.map((entry, index) => {
    const fallback = DEFAULT_PROMOTIONAL_SECTIONS[index] ?? DEFAULT_PROMOTIONAL_SECTIONS[0];
    const section = (entry && typeof entry === 'object') ? entry as Record<string, unknown> : {};

    const selectedProducts = Array.isArray(section.selectedProducts)
      ? section.selectedProducts.filter((id): id is string => typeof id === 'string')
      : fallback.selectedProducts ?? [];

    const linkType = section.linkType;
    const position = section.position;

    return {
      id: typeof section.id === 'string' && section.id.trim() ? section.id : fallback.id || `section-${index}`,
      title: typeof section.title === 'string' ? section.title : fallback.title,
      description: typeof section.description === 'string' ? section.description : fallback.description,
      imageUrl: typeof section.imageUrl === 'string' && section.imageUrl ? section.imageUrl : fallback.imageUrl,
      linkType:
        linkType === 'product' || linkType === 'filter' || linkType === 'url' || linkType === 'category'
          ? linkType
          : fallback.linkType ?? 'category',
      linkValue: typeof section.linkValue === 'string' ? section.linkValue : fallback.linkValue ?? '',
      badgeText: typeof section.badgeText === 'string' ? section.badgeText : fallback.badgeText ?? '',
      position:
        position === 'large' || position === 'tall' || position === 'wide' || position === 'normal'
          ? position
          : fallback.position ?? 'normal',
      selectedProducts,
    };
  }).map(clonePromotionalSection);
};

const normalizeMiddleBanners = (raw: unknown): MiddleBannerState[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_MIDDLE_BANNERS.map(cloneMiddleBanner);
  }

  return raw.map((entry, index) => {
    const fallback = DEFAULT_MIDDLE_BANNERS[index] ?? DEFAULT_MIDDLE_BANNERS[0];
    const banner = (entry && typeof entry === 'object') ? entry as Record<string, unknown> : {};

    return {
      id: typeof banner.id === 'string' && banner.id.trim() ? banner.id : fallback.id || `middle-${index}`,
      title: typeof banner.title === 'string' ? banner.title : fallback.title,
      subtitle: typeof banner.subtitle === 'string' ? banner.subtitle : fallback.subtitle,
      imageUrl: typeof banner.imageUrl === 'string' && banner.imageUrl ? banner.imageUrl : fallback.imageUrl,
      ctaText: typeof banner.ctaText === 'string' ? banner.ctaText : fallback.ctaText,
      ctaLink: typeof banner.ctaLink === 'string' ? banner.ctaLink : fallback.ctaLink,
      badgeText: typeof banner.badgeText === 'string' ? banner.badgeText : fallback.badgeText,
    };
  }).map(cloneMiddleBanner);
};

const prettifyCategoryName = (value: string): string => {
  const cleaned = value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return value;
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const normalizeCategoryOption = (input: unknown): CategoryOption | null => {
  if (!input) return null;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const id = trimmed.toLowerCase();
    return {
      id,
      name: prettifyCategoryName(trimmed),
    };
  }

  if (typeof input === 'object') {
    const data = input as Record<string, unknown>;
    const rawId = data.id ?? data.slug ?? data.value ?? data.name ?? data.nombre;
    if (typeof rawId !== 'string') return null;
    const id = rawId.trim().toLowerCase();
    if (!id) return null;
    const rawName = data.name ?? data.nombre ?? data.title ?? rawId;
    const name = typeof rawName === 'string' && rawName.trim().length > 0
      ? rawName as string
      : prettifyCategoryName(rawId as string);
    return {
      id,
      name: typeof name === 'string' ? name : prettifyCategoryName(id),
    };
  }

  return null;
};

const mergeCategoryOptions = (
  existing: CategoryOption[],
  incoming: CategoryOption[],
): CategoryOption[] => {
  const map = new Map<string, CategoryOption>();
  const append = (option: CategoryOption) => {
    if (!option.id) return;
    const current = map.get(option.id);
    if (!current || (!current.name && option.name)) {
      map.set(option.id, option);
    } else if (option.name && current.name && option.name.length > current.name.length) {
      map.set(option.id, option);
    }
  };

  existing.forEach(append);
  incoming.forEach(append);

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es-CL'));
};

function getDefaultLayoutRule(variant: LayoutPatternVariant) {
  const match = DEFAULT_LAYOUT_PATTERNS.rules.find((rule) => rule.variant === variant);
  return match ? { ...match } : { variant, enabled: false, interval: 4, span: '1x1' as LayoutPatternSpan };
}

const collectCategoryEntries = (product: Product): string[] => {
  const entries: string[] = [];

  if (typeof product.categoria === 'string' && product.categoria.trim().length > 0) {
    entries.push(product.categoria);
  }

  if (Array.isArray(product.categorias)) {
    product.categorias.forEach((entry) => {
      if (typeof entry === 'string' && entry.trim().length > 0) {
        entries.push(entry);
      }
    });
  }

  return entries;
};

const productHasCategory = (product: Product, categoryId: string): boolean => {
  if (!categoryId || categoryId === 'all') {
    return true;
  }

  const normalizedTarget = normalizeCategoryValue(categoryId);

  return collectCategoryEntries(product).some((entry) => {
    if (entry === categoryId) {
      return true;
    }
    if (entry.startsWith(`${categoryId}-`)) {
      return true;
    }

    const normalizedEntry = normalizeCategoryValue(entry);
    if (!normalizedEntry || !normalizedTarget) {
      return false;
    }

    return (
      normalizedEntry === normalizedTarget ||
      normalizedEntry.startsWith(normalizedTarget)
    );
  });
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, login, logout } = useAuth();
  const { userProfile, isAdmin, loading: userAuthLoading } = useUserAuth();
  const { products, refetch, removeProduct, removeProducts } = useProducts();
  const { footerConfig, updateFooterConfig, loading: footerLoading } = useFooterConfig();
  const { bankConfig, updateBankConfig, loading: bankLoading } = useBankConfig();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [ordersFilter, setOrdersFilter] = useState<'active' | 'completed'>('active');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Users management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showClientes, setShowClientes] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState<Order[]>([]);

  // Banner management state
  const [bannerForm, setBannerForm] = useState({
    title: '¡Ofertas Especiales!',
    text: 'Hasta 50% de descuento en productos seleccionados',
    active: true,
    images: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=400&fit=crop'
    ]
  });
  const [bannerFiles, setBannerFiles] = useState<(File | null)[]>([null, null, null]);
  const [updatingBanner, setUpdatingBanner] = useState(false);
  
  // Popup management state
  const [popupForm, setPopupForm] = useState({
    title: '¡Oferta Especial!',
    description: 'Descuentos increíbles por tiempo limitado',
    buttonText: 'Ver Ofertas',
    buttonLink: '/popup-ofertas',
    active: false,
    size: '2x2' as PopupSize,
    position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
    mediaUrl: '',
    isVideo: false,
    popupType: 'category' as 'category' | 'information'
  });
  const [updatingPopup, setUpdatingPopup] = useState(false);
  const [popupImageUploading, setPopupImageUploading] = useState(false);

  // Temporary function for products (not used in simplified popup)

  // Main banner management state
  const [mainBannerForm, setMainBannerForm] = useState({
    active: true,
    slides: [
      { 
        linkType: "product" as "product" | "category", // "product" o "category"
        productId: "1", 
        categoryId: "",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop" 
      },
      { 
        linkType: "product" as "product" | "category",
        productId: "2", 
        categoryId: "",
        imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop" 
      },
      { 
        linkType: "product" as "product" | "category",
        productId: "3", 
        categoryId: "",
        imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=400&fit=crop" 
      }
    ]
  });
  const [updatingMainBanner, setUpdatingMainBanner] = useState(false);
  const [isAutoSavingBanner, setIsAutoSavingBanner] = useState(false);
  const bannerAutoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Homepage content management state
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORY_OPTIONS);
  const [homepageContent, setHomepageContent] = useState<HomepageContentState>({
    featuredProducts: [] as string[], // IDs de productos destacados
    offerProducts: [] as string[], // IDs de productos en ofertas
    promotionalSections: DEFAULT_PROMOTIONAL_SECTIONS.map((section) => ({ ...section })),
    middleBanners: DEFAULT_MIDDLE_BANNERS.map((banner) => ({ ...banner })),
  });
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const [updatingHomepageContent, setUpdatingHomepageContent] = useState(false); // Unused state
  
  
  // Banner product search
  const [bannerSearchTerms, setBannerSearchTerms] = useState<{[key: number]: string}>({});
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Chat management state
  interface ChatMessage {
    id: string;
    orderId?: string;
    userId: string;
    userEmail: string;
    userName: string;
    message: string;
    isAdmin: boolean;
    timestamp: Date;
    read: boolean;
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // Total unread count for notifications
  const unreadCount = unreadChatCount + newOrdersCount;
  
  // Order selection and deletion states
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [deletingOrders, setDeletingOrders] = useState(false);
  
  // Popup chat states
  const [chatPopupOrder, setChatPopupOrder] = useState<Order | null>(null);
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  
  // Logo management state
  const [logoForm, setLogoForm] = useState({
    text: 'Importadora F&D',
    emoji: '🏪',
    image: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [updatingLogo, setUpdatingLogo] = useState(false);
  
  // Footer information state - synced with useFooterConfig hook
  const [footerForm, setFooterForm] = useState({
    companyDescription: '',
    phone: '',
    email: '',
    address: '',
    facebookUrl: '',
    instagramUrl: '',
    whatsappUrl: ''
  });
  const [updatingFooter, setUpdatingFooter] = useState(false);

  // Bank details state
  const [bankForm, setBankForm] = useState({
    bankName: 'Banco de Chile',
    accountType: 'Cuenta Corriente',
    accountNumber: '123-456-789-01',
    rut: '12.345.678-9',
    holderName: 'Importadora FyD SpA',
    email: 'pagos@importadorafyd.cl'
  });
  const [updatingBank, setUpdatingBank] = useState(false);

  // Sync footer form with hook data
  useEffect(() => {
    if (footerConfig && !footerLoading) {
      setFooterForm({
        companyDescription: footerConfig.description || '',
        phone: footerConfig.contact.phone || '',
        email: footerConfig.contact.email || '',
        address: footerConfig.contact.address || '',
        facebookUrl: footerConfig.socialMedia.facebook || '',
        instagramUrl: footerConfig.socialMedia.instagram || '',
        whatsappUrl: footerConfig.socialMedia.whatsapp || ''
      });
    }
  }, [footerConfig, footerLoading]);

  // Sync bank form with hook data
  useEffect(() => {
    if (bankConfig && !bankLoading) {
      setBankForm({
        bankName: bankConfig.bankName || '',
        accountType: bankConfig.accountType || '',
        accountNumber: bankConfig.accountNumber || '',
        rut: bankConfig.rut || '',
        holderName: bankConfig.holderName || '',
        email: bankConfig.email || ''
      });
    }
  }, [bankConfig, bankLoading]);

  // Category management state
  // const [syncingCategories, setSyncingCategories] = useState(false); // Unused state
  const [categories, setCategories] = useState([
    { id: 'electronicos', name: 'Electrónicos', active: true },
    { id: 'hogar', name: 'Hogar', active: true },
    { id: 'ropa', name: 'Ropa', active: true },
    { id: 'deportes', name: 'Deportes', active: true }
  ]);

  // Load categories from Firebase
  const loadCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'categorias'));
      if (!categoriesSnapshot.empty) {
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          active: doc.data().active ?? true,
          ...doc.data()
        }));
        setCategories(categoriesData as { id: string; name: string; active: boolean; }[]);
      }
    } catch (error) {
      // Error loading categories
    }
  };

  useEffect(() => {
    if (categories.length === 0) return;

    const categoryOptions: CategoryOption[] = [];

    categories.forEach((category) => {
      // Add main category
      const mainCategoryOption = normalizeCategoryOption(category);
      if (mainCategoryOption) {
        categoryOptions.push(mainCategoryOption);
      }

      // Add subcategories
      const subcategorias = (category as any).subcategorias || [];
      subcategorias.forEach((sub: any) => {
        if (sub.nombre && sub.activa !== false) {
          categoryOptions.push({
            id: `${category.id}-${sub.id}`,
            name: `${category.name} > ${sub.nombre}`
          });
        }
      });
    });

    // Replace with actual categories from database (not merge)
    setAvailableCategories(categoryOptions);
  }, [categories]);

  const loadBannerConfig = async () => {
    try {
      const bannerDoc = await getDoc(doc(db, 'config', 'banner'));
      if (bannerDoc.exists()) {
        const bannerData = bannerDoc.data();
        setBannerForm({
          title: bannerData.title || '',
          text: bannerData.text || '',
          active: bannerData.active || false,
          images: bannerData.images || []
        });
      }
    } catch (error) {
      // Error loading banner config
    }
  };

  const loadPopupConfig = async () => {
    try {
      const popupDoc = await getDoc(doc(db, 'config', 'offer-popup'));
      if (popupDoc.exists()) {
        const popupData = popupDoc.data();
        setPopupForm({
          title: popupData.title || '',
          description: popupData.description || '',
          buttonText: popupData.buttonText || 'Ver Ofertas',
          buttonLink: popupData.buttonLink || '/popup-ofertas',
          active: popupData.active || false,
          size: (() => {
            if (isPopupSize(popupData.size)) {
              return popupData.size;
            }
            if (typeof popupData.size === 'string' && POPUP_LEGACY_SIZE_MAP[popupData.size]) {
              return POPUP_LEGACY_SIZE_MAP[popupData.size];
            }
            return '2x2';
          })(),
          position: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(popupData.position)
            ? popupData.position
            : 'bottom-right',
          mediaUrl: typeof popupData.mediaUrl === 'string' ? popupData.mediaUrl : (popupData.imageUrl || ''),
          isVideo: popupData.isVideo || false,
          popupType: ['category', 'information'].includes(popupData.popupType)
            ? popupData.popupType
            : (popupData.popupType === 'promotional' ? 'category' : 'information')
        });
      }
    } catch (error) {
      // Error loading popup config
    }
  };

  const loadMainBannerConfig = async () => {
    try {
      const mainBannerDoc = await getDoc(doc(db, 'config', 'main-banner'));
      if (mainBannerDoc.exists()) {
        const mainBannerData = mainBannerDoc.data();
        const loadedSlides = (mainBannerData.slides || []).map((slide: any) => ({
          linkType: slide.linkType || "product",
          productId: slide.productId || "",
          categoryId: slide.categoryId || "",
          imageUrl: slide.imageUrl || ""
        }));

        // Si no hay slides, usar valores por defecto
        const defaultSlides = [
          { linkType: "product", productId: "1", categoryId: "", imageUrl: "" },
          { linkType: "product", productId: "2", categoryId: "", imageUrl: "" }
        ];

        setMainBannerForm({
          active: mainBannerData.active !== undefined ? mainBannerData.active : true,
          slides: loadedSlides.length > 0 ? loadedSlides : defaultSlides
        });
      }
    } catch (error) {
      // Error loading main banner config, keep defaults
    }
  };

  const loadHomepageContent = async () => {
    try {
      const homepageDoc = await getDoc(doc(db, 'config', 'homepage-content'));
      if (homepageDoc.exists()) {
        const homepageData = homepageDoc.data();
        setHomepageContent({
          featuredProducts: homepageData.featuredProducts || [],
          offerProducts: homepageData.offerProducts || [],
          promotionalSections: normalizePromotionalSections(homepageData.promotionalSections),
          middleBanners: normalizeMiddleBanners(homepageData.middleBanners),
        });
      } else {
        // Si no existe configuración, crear una automáticamente
        await setDoc(doc(db, 'config', 'homepage-content'), homepageContent);
      }
    } catch (error) {
      console.error('Error loading homepage content:', error);
    }
  };

  const autoSaveHomepageContent = useCallback((content: HomepageContentState) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setIsAutoSaving(true);
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'config', 'homepage-content'), content);      } catch (error) {
        console.error('❌ Error auto-saving:', error);
      } finally {
        setIsAutoSaving(false);
        autoSaveTimeoutRef.current = null;
      }
    }, 800);
  }, []);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save for main banner
  const autoSaveMainBanner = useCallback((bannerConfig: typeof mainBannerForm) => {
    if (bannerAutoSaveTimeoutRef.current) {
      clearTimeout(bannerAutoSaveTimeoutRef.current);
    }

    setIsAutoSavingBanner(true);
    bannerAutoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'config', 'main-banner'), {
          active: bannerConfig.active,
          slides: bannerConfig.slides,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Banner auto-guardado');
      } catch (error) {
        console.error('❌ Error auto-guardando banner:', error);
      } finally {
        setIsAutoSavingBanner(false);
        bannerAutoSaveTimeoutRef.current = null;
      }
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (bannerAutoSaveTimeoutRef.current) {
        clearTimeout(bannerAutoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Watch mainBannerForm changes and auto-save
  useEffect(() => {
    // Skip auto-save on initial mount (when loading from Firebase)
    // Only auto-save when user makes changes
    if (mainBannerForm.slides.length > 0) {
      autoSaveMainBanner(mainBannerForm);
    }
  }, [mainBannerForm, autoSaveMainBanner]);

  const saveHomepageContent = async (showAlert = true) => {
    try {
      await setDoc(doc(db, 'config', 'homepage-content'), homepageContent);
      if (showAlert) {
        alert('✅ Contenido guardado! Ve a la página principal para ver los cambios.');
      }    } catch (error) {
      console.error('Error saving homepage content:', error);
      if (showAlert) {
        alert('❌ Error al guardar el contenido de la página');
      }
    }
  };

  // Función para guardar automáticamente cuando cambian los datos
  const updateSection = (index: number, updatedSection: PromotionalSectionState) => {
    const normalized = clonePromotionalSection(updatedSection);
    setHomepageContent((prev) => {
      const updatedSections = [...prev.promotionalSections];
      updatedSections[index] = normalized;
      const newContent: HomepageContentState = { ...prev, promotionalSections: updatedSections };
      autoSaveHomepageContent(newContent);
      return newContent;
    });
  };

  const updateMiddleBanner = (index: number, updatedBanner: MiddleBannerState) => {
    const normalized = cloneMiddleBanner(updatedBanner);
    setHomepageContent((prev) => {
      const updatedBanners = [...prev.middleBanners];
      updatedBanners[index] = normalized;
      const newContent: HomepageContentState = { ...prev, middleBanners: updatedBanners };
      autoSaveHomepageContent(newContent);
      return newContent;
    });
  };

  // Función para subir imagen
  const uploadImage = async (
    file: File,
    storageKey: string,
    options?: { folder?: string; stateKey?: string },
  ): Promise<string> => {
    const folder = options?.folder ?? 'homepage-promotions';
    const stateKey = options?.stateKey ?? storageKey;    setUploadingImages((prev) => ({ ...prev, [stateKey]: true }));

    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const optimizedFile = await optimizeImageFile(file);
      const timestamp = Date.now();
      const fileName = `${folder}/${storageKey}-${timestamp}-${optimizedFile.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, optimizedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    } finally {
      setUploadingImages((prev) => ({ ...prev, [stateKey]: false }));
    }
  };

  // Función para manejar cambio de archivo
  const handleImageUpload = async (file: File, index: number, section: any) => {
    try {      const imageUrl = await uploadImage(file, section.id, { folder: 'homepage-promotions', stateKey: section.id });      updateSection(index, { ...section, imageUrl });    } catch (error) {
      console.error('❌ Error in handleImageUpload:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al subir la imagen: ${message}\nVerifica los permisos de Firebase Storage.`);
    }
  };

  const handleMiddleBannerImageUpload = async (file: File, index: number, banner: MiddleBannerState) => {
    try {      const stateKey = `middle-${banner.id}`;
      const imageUrl = await uploadImage(file, banner.id, {
        folder: 'homepage-middle-banners',
        stateKey,
      });      updateMiddleBanner(index, { ...banner, imageUrl });
    } catch (error) {
      console.error('❌ Error uploading middle banner image:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al subir la imagen del banner: ${message}`);
    }
  };

  // const initializeDefaultContent = ...; // Unused function

  const loadLogoConfig = async () => {
    try {
      const logoDoc = await getDoc(doc(db, 'config', 'logo'));
      if (logoDoc.exists()) {
        const logoData = logoDoc.data();
        setLogoForm({
          text: logoData.text || 'Importadora F&D',
          emoji: logoData.emoji || '🏪',
          image: logoData.image || ''
        });
      }
    } catch (error) {
      // Error loading logo config, keep defaults
    }
  };
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', active: true, subcategorias: [] });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [subcategoryForm, setSubcategoryForm] = useState({ id: '', nombre: '', activa: true });
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

  type OrderStatus = Order['status'];

  interface CustomerOrderGroup {
    customerName: string;
    customerEmail: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: Date;
    lastOrderStatus: OrderStatus;
    lastOrderId: string;
    statusBreakdown: Partial<Record<OrderStatus, number>>;
  }

  const statusLabelMap: Record<OrderStatus, string> = {
    pending: 'Pendiente',
    pending_verification: 'Verificando Pago',
    pending_payment: 'Pendiente de Pago',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    completed: 'Completado',
    cancelled: 'Cancelado'
  };

  const statusClassMap: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    pending_verification: 'bg-blue-100 text-blue-800',
    pending_payment: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-green-100 text-green-800',
    preparing: 'bg-orange-100 text-orange-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const ordersByCustomer = useMemo<CustomerOrderGroup[]>(() => {
    if (!orders || orders.length === 0) return [];

    const groups = new Map<string, CustomerOrderGroup>();

    orders.forEach((order) => {
      const key = order.customerEmail || order.customerName || order.id;
      const createdAt = new Date(order.createdAt || Date.now());
      const total = typeof order.total === 'number' ? order.total : 0;
      const status = (order.status || 'pending') as OrderStatus;

      if (!groups.has(key)) {
        groups.set(key, {
          customerName: order.customerName || 'Cliente sin nombre',
          customerEmail: order.customerEmail || 'Sin correo',
          orderCount: 1,
          totalSpent: total,
          lastOrderDate: createdAt,
          lastOrderStatus: status,
          lastOrderId: order.id,
          statusBreakdown: { [status]: 1 }
        });
        return;
      }

      const group = groups.get(key)!;
      group.orderCount += 1;
      group.totalSpent += total;
      group.statusBreakdown[status] = (group.statusBreakdown[status] || 0) + 1;

      if (createdAt.getTime() > group.lastOrderDate.getTime()) {
        group.lastOrderDate = createdAt;
        group.lastOrderStatus = status;
        group.lastOrderId = order.id;
      }
    });

    return Array.from(groups.values()).sort(
      (a, b) => b.lastOrderDate.getTime() - a.lastOrderDate.getTime()
    );
  }, [orders]);

  // Users management functions
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      console.log('Loading users from Firestore...');
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      console.log('Users snapshot:', snapshot.size, 'documents');

      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('User document:', doc.id, data);
        return {
          ...data,
          uid: doc.id
        };
      }) as UserProfile[];

      console.log('Loaded users:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error cargando usuarios: ' + error);
    } finally {
      setUsersLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'vendedor' | 'cliente') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });

      // Actualizar estado local
      setUsers(prev => prev.map(user =>
        user.uid === userId ? { ...user, role: newRole } : user
      ));

      setEditingUser(null);
      alert('Rol actualizado exitosamente');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error al actualizar rol');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?\n\nSe eliminará de Auth y Firestore.')) {
      return;
    }

    try {
      // Obtener el token del usuario actual
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('Debes estar autenticado para realizar esta acción');
        return;
      }

      const token = await currentUser.getIdToken();

      // Llamar al API para eliminar el usuario
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar usuario');
      }

      // Actualizar la lista local
      setUsers(prev => prev.filter(user => user.uid !== userId));
      alert('Usuario eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Error al eliminar usuario');
    }
  };

  const blockUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres bloquear este usuario? No podrá iniciar sesión hasta que lo desbloquees.')) {
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), {
        blocked: true,
        blockedAt: serverTimestamp()
      });
      // Actualizar estado local
      setUsers(prev => prev.map(user =>
        user.uid === userId ? { ...user, blocked: true } : user
      ));
      alert('Usuario bloqueado exitosamente');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Error al bloquear usuario');
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        blocked: false,
        unblockedAt: serverTimestamp()
      });
      // Actualizar estado local
      setUsers(prev => prev.map(user =>
        user.uid === userId ? { ...user, blocked: false } : user
      ));
      alert('Usuario desbloqueado exitosamente');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Error al desbloquear usuario');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'vendedor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cliente': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Cargar detalles del usuario y sus pedidos
  const loadUserDetails = async (user: UserProfile) => {
    try {
      setSelectedUserDetails({
        ...user,
        uid: user.uid
      });

      // Cargar pedidos del usuario
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, where('userId', '==', user.uid));
      const ordersSnapshot = await getDocs(ordersQuery);

      const userOrders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));

      // Ordenar por fecha más reciente
      userOrders.sort((a, b) => {
        let dateA: Date;
        let dateB: Date;

        if (a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt) {
          dateA = (a.createdAt as any).toDate();
        } else if (a.createdAt) {
          dateA = new Date(a.createdAt as any);
        } else {
          dateA = new Date();
        }

        if (b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt) {
          dateB = (b.createdAt as any).toDate();
        } else if (b.createdAt) {
          dateB = new Date(b.createdAt as any);
        } else {
          dateB = new Date();
        }

        return dateB.getTime() - dateA.getTime();
      });

      setSelectedUserOrders(userOrders);
    } catch (error) {
      console.error('Error loading user details:', error);
      alert('Error al cargar detalles del usuario');
    }
  };

  // Buscar usuario y cargar sus pedidos
  const searchUserByEmail = async (email: string) => {
    if (!email.trim()) {
      setSelectedUserDetails(null);
      setSelectedUserOrders([]);
      return;
    }

    try {
      // Buscar usuario por email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
      const userSnapshot = await getDocs(q);

      if (userSnapshot.empty) {
        alert('No se encontró ningún usuario con ese correo');
        setSelectedUserDetails(null);
        setSelectedUserOrders([]);
        return;
      }

      const userData = userSnapshot.docs[0].data();
      const userId = userSnapshot.docs[0].id;

      const user = {
        ...userData,
        uid: userId
      } as UserProfile;

      loadUserDetails(user);
    } catch (error) {
      console.error('Error searching user:', error);
      alert('Error al buscar usuario');
    }
  };

  // Load users when user management tab is active
  useEffect(() => {
    if (activeTab === 'user-management') {
      loadUsers();
    }
  }, [activeTab]);

  // Product sections state
  const [productSections, setProductSections] = useState([
    {
      id: 'destacados',
      name: 'Productos Destacados',
      description: 'Primera sección en la página principal',
      enabled: true,
      type: 'featured',
      selectedProducts: []
    },
    {
      id: 'vendidos',
      name: 'Los Más Vendidos',
      description: 'Productos con mejor desempeño',
      enabled: true,
      type: 'bestsellers',
      selectedProducts: []
    },
    {
      id: 'novedades',
      name: 'Novedades',
      description: 'Productos recién llegados',
      enabled: true,
      type: 'new',
      selectedProducts: []
    },
    {
      id: 'electronica',
      name: 'Electrónica',
      description: 'Categoría de electrónicos',
      enabled: true,
      type: 'category',
      categoryId: 'electronicos',
      selectedProducts: []
    }
  ]);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string>('');
  const [sectionSaveStatus, setSectionSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [previewName, setPreviewName] = useState('');
  const [previewDescription, setPreviewDescription] = useState('');

  // Estado para la vista del tab Secciones (sin popups)
  const [sectionsView, setSectionsView] = useState<'list' | 'edit' | 'products'>('list');

  // Product selector filters state
  const [productSelectorFilters, setProductSelectorFilters] = useState({
    category: '',
    search: '',
    showOnlySelected: false
  });

  // Layout patterns state
  const {
    patterns: layoutPatternsFetched,
    loading: layoutPatternsLoading,
    error: layoutPatternsError,
    savePatterns: persistLayoutPatterns,
  } = useLayoutPatterns();

  const [layoutPatterns, setLayoutPatterns] = useState<LayoutPatternsConfig>(cloneLayoutPatterns(DEFAULT_LAYOUT_PATTERNS));
  const [savingLayoutPatterns, setSavingLayoutPatterns] = useState(false);

  useEffect(() => {
    setLayoutPatterns(cloneLayoutPatterns(layoutPatternsFetched));
  }, [layoutPatternsFetched]);

  const orderedLayoutRules = useMemo(
    () =>
      LAYOUT_VARIANT_ORDER.map((variant) => {
        const match = layoutPatterns.rules.find((rule) => rule.variant === variant);
        return match ? { ...match } : getDefaultLayoutRule(variant);
      }),
    [layoutPatterns],
  );

  const updateLayoutRule = useCallback(
    (variant: LayoutPatternVariant, updater: (rule: LayoutPatternRule) => LayoutPatternRule) => {
      setLayoutPatterns((prev) => {
        const currentMap = new Map(prev.rules.map((rule) => [rule.variant, rule]));
        const currentRule = currentMap.get(variant) ?? getDefaultLayoutRule(variant);
        currentMap.set(variant, updater({ ...currentRule }));
        const recalculated = LAYOUT_VARIANT_ORDER.map((variantKey) => {
          const rule = currentMap.get(variantKey) ?? getDefaultLayoutRule(variantKey);
          return { ...rule };
        });
        return {
          ...prev,
          rules: recalculated,
        };
      });
    },
    [],
  );

  const handleSaveLayoutPatterns = useCallback(async () => {
    try {
      setSavingLayoutPatterns(true);
      await persistLayoutPatterns(layoutPatterns);
      alert('Configuración de layout guardada exitosamente');
    } catch (error) {
      console.error('Error saving layout patterns:', error);
      alert('Error al guardar la configuración de layout');
    } finally {
      setSavingLayoutPatterns(false);
    }
  }, [layoutPatterns, persistLayoutPatterns]);

  const handleResetLayoutPatterns = useCallback(() => {
    const shouldReset = window.confirm('¿Restablecer los patrones de layout a los valores predeterminados?');
    if (!shouldReset) return;
    setLayoutPatterns(cloneLayoutPatterns(DEFAULT_LAYOUT_PATTERNS));
  }, []);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: 'admin@importadorafyd.com',
    password: 'admin123'
  });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Product form state
  const [productForm, setProductForm] = useState({
    id: '',
    sku: '',
    nombre: '',
    precio: 0,
    precioOriginal: undefined as number | undefined,
    descripcion: '',
    stock: 0,
    minStock: 5,
    categoria: '',
    categorias: [] as string[],
    subcategoria: '',
    nuevo: false,
    oferta: false,
    imagen: '',
    imagenes: [] as string[]
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showStockAlert, setShowStockAlert] = useState(false);

  // Product search and filters
  const [productSearch, setProductSearch] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [productFilters, setProductFilters] = useState({
    priceRange: { min: '', max: '' },
    stockStatus: 'all', // 'all', 'in_stock', 'low_stock', 'out_of_stock'
    status: 'all', // 'all', 'active', 'inactive'
    tags: [] as string[] // ['nuevo', 'oferta']
  });

  // Protección de ruta: redirigir si no es administrador
  useEffect(() => {
    if (!authLoading && !userAuthLoading) {
      if (!user || !isAdmin) {
        console.warn('⚠️ Acceso denegado: usuario no es administrador');
        router.push('/');
      }
    }
  }, [authLoading, userAuthLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      // User is not logged in, show login form
      return;
    }

    if (user && isAdmin) {
      loadCategories();
      loadBannerConfig();
      loadPopupConfig();
      loadMainBannerConfig();
      loadHomepageContent();
      loadLogoConfig();
      
      // Cargar categorías disponibles desde productos
      const productCategoryOptions = [...new Set(products.map((p) => p.categoria).filter(Boolean))]
        .map((category) => normalizeCategoryOption(category))
        .filter((option): option is CategoryOption => option !== null);

      if (productCategoryOptions.length > 0) {
        setAvailableCategories((prev) => mergeCategoryOptions(prev, productCategoryOptions));
      }
      
      // Load orders with real-time updates
      const unsubscribeOrders = loadOrders();
      
      // Load chat messages with real-time updates
      const unsubscribeChat = loadChatMessages();
      
      return () => {
        if (unsubscribeOrders) unsubscribeOrders();
        if (unsubscribeChat) unsubscribeChat();
      };
    }
  }, [user, authLoading, products]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateStats = useCallback(() => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;

    setStats({
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders
    });
  }, [orders, products]);

  // Recalculate stats when orders change
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Reset subcategoria when categoria changes
  useEffect(() => {
    if (productForm.categoria) {
      setProductForm(prev => ({ ...prev, subcategoria: '' }));
    }
  }, [productForm.categoria]);

  // Product sections functions
  const saveProductSections = async () => {
    try {
      await setDoc(doc(db, 'config', 'productSections'), {
        sections: productSections,
        lastUpdated: new Date().toISOString()
      });
      alert('Configuración de secciones guardada exitosamente');
    } catch (error) {
      console.error('Error saving product sections:', error);
      alert('Error al guardar la configuración');
    }
  };

  const loadProductSections = async () => {
    try {
      const sectionsDoc = await getDoc(doc(db, 'config', 'productSections'));
      if (sectionsDoc.exists()) {
        const sectionsData = sectionsDoc.data();
        if (sectionsData.sections) {
          setProductSections(sectionsData.sections);
        }
      }
    } catch (error) {
      console.error('Error loading product sections:', error);
    }
  };

  // Load product sections on component mount
  useEffect(() => {
    loadProductSections();
  }, []);

  // Orders functions
  const loadOrders = () => {
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData: Order[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Order);
      });

      // Count new orders (pending or pending_verification)
      const newOrders = ordersData.filter(order =>
        order.status === 'pending' || order.status === 'pending_verification'
      ).length;

      setOrders(ordersData);
      setNewOrdersCount(newOrders);
    });

    return unsubscribe;
  };

  // Chat functions
  const loadChatMessages = () => {
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const message = {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage;
        
        messages.push(message);
        
        if (!message.read && !message.isAdmin) {
          unread++;
        }
      });

      setChatMessages(messages);
      setUnreadChatCount(unread);
    });

    return unsubscribe;
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    const result = await login(loginForm.email, loginForm.password);
    
    if (!result.success) {
      setLoginError(result.error || 'Error de autenticación');
    }
    
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingProduct(true);

    try {
      const trimmedSku = (productForm.sku || '').trim();

      if (!trimmedSku) {
        alert('Por favor ingresa un SKU para el producto.');
        setUploadingProduct(false);
        return;
      }

      let imageUrl = productForm.imagen;
      let imagenesUrls = productForm.imagenes || [];

      // Upload all new images if selected
      if (productImages.length > 0) {
        console.log(`📸 Subiendo ${productImages.length} nuevas imágenes...`);
        const uploadPromises = productImages.map(async (file, index) => {
          const optimizedImage = await optimizeImageFile(file);
          const imageRef = ref(storage, `products/${Date.now()}_${index}_${optimizedImage.name}`);
          const snapshot = await uploadBytes(imageRef, optimizedImage);
          return await getDownloadURL(snapshot.ref);
        });

        const newImagenesUrls = await Promise.all(uploadPromises);
        console.log(`✅ ${newImagenesUrls.length} nuevas imágenes subidas`);

        // Combinar imágenes existentes + nuevas (no reemplazar)
        imagenesUrls = [...imagenesUrls, ...newImagenesUrls];

        // Solo actualizar imagen principal si no existe una
        if (!imageUrl) {
          imageUrl = newImagenesUrls[0];
        }

        console.log(`📦 Total de imágenes: ${imagenesUrls.length}`);
      }

      const priceAsNumber = parseInt(String(productForm.precio).replace(/\D/g, ''), 10) || 0;

      console.log('📦 Datos de imágenes a guardar:', {
        imagen: imageUrl,
        imagenes: imagenesUrls,
        totalImagenes: imagenesUrls.length
      });

      const productData: any = {
        nombre: productForm.nombre,
        precio: priceAsNumber,
        descripcion: productForm.descripcion,
        stock: Number(productForm.stock),
        minStock: Number(productForm.minStock),
        categoria: productForm.categoria,
        categorias: productForm.categorias,
        subcategoria: productForm.subcategoria,
        nuevo: productForm.nuevo,
        oferta: productForm.oferta,
        imagen: imageUrl,
        imagenes: imagenesUrls,
        sku: trimmedSku,
        activo: true,
      };

      // Solo agregar precioOriginal si tiene valor (evitar undefined)
      if (productForm.precioOriginal && productForm.precioOriginal > 0) {
        productData.precioOriginal = productForm.precioOriginal;
      }

      if (!productForm.id) {
        productData.fechaCreacion = new Date().toISOString();
      }

      // No es necesario limpiar porque ya no incluimos undefined
      const cleanedData = productData;

      if (productForm.id) {
        // Update existing product
        try {
          const productRef = doc(db, 'products', productForm.id);
          await updateDoc(productRef, cleanedData);
          alert('Producto actualizado exitosamente');
          refetch(); // Refetch to show the new data
        } catch (error) {
          console.error("Error updating product in Firestore: ", error);
          alert(`Error al actualizar el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      } else {
        // Create new product
        try {
          const docRef = await addDoc(collection(db, 'products'), cleanedData);
          console.log('✅ Producto creado con ID:', docRef.id);
          console.log('📸 Imágenes guardadas en Firestore:', cleanedData.imagenes);
          alert('Producto creado exitosamente');
          refetch(); // Refetch to get the new product with its ID
        } catch (error) {
          console.error("Error creating product in Firestore: ", error);
          alert(`Error al crear el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      // Reset form and close modal
      setProductForm({
        id: '',
        sku: '',
        nombre: '',
        precio: 0,
        precioOriginal: undefined,
        descripcion: '',
        stock: 0,
        minStock: 5,
        categoria: '',
        categorias: [],
        subcategoria: '',
        nuevo: false,
        oferta: false,
        imagen: '',
        imagenes: []
      });
      setProductImages([]);
      setProductImagePreviews([]);
      setShowProductModal(false);
    } catch (error) {
      alert('Error al guardar el producto');
    } finally {
      setUploadingProduct(false);
    }
  };

  const editProduct = (product: Product) => {
    // Si el producto tiene categorias, las usa; si no, convierte categoria a array para compatibilidad
    const categoriasArray = product.categorias && product.categorias.length > 0
      ? product.categorias
      : product.categoria ? [product.categoria] : [];

    setProductForm({
      id: product.id,
      sku: product.sku || '',
      nombre: product.nombre,
      precio: product.precio,
      precioOriginal: product.precioOriginal,
      descripcion: product.descripcion || '',
      stock: product.stock,
      minStock: product.minStock || 5,
      categoria: product.categoria,
      categorias: categoriasArray,
      subcategoria: product.subcategoria || '',
      nuevo: product.nuevo || false,
      oferta: product.oferta || false,
      imagen: product.imagen || '',
      imagenes: product.imagenes || []
    });
    setShowProductModal(true);
  };

  const deleteProduct = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await removeProduct(id);
        setSelectedProducts(prev => prev.filter(pId => pId !== id));
        alert('Producto eliminado exitosamente');
      } catch (error) {
        alert('Error al eliminar el producto');
      }
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, updates);
      refetch(); // Refetch to show the updated data
      alert('Producto actualizado exitosamente');
    } catch (error) {
      console.error("Error updating product: ", error);
      alert('Error al actualizar el producto');
    }
  };

  const deleteSelectedProducts = async () => {
    if (selectedProducts.length === 0) {
      alert('No hay productos seleccionados');
      return;
    }
    
    if (confirm(`¿Estás seguro de que deseas eliminar ${selectedProducts.length} producto(s)?`)) {
      try {
        await removeProducts(selectedProducts);
        setSelectedProducts([]);
        alert(`${selectedProducts.length} producto(s) eliminado(s) exitosamente`);
      } catch (error) {
        alert('Error al eliminar productos');
      }
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handlePopupImageUpload = async (file: File) => {
    if (!user) {
      alert(`Debes iniciar sesión como administrador para subir ${popupForm.isVideo ? 'videos' : 'imágenes'} del popup.`);
      return;
    }
    try {
      setPopupImageUploading(true);

      let finalFile = file;
      if (!popupForm.isVideo) {
        finalFile = await optimizeImageFile(file, {
          maxWidthOrHeight: 800,
          maxSizeMB: 0.8,
        });
      }

      const fileName = `config/offer-popup/${Date.now()}-${finalFile.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, finalFile, {
        contentType: finalFile.type || (popupForm.isVideo ? 'video/mp4' : 'image/jpeg')
      });
      const downloadURL = await getDownloadURL(snapshot.ref);
      setPopupForm((prev) => ({ ...prev, mediaUrl: downloadURL }));
    } catch (error) {
      console.error(`Error uploading popup ${popupForm.isVideo ? 'video' : 'image'}:`, error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      if (message.includes('storage/unauthorized')) {
        alert(`❌ No tienes permisos para subir este ${popupForm.isVideo ? 'video' : 'imagen'}. Verifica que estás autenticado como administrador y que las reglas de Firebase Storage lo permiten.`);
      } else {
        alert(`❌ Error al subir ${popupForm.isVideo ? 'el video' : 'la imagen'} del popup: ${message}`);
      }
    } finally {
      setPopupImageUploading(false);
    }
  };

  const popupSizePreset = POPUP_SIZE_PRESETS[popupForm.size] ?? POPUP_SIZE_PRESETS['2x2'];
  const popupRatio = popupSizePreset.height / popupSizePreset.width;
  const popupPreviewStyle = {
    width: `min(${popupSizePreset.width}px, calc(100% - 2rem), calc((100vh - 3rem) / ${popupRatio.toFixed(3)}))`,
    maxWidth: 'calc(100% - 2rem)'
  } as React.CSSProperties;

  // Advanced product filtering function
  const getFilteredProducts = () => {
    return products.filter(product => {
      // Category filter
      if (selectedCategory !== 'all' && !productHasCategory(product, selectedCategory)) {
        return false;
      }

      // Search filter
      if (productSearch) {
        const searchTerm = productSearch.toLowerCase();
        const searchableText = [
          product.nombre,
          product.descripcion || '',
          product.categoria,
          product.subcategoria || '',
          product.sku || ''
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Price range filter
      if (productFilters.priceRange.min && product.precio < parseFloat(productFilters.priceRange.min)) {
        return false;
      }
      if (productFilters.priceRange.max && product.precio > parseFloat(productFilters.priceRange.max)) {
        return false;
      }

      // Stock status filter
      if (productFilters.stockStatus !== 'all') {
        const minStock = product.minStock || 5;
        switch (productFilters.stockStatus) {
          case 'out_of_stock':
            if (product.stock > 0) return false;
            break;
          case 'low_stock':
            if (product.stock === 0 || product.stock > minStock) return false;
            break;
          case 'in_stock':
            if (product.stock <= minStock) return false;
            break;
        }
      }

      // Status filter (active/inactive)
      if (productFilters.status !== 'all') {
        const isActive = product.activo !== false;
        if (productFilters.status === 'active' && !isActive) return false;
        if (productFilters.status === 'inactive' && isActive) return false;
      }

      // Tags filter (nuevo, oferta)
      if (productFilters.tags.length > 0) {
        const hasRequiredTags = productFilters.tags.every(tag => {
          if (tag === 'nuevo') return product.nuevo === true;
          if (tag === 'oferta') return product.oferta === true;
          return false;
        });
        if (!hasRequiredTags) return false;
      }

      return true;
    });
  };

  const selectAllProducts = () => {
    const filteredProducts = getFilteredProducts();
    const allIds = filteredProducts.map(p => p.id);
    setSelectedProducts(allIds);
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      await updateDoc(doc(db, 'orders', orderId), { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Send notification message about status change
      const statusMessages = {
        confirmed: `✅ **Pago Confirmado** - ${new Date().toLocaleString('es-CL')}\n\nTu pedido #${orderId.slice(-8).toUpperCase()} ha sido confirmado exitosamente. Hemos verificado tu pago y ahora estamos preparando tus productos para el envío.\n\n📋 **Siguiente paso:** Verificación de stock y preparación del pedido`,
        preparing: `📦 **Preparando Pedido** - ${new Date().toLocaleString('es-CL')}\n\nEstamos verificando el stock y preparando tu pedido #${orderId.slice(-8).toUpperCase()} para el envío. Nuestro equipo está seleccionando cuidadosamente tus productos.\n\n🚚 **Siguiente paso:** Envío del pedido`,
        shipped: `🚚 **Pedido Enviado** - ${new Date().toLocaleString('es-CL')}\n\n¡Tu pedido #${orderId.slice(-8).toUpperCase()} está en camino! Hemos entregado tu paquete al servicio de envío y pronto estará en tus manos.\n\n📍 **Siguiente paso:** Entrega en tu dirección`,
        delivered: `🎉 **Pedido Entregado** - ${new Date().toLocaleString('es-CL')}\n\n¡Excelente! Tu pedido #${orderId.slice(-8).toUpperCase()} ha sido entregado exitosamente. Esperamos que disfrutes tu compra.\n\n⭐ ¡No olvides dejarnos tu opinión!`,
        cancelled: `❌ **Pedido Cancelado** - ${new Date().toLocaleString('es-CL')}\n\nTu pedido #${orderId.slice(-8).toUpperCase()} ha sido cancelado. Si tienes dudas sobre esta cancelación o necesitas ayuda, no dudes en contactarnos.`
      };

      const statusMessage = statusMessages[newStatus as keyof typeof statusMessages];
      if (statusMessage && order.customerEmail) {
        // Try to find user by email to send notification
        await sendOrderNotification(orderId, order.customerEmail, order.customerName, statusMessage);
      }

      // Regenerar reporte diario cuando se entrega un pedido
      if (newStatus === 'delivered') {
        try {
          // const today = new Date().toISOString().split('T')[0];
          // const { generateDailyReportUtil } = await import('@/utils/reportUtils');
          // await generateDailyReportUtil(today);
        } catch (error) {
          console.error('Error regenerando reporte diario:', error);
        }
      }
      
      loadOrders();
    } catch (error) {
      alert('Error al actualizar el pedido');
    }
  };

  const sendOrderNotification = async (orderId: string, customerEmail: string, customerName: string, message: string) => {
    try {
      await addDoc(collection(db, 'chat_messages'), {
        orderId: orderId,
        userId: customerEmail, // Use email as userId for guests
        userEmail: customerEmail,
        userName: customerName,
        message: message,
        isAdmin: true,
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error('Error sending order notification:', error);
    }
  };


  const getOrderMessageCount = (orderId: string) => {
    return chatMessages.filter(msg => msg.orderId === orderId && !msg.read && !msg.isAdmin).length;
  };

  const openChatPopup = (order: Order) => {
    setChatPopupOrder(order);
    setIsChatPopupOpen(true);
  };

  const closeChatPopup = () => {
    setIsChatPopupOpen(false);
    setChatPopupOrder(null);
  };

  const handleDeleteSelectedOrders = async () => {
    if (selectedOrders.length === 0) {
      alert('⚠️ No has seleccionado ningún pedido para eliminar.');
      return;
    }

    if (!confirm(`⚠️ ¿Estás seguro de que quieres eliminar ${selectedOrders.length} pedido(s)?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingOrders(true);
    try {
      // Eliminar pedidos seleccionados
      for (const orderId of selectedOrders) {
        await deleteDoc(doc(db, 'orders', orderId));

        // Eliminar mensajes de chat asociados
        const messagesQuery = query(
          collection(db, 'chat_messages'),
          where('orderId', '==', orderId)
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        for (const messageDoc of messagesSnapshot.docs) {
          await deleteDoc(messageDoc.ref);
        }
      }

      alert(`✅ ${selectedOrders.length} pedido(s) eliminado(s) exitosamente.`);
      setSelectedOrders([]);
      refetch();
    } catch (error) {
      alert('❌ Error al eliminar pedidos');
      console.error('Error deleting orders:', error);
    } finally {
      setDeletingOrders(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAllOrders = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getOrderTimeline = (order: Order) => {
    const timeline = [
      {
        status: 'pending',
        title: 'Recibido',
        icon: ClockIcon,
        completed: true,
        date: order.createdAt
      },
      {
        status: 'confirmed',
        title: 'Confirmado',
        icon: CreditCardIcon,
        completed: ['confirmed', 'preparing', 'shipped', 'delivered'].includes(order.status),
        date: order.status !== 'pending' ? order.createdAt : null
      },
      {
        status: 'preparing',
        title: 'Preparando',
        icon: CubeIcon,
        completed: ['preparing', 'shipped', 'delivered'].includes(order.status),
        date: order.status === 'preparing' || ['shipped', 'delivered'].includes(order.status) ? order.createdAt : null
      },
      {
        status: 'shipped',
        title: 'Enviado',
        icon: TruckIcon,
        completed: ['shipped', 'delivered'].includes(order.status),
        date: order.status === 'shipped' || order.status === 'delivered' ? order.createdAt : null
      },
      {
        status: 'delivered',
        title: 'Entregado',
        icon: CheckCircleIcon,
        completed: order.status === 'delivered',
        date: order.status === 'delivered' ? order.createdAt : null
      }
    ];

    return timeline.filter(item => order.status !== 'cancelled');
  };

  const toggleGroupExpansion = (groupIndex: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupIndex)) {
      newExpanded.delete(groupIndex);
    } else {
      newExpanded.add(groupIndex);
    }
    setExpandedGroups(newExpanded);
  };

  const groupOrdersByUser = (orders: Order[]) => {
    const grouped: { [key: string]: Order[] } = {};

    orders.forEach(order => {
      // Group by user email OR user ID, prioritizing email
      const key = order.customerEmail || 'unknown-user';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(order);
    });

    // Convert to array and sort each group by date (most recent first)
    return Object.values(grouped).map(userOrders => {
      return userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }).sort((a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime());
  };

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading || userAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#F16529' }}></div>
      </div>
    );
  }

  // Bloquear acceso si no es administrador
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">🛡️ Admin Panel</h1>
            <p className="text-gray-600 mt-2">Importadora F&D</p>
          </div>

          {!user ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
              />
            </div>

            {loginError && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full text-white font-semibold text-base py-3 px-6 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
            >
              {loggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 font-semibold">⛔ Acceso Denegado</p>
                <p className="text-red-600 text-sm mt-2">
                  No tienes permisos de administrador para acceder a esta página.
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="w-full text-white font-semibold py-2 px-4 rounded-md transition-colors"
                style={{ backgroundColor: '#F16529' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
              >
                Volver al Inicio
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        #admin-container * {
          font-size: 1.02em !important;
        }
      `}</style>
      <div id="admin-container" className="min-h-screen bg-gradient-to-br from-orange-50/30 via-red-50/20 to-orange-100/40">

      <header className="bg-white/80 backdrop-blur-lg shadow-xl border-b border-orange-100">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#F16529' }}>
                <span className="text-white text-lg">🏪</span>
              </div>
              <h1 className="text-xl font-bold" style={{ color: '#F16529' }}>
                F&D Admin Panel
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
              style={{ backgroundColor: '#F16529' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Compact Admin Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-xl p-4 mb-6 border border-orange-200" style={{ backgroundColor: '#F16529' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Panel de Administración</h1>
                <p className="text-orange-100 text-xs">Gestiona tu tienda</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-white font-semibold text-xs">🏪 FYD</span>
            </div>
          </div>

          {/* Horizontal Navigation */}
          <nav className="flex flex-wrap gap-2">
                          {[
                { id: 'dashboard', name: 'Dashboard & Reportes', icon: '🏠' },
                { id: 'products', name: 'Productos & Stock', icon: '📦' },
                { id: 'orders', name: 'Pedidos', icon: '🛒', badge: newOrdersCount > 0 ? newOrdersCount : null, badgeColor: 'bg-red-500' },
                { id: 'user-management', name: 'Gestión de Usuario', icon: '👥' },
                { id: 'main-banner', name: 'Banners', icon: '🏆' },
                { id: 'product-layout', name: 'Layout Productos', icon: '🔲' },
                { id: 'secciones', name: 'Secciones', icon: '📑' },
                { id: 'popup', name: 'Popup Ofertas', icon: '🎉' },
                { id: 'logo', name: 'Logo', icon: '🏪' },
                { id: 'categories', name: 'Categorías', icon: '🏷️' },
                { id: 'homepage-content', name: 'Contenido Página', icon: '🎨' },
                { id: 'footer', name: 'Información', icon: '📋' },
                { id: 'bank-details', name: 'Datos Bancarios', icon: '🏦' }
              ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'bg-white text-orange-600 shadow-lg transform scale-105'
                    : 'text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-semibold whitespace-nowrap">{tab.name}</span>
                {'badge' in tab && tab.badge && (
                  <span className={`absolute -top-2 -right-2 ${tab.badgeColor || 'bg-red-500'} text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse`}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        
        {activeTab === 'dashboard' && (
          <div className="space-y-8">

            {/* Dashboard & Reportes Header */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#F16529' }}>
                    <span className="text-white text-lg">🏠</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard & Reportes</h2>
                    <p className="text-gray-600 text-sm">Panel principal con estadísticas y exportación</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const currentMonth = today.toISOString().slice(0, 7);
                      const monthName = today.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

                      // Generate a simple PDF report with current data
                      const reportData = {
                        month: currentMonth,
                        monthName: monthName,
                        totalSales: stats.totalRevenue,
                        totalOrders: stats.totalOrders,
                        averageOrderValue: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0,
                        topProducts: orders.flatMap(order => order.items)
                          .reduce((acc, item) => {
                            const existing = acc.find(p => p.nombre === item.nombre);
                            if (existing) {
                              existing.quantity += item.cantidad;
                              existing.revenue += item.precio * item.cantidad;
                            } else {
                              acc.push({
                                nombre: item.nombre,
                                quantity: item.cantidad,
                                revenue: item.precio * item.cantidad
                              });
                            }
                            return acc;
                          }, [] as any[])
                          .sort((a, b) => b.revenue - a.revenue)
                          .slice(0, 5)
                      };

                      // Simple export alert for now (could be enhanced with actual PDF generation)
                      alert(`Reporte de ${monthName}\n\nVentas totales: ${formatPrice(reportData.totalSales)}\nPedidos: ${reportData.totalOrders}\nVenta promedio: ${formatPrice(reportData.averageOrderValue)}\n\nProducto más vendido: ${reportData.topProducts[0]?.nombre || 'N/A'}`);
                    }}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
                  >
                    📊 Exportar Reporte
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 rounded-2xl text-white text-2xl mr-4 shadow-lg" style={{ backgroundColor: '#F16529' }}>📦</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F16529' }}>Total Productos</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 rounded-2xl text-white text-2xl mr-4 shadow-lg" style={{ backgroundColor: '#F16529' }}>🛒</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F16529' }}>Total Pedidos</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 rounded-2xl text-white text-2xl mr-4 shadow-lg" style={{ backgroundColor: '#F16529' }}>💰</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F16529' }}>Ingresos Totales</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {formatPrice(stats.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 rounded-2xl text-white text-2xl mr-4 shadow-lg" style={{ backgroundColor: '#F16529' }}>⏳</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F16529' }}>Pedidos Pendientes</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.pendingOrders}</p>
                  </div>
                </div>
              </div>
            </div>


            {/* Modern Recent Orders Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100">
              <div className="p-6 border-b border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#F16529' }}>
                    <span className="text-white text-sm">📋</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Pedidos Recientes</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pedidos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Comprado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Último Pedido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estados
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ordersByCustomer.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-6 text-center text-sm text-gray-500">
                          No hay pedidos registrados todavía.
                        </td>
                      </tr>
                    ) : (
                      ordersByCustomer.slice(0, 5).map((group) => (
                        <tr key={group.lastOrderId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {group.customerName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {group.customerEmail}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {group.orderCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(group.totalSpent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {group.lastOrderDate.toLocaleDateString('es-CL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(group.statusBreakdown).map(([status, count]) => (
                                <span
                                  key={status}
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    statusClassMap[status as OrderStatus] || 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {statusLabelMap[status as OrderStatus]} · {count}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gestión de Productos</h2>
              <Link
                href="/admin/productos/nuevo"
                className="text-white px-4 py-2 rounded-md transition-colors inline-block"
                style={{ backgroundColor: '#F16529' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
              >
                <span className="text-lg mr-2">➕</span>
                Agregar Producto
              </Link>
            </div>

            {/* Compact Low Stock Alert Section */}
            {(() => {
              const lowStockProducts = products.filter(product => {
                const minStock = product.minStock || 5;
                return product.stock <= minStock;
              });

              if (lowStockProducts.length === 0) return null;

              // Count by severity
              const outOfStock = lowStockProducts.filter(p => p.stock === 0).length;
              const critical = lowStockProducts.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5) / 2).length;
              const low = lowStockProducts.length - outOfStock - critical;

              return (
                <div className="mb-6">
                  {/* Compact Alert Button */}
                  <div
                    onClick={() => setShowStockAlert(!showStockAlert)}
                    className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] animate-pulse-slow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative mr-3">
                          <ExclamationTriangleIcon className="h-6 w-6 animate-bounce" />
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-ping"></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            🚨 {lowStockProducts.length} Producto{lowStockProducts.length !== 1 ? 's' : ''} con Stock Bajo
                          </h3>
                          <div className="flex items-center space-x-3 text-sm">
                            {outOfStock > 0 && (
                              <span className="bg-red-700 px-2 py-1 rounded-full text-xs font-bold">
                                {outOfStock} Sin Stock
                              </span>
                            )}
                            {critical > 0 && (
                              <span className="bg-orange-700 px-2 py-1 rounded-full text-xs font-bold">
                                {critical} Crítico{critical !== 1 ? 's' : ''}
                              </span>
                            )}
                            {low > 0 && (
                              <span className="bg-yellow-600 px-2 py-1 rounded-full text-xs font-bold">
                                {low} Bajo{low !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm mr-2">Click para {showStockAlert ? 'ocultar' : 'ver'}</span>
                        <div className={`transform transition-transform duration-300 ${showStockAlert ? 'rotate-180' : ''}`}>
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Stock List */}
                  {showStockAlert && (
                    <div className="mt-4 bg-white border-2 border-red-200 rounded-xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 border-b border-red-200">
                        <h4 className="font-bold text-red-800 flex items-center">
                          📋 Lista Detallada de Productos
                          <span className="ml-2 text-sm text-red-600">({lowStockProducts.length} productos)</span>
                        </h4>
                      </div>

                      {/* Stock List Table */}
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr className="text-left text-xs font-semibold text-gray-600 uppercase">
                              <th className="px-4 py-2">Producto</th>
                              <th className="px-4 py-2">Estado</th>
                              <th className="px-4 py-2">Stock</th>
                              <th className="px-4 py-2">Mínimo</th>
                              <th className="px-4 py-2">Nivel</th>
                              <th className="px-4 py-2">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {lowStockProducts.map((product) => {
                              const minStock = product.minStock || 5;
                              const isOutOfStock = product.stock === 0;
                              const isCritical = product.stock <= minStock / 2;
                              const stockPercentage = Math.min((product.stock / minStock) * 100, 100);

                              return (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{product.nombre}</div>
                                    <div className="text-xs text-gray-500">{product.categoria}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                                      isOutOfStock
                                        ? 'bg-red-100 text-red-800'
                                        : isCritical
                                          ? 'bg-orange-100 text-orange-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {isOutOfStock ? '🔴 Sin Stock' : isCritical ? '🟠 Crítico' : '🟡 Bajo'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`font-bold ${
                                      isOutOfStock ? 'text-red-600' : isCritical ? 'text-orange-600' : 'text-yellow-700'
                                    }`}>
                                      {product.stock}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-gray-600">{minStock}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            isOutOfStock ? 'bg-red-500' : isCritical ? 'bg-orange-500' : 'bg-yellow-500'
                                          }`}
                                          style={{ width: `${stockPercentage}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-gray-600">{Math.round(stockPercentage)}%</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => {
                                          const newStock = prompt(`Nuevo stock para "${product.nombre}":`, product.stock.toString());
                                          if (newStock && !isNaN(parseInt(newStock))) {
                                            updateProduct(product.id, { stock: parseInt(newStock) });
                                          }
                                        }}
                                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 rounded transition-colors"
                                        title="Ajustar Stock"
                                      >
                                        📈
                                      </button>
                                      <button
                                        onClick={() => {
                                          const minStockNew = prompt(`Stock mínimo para "${product.nombre}":`, minStock.toString());
                                          if (minStockNew && !isNaN(parseInt(minStockNew))) {
                                            updateProduct(product.id, { minStock: parseInt(minStockNew) });
                                          }
                                        }}
                                        className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded transition-colors"
                                        title="Configurar Mínimo"
                                      >
                                        ⚙️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Quick Actions Footer */}
                      <div className="bg-gray-50 p-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            💡 Tip: Haz clic en los botones de acción para gestionar el stock rápidamente
                          </span>
                          <button
                            onClick={() => setShowStockAlert(false)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cerrar Lista
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}


            {/* Advanced Search and Filters Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-lg mb-6">
              {/* Search Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <div className="h-6 w-6 text-blue-600">🔍</div>
                  </div>
                  <h3 className="text-lg font-bold text-blue-800">
                    Buscar y Filtrar Productos
                  </h3>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <span>⚙️</span>
                  <span>{showFilters ? 'Ocultar Filtros' : 'Filtros Avanzados'}</span>
                </button>
              </div>

              {/* Main Search Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="🔍 Buscar por nombre, descripción, SKU o categoría..."
                      className="w-full pl-4 pr-12 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 text-sm"
                    />
                    {productSearch && (
                      <button
                        onClick={() => setProductSearch('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 text-sm"
                  >
                    <option value="all">📦 Todas las categorías</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Filters (Collapsible) */}
              {showFilters && (
                <div className="bg-white bg-opacity-80 rounded-xl p-4 space-y-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-800 flex items-center">
                    🎯 Filtros Avanzados
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💰 Rango de Precio
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={productFilters.priceRange.min}
                          onChange={(e) => setProductFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, min: e.target.value }
                          }))}
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={productFilters.priceRange.max}
                          onChange={(e) => setProductFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, max: e.target.value }
                          }))}
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📊 Estado de Stock
                      </label>
                      <select
                        value={productFilters.stockStatus}
                        onChange={(e) => setProductFilters(prev => ({
                          ...prev,
                          stockStatus: e.target.value
                        }))}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all">Todos</option>
                        <option value="in_stock">Con Stock</option>
                        <option value="low_stock">Stock Bajo</option>
                        <option value="out_of_stock">Sin Stock</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔘 Estado
                      </label>
                      <select
                        value={productFilters.status}
                        onChange={(e) => setProductFilters(prev => ({
                          ...prev,
                          status: e.target.value
                        }))}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                      </select>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🏷️ Etiquetas
                      </label>
                      <div className="space-y-1">
                        <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={productFilters.tags.includes('nuevo')}
                            onChange={(e) => {
                              const newTags = e.target.checked
                                ? [...productFilters.tags, 'nuevo']
                                : productFilters.tags.filter(t => t !== 'nuevo');
                              setProductFilters(prev => ({ ...prev, tags: newTags }));
                            }}
                            className="mr-2"
                          />
                          ✨ Nuevos
                        </label>
                        <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={productFilters.tags.includes('oferta')}
                            onChange={(e) => {
                              const newTags = e.target.checked
                                ? [...productFilters.tags, 'oferta']
                                : productFilters.tags.filter(t => t !== 'oferta');
                              setProductFilters(prev => ({ ...prev, tags: newTags }));
                            }}
                            className="mr-2"
                          />
                          🔥 Ofertas
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setProductSearch('');
                        setSelectedCategory('all');
                        setProductFilters({
                          priceRange: { min: '', max: '' },
                          stockStatus: 'all',
                          status: 'all',
                          tags: []
                        });
                      }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🗑️ Limpiar Filtros
                    </button>
                  </div>
                </div>
              )}

              {/* Results Summary */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    📊 {getFilteredProducts().length} de {products.length} productos
                  </span>
                  {(productSearch || selectedCategory !== 'all' || showFilters) && (
                    <div className="flex items-center space-x-2">
                      {productSearch && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          🔍 "{productSearch}"
                        </span>
                      )}
                      {selectedCategory !== 'all' && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                          📦 {categories.find(c => c.id === selectedCategory)?.name}
                        </span>
                      )}
                      {productFilters.tags.map(tag => (
                        <span key={tag} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                          {tag === 'nuevo' ? '✨ Nuevo' : '🔥 Oferta'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-blue-600">
                  💡 Tip: Usa los filtros para encontrar productos específicos
                </div>
              </div>
            </div>

            
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {selectedProducts.length} producto(s) seleccionado(s)
                  </span>
                  <button
                    onClick={selectAllProducts}
                    className="text-sm hover:opacity-80 transition-opacity" style={{ color: '#F16529' }}
                  >
                    Seleccionar todo
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Limpiar selección
                  </button>
                </div>
                {selectedProducts.length > 0 && (
                  <button
                    onClick={deleteSelectedProducts}
                    className="px-4 py-2 text-white rounded-md text-sm" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                  >
                    <span className="text-lg mr-2">🗑️</span>
                    Eliminar seleccionados ({selectedProducts.length})
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={getFilteredProducts().length > 0 && getFilteredProducts().every(p => selectedProducts.includes(p.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAllProducts();
                            } else {
                              clearSelection();
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredProducts().map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 mr-4">
                              {product.imagen ? (
                                <Image
                                  src={product.imagen}
                                  alt={product.nombre}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 object-cover rounded"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                                  📦
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.nombre}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                SKU: {product.sku && product.sku.trim() ? product.sku : 'No asignado'}
                              </div>
                              <div className="flex space-x-1 mt-1">
                                {product.nuevo && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    Nuevo
                                  </span>
                                )}
                                {product.oferta && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                    Oferta
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(product.precio)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            product.stock > 10 ? 'text-green-600' :
                            product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {product.categoria}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => editProduct(product)}
                            className="hover:opacity-80 transition-opacity" style={{ color: '#F16529' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="hover:opacity-80 transition-opacity" style={{ color: '#F16529' }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-bold text-blue-600">{getFilteredProducts().length}</span> de <span className="font-medium">{products.length}</span> productos
                    {(productSearch || selectedCategory !== 'all' || productFilters.tags.length > 0) && (
                      <span className="text-blue-600 ml-1">con filtros aplicados</span>
                    )}
                  </p>
                  {getFilteredProducts().length !== products.length && (
                    <button
                      onClick={() => {
                        setProductSearch('');
                        setSelectedCategory('all');
                        setProductFilters({
                          priceRange: { min: '', max: '' },
                          stockStatus: 'all',
                          status: 'all',
                          tags: []
                        });
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Ver todos los productos
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'user-management' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">👥 Gestión de Usuarios</h2>
                <button
                  onClick={loadUsers}
                  disabled={usersLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {usersLoading ? 'Cargando...' : '🔄 Recargar Usuarios'}
                </button>
              </div>

              {/* Buscador de usuarios */}
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Buscar Usuario por Correo</h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Ingresa el correo electrónico..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        searchUserByEmail(userSearchQuery);
                      }
                    }}
                    className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => searchUserByEmail(userSearchQuery)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Buscar
                  </button>
                  {selectedUserDetails && (
                    <button
                      onClick={() => {
                        setUserSearchQuery('');
                        setSelectedUserDetails(null);
                        setSelectedUserOrders([]);
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Modal de detalles del usuario */}
              {selectedUserDetails && (
                <div
                  className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  onClick={() => {
                    setSelectedUserDetails(null);
                    setSelectedUserOrders([]);
                  }}
                >
                  <div
                    className="bg-white rounded-xl border-2 border-blue-300 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 flex justify-between items-center">
                      <h3 className="text-xl font-bold">📋 Información del Usuario</h3>
                      <button
                        onClick={() => {
                          setSelectedUserDetails(null);
                          setSelectedUserOrders([]);
                        }}
                        className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                  <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Nombre Completo</label>
                        <p className="text-lg font-medium text-gray-900">
                          {selectedUserDetails.firstName} {selectedUserDetails.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Correo Electrónico</label>
                        <p className="text-lg font-medium text-gray-900">{selectedUserDetails.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Teléfono</label>
                        <p className="text-lg font-medium text-gray-900">{selectedUserDetails.phone || 'No registrado'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Rol</label>
                        <p>
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getRoleColor(selectedUserDetails.role || 'cliente')}`}>
                            {selectedUserDetails.role || 'cliente'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Estado</label>
                        <p>
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${
                            selectedUserDetails.blocked
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            {selectedUserDetails.blocked ? '🚫 Bloqueado' : '✅ Activo'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Fecha de Registro</label>
                        <p className="text-lg font-medium text-gray-900">
                          {selectedUserDetails.createdAt ? new Date(selectedUserDetails.createdAt.toDate()).toLocaleDateString('es-CL') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Historial de compras */}
                    <div className="border-t pt-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4">
                        🛒 Historial de Compras ({selectedUserOrders.length})
                      </h4>

                      {selectedUserOrders.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">Este usuario no ha realizado ninguna compra</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedUserOrders.map((order) => (
                            <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-bold text-gray-700">
                                      Pedido #{order.id.slice(-8).toUpperCase()}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      order.status === 'delivered' || order.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : order.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {order.status === 'pending' && '⏳ Pendiente'}
                                      {order.status === 'confirmed' && '✅ Confirmado'}
                                      {order.status === 'preparing' && '📦 Preparando'}
                                      {order.status === 'shipped' && '🚚 Enviado'}
                                      {(order.status === 'delivered' || order.status === 'completed') && '✔️ Entregado'}
                                      {order.status === 'cancelled' && '❌ Cancelado'}
                                    </span>
                                  </div>

                                  <div className="text-sm text-gray-600">
                                    <p>Fecha: {new Date(order.createdAt).toLocaleDateString('es-CL')} - {new Date(order.createdAt).toLocaleTimeString('es-CL')}</p>
                                    <p>Total: <span className="font-bold text-gray-900">{formatPrice(order.total)}</span></p>
                                    <p>Productos: {order.items?.length || 0} artículo(s)</p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => window.open(`/admin/pedido/${order.id}`, '_blank')}
                                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-md text-xs transition-colors"
                                >
                                  Ver Detalles
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Resumen estadístico */}
                      {selectedUserOrders.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm font-semibold text-blue-800">Total Gastado</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {formatPrice(selectedUserOrders.reduce((sum, order) => sum + order.total, 0))}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-sm font-semibold text-green-800">Pedidos Completados</p>
                            <p className="text-2xl font-bold text-green-900">
                              {selectedUserOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length}
                            </p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <p className="text-sm font-semibold text-orange-800">Promedio por Pedido</p>
                            <p className="text-2xl font-bold text-orange-900">
                              {formatPrice(selectedUserOrders.reduce((sum, order) => sum + order.total, 0) / selectedUserOrders.length)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              )}

              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="text-xl">Cargando usuarios...</div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios encontrados</h3>
                  <p className="text-gray-600 mb-4">
                    Puede que no haya usuarios registrados o que haya un problema de conexión con Firebase.
                  </p>
                  <button
                    onClick={loadUsers}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md"
                  >
                    🔄 Intentar de nuevo
                  </button>
                </div>
              ) : (
                <>
                  {/* Admins y Vendedores - Siempre visibles */}
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        👑 Administradores y Vendedores ({users.filter(u => u.role === 'admin' || u.role === 'vendedor').length})
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha Registro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users
                            .filter(user => user.role === 'admin' || user.role === 'vendedor')
                            .map((user) => (
                            <tr
                              key={user.uid}
                              className="hover:bg-blue-50 cursor-pointer transition-colors"
                              onClick={() => loadUserDetails(user)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {editingUser === user.uid ? (
                                  <select
                                    defaultValue={user.role}
                                    onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                  >
                                    <option value="cliente">Cliente</option>
                                    <option value="vendedor">Vendedor</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.role || 'cliente')}`}>
                                    {user.role || 'cliente'}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                                  user.blocked
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : 'bg-green-100 text-green-800 border-green-200'
                                }`}>
                                  {user.blocked ? '🚫 Bloqueado' : '✅ Activo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.createdAt ? new Date(user.createdAt.toString()).toLocaleDateString('es-CL') : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                                {editingUser === user.uid ? (
                                  <button
                                    onClick={() => setEditingUser(null)}
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    Cancelar
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setEditingUser(user.uid)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Editar Rol
                                    </button>
                                    <button
                                      onClick={() => deleteUser(user.uid)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Eliminar
                                    </button>
                                    {user.blocked ? (
                                      <button
                                        onClick={() => unblockUser(user.uid)}
                                        className="text-green-600 hover:text-green-900"
                                      >
                                        ✅ Desbloquear
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => blockUser(user.uid)}
                                        className="text-orange-600 hover:text-orange-900"
                                      >
                                        🚫 Bloquear
                                      </button>
                                    )}
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Clientes - Colapsable */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowClientes(!showClientes)}
                      className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-3 hover:from-blue-100 hover:to-indigo-100 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">
                          👤 Clientes ({users.filter(u => !u.role || u.role === 'cliente').length})
                        </h3>
                        <span className="text-2xl">
                          {showClientes ? '▼' : '▶'}
                        </span>
                      </div>
                    </button>

                    {showClientes && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rol
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha Registro
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {users
                              .filter(user => !user.role || user.role === 'cliente')
                              .map((user) => (
                              <tr
                                key={user.uid}
                                className="hover:bg-blue-50 cursor-pointer transition-colors"
                                onClick={() => loadUserDetails(user)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {user.firstName} {user.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {editingUser === user.uid ? (
                                    <select
                                      defaultValue={user.role}
                                      onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                                      className="text-sm border border-gray-300 rounded px-2 py-1"
                                    >
                                      <option value="cliente">Cliente</option>
                                      <option value="vendedor">Vendedor</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  ) : (
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.role || 'cliente')}`}>
                                      {user.role || 'cliente'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                                    user.blocked
                                      ? 'bg-red-100 text-red-800 border-red-200'
                                      : 'bg-green-100 text-green-800 border-green-200'
                                  }`}>
                                    {user.blocked ? '🚫 Bloqueado' : '✅ Activo'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.createdAt ? new Date(user.createdAt.toString()).toLocaleDateString('es-CL') : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                                  {editingUser === user.uid ? (
                                    <button
                                      onClick={() => setEditingUser(null)}
                                      className="text-gray-600 hover:text-gray-900"
                                    >
                                      Cancelar
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => setEditingUser(user.uid)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                      >
                                        Editar Rol
                                      </button>
                                      <button
                                        onClick={() => deleteUser(user.uid)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Eliminar
                                      </button>
                                      {user.blocked ? (
                                        <button
                                          onClick={() => unblockUser(user.uid)}
                                          className="text-green-600 hover:text-green-900"
                                        >
                                          ✅ Desbloquear
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => blockUser(user.uid)}
                                          className="text-orange-600 hover:text-orange-900"
                                        >
                                          🚫 Bloquear
                                        </button>
                                      )}
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Cómo crear usuarios vendedor</h3>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p><strong>Opción 1 - Firebase Console:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>Ve a Firebase Console &gt; Authentication &gt; Users</li>
                        <li>Haz clic en "Add user"</li>
                        <li>Ingresa email y contraseña</li>
                        <li>Aquí cambia el rol a "Vendedor"</li>
                      </ol>

                      <p className="mt-4"><strong>Opción 2 - Desde el sitio:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>El vendedor se registra normalmente en /auth</li>
                        <li>Por defecto tendrá rol "Cliente"</li>
                        <li>Aquí cambias su rol a "Vendedor"</li>
                      </ol>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Modern Orders Header */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-orange-100">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#F16529' }}>
                    <span className="text-white text-lg">🛒</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestión de Pedidos</h2>
                    <p className="text-gray-600 text-sm">Administra todos los pedidos de clientes</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  {selectedOrders.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-sm font-medium text-blue-700">
                        {selectedOrders.length} seleccionado(s)
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleDeleteSelectedOrders}
                    disabled={deletingOrders || selectedOrders.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                    style={{ backgroundColor: selectedOrders.length > 0 ? '#dc2626' : '#9ca3af' }}
                    onMouseEnter={(e) => selectedOrders.length > 0 && !deletingOrders && (e.currentTarget.style.backgroundColor = '#b91c1c')}
                    onMouseLeave={(e) => selectedOrders.length > 0 && !deletingOrders && (e.currentTarget.style.backgroundColor = '#dc2626')}
                  >
                    {deletingOrders ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <span>🗑️</span>
                        Eliminar Seleccionados
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sub-tabs para filtrar pedidos */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setOrdersFilter('active')}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md ${
                    ordersFilter === 'active'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-105 shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  📋 Pedidos Activos
                </button>
                <button
                  onClick={() => setOrdersFilter('completed')}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md ${
                    ordersFilter === 'completed'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white scale-105 shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  ✅ Historial de Ventas
                </button>
              </div>
            </div>

            {/* Búsqueda y Filtros */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-orange-100 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Búsqueda */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔍 Buscar pedido
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email, teléfono o ID..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Filtro por Estado */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📊 Filtrar por estado
                  </label>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">⏳ Pendiente</option>
                    <option value="pending_verification">🔍 Pendiente Verificación</option>
                    <option value="pending_payment">💳 Pendiente de Pago</option>
                    <option value="confirmed">✅ Confirmado</option>
                    <option value="preparing">📦 Preparando</option>
                    <option value="processing">⚙️ Procesando</option>
                    <option value="shipped">🚚 Enviado</option>
                    <option value="delivered">✔️ Entregado</option>
                    <option value="completed">🎉 Completado</option>
                  </select>
                </div>
              </div>

              {/* Contador de resultados */}
              {(orderSearchQuery || orderStatusFilter !== 'all') && (
                <div className="mt-4 text-sm text-gray-600">
                  {orders.filter(order => {
                    // Filtro base (activos/completados)
                    let passesMainFilter = false;
                    if (ordersFilter === 'active') {
                      passesMainFilter = ['pending', 'pending_verification', 'pending_payment', 'confirmed', 'preparing', 'processing', 'shipped'].includes(order.status);
                    } else {
                      passesMainFilter = ['delivered', 'completed'].includes(order.status);
                    }
                    if (!passesMainFilter) return false;

                    // Filtro por búsqueda
                    if (orderSearchQuery) {
                      const searchLower = orderSearchQuery.toLowerCase();
                      const matchesSearch =
                        order.customerName?.toLowerCase().includes(searchLower) ||
                        order.customerEmail?.toLowerCase().includes(searchLower) ||
                        order.customerPhone?.toLowerCase().includes(searchLower) ||
                        order.id?.toLowerCase().includes(searchLower);
                      if (!matchesSearch) return false;
                    }

                    // Filtro por estado
                    if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
                      return false;
                    }

                    return true;
                  }).length} pedidos encontrados
                </div>
              )}
            </div>

            {/* Modern Orders Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-orange-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-orange-100">
                  <thead className="bg-gradient-to-r from-orange-50 to-red-50">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === orders.length && orders.length > 0}
                          onChange={toggleSelectAllOrders}
                          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#F16529' }}>
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#F16529' }}>
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#F16529' }}>
                        Estado & Progreso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#F16529' }}>
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#F16529' }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupOrdersByUser(
                      orders.filter(order => {
                        // Filtro base (activos/completados)
                        let passesMainFilter = false;
                        if (ordersFilter === 'active') {
                          passesMainFilter = ['pending', 'pending_verification', 'pending_payment', 'confirmed', 'preparing', 'processing', 'shipped'].includes(order.status);
                        } else {
                          passesMainFilter = ['delivered', 'completed'].includes(order.status);
                        }
                        if (!passesMainFilter) return false;

                        // Filtro por búsqueda
                        if (orderSearchQuery) {
                          const searchLower = orderSearchQuery.toLowerCase();
                          const matchesSearch =
                            order.customerName?.toLowerCase().includes(searchLower) ||
                            order.customerEmail?.toLowerCase().includes(searchLower) ||
                            order.customerPhone?.toLowerCase().includes(searchLower) ||
                            order.id?.toLowerCase().includes(searchLower);
                          if (!matchesSearch) return false;
                        }

                        // Filtro por estado
                        if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
                          return false;
                        }

                        return true;
                      })
                    ).map((userOrders, groupIndex) => {
                      const mainOrder = userOrders[0]; // Usar el pedido más reciente como principal
                      const totalUserOrders = userOrders.length;
                      const totalAmount = userOrders.reduce((sum, order) => sum + order.total, 0);
                      
                      return (
                        <React.Fragment key={`group-${groupIndex}`}>
                          <tr key={mainOrder.id} className={totalUserOrders > 1 ? 'bg-blue-50' : ''}>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(mainOrder.id)}
                            onChange={() => toggleOrderSelection(mainOrder.id)}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {totalUserOrders > 1 && (
                              <button
                                onClick={() => toggleGroupExpansion(groupIndex)}
                                className="mr-2 p-1 rounded hover:bg-blue-200 transition-colors"
                              >
                                {expandedGroups.has(groupIndex) ? '▼' : '▶'}
                              </button>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {mainOrder.customerName}
                                {totalUserOrders > 1 && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {totalUserOrders} pedidos
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {mainOrder.customerEmail}
                              </div>
                              <div className="text-sm text-gray-500">
                                {mainOrder.customerPhone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {totalUserOrders > 1 ? (
                            <div>
                              <div className="font-medium">{formatPrice(totalAmount)}</div>
                              <div className="text-xs text-gray-500">Total {totalUserOrders} pedidos</div>
                            </div>
                          ) : (
                            formatPrice(mainOrder.total)
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {totalUserOrders > 1 ? (
                            <div className="text-xs text-gray-600">
                              <div className="font-medium">Estados múltiples</div>
                              <div className="text-xs text-gray-400">Ver detalles individuales</div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Selector de estado */}
                              <div>
                                <select
                                  value={mainOrder.status}
                                  onChange={(e) => updateOrderStatus(mainOrder.id, e.target.value)}
                                  className="w-full text-xs border-2 border-orange-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none font-medium"
                                >
                                  <option value="pending">⏳ Pendiente</option>
                                  <option value="confirmed">✅ Confirmado</option>
                                  <option value="preparing">📦 Preparando</option>
                                  <option value="shipped">🚚 Enviado</option>
                                  <option value="delivered">✔️ Entregado</option>
                                  <option value="cancelled">❌ Cancelado</option>
                                </select>
                              </div>

                              {/* Timeline compacto horizontal */}
                              <div className="flex items-center justify-start">
                                {getOrderTimeline(mainOrder).map((step, index) => {
                                  const IconComponent = step.icon;
                                  return (
                                    <React.Fragment key={step.status}>
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                                          step.completed
                                            ? 'bg-green-500 text-white border-green-500 shadow-md'
                                            : 'bg-gray-100 text-gray-400 border-gray-300'
                                        }`}
                                        title={step.title}
                                      >
                                        <IconComponent className="h-3 w-3" />
                                      </div>
                                      {index < getOrderTimeline(mainOrder).length - 1 && (
                                        <div className={`h-0.5 w-4 ${
                                          step.completed ? 'bg-green-500' : 'bg-gray-300'
                                        }`}></div>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(mainOrder.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(`/admin/pedido/${mainOrder.id}`, '_blank')}
                              className="relative bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-md text-xs transition-colors"
                            >
                              📋 Ver Detalles
                              {getOrderMessageCount(mainOrder.id) > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                  {getOrderMessageCount(mainOrder.id) > 9 ? '9+' : getOrderMessageCount(mainOrder.id)}
                                </span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Show individual orders when expanded */}
                      {totalUserOrders > 1 && expandedGroups.has(groupIndex) && userOrders.slice(1).map((order, orderIndex) => (
                        <tr key={`${groupIndex}-${orderIndex + 1}`} className="bg-blue-25 border-l-4 border-blue-300">
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                            />
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap pl-12">
                            <div className="text-sm text-gray-700">
                              <div className="font-medium">Pedido #{order.id.slice(-8).toUpperCase()}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(order.total)}
                          </td>
                          <td className="px-6 py-3">
                            <div className="space-y-3">
                              {/* Selector de estado */}
                              <div>
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  className="w-full text-xs border-2 border-orange-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none font-medium"
                                >
                                  <option value="pending">⏳ Pendiente</option>
                                  <option value="confirmed">✅ Confirmado</option>
                                  <option value="preparing">📦 Preparando</option>
                                  <option value="shipped">🚚 Enviado</option>
                                  <option value="delivered">✔️ Entregado</option>
                                  <option value="cancelled">❌ Cancelado</option>
                                </select>
                              </div>

                              {/* Timeline compacto horizontal */}
                              <div className="flex items-center justify-start">
                                {getOrderTimeline(order).map((step, index) => {
                                  const IconComponent = step.icon;
                                  return (
                                    <React.Fragment key={step.status}>
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                                          step.completed
                                            ? 'bg-green-500 text-white border-green-500 shadow-md'
                                            : 'bg-gray-100 text-gray-400 border-gray-300'
                                        }`}
                                        title={step.title}
                                      >
                                        <IconComponent className="h-3 w-3" />
                                      </div>
                                      {index < getOrderTimeline(order).length - 1 && (
                                        <div className={`h-0.5 w-4 ${
                                          step.completed ? 'bg-green-500' : 'bg-gray-300'
                                        }`}></div>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => window.open(`/admin/pedido/${order.id}`, '_blank')}
                                className="relative bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded-md text-xs transition-colors"
                              >
                                📋 Ver Detalles
                                {getOrderMessageCount(order.id) > 0 && (
                                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                    {getOrderMessageCount(order.id) > 9 ? '9+' : getOrderMessageCount(order.id)}
                                  </span>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'banner' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Gestión del Banner</h2>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título del Banner
                  </label>
                  <input
                    type="text"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto del Banner
                  </label>
                  <input
                    type="text"
                    value={bannerForm.text}
                    onChange={(e) => setBannerForm({ ...bannerForm, text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imágenes del Carrusel
                  </label>
                  {bannerForm.images.map((image, index) => (
                    <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <label className="block text-sm text-gray-600 mb-1">
                            Imagen {index + 1}
                          </label>
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              const newFiles = [...bannerFiles];
                              newFiles[index] = file;
                              setBannerFiles(newFiles);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                          />
                          {image && (
                            <div className="mt-2">
                              <img
                                loading="lazy"
                                src={image}
                                alt={`Banner ${index + 1}`}
                                className="h-20 w-32 object-cover rounded border"
                              />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = bannerForm.images.filter((_, i) => i !== index);
                            const newFiles = bannerFiles.filter((_, i) => i !== index);
                            setBannerForm({ ...bannerForm, images: newImages });
                            setBannerFiles([...newFiles, null]);
                          }}
                          className="px-3 py-2 text-white rounded-md mt-6" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setBannerForm({ ...bannerForm, images: [...bannerForm.images, ''] });
                      setBannerFiles([...bannerFiles, null]);
                    }}
                    className="mt-2 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    ➕ Agregar Imagen
                  </button>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bannerForm.active}
                    onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Banner Activo
                  </label>
                </div>
                
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      // console.log('🚀 Banner update started');
                      setUpdatingBanner(true);

                      // Upload new banner images
                      const imageUrls = [...bannerForm.images];
                      // console.log('📁 Banner files to upload:', bannerFiles.length);

                      for (let i = 0; i < bannerFiles.length; i++) {
                        const file = bannerFiles[i];
                        if (file) {
                          // console.log(`📤 Uploading banner ${i}:`, file.name);
                          const optimizedBannerFile = await optimizeImageFile(file);
                          // console.log(`✨ Optimized banner ${i}:`, optimizedBannerFile.size, 'bytes');
                          const imageRef = ref(storage, `banners/banner_${i}_${Date.now()}_${optimizedBannerFile.name}`);
                          // console.log(`☁️ Uploading to Storage:`, imageRef.fullPath);
                          const snapshot = await uploadBytes(imageRef, optimizedBannerFile);
                          const downloadUrl = await getDownloadURL(snapshot.ref);
                          // console.log(`✅ Banner ${i} uploaded:`, downloadUrl);
                          imageUrls[i] = downloadUrl;
                        }
                      }

                      try {
                        // Try to save banner configuration to Firebase
                        await setDoc(doc(db, 'config', 'banner'), {
                          title: bannerForm.title,
                          text: bannerForm.text,
                          active: bannerForm.active,
                          images: imageUrls,
                          updatedAt: new Date().toISOString()
                        });
                      } catch (firebaseError) {
                        // If Firebase fails (no auth), just update local state
                      }

                      // Update local state
                      setBannerForm({ ...bannerForm, images: imageUrls });
                      setBannerFiles([null, null, null]);
                      
                      alert('Banner actualizado exitosamente (modo local)');
                    } catch (error: unknown) {
                      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                      alert(`Error al actualizar banner: ${errorMessage}`);
                    } finally {
                      setUpdatingBanner(false);
                    }
                  }}
                  disabled={updatingBanner}
                  className="text-white font-semibold text-base py-3 px-6 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                >
                  {updatingBanner ? 'Actualizando...' : 'Actualizar Banner'}
                </button>
              </form>
              
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa:</h3>
                <div className="relative text-white py-12 rounded-lg overflow-hidden" style={{ background: 'linear-gradient(to right, #F16529, #F16529)' }}>
                  {bannerForm.images.length > 0 && bannerForm.images[0] && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-30"
                      style={{ backgroundImage: `url(${bannerForm.images[0]})` }}
                    />
                  )}
                  <div className="relative text-center">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                      {bannerForm.title}
                    </h1>
                    <p className="text-lg opacity-90">
                      {bannerForm.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'popup' && (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-xl shadow-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">🎯 Gestión de Popup</h1>
                  <p className="text-blue-100">Configura las ventanas emergentes promocionales</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Configuration Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Configuration */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">📝 Configuración Básica</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🏷️ Título del Popup
                      </label>
                      <input
                        type="text"
                        value={popupForm.title}
                        onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })}
                        placeholder="¡Oferta Especial!"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🎨 Tipo de Popup
                      </label>
                      <select
                        value={popupForm.popupType}
                        onChange={(e) => setPopupForm({ ...popupForm, popupType: e.target.value as 'category' | 'information' })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70"
                      >
                        <option value="category">🏷️ Categoría/Promocional</option>
                        <option value="information">ℹ️ Información</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📄 Descripción
                      </label>
                      <textarea
                        value={popupForm.description}
                        onChange={(e) => setPopupForm({ ...popupForm, description: e.target.value })}
                        placeholder="Descripción detallada de la oferta..."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🔗 Texto del Botón
                      </label>
                      <input
                        type="text"
                        value={popupForm.buttonText}
                        onChange={(e) => setPopupForm({ ...popupForm, buttonText: e.target.value })}
                        placeholder="Ver Ofertas"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70"
                      />
                    </div>
                  </div>
                </div>

                {/* Layout Configuration */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">🎯 Configuración de Layout</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📏 Tamaño del Popup
                      </label>
                      <select
                        value={popupForm.size}
                        onChange={(e) => setPopupForm({ ...popupForm, size: (isPopupSize(e.target.value) ? e.target.value : '2x2') })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70"
                      >
                        {Object.entries(POPUP_SIZE_PRESETS).map(([value, config]) => (
                          <option key={value} value={value}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📍 Posición en Pantalla
                      </label>
                      <select
                        value={popupForm.position}
                        onChange={(e) => setPopupForm({ ...popupForm, position: e.target.value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/70"
                      >
                        <option value="bottom-right">🔽➡️ Esquina inferior derecha</option>
                        <option value="bottom-left">🔽⬅️ Esquina inferior izquierda</option>
                        <option value="top-right">🔼➡️ Esquina superior derecha</option>
                        <option value="top-left">🔼⬅️ Esquina superior izquierda</option>
                        <option value="center">🎯 Centro</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Media Configuration */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">🎬 Contenido Multimedia</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        📸 Tipo de Contenido
                      </label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="mediaType"
                            checked={!popupForm.isVideo}
                            onChange={() => setPopupForm(prev => ({ ...prev, isVideo: false, mediaUrl: '' }))}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">🖼️ Imagen</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="mediaType"
                            checked={popupForm.isVideo}
                            onChange={() => setPopupForm(prev => ({ ...prev, isVideo: true, mediaUrl: '' }))}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">🎥 Video</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📤 Subir Archivo
                      </label>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept={popupForm.isVideo ? "video/*" : "image/*"}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handlePopupImageUpload(file);
                            }
                          }}
                          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        {popupImageUploading && (
                          <div className="flex items-center gap-2 text-green-600">
                            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-sm font-medium">Subiendo {popupForm.isVideo ? 'video' : 'imagen'}...</span>
                          </div>
                        )}
                      </div>

                      {popupForm.mediaUrl && (
                        <div className="mt-4 p-4 bg-green-50 rounded-xl border-2 border-green-100">
                          <div className="flex items-center gap-4">
                            {popupForm.isVideo ? (
                              <video
                                src={popupForm.mediaUrl}
                                className="w-20 h-20 rounded-lg object-cover border-2 border-green-200 shadow-sm"
                                muted
                              />
                            ) : (
                              <img
                                loading="lazy"
                                src={popupForm.mediaUrl}
                                alt="Popup"
                                className="w-20 h-20 rounded-lg object-cover border-2 border-green-200 shadow-sm"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-green-800 mb-1">
                                ✅ {popupForm.isVideo ? 'Video' : 'Imagen'} cargada correctamente
                              </p>
                              <button
                                type="button"
                                onClick={() => setPopupForm({ ...popupForm, mediaUrl: '' })}
                                className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
                              >
                                🗑️ Eliminar {popupForm.isVideo ? 'video' : 'imagen'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activation & Actions */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-lg p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">⚡ Control y Acciones</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <input
                        type="checkbox"
                        id="popup-active"
                        checked={popupForm.active}
                        onChange={(e) => setPopupForm({ ...popupForm, active: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="popup-active" className="text-sm font-semibold text-gray-800">
                        🎯 Popup Activo (visible en el sitio web)
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setUpdatingPopup(true);

                            await setDoc(doc(db, 'config', 'offer-popup'), {
                              title: popupForm.title,
                              description: popupForm.description,
                              buttonText: popupForm.buttonText,
                              buttonLink: '/popup-ofertas',
                              active: popupForm.active,
                              size: popupForm.size,
                              position: popupForm.position,
                              mediaUrl: popupForm.mediaUrl,
                              isVideo: popupForm.isVideo,
                              popupType: popupForm.popupType,
                              updatedAt: new Date().toISOString()
                            });

                            alert('✅ Popup actualizado exitosamente');
                          } catch (error: unknown) {
                            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                            alert(`❌ Error al actualizar popup: ${errorMessage}`);
                          } finally {
                            setUpdatingPopup(false);
                          }
                        }}
                        disabled={updatingPopup}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl transform disabled:opacity-50 disabled:transform-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {updatingPopup ? '⏳ Actualizando...' : '💾 Guardar Configuración'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sessionStorage.removeItem('offer-popup-seen');
                          sessionStorage.removeItem('offer-popup-last-shown');
                          window.open('/', '_blank');
                        }}
                        className="flex-1 sm:flex-initial bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:from-green-700 hover:to-teal-700 hover:scale-105 shadow-lg hover:shadow-xl transform focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        🧪 Probar Popup
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6 sticky top-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">👁️ Vista Previa</h3>
                  </div>

                  <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl border-2 border-slate-300 p-6 min-h-[400px] shadow-inner">
                    <div
                      className={`absolute ${POPUP_PREVIEW_POSITION_CLASSES[popupForm.position] ?? POPUP_PREVIEW_POSITION_CLASSES['bottom-right']}`}
                      style={popupPreviewStyle}
                    >
                      <div className="relative w-full" style={{ paddingBottom: `${(popupRatio * 100).toFixed(2)}%` }}>
                        <div className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden bg-gradient-to-br from-orange-500 to-red-500">
                          <button
                            type="button"
                            className="absolute top-2 right-2 z-20 p-1 rounded-full bg-white/90 hover:bg-white transition-all cursor-default shadow-lg"
                            aria-label="Cerrar"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-600" />
                          </button>

                          {popupForm.mediaUrl && !popupForm.isVideo && (
                            <>
                              <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${popupForm.mediaUrl})` }}
                              />
                              <div className="absolute inset-0 bg-black/30" />
                            </>
                          )}

                          {popupForm.mediaUrl && popupForm.isVideo && (
                            <>
                              <video
                                autoPlay
                                muted
                                loop
                                className="absolute inset-0 w-full h-full object-cover"
                              >
                                <source src={popupForm.mediaUrl} type="video/mp4" />
                              </video>
                              <div className="absolute inset-0 bg-black/20" />
                            </>
                          )}

                          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center text-white">
                            <div className="text-2xl mb-2">
                              {popupForm.popupType === 'category' ? '🛍️' : '📢'}
                            </div>

                            <h4 className="text-sm font-bold mb-2 leading-tight">
                              {popupForm.title || '¡Oferta Especial!'}
                            </h4>

                            <p className="text-xs mb-3 opacity-90 leading-tight">
                              {popupForm.description || 'Descuentos increíbles por tiempo limitado'}
                            </p>

                            <button
                              type="button"
                              className="bg-white text-orange-500 font-bold py-1.5 px-3 rounded-md text-xs hover:shadow-lg transition-all"
                            >
                              {popupForm.buttonText || 'Ver Ofertas'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-600 text-sm">📍</span>
                        <span className="text-sm font-semibold text-blue-800">Posición actual:</span>
                      </div>
                      <p className="text-xs text-blue-700 ml-6">
                        {
                          {
                            'top-left': '🔝⬅️ Esquina superior izquierda',
                            'top-right': '🔝➡️ Esquina superior derecha',
                            'bottom-left': '🔽⬅️ Esquina inferior izquierda',
                            'bottom-right': '🔽➡️ Esquina inferior derecha',
                            center: '🎯 Centro de la pantalla'
                          }[popupForm.position]
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'product-layout' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">🔲 Configuración del Layout de Productos</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-blue-500 text-xl">ℹ️</div>
                <div className="space-y-2">
                  <h3 className="text-blue-900 font-semibold">¿Cómo funciona el layout?</h3>
                  <p className="text-sm text-blue-800">
                    El layout de productos utiliza una cuadrícula tipo masonry. Puedes activar bloques especiales (hero, horizontales, verticales) y definir cada cuántos productos deben aparecer.
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Activo:</strong> habilita o deshabilita el patrón.</li>
                    <li>• <strong>Intervalo:</strong> cada cuántos productos se aplica el diseño.</li>
                    <li>• <strong>Diseño:</strong> tamaño/forma del bloque dentro de la cuadrícula.</li>
                  </ul>
                  {layoutPatternsError && (
                    <div className="mt-2 bg-white/80 border border-blue-200 rounded-md px-3 py-2 text-sm text-blue-900">
                      {layoutPatternsError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Configurador de Patrones de Layout</h3>
                      <p className="text-sm text-gray-600">
                        Ajusta el ritmo visual de la grilla principal. Los cambios se reflejan en la home una vez guardados.
                      </p>
                      {layoutPatternsFetched.updatedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Última actualización: {new Date(layoutPatternsFetched.updatedAt).toLocaleString('es-CL')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleResetLayoutPatterns}
                        className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors"
                        disabled={savingLayoutPatterns || layoutPatternsLoading}
                      >
                        Restablecer valores
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveLayoutPatterns}
                        className="text-white font-semibold text-base py-3 px-6 rounded-md transition-colors text-base disabled:opacity-60"
                        style={{ backgroundColor: '#F16529' }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.hasAttribute('disabled')) {
                            e.currentTarget.style.backgroundColor = '#D13C1A';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#F16529';
                        }}
                        disabled={savingLayoutPatterns || layoutPatternsLoading}
                      >
                        {savingLayoutPatterns ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {orderedLayoutRules.map((rule) => {
                      const meta = LAYOUT_VARIANT_META[rule.variant];
                      return (
                        <div key={rule.variant} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-2xl">{meta.icon}</div>
                              <h4 className="font-medium text-gray-900">{meta.title}</h4>
                              <p className="text-sm text-gray-600">{meta.description}</p>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                              <span>Activo</span>
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-orange-500 rounded"
                                checked={rule.enabled}
                                onChange={(e) => updateLayoutRule(rule.variant, (prevRule) => ({
                                  ...prevRule,
                                  enabled: e.target.checked,
                                }))}
                                disabled={savingLayoutPatterns || layoutPatternsLoading}
                              />
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Intervalo (cada cuántos productos)
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={rule.interval}
                                onChange={(e) => {
                                  const value = Math.max(1, Math.min(50, Number(e.target.value) || 1));
                                  updateLayoutRule(rule.variant, (prevRule) => ({
                                    ...prevRule,
                                    interval: value,
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1"
                                style={{ '--tw-ring-color': '#F16529' } as any}
                                disabled={savingLayoutPatterns || layoutPatternsLoading}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Diseño del bloque
                              </label>
                              <select
                                value={rule.span}
                                onChange={(e) => {
                                  const value = e.target.value as LayoutPatternSpan;
                                  const allowedValues = meta.spanOptions.map((option) => option.value);
                                  if (!allowedValues.includes(value)) return;
                                  updateLayoutRule(rule.variant, (prevRule) => ({
                                    ...prevRule,
                                    span: value,
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1"
                                style={{ '--tw-ring-color': '#F16529' } as any}
                                disabled={savingLayoutPatterns || layoutPatternsLoading}
                              >
                                {meta.spanOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500 mt-3">
                            {rule.enabled
                              ? `Activo: se aplica a cada ${rule.interval} producto(s).`
                              : 'Este patrón está deshabilitado temporalmente.'}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

{activeTab === 'secciones' && (
  <div className="space-y-6">
    {/* Vista LIST - Listado de secciones */}
    {sectionsView === 'list' && (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              📑 Secciones de Productos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona las secciones que aparecen en la página principal
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSection(null);
              setPreviewName('');
              setPreviewDescription('');
              setSectionsView('edit');
            }}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold flex items-center gap-2"
          >
            <span>+</span> Nueva Sección
          </button>
        </div>

        {/* Sections Grid */}
        {productSections.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {productSections.map((section, index) => (
              <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{section.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          section.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {section.enabled ? '✓ Activa' : '○ Inactiva'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-md font-medium">
                          {section.selectedProducts?.length || 0} productos
                        </span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-medium">
                          {section.type === 'custom' ? '🎯 Personalizada' :
                           section.type === 'featured' ? '⭐ Destacados' :
                           section.type === 'new' ? '🆕 Nuevos' :
                           section.type === 'bestsellers' ? '🔥 Más Vendidos' : '📁 Categoría'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={async (e) => {
                          const newSections = [...productSections];
                          newSections[index].enabled = e.target.checked;
                          setProductSections(newSections as any);

                          try {
                            await setDoc(doc(db, 'config', 'productSections'), {
                              sections: newSections,
                              updatedAt: new Date().toISOString()
                            });
                          } catch (error) {
                            console.error('Error auto-saving section enabled status:', error);
                          }
                        }}
                        className="w-5 h-5 text-orange-500 rounded"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingSection(section);
                        setPreviewName(section.name);
                        setPreviewDescription(section.description);
                        setSectionsView('edit');
                      }}
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => {
                        setCurrentSectionId(section.id);
                        setProductSelectorFilters({ category: '', search: '', showOnlySelected: false });
                        setSectionsView('products');
                      }}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      📦 Productos
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('¿Estás seguro de eliminar esta sección?')) {
                          const newSections = productSections.filter(s => s.id !== section.id);
                          setProductSections(newSections as any);
                          try {
                            await setDoc(doc(db, 'config', 'productSections'), {
                              sections: newSections,
                              updatedAt: new Date().toISOString()
                            });
                          } catch (error) {
                            console.error('Error deleting section:', error);
                          }
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📑</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay secciones configuradas</h3>
            <p className="text-gray-600 mb-6">Crea tu primera sección para organizar los productos en la página principal</p>
            <button
              onClick={() => {
                setEditingSection(null);
                setPreviewName('');
                setPreviewDescription('');
                setSectionsView('edit');
              }}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              + Nueva Sección
            </button>
          </div>
        )}
      </>
    )}

    {/* Vista EDIT - Editar/Crear sección */}
    {sectionsView === 'edit' && (
      <>
        <div className="mb-6">
          <button
            onClick={() => {
              setSectionsView('list');
              setEditingSection(null);
              setPreviewName('');
              setPreviewDescription('');
              setSectionSaveStatus('idle');
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <span>←</span> Volver a la lista
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingSection ? 'Editar Sección' : 'Nueva Sección'}
          </h2>

          <div className="grid grid-cols-3 gap-6">
            {/* Columna Izquierda: Formulario */}
            <div className="col-span-1 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Sección
                </label>
                <input
                  type="text"
                  id="section-name-input"
                  defaultValue={editingSection?.name || ''}
                  onChange={(e) => setPreviewName(e.target.value)}
                  placeholder="Ej: Productos Destacados"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="section-description-input"
                  defaultValue={editingSection?.description || ''}
                  onChange={(e) => setPreviewDescription(e.target.value)}
                  placeholder="Descripción de la sección"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Sección
                </label>
                <select
                  defaultValue={editingSection?.type || 'custom'}
                  id="section-type-select"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="custom">🎯 Personalizada</option>
                  <option value="featured">⭐ Destacados</option>
                  <option value="new">🆕 Nuevos</option>
                  <option value="bestsellers">🔥 Más Vendidos</option>
                  <option value="category">📁 Categoría</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="section-enabled"
                  defaultChecked={editingSection?.enabled ?? true}
                  className="w-5 h-5 text-orange-500 rounded"
                />
                <label htmlFor="section-enabled" className="text-sm font-medium text-gray-700">
                  Sección activa
                </label>
              </div>
            </div>

            {/* Columna Centro: Vista Previa */}
            <div className="col-span-1 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👁️ Vista Previa</h3>

              <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg p-6 border-2 border-orange-200">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="border-b-2 border-orange-500 pb-3 mb-3">
                    <h4 className="text-xl font-bold text-gray-900">
                      {previewName || editingSection?.name || 'Nombre de Sección'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {previewDescription || editingSection?.description || 'Descripción de la sección'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-50 rounded h-20 flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 text-xs">
                    <span className="text-gray-500">{editingSection?.selectedProducts?.length || 0} productos</span>
                    <span className="text-orange-500 font-semibold">Ver todos →</span>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-3">
                  Así se verá en tu sitio web
                </p>
              </div>
            </div>

            {/* Columna Derecha: Resumen de Productos */}
            <div className="col-span-1 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos Seleccionados</h3>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-orange-500">
                    {editingSection?.selectedProducts?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">productos configurados</div>
                </div>

                {editingSection?.selectedProducts && editingSection.selectedProducts.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {editingSection.selectedProducts.slice(0, 5).map((productId: string) => {
                      const product = products.find(p => p.id === productId);
                      return product ? (
                        <div key={productId} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">
                          {product.imagen && (
                            <img
                              src={product.imagen}
                              alt={product.nombre}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {product.nombre}
                            </div>
                            <div className="text-xs text-gray-500">
                              ${product.precio?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })}
                    {editingSection.selectedProducts.length > 5 && (
                      <div className="text-xs text-gray-500 text-center pt-2">
                        +{editingSection.selectedProducts.length - 5} más
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No hay productos seleccionados.
                    <br />
                    Guarda la sección y luego agrega productos.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {sectionSaveStatus !== 'idle' && (
            <div className={`mt-6 px-4 py-3 rounded-lg flex items-center gap-2 ${
              sectionSaveStatus === 'saving' ? 'bg-blue-50 text-blue-700 animate-pulse' :
              sectionSaveStatus === 'success' ? 'bg-green-50 text-green-700' :
              'bg-red-50 text-red-700'
            }`}>
              {sectionSaveStatus === 'saving' && (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Guardando cambios...</span>
                </>
              )}
              {sectionSaveStatus === 'success' && (
                <>
                  <span>✓</span>
                  <span>Cambios guardados correctamente</span>
                </>
              )}
              {sectionSaveStatus === 'error' && (
                <>
                  <span>✗</span>
                  <span>Error al guardar los cambios</span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                setSectionsView('list');
                setEditingSection(null);
                setPreviewName('');
                setPreviewDescription('');
                setSectionSaveStatus('idle');
              }}
              disabled={sectionSaveStatus === 'saving'}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                setSectionSaveStatus('saving');

                try {
                  const nameInput = document.querySelector<HTMLInputElement>('#section-name-input');
                  const descriptionInput = document.querySelector<HTMLTextAreaElement>('#section-description-input');
                  const typeSelect = document.querySelector<HTMLSelectElement>('#section-type-select');
                  const enabledCheckbox = document.querySelector<HTMLInputElement>('#section-enabled');

                  const sectionData = {
                    id: editingSection?.id || `section_${Date.now()}`,
                    name: nameInput?.value || previewName || 'Nueva Sección',
                    description: descriptionInput?.value || previewDescription || '',
                    type: typeSelect?.value || 'custom',
                    enabled: enabledCheckbox?.checked ?? true,
                    selectedProducts: editingSection?.selectedProducts || []
                  };

                  let newSections;
                  if (editingSection) {
                    newSections = productSections.map(s =>
                      s.id === editingSection.id ? sectionData : s
                    );
                  } else {
                    newSections = [...productSections, sectionData];
                  }

                  setProductSections(newSections as any);

                  await setDoc(doc(db, 'config', 'productSections'), {
                    sections: newSections,
                    updatedAt: new Date().toISOString()
                  });

                  setSectionSaveStatus('success');
                  setTimeout(() => {
                    setSectionsView('list');
                    setEditingSection(null);
                    setPreviewName('');
                    setPreviewDescription('');
                    setSectionSaveStatus('idle');
                  }, 1500);
                } catch (error) {
                  console.error('Error saving section:', error);
                  setSectionSaveStatus('error');
                  setTimeout(() => setSectionSaveStatus('idle'), 3000);
                }
              }}
              disabled={sectionSaveStatus === 'saving'}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50"
            >
              {sectionSaveStatus === 'saving' ? 'Guardando...' : (editingSection ? 'Actualizar' : 'Crear') + ' Sección'}
            </button>
          </div>
        </div>
      </>
    )}

    {/* Vista PRODUCTS - Selector de productos */}
    {sectionsView === 'products' && (
      <>
        <div className="mb-6">
          <button
            onClick={() => {
              setSectionsView('list');
              setProductSelectorFilters({ category: '', search: '', showOnlySelected: false });
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <span>←</span> Volver a la lista
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📦 Gestionar Productos de la Sección
          </h2>

          <div className="grid grid-cols-3 gap-6">
            {/* Columna Izquierda: Resumen de Sección */}
            <div className="col-span-1 space-y-4">
              {(() => {
                const currentSection = productSections.find(s => s.id === currentSectionId);
                const selectedProducts = products.filter(p => currentSection?.selectedProducts?.includes(p.id as never));

                return currentSection ? (
                  <>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {currentSection.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {currentSection.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-white text-orange-600 rounded-md font-medium text-xs">
                          {currentSection.type === 'custom' ? '🎯 Personalizada' :
                           currentSection.type === 'featured' ? '⭐ Destacados' :
                           currentSection.type === 'new' ? '🆕 Nuevos' :
                           currentSection.type === 'bestsellers' ? '🔥 Más Vendidos' : '📁 Categoría'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-orange-500">
                          {currentSection.selectedProducts?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">productos seleccionados</div>
                      </div>

                      {selectedProducts.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {selectedProducts.map((product) => (
                            <div key={product.id} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">
                              {product.imagen && (
                                <img
                                  src={product.imagen}
                                  alt={product.nombre}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-900 truncate">
                                  {product.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ${product.precio?.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400 text-sm">
                          No hay productos seleccionados
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    Sección no encontrada
                  </div>
                );
              })()}
            </div>

            {/* Columnas Derecha: Selector de Productos */}
            <div className="col-span-2 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={productSelectorFilters.search}
                    onChange={(e) => setProductSelectorFilters(prev => ({
                      ...prev,
                      search: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="w-48">
                  <select
                    value={productSelectorFilters.category}
                    onChange={(e) => setProductSelectorFilters(prev => ({
                      ...prev,
                      category: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-only-selected"
                  checked={productSelectorFilters.showOnlySelected}
                  onChange={(e) => setProductSelectorFilters(prev => ({
                    ...prev,
                    showOnlySelected: e.target.checked
                  }))}
                  className="w-4 h-4 text-orange-500 rounded"
                />
                <label htmlFor="show-only-selected" className="text-sm text-gray-700">
                  Mostrar solo seleccionados
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {(() => {
                  const currentSection = productSections.find(s => s.id === currentSectionId);
                  return products
                    .filter(product => {
                      const isSelected = currentSection?.selectedProducts?.includes(product.id as never) || false;

                      if (productSelectorFilters.search) {
                        const searchTerm = productSelectorFilters.search.toLowerCase();
                        const searchableText = [
                          product.nombre,
                          product.descripcion || '',
                          product.categoria,
                          product.sku || ''
                        ].join(' ').toLowerCase();

                        if (!searchableText.includes(searchTerm)) return false;
                      }

                      if (productSelectorFilters.category) {
                        if (!productHasCategory(product, productSelectorFilters.category)) return false;
                      }

                      if (productSelectorFilters.showOnlySelected && !isSelected) {
                        return false;
                      }

                      return true;
                    })
                    .map((product) => {
                    const currentSection = productSections.find(s => s.id === currentSectionId);
                    const isSelected = currentSection?.selectedProducts?.includes(product.id as never) || false;

                    return (
                      <div key={product.id} className={`border-2 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                        isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={async (e) => {
                              const newSections = productSections.map(section => {
                                if (section.id === currentSectionId) {
                                  const currentProducts = section.selectedProducts || [];
                                  return {
                                    ...section,
                                    selectedProducts: e.target.checked
                                      ? [...currentProducts, product.id as never]
                                      : currentProducts.filter((id: string) => id !== product.id)
                                  };
                                }
                                return section;
                              });

                              setProductSections(newSections as any);

                              try {
                                await setDoc(doc(db, 'config', 'productSections'), {
                                  sections: newSections,
                                  updatedAt: new Date().toISOString()
                                });
                              } catch (error) {
                                console.error('Error auto-saving product selection:', error);
                              }
                            }}
                            className="w-5 h-5 text-orange-500 rounded mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            {product.imagen && (
                              <img
                                src={product.imagen}
                                alt={product.nombre}
                                className="w-full h-32 object-cover rounded-lg mb-2"
                              />
                            )}
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {product.nombre}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              ${product.precio?.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Stock: {product.stock}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
)}

        {activeTab === 'main-banner' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Gestión de Banners (v2)</h2>
              {isAutoSavingBanner && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Guardando cambios...</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <form className="space-y-6">
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="mainBannerActive"
                    checked={mainBannerForm.active}
                    onChange={(e) => setMainBannerForm({ ...mainBannerForm, active: e.target.checked })}
                    className="h-4 w-4 border-gray-300 rounded" style={{ color: '#F16529', '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  />
                  <label htmlFor="mainBannerActive" className="ml-2 block text-sm font-medium text-gray-700">
                    Banner Principal Activo
                  </label>
                </div>

                
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Banners del Carrusel</h3>
                  <p className="text-sm text-gray-600">Selecciona los productos que aparecerán en el banner principal</p>
                  
                  {mainBannerForm.slides.map((slide, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Banner {index + 1}</h4>
                        {mainBannerForm.slides.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newSlides = mainBannerForm.slides.filter((_, i) => i !== index);
                              setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imagen del Banner
                          </label>
                          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                            <p className="text-blue-800 font-medium">📐 Tamaño recomendado: 1920x640px (3:1) | Formato: JPG/PNG | Peso máx: 5MB</p>
                          </div>
                          <input
                            type="file"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {                                  if (!user) {
                                    throw new Error('Usuario no autenticado');
                                  }

                                  const timestamp = Date.now();
                                  const optimizedMainBannerFile = await optimizeImageFile(file);
                                  const fileName = `main-banner/slide-${index}-${timestamp}-${optimizedMainBannerFile.name}`;                                  const storageRef = ref(storage, fileName);                                  const snapshot = await uploadBytes(storageRef, optimizedMainBannerFile);                                  const downloadURL = await getDownloadURL(snapshot.ref);                                  const newSlides = [...mainBannerForm.slides];
                                  newSlides[index] = { ...newSlides[index], imageUrl: downloadURL };
                                  setMainBannerForm({ ...mainBannerForm, slides: newSlides });                                } catch (error) {
                                  console.error('❌ Error uploading main banner image:', error);
                                  const message = error instanceof Error ? error.message : 'Error desconocido';
                                  alert(`❌ Error al subir la imagen: ${message}\nVerifica los permisos de Firebase Storage.`);
                                }
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                          />
                          <p className="text-xs text-gray-500 mt-1">Formatos soportados: JPG, PNG, GIF</p>
                          
                          {slide.imageUrl && (
                            <div className="mt-2">
                              <img
                                loading="lazy"
                                src={slide.imageUrl}
                                alt={`Banner ${index + 1}`}
                                className="w-full h-32 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newSlides = [...mainBannerForm.slides];
                                  newSlides[index] = { ...newSlides[index], imageUrl: "" };
                                  setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                                }}
                                className="mt-2 text-red-600 hover:text-red-800 text-sm"
                              >
                                Eliminar imagen
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Enlace
                          </label>
                          <select
                            value={slide.linkType || "product"}
                            onChange={(e) => {
                              const newSlides = [...mainBannerForm.slides];
                              newSlides[index] = { 
                                ...newSlides[index], 
                                linkType: e.target.value as "product" | "category",
                                productId: e.target.value === "product" ? newSlides[index].productId : "",
                                categoryId: e.target.value === "category" ? newSlides[index].categoryId : ""
                              };
                              setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 mb-4" style={{ '--tw-ring-color': '#F16529' } as any}
                          >
                            <option value="product">Producto Específico</option>
                            <option value="category">Categoría (múltiples productos en promo)</option>
                          </select>
                        </div>

                        {slide.linkType === "category" && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Seleccionar Categoría
                            </label>
                            <select
                              value={slide.categoryId || ""}
                              onChange={(e) => {
                                const newSlides = [...mainBannerForm.slides];
                                newSlides[index] = { ...newSlides[index], categoryId: e.target.value };
                                setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                            >
                              <option value="">Selecciona una categoría</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  📦 {category.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              El banner redirigirá a todos los productos de esta categoría
                            </p>
                          </div>
                        )}

                        {slide.linkType === "product" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Buscar Producto para Redirección
                            </label>
                          <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={bannerSearchTerms[index] || ''}
                            onChange={(e) => {
                              setBannerSearchTerms({ ...bannerSearchTerms, [index]: e.target.value });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                          />
                          
                          <select
                            value={slide.productId}
                            onChange={(e) => {
                              const newProductId = e.target.value;                              const newSlides = mainBannerForm.slides.map((s, i) => {
                                if (i === index) {
                                  return { ...s, productId: newProductId };
                                }
                                return s;
                              });
                              setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                          >
                            <option value="">Selecciona un producto</option>
                            {products
                              .filter(product => {
                                const searchTerm = bannerSearchTerms[index] || '';
                                if (!searchTerm) return true;
                                const productName = (product.nombre || '').toLowerCase();
                                return productName.includes(searchTerm.toLowerCase());
                              })
                              .map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.nombre} - ${(product.precio || 0).toLocaleString()}
                                </option>
                              ))}
                          </select>
                          
                          {(() => {
                            const selectedProduct = products.find(p => p.id === slide.productId);
                            return selectedProduct && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center space-x-3">
                                <img
                                  loading="lazy"
                                  src={selectedProduct.imagen || ''}
                                  alt={selectedProduct.nombre || 'Producto'}
                                  className="w-16 h-16 object-cover rounded"
                                />
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {selectedProduct.nombre}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    ${(selectedProduct.precio || 0).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        )}
                        
                        {slide.linkType === "category" && (() => {
                          const selectedCategory = categories.find(c => c.id === slide.categoryId);
                          const categoryProducts = products.filter(p => p.categoria === slide.categoryId);
                          return selectedCategory && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-2xl">📦</span>
                                <h5 className="font-medium text-gray-900">
                                  {selectedCategory.name}
                                </h5>
                              </div>
                              <p className="text-sm text-gray-600">
                                {categoryProducts.length} productos en esta categoría
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                  
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newSlides = [...mainBannerForm.slides, { linkType: "product" as "product" | "category", productId: "", categoryId: "", imageUrl: "" }];
                      setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                    }}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors"
                  >
                    + Agregar Banner
                  </button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-700 font-medium">
                    ✅ Los cambios se guardan automáticamente
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    No necesitas hacer clic en ningún botón, todos los cambios se sincronizan con Firebase automáticamente.
                  </p>
                </div>
              </form>

              
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa del Carrusel:</h3>
                <div className="relative w-full max-w-full mx-auto">
                  <MainBannerCarousel
                    config={{
                      active: mainBannerForm.active,
                      slides: mainBannerForm.slides,
                    }}
                    products={products}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        
        {activeTab === 'logo' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Gestión del Logo</h2>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto del Logo
                  </label>
                  <input
                    type="text"
                    value={logoForm.text}
                    onChange={(e) => setLogoForm({ ...logoForm, text: e.target.value })}
                    placeholder="Importadora F&D"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen del Logo
                  </label>
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <p className="text-green-800 font-medium mb-1">📐 Medidas recomendadas:</p>
                    <ul className="text-green-700 space-y-1">
                      <li>• <strong>Tamaño:</strong> 200x60px o 300x90px</li>
                      <li>• <strong>Formato:</strong> PNG con transparencia</li>
                      <li>• <strong>Estilo:</strong> Logo horizontal preferible</li>
                      <li>• <strong>Tamaño máximo:</strong> 2MB</li>
                    </ul>
                    <p className="text-green-600 text-xs mt-2">💡 Tip: Usa fondo transparente para mejor integración</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Si subes una imagen, se usará en lugar del emoji
                  </p>
                  {logoForm.image && (
                    <div className="mt-2">
                      <img
                        loading="lazy"
                        src={logoForm.image}
                        alt="Logo actual"
                        className="h-12 w-12 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setUpdatingLogo(true);
                      
                      let logoImageUrl = logoForm.image;
                      
                      // Upload image if selected
                      if (logoFile) {
                        const optimizedLogoFile = await optimizeImageFile(logoFile, {
                          maxWidthOrHeight: 600,
                          maxSizeMB: 0.5,
                        });
                        const imageRef = ref(storage, `config/logo_${Date.now()}_${optimizedLogoFile.name}`);
                        const snapshot = await uploadBytes(imageRef, optimizedLogoFile);
                        logoImageUrl = await getDownloadURL(snapshot.ref);
                      }

                      // Update form state with new image URL
                      const updatedLogoForm = {
                        ...logoForm,
                        image: logoImageUrl
                      };
                      setLogoForm(updatedLogoForm);

                      try {
                        // Try to save logo configuration to Firebase
                        await setDoc(doc(db, 'config', 'logo'), {
                          text: updatedLogoForm.text,
                          image: updatedLogoForm.image,
                          updatedAt: new Date().toISOString()
                        });
                      } catch (firebaseError) {
                        // If Firebase fails (no auth), just update local state
                      }

                      alert('Logo actualizado exitosamente');
                      setLogoFile(null);
                    } catch (error) {
                      console.error('Error updating logo:', error);
                      alert('Error al actualizar logo');
                    } finally {
                      setUpdatingLogo(false);
                    }
                  }}
                  disabled={updatingLogo}
                  className="text-white font-semibold text-base py-3 px-6 rounded-md transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#F16529' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                >
                  {updatingLogo ? 'Actualizando...' : 'Actualizar Logo'}
                </button>
              </form>
              
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa:</h3>
                <div className="bg-white p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    {logoForm.image ? (
                      <img loading="lazy" src={logoForm.image} alt="Logo" className="h-8 w-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        Sin logo
                      </div>
                    )}
                    <span className="text-xl font-bold text-gray-900">{logoForm.text}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h2>
              <button
                  onClick={() => {
                    setCategoryForm({ id: '', name: '', active: true, subcategorias: [] });
                    setShowCategoryModal(true);
                  }}
                  className="text-white px-4 py-2 rounded-md transition-colors" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                >
                  ➕ Agregar Categoría
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subcategorías
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex flex-wrap gap-1">
                            {(category as any).subcategorias && (category as any).subcategorias.length > 0 ? (
                              (category as any).subcategorias.map((sub: any, index: number) => (
                                <div
                                  key={index}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 group"
                                >
                                  <span>{sub.nombre}</span>
                                  <button
                                    onClick={() => {
                                      setSelectedCategoryForSub(category.id);
                                      setSubcategoryForm({ id: sub.id, nombre: sub.nombre, activa: sub.activa });
                                      setShowSubcategoryModal(true);
                                    }}
                                    className="ml-1 opacity-0 group-hover:opacity-100 hover:text-blue-900 transition-opacity"
                                    title="Editar subcategoría"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(`¿Eliminar subcategoría "${sub.nombre}"?`)) {
                                        try {
                                          const updatedSubcategorias = (category as any).subcategorias.filter((_: any, i: number) => i !== index);
                                          await updateDoc(doc(db, 'categorias', category.id), {
                                            subcategorias: updatedSubcategorias
                                          });
                                          setCategories(categories.map(c =>
                                            c.id === category.id ? { ...c, subcategorias: updatedSubcategorias } as any : c
                                          ));
                                        } catch (error) {
                                          console.error('Error eliminando subcategoría:', error);
                                          alert('Error al eliminar subcategoría');
                                        }
                                      }
                                    }}
                                    className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                                    title="Eliminar subcategoría"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">Sin subcategorías</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCategoryForSub(category.id);
                              setSubcategoryForm({ id: '', nombre: '', activa: true });
                              setShowSubcategoryModal(true);
                            }}
                            className="text-xs mt-1 hover:opacity-80 transition-opacity"
                            style={{ color: '#F16529' }}
                          >
                            + Agregar subcategoría
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {category.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              setCategoryForm({ ...category, subcategorias: (category as any).subcategorias || [] });
                              setShowCategoryModal(true);
                            }}
                            className="hover:opacity-80 transition-opacity" style={{ color: '#F16529' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await deleteDoc(doc(db, 'categorias', category.id));
                                setCategories(categories.filter(c => c.id !== category.id));
                              } catch (error) {
                                alert('Error al eliminar categoría');
                              }
                            }}
                            className="hover:opacity-80 transition-opacity" style={{ color: '#F16529' }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {categoryForm.id ? 'Editar Categoría' : 'Agregar Categoría'}
                  </h3>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID de la Categoría
                    </label>
                    <input
                      type="text"
                      value={categoryForm.id}
                      onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value })}
                      placeholder="electronicos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Categoría
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="Electrónicos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={categoryForm.active}
                      onChange={(e) => setCategoryForm({ ...categoryForm, active: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Categoría Activa
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-base py-3 px-6 rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (categoryForm.id && categoryForm.name) {
                          try {
                            const categoryData = {
                              name: categoryForm.name,
                              active: categoryForm.active,
                              fechaCreacion: new Date().toISOString()
                            };

                            const existingIndex = categories.findIndex(c => c.id === categoryForm.id);
                            if (existingIndex >= 0) {
                              // Update existing category in Firebase
                              await setDoc(doc(db, 'categorias', categoryForm.id), categoryData);
                              // Update local state
                              const newCategories = [...categories];
                              newCategories[existingIndex] = categoryForm;
                              setCategories(newCategories);
                            } else {
                              // Add new category to Firebase
                              await setDoc(doc(db, 'categorias', categoryForm.id), categoryData);
                              // Add to local state
                              setCategories([...categories, categoryForm]);
                            }
                            setShowCategoryModal(false);
                            setCategoryForm({ id: '', name: '', active: true, subcategorias: [] });
                          } catch (error) {
                            alert('Error al guardar categoría');
                          }
                        }
                      }}
                      className="flex-1 text-white font-semibold py-3 px-6 rounded-md transition-colors" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        
        {showSubcategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {subcategoryForm.id ? 'Editar Subcategoría' : 'Agregar Subcategoría'}
                  </h3>
                  <button
                    onClick={() => setShowSubcategoryModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Subcategoría
                    </label>
                    <input
                      type="text"
                      value={subcategoryForm.nombre}
                      onChange={(e) => setSubcategoryForm({ ...subcategoryForm, nombre: e.target.value })}
                      placeholder="Smartphones"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={subcategoryForm.activa}
                      onChange={(e) => setSubcategoryForm({ ...subcategoryForm, activa: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Subcategoría Activa
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSubcategoryModal(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-base py-3 px-6 rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (subcategoryForm.nombre && selectedCategoryForSub) {
                          try {
                            // Find the category and update its subcategories
                            const categoryIndex = categories.findIndex(c => c.id === selectedCategoryForSub);
                            if (categoryIndex >= 0) {
                              const category = categories[categoryIndex];
                              const subcategorias = (category as any).subcategorias || [];

                              let updatedSubcategorias;

                              if (subcategoryForm.id) {
                                // Editar subcategoría existente
                                updatedSubcategorias = subcategorias.map((sub: any) =>
                                  sub.id === subcategoryForm.id
                                    ? { ...sub, nombre: subcategoryForm.nombre, activa: subcategoryForm.activa }
                                    : sub
                                );
                              } else {
                                // Crear nueva subcategoría
                                const newSubcategory = {
                                  id: Date.now().toString(),
                                  nombre: subcategoryForm.nombre,
                                  activa: subcategoryForm.activa
                                };
                                updatedSubcategorias = [...subcategorias, newSubcategory];
                              }

                              const updatedCategory = { ...category, subcategorias: updatedSubcategorias };

                              // Update in Firebase
                              await setDoc(doc(db, 'categorias', selectedCategoryForSub), {
                                name: category.name,
                                active: category.active,
                                subcategorias: updatedSubcategorias,
                                fechaCreacion: (category as any).fechaCreacion || new Date().toISOString()
                              });

                              // Update local state
                              const newCategories = [...categories];
                              newCategories[categoryIndex] = updatedCategory;
                              setCategories(newCategories);

                              setShowSubcategoryModal(false);
                              setSubcategoryForm({ id: '', nombre: '', activa: true });
                              setSelectedCategoryForSub('');
                            }
                          } catch (error) {
                            alert('Error al guardar subcategoría');
                          }
                        }
                      }}
                      className="flex-1 text-white font-semibold py-3 px-6 rounded-md transition-colors" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        
        {showProductModal && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl w-full max-w-6xl 2xl:max-w-[90vw] max-h-[95vh] min-h-[78vh] shadow-2xl border border-gray-200 flex flex-col mx-auto">
              {/* Compact Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-4 sm:px-6 sm:py-5 text-white" style={{ backgroundColor: '#F16529' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                      {productForm.id ? '📝' : '✨'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {productForm.id ? '📝 Editar Producto' : '✨ Nuevo Producto'}
                      </h3>
                      <p className="text-blue-100 text-xs">
                        {productForm.id ? 'Actualiza la información del producto' : 'Completa la información del producto'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Compact Scrollable Content */}
              <div className="flex-1 overflow-y-auto bg-transparent">
                <form onSubmit={handleProductSubmit} className="px-6 py-6 lg:px-8 lg:py-7 space-y-6 lg:space-y-7">

                  {/* Compact Basic Info Section */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg border border-orange-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                        <span className="text-white text-xs">📝</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">Información Básica</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <span>📦</span> Nombre *
                        </label>
                        <input
                          type="text"
                          value={productForm.nombre}
                          onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                          required
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-200 bg-white/70" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties} onFocus={(e) => e.target.style.borderColor = '#F16529'} onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          placeholder="Ej: Laptop Gaming RGB"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <span>🏷️</span> SKU *
                        </label>
                        <input
                          type="text"
                          value={productForm.sku}
                          onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                          required
                          placeholder="SKU-001"
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-200 uppercase bg-white/70"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <span>💰</span> Precio ($) *
                        </label>
                        <input
                          type="number"
                          value={productForm.precio}
                          onChange={(e) => setProductForm({ ...productForm, precio: parseFloat(e.target.value) || 0 })}
                          required
                          min="0"
                          step="1"
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-200 bg-white/70" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties} onFocus={(e) => e.target.style.borderColor = '#F16529'} onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          placeholder="0"
                        />
                      </div>

                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <span>💸</span> Precio Anterior (Opcional - para mostrar descuento)
                        </label>
                        <input
                          type="number"
                          value={productForm.precioOriginal || ''}
                          onChange={(e) => setProductForm({ ...productForm, precioOriginal: e.target.value ? parseFloat(e.target.value) : undefined })}
                          min="0"
                          step="1"
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none transition-all duration-200 bg-white/70" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties} onFocus={(e) => e.target.style.borderColor = '#F16529'} onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          placeholder="Dejar vacío si no hay descuento"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Si agregas un precio anterior, se mostrará tachado y el % de descuento
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compact Stock Section */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg border border-orange-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                        <span className="text-white text-xs">📊</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">Control de Inventario</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <span>📦</span> Stock Actual *
                        </label>
                        <input
                          type="number"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                          required
                          min="0"
                          step="1"
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-all duration-200 bg-white/70"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <span>⚠️</span> Stock Mínimo *
                        </label>
                        <input
                          type="number"
                          value={productForm.minStock}
                          onChange={(e) => setProductForm({ ...productForm, minStock: Number(e.target.value) })}
                          required
                          min="0"
                          step="1"
                          placeholder="5"
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-all duration-200 bg-white/70"
                        />
                        <p className="text-xs text-green-600 mt-1">📊 Para alertas de stock bajo</p>
                      </div>
                    </div>
                  </div>

                  {/* Compact Categories Section */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg border border-orange-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                        <span className="text-white text-xs">📂</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">Categorización</h4>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <span>📂</span> Categorías y Subcategorías * (selecciona todas las que apliquen)
                        </label>
                        <div className="border-2 border-gray-200 rounded-lg p-3 bg-white/70 max-h-[55vh] overflow-y-auto space-y-4">
                          {categories.map((category) => {
                            const subcategorias = (category as any).subcategorias || [];
                            const isCategoryChecked = productForm.categorias.includes(category.id);

                            return (
                              <div key={category.id} className="border-b border-gray-200 pb-3 last:border-0">
                                {/* Categoría principal */}
                                <label className="flex items-center gap-2 hover:bg-purple-50 p-2 rounded cursor-pointer font-medium">
                                  <input
                                    type="checkbox"
                                    checked={isCategoryChecked}
                                    onChange={(e) => {
                                      let newCategorias = [...productForm.categorias];

                                      if (e.target.checked) {
                                        // Agregar categoría
                                        newCategorias.push(category.id);
                                      } else {
                                        // Quitar categoría y todas sus subcategorías
                                        newCategorias = newCategorias.filter(c => {
                                          if (c === category.id) return false;
                                          if (c.startsWith(`${category.id}-`)) return false;
                                          return true;
                                        });
                                      }

                                      setProductForm({
                                        ...productForm,
                                        categorias: newCategorias,
                                        categoria: newCategorias[0]?.split('-')[0] || ''
                                      });
                                    }}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="text-sm">📂 {category.name}</span>
                                </label>

                                {/* Subcategorías */}
                                {subcategorias.length > 0 && (
                                  <div className="ml-6 mt-2 space-y-1">
                                    {subcategorias.map((sub: any) => {
                                      const subId = `${category.id}-${sub.id}`;
                                      return (
                                        <label key={sub.id} className="flex items-center gap-2 hover:bg-purple-50 p-1.5 rounded cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={productForm.categorias.includes(subId)}
                                            onChange={(e) => {
                                              let newCategorias = [...productForm.categorias];

                                              if (e.target.checked) {
                                                // Agregar subcategoría y asegurar que categoría padre esté incluida
                                                if (!newCategorias.includes(category.id)) {
                                                  newCategorias.push(category.id);
                                                }
                                                newCategorias.push(subId);
                                              } else {
                                                // Quitar subcategoría
                                                newCategorias = newCategorias.filter(c => c !== subId);
                                              }

                                              setProductForm({
                                                ...productForm,
                                                categorias: newCategorias,
                                                categoria: newCategorias[0]?.split('-')[0] || ''
                                              });
                                            }}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                          />
                                          <span className="text-xs">📁 {sub.nombre}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {productForm.categorias.length === 0 && (
                          <p className="text-xs text-red-500 mt-1">Debes seleccionar al menos una categoría o subcategoría</p>
                        )}
                        {productForm.categorias.length > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {productForm.categorias.length} seleccionada(s)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compact Description Section */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg border border-orange-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                        <span className="text-white text-xs">📝</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">Descripción</h4>
                    </div>
                    <textarea
                      value={productForm.descripcion}
                      onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-all duration-200 resize-none bg-white/70"
                      placeholder="Describe las características principales del producto..."
                    />
                  </div>

                  {/* Compact Images Section */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg border border-orange-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                        <span className="text-white text-xs">🖼️</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">Imágenes del Producto</h4>
                    </div>

                    {/* Image Specifications */}
                    <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs">
                      <p className="text-orange-800 font-medium mb-1">📐 Especificaciones:</p>
                      <ul className="text-orange-700 space-y-0.5">
                        <li>• <strong>Tamaño:</strong> 800x800px (1:1)</li>
                        <li>• <strong>Formato:</strong> JPG o PNG</li>
                        <li>• <strong>Fondo:</strong> Blanco preferible</li>
                        <li>• <strong>Máximo:</strong> 5MB por imagen</li>
                      </ul>
                    </div>

                    {/* Compact Image Upload Area */}
                    <div className="border-2 border-dashed border-orange-200 rounded-lg p-3 text-center bg-orange-50/50 hover:bg-orange-50 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setProductImages(prev => [...prev, ...files]);

                          // Create previews
                          files.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setProductImagePreviews(prev => [...prev, e.target?.result as string]);
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                        className="hidden"
                        id="product-images"
                      />
                      <label htmlFor="product-images" className="cursor-pointer block">
                        <div className="flex flex-col items-center">
                          <div className="text-2xl mb-1">📸</div>
                          <p className="text-xs font-medium" style={{ color: '#F16529' }}>Agregar imágenes</p>
                          <p className="text-xs" style={{ color: '#D13C1A' }}>Múltiples archivos</p>
                        </div>
                      </label>
                    </div>

                    {/* Compact Image Previews */}
                    {(productImagePreviews.length > 0 || (productForm.imagenes && productForm.imagenes.length > 0)) && (
                      <div className="mt-3 space-y-3">
                        {/* Existing images from product */}
                        {productForm.imagenes && productForm.imagenes.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-2">📦 Imágenes actuales del producto:</p>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                              {productForm.imagenes.map((imageUrl, index) => (
                                <div key={`existing-${index}`} className="relative group">
                                  <img
                                    loading="lazy"
                                    src={imageUrl}
                                    alt={`Actual ${index + 1}`}
                                    className="w-full h-16 object-cover rounded-lg border-2 border-green-200 shadow-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newImagenes = productForm.imagenes?.filter((_, i) => i !== index) || [];
                                      setProductForm(prev => ({
                                        ...prev,
                                        imagenes: newImagenes,
                                        imagen: newImagenes.length > 0 ? newImagenes[0] : ''
                                      }));
                                    }}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    ✕
                                  </button>
                                  <div className="absolute -top-1 -left-1">
                                    <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full text-[10px]">#{index + 1}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* New image previews */}
                        {productImagePreviews.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-2">✨ Nuevas imágenes a agregar:</p>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                              {productImagePreviews.map((preview, index) => (
                                <div key={`new-${index}`} className="relative group">
                                  <img
                                    loading="lazy"
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-16 object-cover rounded-lg border-2 border-indigo-200 shadow-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProductImages(prev => prev.filter((_, i) => i !== index));
                                      setProductImagePreviews(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                  >
                                    ✕
                                  </button>
                                  <div className="absolute -top-1 -left-1">
                                    <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full text-[10px]">Nuevo</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Compact Tags Section */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 lg:p-5 shadow-lg border border-orange-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F16529' }}>
                        <span className="text-white text-xs">🏷️</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">Etiquetas</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 cursor-pointer bg-orange-50 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={productForm.nuevo}
                          onChange={(e) => setProductForm({ ...productForm, nuevo: e.target.checked })}
                          className="rounded w-4 h-4" style={{ color: '#F16529', '--tw-ring-color': '#F16529' } as React.CSSProperties}
                        />
                        <span className="text-xs font-semibold" style={{ color: '#F16529' }}>✨ Nuevo</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer bg-orange-50 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={productForm.oferta}
                          onChange={(e) => setProductForm({ ...productForm, oferta: e.target.checked })}
                          className="rounded w-4 h-4" style={{ color: '#F16529', '--tw-ring-color': '#F16529' } as React.CSSProperties}
                        />
                        <span className="text-xs font-semibold" style={{ color: '#F16529' }}>🔥 Oferta</span>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modern Compact Bottom Actions - Fixed */}
              <div className="bg-white/95 backdrop-blur-sm p-4 border-t border-orange-200 flex-shrink-0">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    onClick={handleProductSubmit}
                    disabled={uploadingProduct}
                    className="flex-[2] text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    style={{
                      backgroundColor: '#F16529'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                  >
                    {uploadingProduct ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {productForm.id ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Actualizar
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Crear Producto
                          </>
                        )}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'homepage-content' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">📝 Editar Contenido de la Página Principal</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="text-green-500 text-xl mr-3">✨</div>
                <div>
                  <h3 className="text-green-800 font-semibold mb-2">🚀 ¡Súper fácil! Solo selecciona y se guarda automáticamente</h3>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• <strong>📁 Subir imágenes:</strong> Haz clic en &quot;Elegir archivo&quot; para subir directamente desde tu computadora</li>
                    <li>• <strong>🎯 Seleccionar enlaces:</strong> Listas desplegables con categorías y productos existentes</li>
                    <li>• <strong>⚡ Guardado automático:</strong> Se guarda automáticamente al cambiar cualquier opción</li>
                    <li>• <strong>👁️ Ver cambios:</strong> Abre la página principal para ver los resultados al instante</li>
                  </ul>
                </div>
              </div>
            </div>
            
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">🎨 Secciones Promocionales de la Página Principal</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      const restoredSections = DEFAULT_PROMOTIONAL_SECTIONS.map((section) => ({ ...section }));
                      const newContent: HomepageContentState = {
                        ...homepageContent,
                        promotionalSections: restoredSections,
                      };

                      setHomepageContent(newContent);
                      autoSaveHomepageContent(newContent);
                      alert('✅ Imágenes por defecto restauradas!');
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 rounded transition-colors"
                  >
                    🔄 Restaurar Imágenes
                  </button>

                  {isAutoSaving ? (
                    <div className="flex items-center text-orange-600 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                      Guardando...
                    </div>
                  ) : (
                    <div className="text-green-600 text-sm flex items-center">
                      ✅ Guardado automático activo
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {                  return homepageContent.promotionalSections.map((section, index) => {                    const previewWrapperClasses = (() => {
                      const base = 'relative w-full bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-300';
                      switch (section.position) {
                        case 'large':
                          return `${base} max-w-[240px] aspect-square`;
                        case 'tall':
                          return `${base} max-w-[180px] aspect-[1/2]`;
                        case 'wide':
                          return `${base} max-w-[340px] aspect-[3/1]`;
                        default:
                          return `${base} max-w-[220px] aspect-[4/3]`;
                      }
                    })();

                    return (
                  <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-orange-300 transition-colors">
                    
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">
                          {section.position === 'large' ? '🔲 Grande (2x2)' :
                           section.position === 'tall' ? '📱 Alto (1x2)' :
                           section.position === 'wide' ? '📺 Ancho (3:1)' : '⬜ Normal (1x1)'}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                            {section.linkType === 'category' ? '📁 Categoría' :
                             section.linkType === 'product' ? '📦 Producto' :
                             section.linkType === 'filter' ? '🔍 Filtro' : '🔗 URL'}
                          </span>
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar esta sección promocional?')) {
                                const newContent: HomepageContentState = {
                                  ...homepageContent,
                                  promotionalSections: homepageContent.promotionalSections.filter((_, i) => i !== index)
                                };
                                setHomepageContent(newContent);
                                autoSaveHomepageContent(newContent);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Eliminar sección"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold text-gray-700 flex items-center">
                          ✨ Vista Previa en Vivo
                        </h5>
                        <div className={`${previewWrapperClasses} mx-auto md:mx-0`}>
                          {section.imageUrl ? (
                            <img
                              src={section.imageUrl}
                              alt={section.title}
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={(e) => {
                                console.error('Error loading image:', section.imageUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-800/60">
                              <div className="text-center">
                                <div className="text-4xl mb-2">📷</div>
                                <div className="text-xs">Sube una imagen</div>
                              </div>
                            </div>
                          )}

                          
                          {section.badgeText && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold shadow-lg">
                              {section.badgeText}
                            </div>
                          )}

                          
                          {section.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent text-white p-3">
                              <div className="font-bold text-sm">{section.title}</div>
                              {section.description && (
                                <div className="text-xs opacity-90 mt-1">{section.description}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      
                      <div className="space-y-3">
                        <h5 className="text-sm font-semibold text-gray-700 flex items-center">
                          ⚙️ Configuración
                        </h5>

                      
                      <div>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => {
                            updateSection(index, { ...section, title: e.target.value });
                          }}
                          className="w-full font-semibold text-gray-900 border-0 border-b border-gray-300 bg-transparent pb-1 focus:border-orange-500 focus:outline-none"
                          placeholder="Título de la sección"
                        />
                        <input
                          type="text"
                          value={section.description}
                          onChange={(e) => {
                            updateSection(index, { ...section, description: e.target.value });
                          }}
                          className="w-full text-sm text-gray-600 mt-1 border-0 border-b border-gray-300 bg-transparent pb-1 focus:border-orange-500 focus:outline-none"
                          placeholder="Descripción de la sección"
                        />
                      </div>
                      
                      
                      <input
                        type="text"
                        value={section.badgeText}
                        onChange={(e) => {
                          updateSection(index, { ...section, badgeText: e.target.value });
                        }}
                        placeholder="Texto del badge (ej: OFERTA, NUEVO)"
                        className="w-full text-xs border rounded px-2 py-1 focus:border-orange-500 focus:outline-none"
                      />
                      
                      
                      <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                        <p className="text-purple-800 font-medium">📐 Resolución recomendada:</p>
                        <p className="text-purple-700">
                          {section.position === 'large' ? '1200x1200px (1:1)' :
                           section.position === 'tall' ? '800x1600px (1:2)' :
                           section.position === 'wide' ? '1440x480px (3:1)' : '1200x900px (4:3)'}
                          {' • JPG/PNG • Max 3MB'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, index, section);
                            }
                          }}
                          className="flex-1 text-xs border rounded px-2 py-1 focus:border-orange-500 focus:outline-none"
                        />
                        {uploadingImages[section.id] && (
                          <div className="flex items-center text-orange-600 text-xs">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 mr-1"></div>
                            Subiendo...
                          </div>
                        )}
                      </div>
                      
                      
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700">Tipo de enlace</label>
                        <select
                          value={section.linkType}
                          onChange={(e) => {
                            updateSection(index, { ...section, linkType: e.target.value as any, linkValue: '' });
                          }}
                          className="w-full text-xs border rounded px-2 py-1.5 focus:border-orange-500 focus:outline-none"
                        >
                          <option value="category">📁 Categoría</option>
                          <option value="product">📦 Producto</option>
                          <option value="filter">🔍 Filtro</option>
                          <option value="url">🔗 URL personalizada</option>
                        </select>

                        {section.linkType === 'category' ? (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar categoría</label>
                            <select
                              value={section.linkValue}
                              onChange={(e) => {
                                updateSection(index, { ...section, linkValue: e.target.value });
                              }}
                              className="w-full text-xs border rounded px-2 py-1.5 focus:border-orange-500 focus:outline-none"
                            >
                              <option value="">-- Selecciona una categoría --</option>
                              {availableCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : section.linkType === 'product' ? (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar producto</label>
                            <select
                              value={section.linkValue}
                              onChange={(e) => {
                                updateSection(index, { ...section, linkValue: e.target.value });
                              }}
                              className="w-full text-xs border rounded px-2 py-1.5 focus:border-orange-500 focus:outline-none"
                            >
                              <option value="">-- Selecciona un producto --</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : section.linkType === 'filter' ? (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar filtro</label>
                            <select
                              value={section.linkValue}
                              onChange={(e) => {
                                updateSection(index, { ...section, linkValue: e.target.value });
                              }}
                              className="w-full text-xs border rounded px-2 py-1.5 focus:border-orange-500 focus:outline-none"
                            >
                              <option value="">-- Selecciona un filtro --</option>
                              <option value="ofertas">🏷️ Ofertas</option>
                              <option value="nuevos">✨ Nuevos</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">URL personalizada</label>
                            <input
                              type="text"
                              value={section.linkValue}
                              onChange={(e) => {
                                updateSection(index, { ...section, linkValue: e.target.value });
                              }}
                              placeholder="https://ejemplo.com"
                              className="w-full text-xs border rounded px-2 py-1.5 focus:border-orange-500 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                      
                      
                      <select
                        value={section.position}
                        onChange={(e) => {
                          updateSection(index, { ...section, position: e.target.value as "large" | "tall" | "normal" | "wide" });
                        }}
                        className="w-full text-xs border rounded px-2 py-1 focus:border-orange-500 focus:outline-none"
                      >
                        <option value="large">Grande (2x2)</option>
                        <option value="tall">Alto (1x2)</option>
                        <option value="wide">Ancho (2x1)</option>
                        <option value="normal">Normal (1x1)</option>
                      </select>
                      </div>
                    </div>
                  </div>
                    );
                  });
                })()}
              </div>

              {/* Add New Section Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    const newSection: PromotionalSectionState = {
                      id: `section-${Date.now()}`,
                      title: 'Nueva Sección',
                      description: 'Descripción de la sección',
                      imageUrl: '',
                      badgeText: '',
                      linkType: 'category',
                      linkValue: '',
                      position: 'normal',
                      selectedProducts: []
                    };

                    const newContent: HomepageContentState = {
                      ...homepageContent,
                      promotionalSections: [...homepageContent.promotionalSections, newSection]
                    };

                    setHomepageContent(newContent);
                    autoSaveHomepageContent(newContent);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md"
                >
                  ➕ Agregar Nueva Sección Promocional
                </button>
              </div>


              <div className="mt-10 border-t border-gray-200 pt-6">
                <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">🖼️ Banners Intermedios</h3>
                    <p className="text-sm text-gray-600">
                      Banners que aparecen entre secciones de la página principal.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const restored = DEFAULT_MIDDLE_BANNERS.map((banner) => ({ ...banner }));
                      const newContent: HomepageContentState = { ...homepageContent, middleBanners: restored };
                      setHomepageContent(newContent);
                      autoSaveHomepageContent(newContent);
                      alert('✅ Banners restaurados');
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-2 rounded transition-colors"
                  >
                    🔄 Restaurar
                  </button>
                </div>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm font-medium">📐 Tamaño recomendado: 1440x480px (3:1) | Formato: JPG/PNG | Peso máx: 4MB</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {homepageContent.middleBanners.map((banner, index) => {
                    const placementLabel = index === 0
                      ? 'Banner entre las primeras secciones'
                      : index === 1
                        ? 'Banner después de la segunda sección'
                        : 'Banner al final de la página';
                    const stateKey = `middle-${banner.id}`;

                    return (
                      <div key={banner.id || `middle-${index}`} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                        <h4 className="font-medium text-gray-900">Banner #{index + 1}</h4>

                        <div className="space-y-3">
                          {/* Preview */}
                          {banner.imageUrl && (
                            <div className="relative h-32 bg-gray-100 rounded overflow-hidden">
                              <img
                                src={banner.imageUrl}
                                alt={banner.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}

                          {/* Título */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Título</label>
                            <input
                              type="text"
                              value={banner.title}
                              onChange={(e) => updateMiddleBanner(index, { ...banner, title: e.target.value })}
                              className="w-full text-sm border rounded px-2 py-1.5 focus:border-orange-500 focus:outline-none"
                              placeholder="Ej: Ofertas Especiales"
                            />
                          </div>

                          {/* Subtítulo */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Subtítulo</label>
                            <input
                              type="text"
                              value={banner.subtitle}
                              onChange={(e) => updateMiddleBanner(index, { ...banner, subtitle: e.target.value })}
                              className="w-full text-sm border rounded px-2 py-1.5 focus:border-orange-500 focus:outline-none"
                              placeholder="Ej: Hasta 50% de descuento"
                            />
                          </div>

                          {/* Tipo de Enlace */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de enlace</label>
                            <select
                              value={banner.linkType || 'url'}
                              onChange={(e) => {
                                const linkType = e.target.value as 'category' | 'product' | 'filter' | 'url' | 'popup-ofertas';
                                updateMiddleBanner(index, { ...banner, linkType, linkValue: '', ctaLink: '' });
                              }}
                              className="w-full text-xs border rounded px-2 py-1 focus:border-orange-500 focus:outline-none"
                            >
                              <option value="category">📁 Categoría</option>
                              <option value="product">📦 Producto</option>
                              <option value="filter">🔍 Filtro</option>
                              <option value="popup-ofertas">🎯 Secciones Especiales</option>
                              <option value="url">🔗 URL personalizada</option>
                            </select>

                            {banner.linkType === 'category' ? (
                              <div className="mt-2">
                                <select
                                  value={banner.linkValue || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    updateMiddleBanner(index, { ...banner, linkValue: value, ctaLink: `/?category=${value}` });
                                  }}
                                  className="w-full text-xs border rounded px-2 py-1.5 focus:border-orange-500 focus:outline-none"
                                >
                                  <option value="">-- Selecciona una categoría --</option>
                                  {availableCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                              </div>
                            ) : banner.linkType === 'filter' ? (
                              <div className="mt-2">
                                <select
                                  value={banner.linkValue || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    updateMiddleBanner(index, { ...banner, linkValue: value, ctaLink: `/?filter=${value}` });
                                  }}
                                  className="w-full text-xs border rounded px-2 py-1.5 focus:border-orange-500 focus:outline-none"
                                >
                                  <option value="">-- Selecciona un filtro --</option>
                                  <option value="ofertas">🏷️ Ofertas</option>
                                  <option value="nuevos">✨ Nuevos</option>
                                </select>
                              </div>
                            ) : banner.linkType === 'popup-ofertas' ? (
                              <div className="mt-2">
                                <input
                                  type="text"
                                  value="/popup-ofertas"
                                  disabled
                                  className="w-full text-xs border rounded px-2 py-1.5 bg-gray-100 text-gray-600"
                                />
                                <p className="text-xs text-gray-500 mt-1">Enlaza a la página de ofertas especiales</p>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <input
                                  type="text"
                                  value={banner.ctaLink}
                                  onChange={(e) => updateMiddleBanner(index, { ...banner, ctaLink: e.target.value })}
                                  className="w-full text-sm border rounded px-2 py-1.5 focus:border-orange-500 focus:outline-none"
                                  placeholder="https://ejemplo.com o /?filter=ofertas"
                                />
                              </div>
                            )}
                          </div>

                          {/* Subir Imagen */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Imagen del Banner</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleMiddleBannerImageUpload(file, index, banner);
                                }
                              }}
                              className="w-full text-xs border rounded px-2 py-1.5 focus:border-orange-500 focus:outline-none"
                            />
                            {uploadingImages[stateKey] && (
                              <p className="text-xs text-orange-600 mt-1">
                                <span className="animate-pulse">⏳</span> Subiendo...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <a
                  href="/"
                  target="_blank"
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg flex items-center gap-2"
                >
                  👁️ Ver Página Principal (Nueva pestaña)
                </a>
                <button
                  onClick={() => saveHomepageContent()}
                  className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  💾 Forzar Guardado
                </button>
                <button
                  onClick={() => loadHomepageContent()}
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  🔄 Recargar
                </button>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'footer' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Información del Footer</h2>
              
              <form className="space-y-6">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción de la Empresa
                  </label>
                  <textarea
                    value={footerForm.companyDescription}
                    onChange={(e) => setFooterForm({ ...footerForm, companyDescription: e.target.value })}
                    placeholder="Tu tienda online de confianza con los mejores productos importados."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  />
                </div>

                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📞 Teléfono
                    </label>
                    <input
                      type="text"
                      value={footerForm.phone}
                      onChange={(e) => setFooterForm({ ...footerForm, phone: e.target.value })}
                      placeholder="+1 234 567 890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📧 Email
                    </label>
                    <input
                      type="email"
                      value={footerForm.email}
                      onChange={(e) => setFooterForm({ ...footerForm, email: e.target.value })}
                      placeholder="info@importadorafyd.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📍 Dirección
                  </label>
                  <input
                    type="text"
                    value={footerForm.address}
                    onChange={(e) => setFooterForm({ ...footerForm, address: e.target.value })}
                    placeholder="Calle Principal 123, Ciudad"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  />
                </div>

                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Redes Sociales</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📘 Facebook URL
                      </label>
                      <input
                        type="url"
                        value={footerForm.facebookUrl}
                        onChange={(e) => setFooterForm({ ...footerForm, facebookUrl: e.target.value })}
                        placeholder="https://facebook.com/tu-pagina"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📷 Instagram URL
                      </label>
                      <input
                        type="url"
                        value={footerForm.instagramUrl}
                        onChange={(e) => setFooterForm({ ...footerForm, instagramUrl: e.target.value })}
                        placeholder="https://instagram.com/tu-cuenta"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💬 WhatsApp (número de teléfono)
                      </label>
                      <input
                        type="tel"
                        value={footerForm.whatsappUrl}
                        onChange={(e) => setFooterForm({ ...footerForm, whatsappUrl: e.target.value })}
                        placeholder="912345678 o 56912345678"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Número de teléfono (se agregará automáticamente el código 56 si no lo incluyes)
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setUpdatingFooter(true);

                      // Update footer configuration using the hook
                      await updateFooterConfig({
                        description: footerForm.companyDescription,
                        contact: {
                          phone: footerForm.phone,
                          email: footerForm.email,
                          address: footerForm.address
                        },
                        socialMedia: {
                          facebook: footerForm.facebookUrl,
                          instagram: footerForm.instagramUrl,
                          whatsapp: footerForm.whatsappUrl
                        }
                      });

                      alert('Información del footer actualizada exitosamente');
                    } catch (error) {
                      console.error('Error updating footer:', error);
                      alert('Error al actualizar la información del footer');
                    } finally {
                      setUpdatingFooter(false);
                    }
                  }}
                  disabled={updatingFooter}
                  className="text-white font-semibold text-base py-3 px-6 rounded-md transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#F16529' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                >
                  {updatingFooter ? 'Actualizando...' : 'Actualizar Información'}
                </button>
              </form>
              
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa del Footer:</h3>
                <div className="bg-orange-500 text-white p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Importadora F&D</h4>
                      <p className="text-gray-300 text-sm">{footerForm.companyDescription}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Contacto</h4>
                      <div className="space-y-1 text-gray-300 text-sm">
                        <p>📞 {footerForm.phone}</p>
                        <p>📧 {footerForm.email}</p>
                        <p>📍 {footerForm.address}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Síguenos</h4>
                      <div className="flex space-x-4">
                        <span className="text-2xl cursor-pointer">📘</span>
                        <span className="text-2xl cursor-pointer">📷</span>
                        <span className="text-2xl cursor-pointer">💬</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bank-details' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🏦 Configuración de Datos Bancarios</h2>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏛️ Nombre del Banco
                    </label>
                    <input
                      type="text"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      placeholder="Banco de Chile"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💳 Tipo de Cuenta
                    </label>
                    <select
                      value={bankForm.accountType}
                      onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                    >
                      <option value="Cuenta Corriente">Cuenta Corriente</option>
                      <option value="Cuenta Vista">Cuenta Vista</option>
                      <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔢 Número de Cuenta
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      placeholder="123-456-789-01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🆔 RUT del Titular
                    </label>
                    <input
                      type="text"
                      value={bankForm.rut}
                      onChange={(e) => setBankForm({ ...bankForm, rut: e.target.value })}
                      placeholder="12.345.678-9"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👤 Nombre del Titular
                    </label>
                    <input
                      type="text"
                      value={bankForm.holderName}
                      onChange={(e) => setBankForm({ ...bankForm, holderName: e.target.value })}
                      placeholder="Importadora FyD SpA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📧 Email para Confirmaciones
                    </label>
                    <input
                      type="email"
                      value={bankForm.email}
                      onChange={(e) => setBankForm({ ...bankForm, email: e.target.value })}
                      placeholder="pagos@importadorafyd.cl"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setUpdatingBank(true);
                      await updateBankConfig(bankForm);
                      alert('Datos bancarios actualizados exitosamente');
                    } catch (error) {
                      console.error('Error updating bank details:', error);
                      alert('Error al actualizar los datos bancarios');
                    } finally {
                      setUpdatingBank(false);
                    }
                  }}
                  disabled={updatingBank}
                  className="text-white font-semibold text-base py-3 px-6 rounded-md transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#F16529' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                >
                  {updatingBank ? 'Actualizando...' : 'Actualizar Datos Bancarios'}
                </button>
              </form>

              {/* Vista previa */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa en Checkout:</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">📋 Datos para transferencia:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Banco:</span>
                        <span className="ml-2">{bankForm.bankName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Tipo de cuenta:</span>
                        <span className="ml-2">{bankForm.accountType}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Número de cuenta:</span>
                        <span className="ml-2">{bankForm.accountNumber}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">RUT:</span>
                        <span className="ml-2">{bankForm.rut}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Titular:</span>
                        <span className="ml-2">{bankForm.holderName}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Email para confirmación:</span>
                        <span className="ml-2">{bankForm.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>


      {chatPopupOrder && (
        <AdminChatPopup
          order={{...chatPopupOrder, userId: '', updatedAt: ''} as any}
          isOpen={isChatPopupOpen}
          onClose={closeChatPopup}
        />
      )}

      
      {showSectionModal && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editingSection ? 'Editar Sección' : 'Nueva Sección'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Configura cómo se verá esta sección en la página principal
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSectionModal(false);
                    setSectionSaveStatus('idle');
                    setPreviewName('');
                    setPreviewDescription('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form
                key={editingSection?.id || 'new'}
                onSubmit={async (e) => {
                e.preventDefault();
                setSectionSaveStatus('saving');

                const formData = new FormData(e.currentTarget);
                const sectionData = {
                  id: editingSection?.id || `section_${Date.now()}`,
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  enabled: true,
                  type: formData.get('type') as string,
                  selectedProducts: editingSection?.selectedProducts || []
                };

                let newSections;
                if (editingSection) {
                  newSections = productSections.map(s =>
                    s.id === editingSection.id ? sectionData : s
                  );
                  setProductSections(newSections);
                } else {
                  newSections = [...productSections, sectionData];
                  setProductSections(newSections);
                }

                // Auto-save to Firebase
                try {
                  await setDoc(doc(db, 'config', 'productSections'), {
                    sections: newSections,
                    updatedAt: new Date().toISOString()
                  });
                  setSectionSaveStatus('success');

                  // Close modal after a brief delay to show success message
                  setTimeout(() => {
                    setShowSectionModal(false);
                    setEditingSection(null);
                    setSectionSaveStatus('idle');
                  }, 1500);
                } catch (error) {
                  console.error('Error auto-saving section:', error);
                  setSectionSaveStatus('error');
                  setTimeout(() => setSectionSaveStatus('idle'), 3000);
                }
              }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la Sección *
                      </label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingSection?.name || ''}
                        onChange={(e) => setPreviewName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-base"
                        style={{ '--tw-ring-color': '#F16529' } as any}
                        placeholder="Ej: Ofertas Especiales"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        name="description"
                        defaultValue={editingSection?.description || ''}
                        onChange={(e) => setPreviewDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-base resize-none"
                        style={{ '--tw-ring-color': '#F16529' } as any}
                        placeholder="Breve descripción de la sección"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Sección
                      </label>
                      <select
                        name="type"
                        defaultValue={editingSection?.type || 'custom'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-base"
                        style={{ '--tw-ring-color': '#F16529' } as any}
                      >
                        <option value="custom">🎯 Productos Personalizados</option>
                        <option value="featured">⭐ Productos Destacados</option>
                        <option value="new">🆕 Productos Nuevos</option>
                        <option value="bestsellers">🔥 Más Vendidos</option>
                        <option value="category">📁 Por Categoría</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column - Preview */}
                  <div className="bg-gradient-to-br from-orange-50 via-white to-gray-50 rounded-xl p-6 border-2 border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                        <span className="mr-2">👁️</span> Vista Previa en el Sitio
                      </h4>
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                        En Vivo
                      </span>
                    </div>

                    {/* Preview of section as it appears on website */}
                    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
                      {/* Section Header */}
                      <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-orange-500">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {previewName || editingSection?.name || 'Nombre de Sección'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {previewDescription || editingSection?.description || 'Descripción de la sección'}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-orange-500 font-semibold hover:text-orange-600 whitespace-nowrap"
                        >
                          Ver todos →
                        </button>
                      </div>

                      {/* Product Cards Preview */}
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <div className="bg-gray-200 rounded h-20 mb-2 flex items-center justify-center">
                              <span className="text-2xl">📦</span>
                            </div>
                            <div className="space-y-1">
                              <div className="h-2 bg-gray-300 rounded w-full"></div>
                              <div className="h-2 bg-orange-200 rounded w-2/3"></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-gray-400 mt-3 text-center">
                        {editingSection?.selectedProducts?.length || 0} productos configurados
                      </p>
                    </div>

                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 text-center font-medium">
                        💡 Los productos se mostrarán en carrusel horizontal
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {sectionSaveStatus !== 'idle' && (
                  <div className={`mt-6 p-4 rounded-lg flex items-center justify-center text-center font-semibold transition-all ${
                    sectionSaveStatus === 'saving' ? 'bg-blue-50 text-blue-700 animate-pulse' :
                    sectionSaveStatus === 'success' ? 'bg-green-50 text-green-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {sectionSaveStatus === 'saving' && (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Guardando cambios...
                      </>
                    )}
                    {sectionSaveStatus === 'success' && (
                      <>
                        <span className="mr-2">✅</span>
                        ¡Guardado exitosamente! Los cambios ya están activos en tu sitio web.
                      </>
                    )}
                    {sectionSaveStatus === 'error' && (
                      <>
                        <span className="mr-2">❌</span>
                        Error al guardar. Por favor intenta nuevamente.
                      </>
                    )}
                  </div>
                )}

                <div className="flex space-x-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSectionModal(false);
                      setSectionSaveStatus('idle');
                      setPreviewName('');
                      setPreviewDescription('');
                    }}
                    disabled={sectionSaveStatus === 'saving'}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-base py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={sectionSaveStatus === 'saving'}
                    className="flex-1 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#F16529' }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#D13C1A')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                  >
                    {sectionSaveStatus === 'saving' ? 'Guardando...' : (editingSection ? 'Actualizar' : 'Crear') + ' Sección'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      
      {showProductSelector && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-full w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Seleccionar Productos para la Sección
                </h3>
                <button
                  onClick={() => {
                    setShowProductSelector(false);
                    // Reset filters when closing
                    setProductSelectorFilters({
                      category: '',
                      search: '',
                      showOnlySelected: false
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar por nombre
                    </label>
                    <input
                      type="text"
                      value={productSelectorFilters.search}
                      onChange={(e) => setProductSelectorFilters(prev => ({
                        ...prev,
                        search: e.target.value
                      }))}
                      placeholder="Buscar productos..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#F16529' } as any}
                    />
                  </div>

                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filtrar por categoría
                    </label>
                    <select
                      value={productSelectorFilters.category}
                      onChange={(e) => setProductSelectorFilters(prev => ({
                        ...prev,
                        category: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#F16529' } as any}
                    >
                      <option value="">Todas las categorías</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opciones de vista
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productSelectorFilters.showOnlySelected}
                          onChange={(e) => setProductSelectorFilters(prev => ({
                            ...prev,
                            showOnlySelected: e.target.checked
                          }))}
                          className="h-4 w-4 text-orange-500 rounded mr-2"
                        />
                        <span className="text-sm text-gray-700">Solo seleccionados</span>
                      </label>
                      <button
                        onClick={() => setProductSelectorFilters({
                          category: '',
                          search: '',
                          showOnlySelected: false
                        })}
                        className="text-sm text-orange-600 hover:text-orange-800"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="mb-4 text-sm text-gray-600">
                Mostrando {products
                  .filter((product) => {
                    const currentSection = productSections.find(s => s.id === currentSectionId);
                    const isSelected = currentSection?.selectedProducts.includes(product.id as never) || false;

                    if (productSelectorFilters.search) {
                      const searchTerm = productSelectorFilters.search.toLowerCase();
                      const matchesSearch = product.nombre.toLowerCase().includes(searchTerm) ||
                                          product.descripcion?.toLowerCase().includes(searchTerm) ||
                                          product.categoria?.toLowerCase().includes(searchTerm);
                      if (!matchesSearch) return false;
                    }

                    if (productSelectorFilters.category) {
                      if (!productHasCategory(product, productSelectorFilters.category)) return false;
                    }

                    if (productSelectorFilters.showOnlySelected && !isSelected) {
                      return false;
                    }

                    return true;
                  }).length} de {products.length} productos
                {productSelectorFilters.category && (
                  <span className="font-medium">
                    {' '}en categoría &quot;
                    {categories.find(cat => cat.id === productSelectorFilters.category)?.name}
                    &quot;
                  </span>
                )}
                {productSelectorFilters.search && (
                  <span className="font-medium">
                    {' '}que coinciden con &quot;
                    {productSelectorFilters.search}
                    &quot;
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products
                  .filter((product) => {
                    const currentSection = productSections.find(s => s.id === currentSectionId);
                    const isSelected = currentSection?.selectedProducts.includes(product.id as never) || false;

                    // Apply search filter
                    if (productSelectorFilters.search) {
                      const searchTerm = productSelectorFilters.search.toLowerCase();
                      const matchesSearch = product.nombre.toLowerCase().includes(searchTerm) ||
                                          product.descripcion?.toLowerCase().includes(searchTerm) ||
                                          product.categoria?.toLowerCase().includes(searchTerm);
                      if (!matchesSearch) return false;
                    }

                    // Apply category filter
                    if (productSelectorFilters.category) {
                      if (!productHasCategory(product, productSelectorFilters.category)) return false;
                    }

                    // Apply "only selected" filter
                    if (productSelectorFilters.showOnlySelected && !isSelected) {
                      return false;
                    }

                    return true;
                  })
                  .map((product) => {
                  const currentSection = productSections.find(s => s.id === currentSectionId);
                  const isSelected = currentSection?.selectedProducts.includes(product.id as never) || false;

                  return (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={async (e) => {
                            const newSections = productSections.map(section => {
                              if (section.id === currentSectionId) {
                                const selectedProducts = e.target.checked
                                  ? [...section.selectedProducts, product.id]
                                  : section.selectedProducts.filter(id => id !== product.id);
                                return { ...section, selectedProducts };
                              }
                              return section;
                            });
                            setProductSections(newSections as any);

                            // Auto-save to Firebase
                            try {
                              await setDoc(doc(db, 'config', 'productSections'), {
                                sections: newSections,
                                updatedAt: new Date().toISOString()
                              });
                            } catch (error) {
                              console.error('Error auto-saving product selection:', error);
                            }
                          }}
                          className="mt-1 h-4 w-4 text-orange-500 rounded"
                        />
                        <div className="flex-1">
                          {product.imagen && (
                            <img
                              src={product.imagen}
                              alt={product.nombre}
                              className="w-full h-24 object-cover rounded mb-2"
                            />
                          )}
                          <h4 className="font-medium text-gray-900 text-sm">{product.nombre}</h4>
                          <p className="text-gray-600 text-xs mt-1">${product.precio?.toLocaleString()}</p>
                          <p className="text-gray-500 text-xs">{product.categoria}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setShowProductSelector(false)}
                  className="text-white font-medium py-2 px-6 rounded-md transition-colors"
                  style={{ backgroundColor: '#F16529' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
