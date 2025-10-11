import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  }
});

const preference = new Preference(client);

export async function POST(_request: NextRequest) {
  // ⚠️ SEGURIDAD: Deshabilitar en producción
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        error: 'Endpoint de prueba deshabilitado en producción',
        message: 'Este endpoint solo está disponible en desarrollo'
      },
      { status: 403 }
    );
  }

  try {
    // Preferencia mínima siguiendo documentación oficial
    const testPreference = {
      items: [
        {
          id: 'test_item_001',
          title: 'Producto de Prueba',
          quantity: 1,
          unit_price: 1000
        }
      ],
      back_urls: {
        success: `${process.env.BASE_URL || 'http://localhost:3000'}/checkout/success`,
        failure: `${process.env.BASE_URL || 'http://localhost:3000'}/checkout/failure`,
        pending: `${process.env.BASE_URL || 'http://localhost:3000'}/checkout/pending`
      },
      external_reference: 'test_' + Date.now(),
      statement_descriptor: 'TEST IMPORTADORA'
    };    const result = await preference.create({ body: testPreference });    return NextResponse.json({
      success: true,
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
      message: 'Preferencia de prueba creada. Usa estas tarjetas: Visa 4009175332806176 CVV 123 11/25'
    });

  } catch (error: unknown) {
    console.error('❌ Error en preferencia de prueba:', error);
    const err = error as { message: string; cause?: any };
    
    return NextResponse.json({
      success: false,
      error: err.message,
      details: err.cause || err
    }, { status: 500 });
  }
}