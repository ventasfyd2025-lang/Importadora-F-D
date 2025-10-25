import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_RECIPIENT = 'ventas.fyd2025@gmail.com';

// ⚠️ SEGURIDAD: Token secreto para proteger el endpoint
// Genera uno seguro y agrégalo en .env: EMAIL_API_SECRET=tu_token_secreto_aqui
const EMAIL_API_SECRET = process.env.EMAIL_API_SECRET;

// Rate limiting simple en memoria (para producción considera Redis o similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 5; // 5 emails por minuto por IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count };
}

// Limpiar registros antiguos cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

const normalizeEmail = (email?: string | null) => {
  if (!email) return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  // Minimal email format check to avoid Resend API errors
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
};

export async function POST(request: NextRequest) {
  try {
    // ⚠️ SEGURIDAD: Verificar token de autenticación (opcional)
    const authHeader = request.headers.get('x-email-api-secret');
    const hasValidToken = EMAIL_API_SECRET && authHeader === EMAIL_API_SECRET;

    // ⚠️ SEGURIDAD: Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const rateLimit = checkRateLimit(ip);

    // Si NO tiene token válido, aplicar rate limiting estricto
    if (!hasValidToken && !rateLimit.allowed) {
      console.warn(`🚨 Rate limit excedido para IP sin autenticación: ${ip}`);
      return NextResponse.json(
        {
          error: 'Demasiadas peticiones. Por favor intenta más tarde.',
          retryAfter: RATE_LIMIT_WINDOW_MS / 1000
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(RATE_LIMIT_WINDOW_MS / 1000)
          }
        }
      );
    }

    // Si tiene token válido, bypass del rate limiting (llamadas del servidor son confiables)
    if (hasValidToken) {
      console.log('✅ Llamada autenticada desde servidor (bypass rate limiting)');
    }

    const body = await request.json();
    const { type, data } = body;

    console.log('📧 [send-email] Received email request:', {
      type,
      customerEmail: data?.customerEmail,
      email: data?.email,
      customerName: data?.customerName,
      orderId: data?.orderId,
      dataKeys: data ? Object.keys(data) : 'NO DATA',
      fullData: JSON.stringify(data)
    });

    let emailContent;
    let subject;
    const recipients = new Set<string>();

    const addRecipient = (email?: string | null) => {
      const normalized = normalizeEmail(email);
      console.log(`📧 [send-email] addRecipient called with: "${email}" -> normalized: "${normalized}"`);
      if (normalized) {
        recipients.add(normalized);
        console.log(`✅ [send-email] Added recipient: ${normalized}`);
      } else {
        console.warn(`⚠️ [send-email] Failed to normalize email: "${email}"`);
      }
    };

    // Siempre enviar copia al correo operativo
    addRecipient(DEFAULT_RECIPIENT);

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
        addRecipient(data.customerEmail);
        break;

      case 'order_status_change':
        const statusLabels: Record<string, string> = {
          pending: '⏳ Pendiente',
          pending_verification: '🔍 Pendiente de Verificación',
          confirmed: '✅ Confirmado',
          preparing: '📦 Preparando',
          shipped: '🚚 Enviado',
          delivered: '✔️ Entregado',
          cancelled: '❌ Cancelado'
        };

        const statusDescriptions: Record<string, string> = {
          confirmed: '¡Excelente noticia! Hemos confirmado tu pago y tu pedido está siendo procesado.',
          preparing: 'Estamos preparando cuidadosamente tu pedido para el envío.',
          shipped: '¡Tu pedido está en camino! Recibirás tu compra pronto.',
          delivered: '¡Tu pedido ha sido entregado! Esperamos que disfrutes tu compra.',
          cancelled: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.'
        };

        const orderIdShort = data.orderId.slice(-8).toUpperCase();
        subject = `${statusLabels[data.newStatus] || '📦'} - Orden #${orderIdShort}`;

        emailContent = `
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="font-size: 28px; margin-bottom: 10px;">¡Actualización de tu Pedido!</h2>
            <p style="font-size: 16px; color: #666;">Orden #${orderIdShort}</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 18px; margin: 0;">
              <strong>Estado actual:</strong> ${statusLabels[data.newStatus] || data.newStatus}
            </p>
            ${statusDescriptions[data.newStatus] ? `
              <p style="font-size: 14px; color: #666; margin-top: 10px;">
                ${statusDescriptions[data.newStatus]}
              </p>
            ` : ''}
          </div>

          <div style="margin: 20px 0;">
            <p><strong>Cliente:</strong> ${data.customerName}</p>
            <p><strong>Total del pedido:</strong> $${data.total.toLocaleString('es-CL')}</p>
          </div>

          ${data.newStatus === 'confirmed' ? `
            <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #065f46;">
                <strong>Próximos pasos:</strong><br>
                • Estamos verificando el stock de tus productos<br>
                • Preparando tu pedido para el envío<br>
                • Te notificaremos cuando sea despachado
              </p>
            </div>
          ` : ''}

          ${data.newStatus === 'shipped' ? `
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af;">
                <strong>Tu pedido está en camino:</strong><br>
                Pronto recibirás tu compra en la dirección indicada.
              </p>
            </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              ¿Tienes preguntas? Contáctanos respondiendo este email o por WhatsApp.
            </p>
          </div>
        `;
        addRecipient(data.customerEmail || data.email);
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
        addRecipient(data.email);
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
        addRecipient(data.customerEmail || data.email);
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
        addRecipient(data.customerEmail || data.replyEmail);
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de email no válido' },
          { status: 400 }
        );
    }

    const to = Array.from(recipients);
    console.log('📧 [send-email] Final recipients list:', to);

    if (to.length === 0) {
      console.error('❌ [send-email] No hay destinatarios válidos para el correo');
      return NextResponse.json(
        { error: 'No hay destinatarios válidos para el correo' },
        { status: 400 }
      );
    }

    console.log(`📧 [send-email] Sending email to ${to.length} recipient(s):`, to);

    const replyTo = normalizeEmail(data?.customerEmail || data?.email || null) || undefined;

    const { data: emailData, error } = await resend.emails.send({
      from: 'Importadora F&D <onboarding@resend.dev>',
      to,
      ...(replyTo ? { reply_to: replyTo } : {}),
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
