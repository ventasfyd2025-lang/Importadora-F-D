import { useState } from 'react';

interface EmailData {
  type: 'new_order' | 'order_status_change' | 'new_user' | 'payment_received' | 'low_stock' | 'new_message';
  data: any;
}

export function useEmailNotifications() {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (emailData: EmailData) => {
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar email');
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      setError(err.message);
      console.error('Error enviando email:', err);
      return null;
    } finally {
      setIsSending(false);
    }
  };

  // Métodos específicos para cada tipo de notificación
  const notifyNewOrder = async (orderData: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    total: number;
    paymentMethod: string;
    items: Array<{ nombre: string; cantidad: number; precio: number }>;
    shippingAddress?: {
      street?: string;
      city?: string;
      region?: string;
      comuna?: string;
    };
  }) => {
    return sendEmail({ type: 'new_order', data: orderData });
  };

  const notifyOrderStatusChange = async (orderData: {
    orderId: string;
    oldStatus: string;
    newStatus: string;
    customerName: string;
    customerEmail: string;
    total: number;
  }) => {
    return sendEmail({ type: 'order_status_change', data: orderData });
  };

  const notifyNewUser = async (userData: {
    name: string;
    email: string;
    phone?: string;
  }) => {
    return sendEmail({ type: 'new_user', data: userData });
  };

  const notifyPaymentReceived = async (paymentData: {
    orderId: string;
    customerName: string;
    amount: number;
    paymentMethod: string;
    status: string;
  }) => {
    return sendEmail({ type: 'payment_received', data: paymentData });
  };

  const notifyLowStock = async (stockData: {
    productName: string;
    currentStock: number;
    sku?: string;
  }) => {
    return sendEmail({ type: 'low_stock', data: stockData });
  };

  const notifyNewMessage = async (messageData: {
    orderId: string;
    senderName: string;
    message: string;
  }) => {
    return sendEmail({ type: 'new_message', data: messageData });
  };

  return {
    sendEmail,
    notifyNewOrder,
    notifyOrderStatusChange,
    notifyNewUser,
    notifyPaymentReceived,
    notifyLowStock,
    notifyNewMessage,
    isSending,
    error,
  };
}
