// Optimized formatters with memoization
let priceFormatter: Intl.NumberFormat;
let dateFormatter: Intl.DateTimeFormat;

export const formatPrice = (price: number): string => {
  if (!priceFormatter) {
    priceFormatter = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    });
  }
  return priceFormatter.format(price);
};

export const formatDate = (date: Date | string): string => {
  if (!dateFormatter) {
    dateFormatter = new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateFormatter.format(dateObj);
};

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-CL').format(num);
};