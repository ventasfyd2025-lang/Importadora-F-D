'use client';

import React, { useState, useEffect, useCallback } from 'react';

export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
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
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Product, Order } from '@/types';
import { cleanAllData } from '@/scripts/cleanData';
import AdminChatPopup from '@/components/AdminChatPopup';
import SalesReportsComponent from '@/components/SalesReportsComponent';
import { 
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  CreditCardIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, login, logout } = useAuth();
  const { products, refetch, removeProduct, removeProducts, updateProduct } = useProducts();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
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
    selectedProducts: [] as string[]
  });
  const [updatingPopup, setUpdatingPopup] = useState(false);

  // Main banner management state
  const [mainBannerForm, setMainBannerForm] = useState({
    active: true,
    slides: [
      { 
        productId: "1", 
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop" 
      },
      { 
        productId: "2", 
        imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop" 
      },
      { 
        productId: "3", 
        imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=400&fit=crop" 
      }
    ]
  });
  const [updatingMainBanner, setUpdatingMainBanner] = useState(false);
  
  // Product search for offers
  const [searchTerm, setSearchTerm] = useState('');
  
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
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Order chat states
  const [cleaningData, setCleaningData] = useState(false);
  
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
  
  // Category management state
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
          ...doc.data()
        }));
        setCategories(categoriesData);
      }
    } catch (error) {
      // Error loading categories
    }
  };

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
          selectedProducts: popupData.selectedProducts || []
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
        setMainBannerForm({
          active: mainBannerData.active !== undefined ? mainBannerData.active : true,
          slides: mainBannerData.slides || [
            { productId: "1" },
            { productId: "2" },
            { productId: "3" }
          ]
        });
      }
    } catch (error) {
      // Error loading main banner config, keep defaults
    }
  };

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
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

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
    nombre: '',
    precio: 0,
    descripcion: '',
    stock: 0,
    categoria: '',
    nuevo: false,
    oferta: false,
    imagen: ''
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      // User is not logged in, show login form
      return;
    }

    if (user) {
      loadCategories();
      loadBannerConfig();
      loadPopupConfig();
      loadMainBannerConfig();
      loadLogoConfig();
      
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
      setUnreadCount(unread);
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
      let imageUrl = productForm.imagen;

      // Upload image if selected
      if (productImage) {
        const imageRef = ref(storage, `products/${Date.now()}_${productImage.name}`);
        const snapshot = await uploadBytes(imageRef, productImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const priceAsNumber = parseInt(String(productForm.precio).replace(/\D/g, ''), 10) || 0;

      const productData: Partial<Product> = {
        nombre: productForm.nombre,
        precio: priceAsNumber,
        descripcion: productForm.descripcion,
        stock: Number(productForm.stock),
        categoria: productForm.categoria,
        nuevo: productForm.nuevo,
        oferta: productForm.oferta,
        imagen: imageUrl,
        activo: true,
      };

      if (!productForm.id) {
        productData.fechaCreacion = new Date().toISOString();
      }

      if (productForm.id) {
        // Update existing product
        try {
          const productRef = doc(db, 'products', productForm.id);
          await updateDoc(productRef, productData);
          alert('Producto actualizado exitosamente');
          refetch(); // Refetch to show the new data
        } catch (error) {
          console.error("Error updating product in Firestore: ", error);
          alert(`Error al actualizar el producto: ${error.message}`);
        }
      } else {
        // Create new product
        try {
          await addDoc(collection(db, 'products'), productData);
          alert('Producto creado exitosamente');
          refetch(); // Refetch to get the new product with its ID
        } catch (error) {
          console.error("Error creating product in Firestore: ", error);
          alert(`Error al crear el producto: ${error.message}`);
        }
      }

      // Reset form and close modal
      setProductForm({
        id: '',
        nombre: '',
        precio: 0,
        descripcion: '',
        stock: 0,
        categoria: '',
        nuevo: false,
        oferta: false,
        imagen: ''
      });
      setProductImage(null);
      setShowProductModal(false);
    } catch (error) {
      alert('Error al guardar el producto');
    } finally {
      setUploadingProduct(false);
    }
  };

  const editProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      descripcion: product.descripcion || '',
      stock: product.stock,
      categoria: product.categoria,
      nuevo: product.nuevo || false,
      oferta: product.oferta || false,
      imagen: product.imagen || ''
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

  const selectAllProducts = () => {
    const filteredProducts = products.filter(product => 
      selectedCategory === 'all' || product.categoria === selectedCategory
    );
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
          const today = new Date().toISOString().split('T')[0];
          const { generateDailyReportUtil } = await import('@/utils/reportUtils');
          await generateDailyReportUtil(today);
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

  const handleCleanData = async () => {
    if (!confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los pedidos y mensajes de chat?\n\nEsta acción no se puede deshacer.')) {
      return;
    }

    setCleaningData(true);
    try {
      await cleanAllData();
      alert('✅ Datos limpiados exitosamente. La página se recargará para reflejar los cambios.');
      window.location.reload();
    } catch (error) {
      alert('❌ Error al limpiar datos');
      console.error('Error cleaning data:', error);
    } finally {
      setCleaningData(false);
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
        date: order.status !== 'pending' ? order.updatedAt : null
      },
      {
        status: 'preparing',
        title: 'Preparando',
        icon: CubeIcon,
        completed: ['preparing', 'shipped', 'delivered'].includes(order.status),
        date: order.status === 'preparing' || ['shipped', 'delivered'].includes(order.status) ? order.updatedAt : null
      },
      {
        status: 'shipped',
        title: 'Enviado',
        icon: TruckIcon,
        completed: ['shipped', 'delivered'].includes(order.status),
        date: order.status === 'shipped' || order.status === 'delivered' ? order.updatedAt : null
      },
      {
        status: 'delivered',
        title: 'Entregado',
        icon: CheckCircleIcon,
        completed: order.status === 'delivered',
        date: order.status === 'delivered' ? order.updatedAt : null
      }
    ];

    return timeline.filter(item => order.status !== 'cancelled');
  };

  const groupOrdersByUser = (orders: Order[]) => {
    const grouped: { [key: string]: Order[] } = {};
    
    orders.forEach(order => {
      const key = `${order.customerEmail}-${order.userId}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(order);
    });

    // Convert to array and sort each group by date
    return Object.values(grouped).map(userOrders => {
      return userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }).sort((a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime());
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#F16529' }}></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">🛡️ Admin Panel</h1>
            <p className="text-gray-600 mt-2">Importadora F&D</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
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
              className="w-full text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
            >
              {loggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              🏪 F&D Admin Panel
            </h1>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-4xl mr-4">⚡</span>
            Panel de Administración
          </h1>
          <nav className="flex flex-wrap gap-3">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: '📊' },
              { id: 'products', name: 'Productos', icon: '📦' },
              { id: 'orders', name: 'Pedidos', icon: '🛒', badge: unreadCount > 0 ? unreadCount : null },
              { id: 'reports', name: 'Reportes', icon: '📈' },
              { id: 'main-banner', name: 'Banner Principal', icon: '🏆' },
              { id: 'popup', name: 'Popup Ofertas', icon: '🎉' },
              { id: 'logo', name: 'Logo', icon: '🏪' },
              { id: 'categories', name: 'Categorías', icon: '🏷️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3 text-xl">{tab.icon}</span>
                <span className="font-semibold">{tab.name}</span>
                {'badge' in tab && tab.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
                <div className="flex items-center">
                  <div className="bg-blue-500 p-3 rounded-full text-white text-2xl mr-4">📦</div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Productos</p>
                    <p className="text-3xl font-bold text-blue-800">{stats.totalProducts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200">
                <div className="flex items-center">
                  <div className="bg-purple-500 p-3 rounded-full text-white text-2xl mr-4">🛒</div>
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total Pedidos</p>
                    <p className="text-3xl font-bold text-purple-800">{stats.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
                <div className="flex items-center">
                  <div className="bg-green-500 p-3 rounded-full text-white text-2xl mr-4">💰</div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Ingresos Totales</p>
                    <p className="text-3xl font-bold text-green-800">
                      {formatPrice(stats.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-lg border border-yellow-200">
                <div className="flex items-center">
                  <div className="bg-yellow-500 p-3 rounded-full text-white text-2xl mr-4">⏳</div>
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pedidos Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-800">{stats.pendingOrders}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Pedidos Recientes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customerEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status === 'pending' ? 'Pendiente' :
                             order.status === 'confirmed' ? 'Confirmado' :
                             order.status === 'shipped' ? 'Enviado' :
                             order.status === 'delivered' ? 'Entregado' : 'Cancelado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gestión de Productos</h2>
              <button
                onClick={() => {
                  setProductForm({
                    id: '',
                    nombre: '',
                    precio: 0,
                    descripcion: '',
                    stock: 0,
                    categoria: '',
                    nuevo: false,
                    oferta: false,
                    imagen: ''
                  });
                  setShowProductModal(true);
                }}
                className="text-white px-4 py-2 rounded-md transition-colors" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
              >
                <span className="text-lg mr-2">➕</span>
                Agregar Producto
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Filtrar por categoría:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
              >
                <option value="all">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Actions */}
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
                          checked={products.filter(p => selectedCategory === 'all' || p.categoria === selectedCategory).length > 0 && 
                                   products.filter(p => selectedCategory === 'all' || p.categoria === selectedCategory).every(p => selectedProducts.includes(p.id))}
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
                    {products
                      .filter(product => selectedCategory === 'all' || product.categoria === selectedCategory)
                      .map((product) => (
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
                                <img
                                  src={product.imagen}
                                  alt={product.nombre}
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
              
              {/* Products Counter */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  Mostrando {products.filter(product => selectedCategory === 'all' || product.categoria === selectedCategory).length} de {products.length} productos
                  {selectedCategory !== 'all' && (
                    <span className="font-medium"> en categoría &quot;{categories.find(cat => cat.id === selectedCategory)?.name}&quot;</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <SalesReportsComponent />
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h2>
              <div className="flex space-x-3">
                <button
                  onClick={handleCleanData}
                  disabled={cleaningData}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {cleaningData ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Limpiando...
                    </div>
                  ) : (
                    <>🧹 Limpiar Datos de Prueba</>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Línea de Tiempo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado de la Venta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupOrdersByUser(orders).map((userOrders, groupIndex) => {
                      const mainOrder = userOrders[0]; // Usar el pedido más reciente como principal
                      const totalUserOrders = userOrders.length;
                      const totalAmount = userOrders.reduce((sum, order) => sum + order.total, 0);
                      
                      return (
                        <React.Fragment key={`group-${groupIndex}`}>
                          <tr key={mainOrder.id} className={totalUserOrders > 1 ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {totalUserOrders > 1 ? (
                            <div className="text-xs text-gray-600">
                              <div>Estados múltiples</div>
                              <div className="text-xs">Ver individual</div>
                            </div>
                          ) : (
                            <select
                              value={mainOrder.status}
                              onChange={(e) => updateOrderStatus(mainOrder.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pendiente</option>
                              <option value="confirmed">Confirmado</option>
                              <option value="preparing">Preparando</option>
                              <option value="shipped">Enviado</option>
                              <option value="delivered">Entregado</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {totalUserOrders > 1 ? (
                            <div className="text-xs text-gray-600 text-center">
                              <div>Líneas múltiples</div>
                              <div>Ver individual</div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-2">
                              <div className="flex items-center space-x-1">
                                {getOrderTimeline(mainOrder).map((step, index) => {
                                const IconComponent = step.icon;
                                return (
                                  <div key={step.status} className="flex items-center">
                                    <div className="flex flex-col items-center">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm ${
                                        step.completed 
                                          ? 'bg-green-500 text-white border-green-500' 
                                          : 'bg-gray-200 text-gray-500 border-gray-300'
                                      }`}>
                                        <IconComponent className="h-4 w-4" />
                                      </div>
                                      <span className={`text-xs mt-1 font-medium ${
                                        step.completed ? 'text-green-600' : 'text-gray-500'
                                      }`}>
                                        {step.title}
                                      </span>
                                    </div>
                                    {index < getOrderTimeline(mainOrder).length - 1 && (
                                      <div className={`flex-1 h-0.5 mx-2 ${
                                        step.completed ? 'bg-green-500' : 'bg-gray-300'
                                      }`} style={{width: '20px'}}></div>
                                    )}
                                  </div>
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
                              onClick={() => openChatPopup(mainOrder)}
                              className="relative bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs transition-colors"
                            >
                              📋 Estado Compra
                              {getOrderMessageCount(mainOrder.id) > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                  {getOrderMessageCount(mainOrder.id) > 9 ? '9+' : getOrderMessageCount(mainOrder.id)}
                                </span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Banner Tab */}
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
                            accept="image/*"
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
                      setUpdatingBanner(true);
                      
                      // Upload new banner images
                      const imageUrls = [...bannerForm.images];
                      
                      for (let i = 0; i < bannerFiles.length; i++) {
                        const file = bannerFiles[i];
                        if (file) {
                          const imageRef = ref(storage, `banners/banner_${i}_${Date.now()}_${file.name}`);
                          const snapshot = await uploadBytes(imageRef, file);
                          const downloadUrl = await getDownloadURL(snapshot.ref);
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
                  className="text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                >
                  {updatingBanner ? 'Actualizando...' : 'Actualizar Banner'}
                </button>
              </form>
              
              {/* Preview */}
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

        {/* Popup Tab */}
        {activeTab === 'popup' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Gestión del Popup de Ofertas</h2>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título del Popup
                  </label>
                  <input
                    type="text"
                    value={popupForm.title}
                    onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })}
                    placeholder="¡Oferta Especial!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={popupForm.description}
                    onChange={(e) => setPopupForm({ ...popupForm, description: e.target.value })}
                    placeholder="Descripción de la oferta..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  />
                </div>
                
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={popupForm.buttonText}
                    onChange={(e) => setPopupForm({ ...popupForm, buttonText: e.target.value })}
                    placeholder="Ver Ofertas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  />
                </div>
                
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Productos en Oferta
                  </label>
                  
                  {/* Search box */}
                  <div className="mb-3">
                    <input
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                    />
                  </div>
                  
                  {/* Selected products */}
                  {popupForm.selectedProducts.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Productos Seleccionados ({popupForm.selectedProducts.length}):</h4>
                      <div className="flex flex-wrap gap-2">
                        {popupForm.selectedProducts.map((productId) => {
                          const product = products.find(p => p.id === productId);
                          return product ? (
                            <span
                              key={productId}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#FFF0E6', color: '#F16529' }}
                            >
                              {product.name || product.nombre}
                              <button
                                onClick={() => setPopupForm({ 
                                  ...popupForm, 
                                  selectedProducts: popupForm.selectedProducts.filter(id => id !== productId) 
                                })}
                                className="ml-1" style={{ color: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.color = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.color = '#F16529'}
                              >
                                ✕
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Product list organized by categories */}
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {(() => {
                      const filteredProducts = products.filter(product => 
                        (product.name?.toLowerCase() || product.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (product.category?.toLowerCase() || product.categoria?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                      );
                      
                      const groupedByCategory = filteredProducts.reduce((acc, product) => {
                        const category = product.categoria || product.category || 'Sin categoría';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(product);
                        return acc;
                      }, {} as Record<string, typeof products>);
                      
                      const sortedCategories = Object.keys(groupedByCategory).sort();
                      
                      return sortedCategories.map(category => (
                        <div key={category} className="mb-4">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2 px-2 py-1 bg-gray-100 rounded">
                            📦 {category.charAt(0).toUpperCase() + category.slice(1)}
                          </h4>
                          <div className="space-y-1 ml-2">
                            {groupedByCategory[category].map((product) => (
                        <div key={product.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`popup-product-${product.id}`}
                            checked={popupForm.selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPopupForm({ 
                                  ...popupForm, 
                                  selectedProducts: [...popupForm.selectedProducts, product.id] 
                                });
                              } else {
                                setPopupForm({ 
                                  ...popupForm, 
                                  selectedProducts: popupForm.selectedProducts.filter(id => id !== product.id) 
                                });
                              }
                            }}
                            className="h-4 w-4 border-gray-300 rounded" style={{ color: '#F16529', '--tw-ring-color': '#F16529' } as React.CSSProperties}
                                              />                          <label htmlFor={`popup-product-${product.id}`} className="ml-2 flex-1 text-sm text-gray-900 cursor-pointer">
                            <div className="flex items-center space-x-2">
                              {((product.images && product.images.length > 0) || product.imagen) && (
                                <img 
                                  src={product.images?.[0] || product.imagen} 
                                  alt={product.name || product.nombre || 'Producto'}
                                  className="h-8 w-8 object-cover rounded"
                                />
                              )}
                              <span>{product.name || product.nombre || 'Sin nombre'}</span>
                              <span className="text-gray-500">- ${(product.price || product.precio)?.toLocaleString() || '0'}</span>
                            </div>
                          </label>
                            </div>
                          ))}
                          </div>
                        </div>
                      ));
                    })()}
                    {products.filter(product => 
                      (product.name?.toLowerCase() || product.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                      (product.category?.toLowerCase() || product.categoria?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                    ).length === 0 && searchTerm && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No se encontraron productos que coincidan con &quot;{searchTerm}&quot;
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Usa el buscador para encontrar productos y selecciona los que aparecerán en el popup de ofertas
                  </p>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="popup-active"
                    checked={popupForm.active}
                    onChange={(e) => setPopupForm({ ...popupForm, active: e.target.checked })}
                    className="h-4 w-4 border-gray-300 rounded" style={{ color: '#F16529', '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  />
                  <label htmlFor="popup-active" className="ml-2 block text-sm text-gray-900">
                    Popup Activo
                  </label>
                </div>
                
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setUpdatingPopup(true);
                      

                      // Save popup configuration to Firebase
                      await setDoc(doc(db, 'config', 'offer-popup'), {
                        title: popupForm.title,
                        description: popupForm.description,
                        buttonText: popupForm.buttonText,
                        buttonLink: '/popup-ofertas',
                        selectedProducts: popupForm.selectedProducts,
                        active: popupForm.active,
                        updatedAt: new Date().toISOString()
                      });

                      // Update local state
                      
                      alert('Popup actualizado exitosamente');
                    } catch (error: unknown) {
                      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                      alert(`Error al actualizar popup: ${errorMessage}`);
                    } finally {
                      setUpdatingPopup(false);
                    }
                  }}
                  disabled={updatingPopup}
                  className="text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                >
                  {updatingPopup ? 'Actualizando...' : 'Actualizar Popup'}
                </button>
                
                <button
                  onClick={() => {
                    // Clear popup storage to test it
                    sessionStorage.removeItem('offer-popup-seen');
                    sessionStorage.removeItem('offer-popup-last-shown');
                    window.open('/', '_blank');
                  }}
                  className="text-white font-medium py-2 px-4 rounded-md transition-colors" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                >
                  🧪 Probar Popup
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Main Banner Tab */}
        {activeTab === 'main-banner' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Configuración del Banner Principal</h2>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <form className="space-y-6">
                {/* Banner Active Toggle */}
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

                {/* Slides Configuration */}
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
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  // Convert file to base64 or upload to storage
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    const result = e.target?.result as string;
                                    const newSlides = [...mainBannerForm.slides];
                                    newSlides[index] = { ...newSlides[index], imageUrl: result };
                                    setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                                  };
                                  reader.readAsDataURL(file);
                                } catch (error) {
                                  alert('Error al cargar la imagen');
                                }
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                          />
                          <p className="text-xs text-gray-500 mt-1">Formatos soportados: JPG, PNG, GIF</p>
                          
                          {slide.imageUrl && (
                            <div className="mt-2">
                              <img 
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
                              const newSlides = [...mainBannerForm.slides];
                              newSlides[index] = { ...newSlides[index], productId: e.target.value };
                              setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                          >
                            <option value="">Selecciona un producto</option>
                            {products
                              .filter(product => {
                                const searchTerm = bannerSearchTerms[index] || '';
                                if (!searchTerm) return true;
                                const productName = (product.nombre || product.name || '').toLowerCase();
                                return productName.includes(searchTerm.toLowerCase());
                              })
                              .map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.nombre || product.name} - ${(product.precio || product.price || 0).toLocaleString()}
                                </option>
                              ))}
                          </select>
                        </div>
                        
                        {(() => {
                          const selectedProduct = products.find(p => p.id === slide.productId);
                          return selectedProduct && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center space-x-3">
                              <img 
                                src={selectedProduct.imagen || selectedProduct.image || ''} 
                                alt={selectedProduct.nombre || selectedProduct.name || 'Producto'}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {selectedProduct.nombre || selectedProduct.name}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  ${(selectedProduct.precio || selectedProduct.price || 0).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Banner Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newSlides = [...mainBannerForm.slides, { productId: "", imageUrl: "" }];
                      setMainBannerForm({ ...mainBannerForm, slides: newSlides });
                    }}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors"
                  >
                    + Agregar Banner
                  </button>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setUpdatingMainBanner(true);
                      
                      try {
                        // Try to save to Firebase
                        await setDoc(doc(db, 'config', 'main-banner'), {
                          active: mainBannerForm.active,
                          slides: mainBannerForm.slides,
                          updatedAt: new Date().toISOString()
                        });
                      } catch (firebaseError) {
                        // If Firebase fails, just update local state
                      }

                      alert('Banner principal actualizado exitosamente (modo local)');
                    } catch (error) {
                      alert('Error al actualizar banner principal');
                    } finally {
                      setUpdatingMainBanner(false);
                    }
                  }}
                  disabled={updatingMainBanner}
                  className="text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                >
                  {updatingMainBanner ? 'Actualizando...' : 'Guardar Configuración'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Logo Tab */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emoji del Logo
                  </label>
                  <input
                    type="text"
                    value={logoForm.emoji}
                    onChange={(e) => setLogoForm({ ...logoForm, emoji: e.target.value })}
                    placeholder="🏪"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as React.CSSProperties}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen del Logo
                  </label>
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
                        const imageRef = ref(storage, `config/logo_${Date.now()}_${logoFile.name}`);
                        const snapshot = await uploadBytes(imageRef, logoFile);
                        logoImageUrl = await getDownloadURL(snapshot.ref);
                      }

                      try {
                        // Try to save logo configuration to Firebase
                        await setDoc(doc(db, 'config', 'logo'), {
                          emoji: logoForm.emoji,
                          text: logoForm.text,
                          image: logoImageUrl,
                          updatedAt: new Date().toISOString()
                        });
                      } catch (firebaseError) {
                        // If Firebase fails (no auth), just update local state
                      }

                      alert('Logo actualizado exitosamente (modo local)');
                      setLogoFile(null);
                    } catch (error) {
                      alert('Error al actualizar logo');
                    } finally {
                      setUpdatingLogo(false);
                    }
                  }}
                  disabled={updatingLogo}
                  className="text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                >
                  {updatingLogo ? 'Actualizando...' : 'Actualizar Logo'}
                </button>
              </form>
              
              {/* Preview */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa:</h3>
                <div className="bg-white p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    {logoForm.image ? (
                      <img src={logoForm.image} alt="Logo" className="h-8 w-8 object-contain" />
                    ) : (
                      <div className="text-2xl">{logoForm.emoji}</div>
                    )}
                    <span className="text-xl font-bold text-gray-900">{logoForm.text}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h2>
              <button
                onClick={() => {
                  setCategoryForm({ id: '', name: '', active: true });
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
                            {category.subcategorias && category.subcategorias.length > 0 ? (
                              category.subcategorias.map((sub, index) => (
                                <span
                                  key={index}
                                  className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                                >
                                  {sub.nombre}
                                </span>
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
                              setCategoryForm(category);
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

        {/* Category Modal */}
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
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
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
                            setCategoryForm({ id: '', name: '', active: true });
                          } catch (error) {
                            alert('Error al guardar categoría');
                          }
                        }
                      }}
                      className="flex-1 text-white font-semibold py-2 px-4 rounded-md transition-colors" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Subcategory Modal */}
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
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
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
                              const subcategorias = category.subcategorias || [];
                              
                              const newSubcategory = {
                                id: Date.now().toString(),
                                nombre: subcategoryForm.nombre,
                                activa: subcategoryForm.activa
                              };
                              
                              const updatedSubcategorias = [...subcategorias, newSubcategory];
                              const updatedCategory = { ...category, subcategorias: updatedSubcategorias };
                              
                              // Update in Firebase
                              await setDoc(doc(db, 'categorias', selectedCategoryForSub), {
                                name: category.name,
                                active: category.active,
                                subcategorias: updatedSubcategorias,
                                fechaCreacion: category.fechaCreacion || new Date().toISOString()
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
                      className="flex-1 text-white font-semibold py-2 px-4 rounded-md transition-colors" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {productForm.id ? 'Editar Producto' : 'Agregar Producto'}
                  </h3>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Producto *
                      </label>
                      <input
                        type="text"
                        value={productForm.nombre}
                        onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio ($) *
                      </label>
                  <input
                    type="text"
                    value={productForm.precio}
                    onChange={(e) => setProductForm({ ...productForm, precio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                  />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock *
                      </label>
                      <input
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría *
                      </label>
                      <select
                        value={productForm.categoria}
                        onChange={(e) => setProductForm({ ...productForm, categoria: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                      >
                        <option value="">Seleccionar categoría</option>
                        <option value="electronicos">Electrónicos</option>
                        <option value="hogar">Hogar</option>
                        <option value="ropa">Ropa</option>
                        <option value="deportes">Deportes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={productForm.descripcion}
                      onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Imagen del Producto
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProductImage(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#F16529' } as any}
                    />
                    {productForm.imagen && (
                      <img
                        src={productForm.imagen}
                        alt="Current"
                        className="mt-2 h-20 w-20 object-cover rounded"
                      />
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={productForm.nuevo}
                        onChange={(e) => setProductForm({ ...productForm, nuevo: e.target.checked })}
                        className="mr-2"
                      />
                      Producto Nuevo
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={productForm.oferta}
                        onChange={(e) => setProductForm({ ...productForm, oferta: e.target.checked })}
                        className="mr-2"
                      />
                      En Oferta
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={uploadingProduct}
                      className="flex-1 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#F16529' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D13C1A'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F16529'}
                    >
                      {uploadingProduct ? 'Guardando...' : 'Guardar Producto'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Popup */}
      {chatPopupOrder && (
        <AdminChatPopup 
          order={chatPopupOrder}
          isOpen={isChatPopupOpen}
          onClose={closeChatPopup}
        />
      )}
    </div>
  );
}