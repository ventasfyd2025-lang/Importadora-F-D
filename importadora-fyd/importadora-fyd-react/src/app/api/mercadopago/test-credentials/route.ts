import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { auth } from '@/lib/firebase-admin';

async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    
    return decodedToken.admin === true;
  } catch (error) {
    console.error('Error verificando token admin:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({
        error: 'Acceso no autorizado. Solo administradores pueden acceder a este endpoint.'
      }, { status: 401 });
    }
    
    // Verificar que las variables de entorno estén configuradas
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    
    if (!accessToken || !publicKey) {
      return NextResponse.json({
        error: 'Credenciales no configuradas',
        hasAccessToken: !!accessToken,
        hasPublicKey: !!publicKey
      }, { status: 400 });
    }

    // Verificar si las credenciales son de TEST
    const isTestMode = accessToken.includes('TEST') || accessToken.includes('APP_USR');
    
    // Configurar cliente de MercadoPago
    const client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: {
        timeout: 5000,
      }
    });

    // Crear una preferencia de prueba simple
    const preference = new Preference(client);
    
    const testPreference = {
      items: [
        {
          id: 'test_item',
          title: 'Test Item',
          description: 'Item de prueba para verificar credenciales',
          quantity: 1,
          unit_price: 100,
          currency_id: 'CLP'
        }
      ],
      back_urls: {
        success: `${process.env.BASE_URL || 'http://localhost:3000'}/checkout/success`,
        failure: `${process.env.BASE_URL || 'http://localhost:3000'}/checkout/failure`,
        pending: `${process.env.BASE_URL || 'http://localhost:3000'}/checkout/pending`
      },
      external_reference: 'test_' + Date.now(),
      statement_descriptor: 'Test IMPORTADORA F&D'
    };

    try {
      const result = await preference.create({ body: testPreference });
      
      return NextResponse.json({
        success: true,
        message: 'Credenciales válidas',
        isTestMode,
        preferenceCreated: true,
        sandboxInitPoint: result.sandbox_init_point,
        initPoint: result.init_point
      });
      
    } catch (preferenceError: unknown) {
      const error = preferenceError as { message: string; status: number; cause: any };
      return NextResponse.json({
        success: false,
        message: 'Error creando preferencia de prueba',
        isTestMode,
        error: error.message,
        status: error.status
      }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error('Error verificando credenciales:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json({
      success: false,
      message: 'Error interno verificando credenciales',
      error: errorMessage
    }, { status: 500 });
  }
}