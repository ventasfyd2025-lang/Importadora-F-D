import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { logError, logInfo } from '@/utils/logger';

// Define interfaces for strong typing
interface RequestItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  price: number;
  image?: string;
}

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  rut: string;
  address: {
    street: string;
    postalCode: string;
  };
}

interface RequestBody {
  items: RequestItem[];
  userInfo: UserInfo;
  orderId: string;
}

// Configurar MercadoPago con el access token
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

if (!accessToken) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
}

const client = new MercadoPagoConfig({
  accessToken: accessToken,
  options: {
    timeout: 5000,
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RequestBody;
    const { items, userInfo, orderId } = body;

    // Generate unique idempotency key for this request
    const idempotencyKey = orderId ? `order_${orderId}` : `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Create preference instance with unique idempotency key
    const preference = new Preference(client);


    // Validar que tenemos los datos necesarios
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Items son requeridos' },
        { status: 400 }
      );
    }

    // Preparar items para MercadoPago
    const mpItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || `${item.title} - Producto`,
      quantity: item.quantity,
      unit_price: parseFloat(item.price.toString()),
      currency_id: 'CLP', // Peso chileno
      picture_url: item.image
    }));

    // Obtener la URL base correcta y limpiarla
    const baseUrl = (process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim();
    
    // Calcular total desde los items
    const total = mpItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    // Preparar datos del usuario de forma segura
    const customerName = `${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`.trim();
    const customerEmail = userInfo?.email || '';

    // Crear URLs de retorno
    const successUrl = `${baseUrl}/checkout/success?orderId=${encodeURIComponent(orderId || '')}&paymentMethod=mercadopago&customerName=${encodeURIComponent(customerName)}&customerEmail=${encodeURIComponent(customerEmail)}&total=${total}`;
    const failureUrl = `${baseUrl}/checkout/failure?orderId=${encodeURIComponent(orderId || '')}`;
    const pendingUrl = `${baseUrl}/checkout/pending?orderId=${encodeURIComponent(orderId || '')}`;

    console.log('URLs generadas:', { successUrl, failureUrl, pendingUrl, baseUrl });

    // Configurar preferencia simplificada
    const preferenceData = {
      items: mpItems,
      payer: {
        email: customerEmail
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      external_reference: orderId || `order_${Date.now()}`,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      statement_descriptor: 'IMPORTADORA F&D',
      auto_return: 'approved'
    };


    // Log de la preferencia antes de crearla
    logInfo('Creando preferencia MercadoPago', {
      orderId: orderId || 'sin_orden',
      itemsCount: mpItems.length,
      total: mpItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
      userEmail: userInfo?.email || 'sin_email',
      baseUrl: baseUrl,
      successUrl: `${baseUrl}/checkout/success`
    });

    // Crear preferencia en MercadoPago con idempotency key único
    const response = await preference.create({ 
      body: preferenceData,
      requestOptions: {
        idempotencyKey: idempotencyKey
      }
    });    return NextResponse.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    });

  } catch (error: any) {
    logError('Error creando preferencia MercadoPago', error);

    // Log más detallado del error
    console.error('Error completo:', {
      message: error?.message,
      cause: error?.cause,
      stack: error?.stack,
      status: error?.status,
      statusCode: error?.statusCode,
      apiResponse: error?.apiResponse,
      response: error?.response
    });

    // Extraer mensaje de error más específico de MercadoPago
    let errorMessage = error?.message || 'Error desconocido';
    let errorDetails = error?.cause || error?.response?.data;

    // Si hay respuesta de la API de MercadoPago
    if (error?.apiResponse) {
      errorMessage = error.apiResponse.message || errorMessage;
      errorDetails = error.apiResponse;
    }

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: errorMessage,
        details: errorDetails,
        hasAccessToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN
      },
      { status: 500 }
    );
  }
}