import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config();
admin.initializeApp();

const resend = new Resend(process.env.RESEND_API_KEY);

// Función de prueba para verificar que los triggers funcionan
export const testOrderTrigger = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderId = context.params.orderId;
    const order = snap.data();

    console.log(`TEST: Order ${orderId} created with status: ${order.status}`);
    console.log(`TEST: Customer email: ${order.customerEmail}`);

    return null;
  });

export const sendOrderConfirmationEmail = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;

    try {
      console.log(`Processing order ${orderId} with status: ${order.status}`);
      console.log(`Customer email: ${order.customerEmail}`);
      console.log(`Resend API Key exists: ${!!process.env.RESEND_API_KEY}`);
      console.log(`Resend API Key prefix: ${process.env.RESEND_API_KEY?.substring(0, 10)}...`);

      // Solo enviar email para órdenes confirmadas o con comprobante
      if (order.status !== 'confirmed' && order.status !== 'pending_verification') {
        console.log(`Skipping email for status: ${order.status}`);
        return null;
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmación de Pedido</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .total { font-weight: bold; font-size: 18px; color: #4CAF50; }
            .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>¡Pedido Confirmado!</h1>
            <p>Gracias por tu compra en Importadora FyD</p>
          </div>

          <div class="content">
            <h2>Hola ${order.customerName || 'Cliente'},</h2>

            <p>Tu pedido ha sido ${order.status === 'confirmed' ? 'confirmado' : 'recibido y está siendo verificado'}.</p>

            <div class="order-details">
              <h3>Detalles del Pedido #${orderId}</h3>
              <p><strong>Fecha:</strong> ${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL')}</p>
              <p><strong>Email:</strong> ${order.customerEmail}</p>
              <p><strong>Teléfono:</strong> ${order.customerPhone}</p>
              <p><strong>Dirección:</strong> ${order.shippingAddress}</p>

              <h4>Productos:</h4>
              ${order.items.map((item: any) => `
                <div class="item">
                  <strong>${item.nombre}</strong><br>
                  Cantidad: ${item.cantidad}<br>
                  Precio unitario: $${item.precio.toLocaleString('es-CL')}<br>
                  Subtotal: $${(item.precio * item.cantidad).toLocaleString('es-CL')}
                </div>
              `).join('')}

              <div class="total">
                <p>Total: $${order.total.toLocaleString('es-CL')}</p>
              </div>
            </div>

            ${order.paymentMethod === 'transfer' ? `
              <p><strong>Método de pago:</strong> Transferencia bancaria</p>
              ${order.status === 'pending_verification' ?
                '<p>Hemos recibido tu comprobante de pago y estamos verificando la transferencia. Te notificaremos cuando esté confirmada.</p>' :
                '<p>Tu transferencia ha sido verificada y confirmada.</p>'
              }
            ` : `
              <p><strong>Método de pago:</strong> ${order.paymentMethod === 'mercadopago' ? 'MercadoPago' : order.paymentMethod}</p>
            `}

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #4CAF50; margin-bottom: 15px;">📋 Seguimiento de tu Pedido</h3>
              <p style="margin-bottom: 15px;">Puedes ver el estado de tu pedido en tiempo real:</p>
              <a href="https://www.importadora-fyd.cl/chat/${orderId}"
                 style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                🔍 Ver Estado del Pedido #${orderId}
              </a>
              <p style="margin-top: 15px; font-size: 12px; color: #666;">
                O ve a "Mis Pedidos" en nuestro sitio web
              </p>
            </div>

            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

            <p>¡Gracias por confiar en nosotros!</p>
          </div>

          <div class="footer">
            <p>Importadora FyD<br>
            Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </body>
        </html>
      `;

      console.log('Attempting to send email...');
      console.log(`Sending email to: ${order.customerEmail}`);

      const result = await resend.emails.send({
        from: 'Importadora FyD <pedidos@importadora-fyd.cl>',
        to: [order.customerEmail],
        subject: `Confirmación de Pedido #${orderId} - Importadora FyD`,
        html: emailHtml,
        reply_to: 'contacto@importadora-fyd.cl',
      });

      console.log(`Email sent successfully for order ${orderId}. Resend response:`, result);
      return null;

    } catch (error) {
      console.error('Error sending email:', error);
      return null;
    }
  });

export const sendManualOrderEmail = functions.https.onCall(async (data, context) => {
  // Función para enviar emails manualmente desde el admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { orderId, email } = data;

  try {
    const orderDoc = await admin.firestore().doc(`orders/${orderId}`).get();
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }

    const order = orderDoc.data();
    if (!order) {
      throw new functions.https.HttpsError('not-found', 'Order data not found');
    }

    // Reutilizar la misma lógica de email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmación de Pedido</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .order-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .total { font-weight: bold; font-size: 18px; color: #4CAF50; }
          .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>¡Pedido Confirmado!</h1>
          <p>Gracias por tu compra en Importadora FyD</p>
        </div>

        <div class="content">
          <h2>Hola ${order.customerName || 'Cliente'},</h2>

          <p>Tu pedido ha sido confirmado.</p>

          <div class="order-details">
            <h3>Detalles del Pedido #${orderId}</h3>
            <p><strong>Fecha:</strong> ${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL')}</p>
            <p><strong>Email:</strong> ${order.customerEmail}</p>
            <p><strong>Teléfono:</strong> ${order.customerPhone}</p>
            <p><strong>Dirección:</strong> ${order.shippingAddress}</p>

            <h4>Productos:</h4>
            ${order.items.map((item: any) => `
              <div class="item">
                <strong>${item.nombre}</strong><br>
                Cantidad: ${item.cantidad}<br>
                Precio unitario: $${item.precio.toLocaleString('es-CL')}<br>
                Subtotal: $${(item.precio * item.cantidad).toLocaleString('es-CL')}
              </div>
            `).join('')}

            <div class="total">
              <p>Total: $${order.total.toLocaleString('es-CL')}</p>
            </div>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #4CAF50; margin-bottom: 15px;">📋 Seguimiento de tu Pedido</h3>
            <p style="margin-bottom: 15px;">Puedes ver el estado de tu pedido en tiempo real:</p>
            <a href="https://www.importadora-fyd.cl/chat/${orderId}"
               style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              🔍 Ver Estado del Pedido #${orderId}
            </a>
            <p style="margin-top: 15px; font-size: 12px; color: #666;">
              O ve a "Mis Pedidos" en nuestro sitio web
            </p>
          </div>

          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

          <p>¡Gracias por confiar en nosotros!</p>
        </div>

        <div class="footer">
          <p>Importadora FyD<br>
          Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: 'Importadora FyD <pedidos@importadora-fyd.cl>',
      to: [email || order.customerEmail],
      subject: `Confirmación de Pedido #${orderId} - Importadora FyD`,
      html: emailHtml,
      reply_to: 'contacto@importadora-fyd.cl',
    });

    return { success: true, message: 'Email sent successfully' };

  } catch (error) {
    console.error('Error sending manual email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});

// Función para notificar cambios de estado de pedidos
export const sendOrderStatusUpdate = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const orderId = context.params.orderId;

    // Solo enviar si el estado cambió
    if (beforeData.status === afterData.status) {
      return null;
    }

    try {
      console.log(`Order ${orderId} status changed from ${beforeData.status} to ${afterData.status}`);

      const statusMessages: { [key: string]: { title: string; message: string; color: string } } = {
        confirmed: {
          title: '✅ Pedido Confirmado',
          message: 'Tu pedido ha sido confirmado y está en proceso.',
          color: '#4CAF50'
        },
        preparing: {
          title: '📦 Pedido en Preparación',
          message: 'Estamos preparando tu pedido para el envío.',
          color: '#FF9800'
        },
        shipped: {
          title: '🚚 Pedido Enviado',
          message: 'Tu pedido está en camino. ¡Pronto lo tendrás!',
          color: '#2196F3'
        },
        delivered: {
          title: '🎉 Pedido Entregado',
          message: '¡Tu pedido ha sido entregado exitosamente!',
          color: '#4CAF50'
        },
        cancelled: {
          title: '❌ Pedido Cancelado',
          message: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
          color: '#f44336'
        }
      };

      const statusInfo = statusMessages[afterData.status];
      if (!statusInfo) {
        console.log(`No notification needed for status: ${afterData.status}`);
        return null;
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Actualización de Pedido</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: ${statusInfo.color}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .status-badge {
              background-color: ${statusInfo.color};
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              display: inline-block;
              font-weight: bold;
              margin: 10px 0;
            }
            .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${statusInfo.title}</h1>
          </div>

          <div class="content">
            <h2>Hola ${afterData.customerName || 'Cliente'},</h2>
            <p>${statusInfo.message}</p>

            <div class="order-details">
              <h3>Detalles del Pedido</h3>
              <p><strong>Número de Pedido:</strong> #${orderId.slice(-8).toUpperCase()}</p>
              <div class="status-badge">${statusInfo.title}</div>
              <p><strong>Total:</strong> ${formatPrice(afterData.total)}</p>
            </div>

            <p>Puedes ver más detalles y hacer seguimiento en nuestra web en la sección "Mis Pedidos".</p>

            ${afterData.status === 'shipped' ?
              '<p><strong>Nota:</strong> Recibirás información de tracking cuando esté disponible.</p>' :
              ''
            }
          </div>

          <div class="footer">
            <p>Gracias por elegir Importadora FyD</p>
            <p>Si tienes alguna pregunta, responde a este correo o contáctanos.</p>
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        from: 'Importadora FyD <pedidos@importadora-fyd.cl>',
        to: [afterData.customerEmail],
        subject: `${statusInfo.title} - Pedido #${orderId.slice(-8).toUpperCase()}`,
        html: emailHtml,
        reply_to: 'contacto@importadora-fyd.cl',
      });

      console.log(`Status update email sent to ${afterData.customerEmail}`);
      return { success: true };

    } catch (error) {
      console.error('Error sending status update email:', error);
      return null;
    }
  });

// Función para notificar nuevos mensajes del admin
export const sendNewMessageNotification = functions.firestore
  .document('chat_messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();

    // Solo enviar para mensajes del admin
    if (!message.isAdmin) {
      return null;
    }

    try {
      console.log(`New admin message for user: ${message.userEmail}`);

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Nuevo Mensaje de Importadora FyD</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .message-box {
              background-color: #f0f8ff;
              border-left: 4px solid #2196F3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 0 5px 5px 0;
            }
            .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; }
            .cta-button {
              background-color: #2196F3;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
              margin: 10px 0;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💬 Nuevo Mensaje</h1>
            <p>Tienes un mensaje de nuestro equipo</p>
          </div>

          <div class="content">
            <h2>Hola ${message.userName || 'Cliente'},</h2>
            <p>Has recibido un nuevo mensaje sobre tu pedido:</p>

            <div class="message-box">
              <p><strong>De:</strong> Equipo Importadora FyD</p>
              <p><strong>Mensaje:</strong></p>
              <p>${message.message.replace(/\n/g, '<br>')}</p>
            </div>

            ${message.orderId ?
              `<p><strong>Pedido relacionado:</strong> #${message.orderId.slice(-8).toUpperCase()}</p>` :
              ''
            }

            <a href="https://importadora-fyd.vercel.app/mis-pedidos" class="cta-button">
              Ver Mis Pedidos y Responder
            </a>
          </div>

          <div class="footer">
            <p>Gracias por elegir Importadora FyD</p>
            <p>Puedes responder a este correo o usar el chat en nuestra web.</p>
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        from: 'Importadora FyD <mensajes@importadora-fyd.cl>',
        to: [message.userEmail],
        subject: `💬 Nuevo mensaje sobre tu pedido${message.orderId ? ` #${message.orderId.slice(-8).toUpperCase()}` : ''}`,
        html: emailHtml,
        reply_to: 'contacto@importadora-fyd.cl',
      });

      console.log(`Message notification sent to ${message.userEmail}`);
      return { success: true };

    } catch (error) {
      console.error('Error sending message notification:', error);
      return null;
    }
  });

// Función helper para formatear precios
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(price);
}