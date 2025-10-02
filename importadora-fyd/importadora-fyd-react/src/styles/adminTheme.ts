// Admin Theme - Estilos consistentes para toda la aplicación
export const adminTheme = {
  // Colores principales
  colors: {
    primary: '#F16529',
    primaryHover: '#D13C1A',
    primaryLight: '#FF7A45',
    secondary: '#E85C26',
    accent: '#D95D22',
  },

  // Backgrounds
  backgrounds: {
    main: 'bg-gradient-to-br from-orange-50/30 via-red-50/20 to-orange-100/40',
    card: 'bg-white/90 backdrop-blur-sm',
    header: 'bg-white/80 backdrop-blur-lg',
    gradient: 'bg-gradient-to-r from-orange-500 to-red-500',
    subtle: 'bg-gradient-to-br from-gray-50 via-white to-gray-50',
  },

  // Cards y Contenedores
  cards: {
    base: 'bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-orange-100',
    hover: 'hover:shadow-2xl transition-all duration-300 hover:-translate-y-1',
    interactive: 'bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1',
  },

  // Botones
  buttons: {
    primary: 'px-4 py-2 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 shadow-lg',
    secondary: 'px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all duration-200',
    icon: 'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg',
  },

  // Badges y Tags
  badges: {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    primary: 'bg-orange-100 text-orange-800 border-orange-200',
  },

  // Inputs
  inputs: {
    base: 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200',
    focus: 'focus:ring-orange-500',
  },

  // Headers de secciones
  sectionHeaders: {
    icon: 'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg',
    title: 'text-2xl font-bold text-gray-800',
    subtitle: 'text-sm text-gray-600',
  },

  // Tablas
  tables: {
    header: 'bg-gradient-to-r from-orange-50 to-red-50',
    row: 'hover:bg-gray-50 transition-colors',
    cell: 'px-6 py-4 text-sm text-gray-900',
  },

  // Efectos
  effects: {
    glassmorphism: 'bg-white/20 backdrop-blur-sm',
    shadow: 'shadow-xl',
    shadowHover: 'hover:shadow-2xl',
    transition: 'transition-all duration-300',
  },
};

// Función helper para obtener color primario
export const getPrimaryStyle = () => ({
  backgroundColor: adminTheme.colors.primary,
});

// Función helper para hover
export const getPrimaryHoverHandlers = () => ({
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = adminTheme.colors.primaryHover;
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = adminTheme.colors.primary;
  },
});
