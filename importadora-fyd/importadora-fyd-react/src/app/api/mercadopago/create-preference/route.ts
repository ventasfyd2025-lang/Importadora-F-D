import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

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
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'unique-key',
  }
});

const preference = new Preference(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RequestBody;
    const { items, userInfo, orderId } = body;


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

    // Obtener la URL base correcta
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Configurar preferencia simplificada para credenciales de prueba
    const preferenceData = {
      items: mpItems,
      payer: {
        name: userInfo?.firstName || '',
        surname: userInfo?.lastName || '.',
        email: userInfo?.email,
        phone: {
          area_code: '56',
          number: userInfo?.phone?.replace(/[^0-9]/g, '') || ''
        },
        identification: {
          type: 'RUT',
          number: userInfo?.rut?.replace(/[^0-9kK]/g, '') || ''
        },
        address: {
          street_name: userInfo?.address?.street || '',
          zip_code: userInfo?.address?.postalCode || ''
        }
      },
      back_urls: {
        success: `${baseUrl}/checkout/success`,
        failure: `${baseUrl}/checkout/failure`,
        pending: `${baseUrl}/checkout/pending`
      },
      external_reference: orderId || `order_${Date.now()}`,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      statement_descriptor: 'IMPORTADORA F&D'
    };


    // Log de la preferencia antes de crearla
    console.log('📦 Creando preferencia MercadoPago:', {
      orderId: orderId || 'sin_orden',
      itemsCount: mpItems.length,
      total: mpItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
      userEmail: userInfo?.email || 'sin_email',
      baseUrl: baseUrl,
      successUrl: `${baseUrl}/checkout/success`
    });

    // Crear preferencia en MercadoPago
    const response = await preference.create({ body: preferenceData });

    console.log('✅ Preferencia creada exitosamente:', {
      preferenceId: response.id,
      sandboxInitPoint: response.sandbox_init_point ? 'disponible' : 'no_disponible',
      initPoint: response.init_point ? 'disponible' : 'no_disponible'
    });

    return NextResponse.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    });

  } catch (error) {
    console.error('Error creando preferencia MercadoPago:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}