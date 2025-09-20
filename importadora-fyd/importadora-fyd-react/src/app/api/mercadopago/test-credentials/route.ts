import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function GET(_request: NextRequest) {
  try {
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
        accessTokenPrefix: accessToken.substring(0, 20) + '...',
        publicKeyPrefix: publicKey.substring(0, 20) + '...',
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
        accessTokenPrefix: accessToken.substring(0, 20) + '...',
        publicKeyPrefix: publicKey.substring(0, 20) + '...',
        error: error.message,
        status: error.status,
        cause: error.cause
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