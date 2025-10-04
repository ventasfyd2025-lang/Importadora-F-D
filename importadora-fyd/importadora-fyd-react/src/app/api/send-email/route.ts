import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    let emailContent;
    let subject;
    const to = 'ventas.fyd2025@gmail.com'; // Email donde llegan las notificaciones

    switch (type) {
      case 'new_order':
        subject = `🛍️ Nueva Orden #${data.orderId}`;
        emailContent = `
          <h2>Nueva Orden Recibida</h2>
          <p><strong>ID de Orden:</strong> ${data.orderId}</p>
          <p><strong>Cliente:</strong> ${data.customerName}</p>
          <p><strong>Email:</strong> ${data.customerEmail}</p>
          <p><strong>Teléfono:</strong> ${data.customerPhone || 'No proporcionado'}</p>
          <p><strong>Total:</strong> $${data.total.toLocaleString('es-CL')}</p>
          <p><strong>Método de Pago:</strong> ${data.paymentMethod}</p>

          <h3>Productos:</h3>
          <ul>
            ${data.items.map((item: any) => `
              <li>${item.nombre} - Cantidad: ${item.cantidad} - Precio: $${item.precio.toLocaleString('es-CL')}</li>
            `).join('')}
          </ul>

          <p><strong>Dirección de Entrega:</strong><br>
          ${data.shippingAddress?.street || 'No proporcionada'}<br>
          ${data.shippingAddress?.city || ''}, ${data.shippingAddress?.region || ''}<br>
          ${data.shippingAddress?.comuna || ''}</p>
        `;
        break;

      case 'order_status_change':
        subject = `📦 Cambio de Estado - Orden #${data.orderId}`;
        emailContent = `
          <h2>Cambio de Estado de Orden</h2>
          <p><strong>ID de Orden:</strong> ${data.orderId}</p>
          <p><strong>Estado Anterior:</strong> ${data.oldStatus}</p>
          <p><strong>Estado Nuevo:</strong> ${data.newStatus}</p>
          <p><strong>Cliente:</strong> ${data.customerName}</p>
          <p><strong>Total:</strong> $${data.total.toLocaleString('es-CL')}</p>
        `;
        break;

      case 'new_user':
        subject = `👤 Nuevo Usuario Registrado`;
        emailContent = `
          <h2>Nuevo Usuario Registrado</h2>
          <p><strong>Nombre:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Teléfono:</strong> ${data.phone || 'No proporcionado'}</p>
          <p><strong>Fecha de Registro:</strong> ${new Date().toLocaleString('es-CL')}</p>
        `;
        break;

      case 'payment_received':
        subject = `💰 Pago Recibido - Orden #${data.orderId}`;
        emailContent = `
          <h2>Confirmación de Pago</h2>
          <p><strong>ID de Orden:</strong> ${data.orderId}</p>
          <p><strong>Cliente:</strong> ${data.customerName}</p>
          <p><strong>Monto:</strong> $${data.amount.toLocaleString('es-CL')}</p>
          <p><strong>Método de Pago:</strong> ${data.paymentMethod}</p>
          <p><strong>Estado:</strong> ${data.status}</p>
        `;
        break;

      case 'low_stock':
        subject = `⚠️ Alerta de Stock Bajo`;
        emailContent = `
          <h2>Producto con Stock Bajo</h2>
          <p><strong>Producto:</strong> ${data.productName}</p>
          <p><strong>Stock Actual:</strong> ${data.currentStock} unidades</p>
          <p><strong>SKU:</strong> ${data.sku || 'N/A'}</p>
          <p>Se recomienda reabastecer este producto.</p>
        `;
        break;

      case 'new_message':
        subject = `💬 Nuevo Mensaje - Orden #${data.orderId}`;
        emailContent = `
          <h2>Nuevo Mensaje Recibido</h2>
          <p><strong>ID de Orden:</strong> ${data.orderId}</p>
          <p><strong>De:</strong> ${data.senderName}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${data.message}</p>
        `;
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de email no válido' },
          { status: 400 }
        );
    }

    const { data: emailData, error } = await resend.emails.send({
      from: 'ventas@importadora-fyd.cl',
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              h2 {
                color: #f97316;
                border-bottom: 2px solid #f97316;
                padding-bottom: 10px;
              }
              h3 {
                color: #ea580c;
              }
              ul {
                list-style-type: none;
                padding-left: 0;
              }
              li {
                padding: 5px 0;
                border-bottom: 1px solid #eee;
              }
              p {
                margin: 10px 0;
              }
              strong {
                color: #ea580c;
              }
            </style>
          </head>
          <body>
            ${emailContent}
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              Este es un email automático de Importadora F&D<br>
              Fecha: ${new Date().toLocaleString('es-CL')}
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error enviando email:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: emailData });
  } catch (error: any) {
    console.error('Error en send-email:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enviar email' },
      { status: 500 }
    );
  }
}
