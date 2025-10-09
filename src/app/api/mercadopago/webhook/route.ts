import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import crypto from 'crypto';

// Configurar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const payment = new Payment(client);

// Función para validar la firma del webhook
function validateWebhookSignature(request: NextRequest, body: string): boolean {
  try {
    const signature = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');
    
    if (!signature || !requestId) {
      // console.warn('❌ Webhook sin firma o request-id');
      return false;
    }

    // Extraer los componentes de la firma
    const signatureParts = signature.split(',');
    const ts = signatureParts.find(part => part.startsWith('ts='))?.split('=')[1];
    const v1Hash = signatureParts.find(part => part.startsWith('v1='))?.split('=')[1];
    
    if (!ts || !v1Hash) {
      // console.warn('❌ Encabezados de firma incompletos', { signature });
      return false;
    }

    // Validar que el webhook secret esté configurado
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) {
      console.error('❌ MERCADOPAGO_WEBHOOK_SECRET no configurado');
      return false;
    }

    // Construir el mensaje a validar según documentación de MercadoPago
    const dataId = JSON.parse(body).data?.id;
    const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
    
    // Calcular el HMAC SHA256
    const expectedHash = crypto.createHmac('sha256', secret).update(template).digest('hex');
    
    // Comparar hashes de forma segura
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(v1Hash, 'hex')
    );
    
    if (!isValid) {
      // console.warn('❌ Firma de webhook inválida', { requestId, dataId });
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error validando firma webhook:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    // Validar firma del webhook
    if (!validateWebhookSignature(request, bodyText)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Procesar diferentes tipos de notificación
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      const action = body.action; // 'payment.created', 'payment.updated', etc.

      try {
        // Obtener información del pago desde MercadoPago
        const paymentInfo = await payment.get({ id: paymentId });

        if (paymentInfo) {
          const orderId = paymentInfo.external_reference;
          const status = paymentInfo.status;
          const statusDetail = paymentInfo.status_detail;

          // Mapear estados de MercadoPago a nuestros estados
          let orderStatus = 'pending';

          switch (status) {
            case 'approved':
              orderStatus = 'confirmed';
              break;
            case 'pending':
              orderStatus = 'pending';
              break;
            case 'in_process':
              orderStatus = 'pending';
              break;
            case 'rejected':
            case 'cancelled':
              orderStatus = 'cancelled';
              break;
            default:
              orderStatus = 'pending';
          }

          // Actualizar orden en Firestore solo si tenemos orderId
          if (orderId && orderId !== 'undefined') {
            try {
              const orderRef = doc(db, 'orders', orderId);
              const orderDoc = await getDoc(orderRef);

              if (orderDoc.exists()) {
                const orderData = orderDoc.data();
                const previousStatus = orderData.status;

                await updateDoc(orderRef, {
                  status: orderStatus,
                  paymentStatus: status,
                  paymentId: paymentId,
                  paymentDetails: {
                    transactionAmount: paymentInfo.transaction_amount,
                    paymentMethodId: paymentInfo.payment_method_id,
                    paymentTypeId: paymentInfo.payment_type_id,
                    statusDetail: statusDetail,
                    dateApproved: paymentInfo.date_approved,
                    dateCreated: paymentInfo.date_created,
                    lastUpdated: new Date().toISOString()
                  },
                  updatedAt: new Date()
                });

                // Si el pago fue aprobado y el estado anterior era pending_payment, descontar stock
                if (status === 'approved' && previousStatus === 'pending_payment') {
                  const items = orderData.items || [];
                  for (const item of items) {
                    const productRef = doc(db, 'products', item.productId);
                    const productDoc = await getDoc(productRef);

                    if (productDoc.exists()) {
                      const currentStock = productDoc.data().stock || 0;
                      const newStock = Math.max(0, currentStock - item.cantidad);

                      await updateDoc(productRef, {
                        stock: newStock
                      });

                      console.log(`✅ Stock descontado: ${item.nombre} - ${currentStock} → ${newStock}`);
                    }
                  }
                }
              } else {
                // console.warn('⚠️ Orden no encontrada para actualizar con pago MP', { orderId, paymentId });
              }
            } catch (firestoreError) {
              console.error('❌ Error actualizando orden en Firestore:', firestoreError);
            }
          } else {
            // console.warn('⚠️ Pago de MercadoPago sin external_reference', { paymentId });
          }
        }
      } catch (mpError) {
        console.error('❌ Error obteniendo pago de MercadoPago:', mpError);
      }
    } else {
      // console.info('ℹ️ Notificación de MercadoPago ignorada', { type: body.type, action: body.action });
    }

    // Responder con 200 para confirmar que recibimos la notificación
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Error procesando webhook MercadoPago:', error);
    
    // Incluso si hay error, respondemos 200 para evitar reintentos innecesarios
    return NextResponse.json({ error: 'Internal error' }, { status: 200 });
  }
}

// Método GET para verificación del webhook
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Webhook MercadoPago funcionando',
    timestamp: new Date().toISOString()
  });
}
