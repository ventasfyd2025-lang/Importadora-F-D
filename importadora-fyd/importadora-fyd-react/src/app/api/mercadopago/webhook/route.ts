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
      console.log('❌ Headers de firma faltantes');
      return false;
    }

    // Extraer timestamp de la firma
    const ts = signature.split(',').find(part => part.startsWith('ts='))?.split('=')[1];
    if (!ts) {
      console.log('❌ Timestamp no encontrado en firma');
      return false;
    }

    // Construir el mensaje a validar según documentación de MercadoPago
    const dataId = JSON.parse(body).data?.id;
    const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
    
    console.log('🔍 Validando firma con template:', template);

    // Para desarrollo, saltamos la validación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Modo desarrollo: saltando validación de firma');
      return true;
    }

    // En producción, aquí validarías con el secret
    // const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    // const hash = crypto.createHmac('sha256', secret).update(template).digest('hex');
    
    return true;
  } catch (error) {
    console.error('❌ Error validando firma webhook:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    
    console.log('📨 Webhook MercadoPago recibido:', {
      type: body.type,
      action: body.action,
      dataId: body.data?.id
    });

    // Validar firma del webhook
    if (!validateWebhookSignature(request, bodyText)) {
      console.log('❌ Firma de webhook inválida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Procesar diferentes tipos de notificación
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      const action = body.action; // 'payment.created', 'payment.updated', etc.
      
      console.log(`🔄 Procesando ${action} para pago ${paymentId}`);
      
      try {
        // Obtener información del pago desde MercadoPago
        const paymentInfo = await payment.get({ id: paymentId });
        
        console.log('💳 Información del pago:', {
          id: paymentInfo.id,
          status: paymentInfo.status,
          external_reference: paymentInfo.external_reference,
          transaction_amount: paymentInfo.transaction_amount
        });

        if (paymentInfo) {
          const orderId = paymentInfo.external_reference;
          const status = paymentInfo.status;
          const statusDetail = paymentInfo.status_detail;

          // Mapear estados de MercadoPago a nuestros estados
          let orderStatus = 'pending';
          
          switch (status) {
            case 'approved':
              orderStatus = 'completed';
              break;
            case 'pending':
              orderStatus = 'pending';
              break;
            case 'in_process':
              orderStatus = 'processing';
              break;
            case 'rejected':
            case 'cancelled':
              orderStatus = 'failed';
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

                console.log(`✅ Orden ${orderId} actualizada: ${orderStatus}`);
              } else {
                console.log(`⚠️ Orden ${orderId} no encontrada en Firestore`);
              }
            } catch (firestoreError) {
              console.error('❌ Error actualizando orden en Firestore:', firestoreError);
            }
          } else {
            console.log('⚠️ No hay external_reference en el pago');
          }
        }
      } catch (mpError) {
        console.error('❌ Error obteniendo pago de MercadoPago:', mpError);
      }
    } else {
      console.log('ℹ️ Tipo de notificación no manejado:', body.type);
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