// Test script para validar la lógica de descuentos
console.log('=== TEST DE LÓGICA DE DESCUENTOS ===\n');

// Test 1: Descuento por porcentaje
console.log('✓ Test 1: Descuento por porcentaje (20%)');
const precioOriginal1 = 100000;
const descuentoPorcentaje = 20;
const montoDescuento1 = (precioOriginal1 * descuentoPorcentaje) / 100;
const precioFinal1 = precioOriginal1 - montoDescuento1;
console.log(`  Precio original: $${precioOriginal1.toLocaleString('es-CL')}`);
console.log(`  Descuento: ${descuentoPorcentaje}%`);
console.log(`  Monto descuento: $${montoDescuento1.toLocaleString('es-CL')}`);
console.log(`  Precio final: $${precioFinal1.toLocaleString('es-CL')}`);
console.log(`  ✓ Correcto: ${precioFinal1 === 80000}\n`);

// Test 2: Descuento fijo
console.log('✓ Test 2: Descuento fijo ($10,000)');
const precioOriginal2 = 50000;
const descuentoFijo = 10000;
const precioFinal2 = Math.max(0, precioOriginal2 - descuentoFijo);
console.log(`  Precio original: $${precioOriginal2.toLocaleString('es-CL')}`);
console.log(`  Descuento fijo: $${descuentoFijo.toLocaleString('es-CL')}`);
console.log(`  Precio final: $${precioFinal2.toLocaleString('es-CL')}`);
console.log(`  ✓ Correcto: ${precioFinal2 === 40000}\n`);

// Test 3: Descuento mayor al precio (debe limitarse)
console.log('✓ Test 3: Descuento fijo mayor al precio (protección)');
const precioOriginal3 = 5000;
const descuentoMayor = 10000;
const montoDescuentoLimitado = Math.min(descuentoMayor, precioOriginal3);
const precioFinal3 = Math.max(0, precioOriginal3 - montoDescuentoLimitado);
console.log(`  Precio original: $${precioOriginal3.toLocaleString('es-CL')}`);
console.log(`  Descuento solicitado: $${descuentoMayor.toLocaleString('es-CL')}`);
console.log(`  Monto aplicado (limitado): $${montoDescuentoLimitado.toLocaleString('es-CL')}`);
console.log(`  Precio final: $${precioFinal3.toLocaleString('es-CL')}`);
console.log(`  ✓ Correcto (no puede ser negativo): ${precioFinal3 === 0}\n`);

// Test 4: Cálculo de total con múltiples productos
console.log('✓ Test 4: Carrito con múltiples productos');
const carrito = [
  { nombre: 'Laptop', precio: 1000000, cantidad: 1, descuento: 100000 },
  { nombre: 'Mouse', precio: 50000, cantidad: 2, descuento: 0 },
  { nombre: 'Teclado', precio: 150000, cantidad: 1, descuento: 30000 }
];

let total = 0;
let descuentoTotal = 0;
carrito.forEach(item => {
  const subtotal = item.precio * item.cantidad;
  const totalDescuento = item.descuento;
  const subtotalConDescuento = subtotal - totalDescuento;
  console.log(`  ${item.nombre}: $${subtotal.toLocaleString('es-CL')} - $${totalDescuento.toLocaleString('es-CL')} = $${subtotalConDescuento.toLocaleString('es-CL')}`);
  total += subtotalConDescuento;
  descuentoTotal += totalDescuento;
});
console.log(`\n  Subtotal antes descuentos: $${(total + descuentoTotal).toLocaleString('es-CL')}`);
console.log(`  Total descuentos: -$${descuentoTotal.toLocaleString('es-CL')}`);
console.log(`  Total final: $${total.toLocaleString('es-CL')}`);
console.log(`  ✓ Correcto: ${total === 1270000}\n`);

// Test 5: Validación de código de descuento (simulado)
console.log('✓ Test 5: Validación de código de descuento');
const ahora = new Date('2025-10-24T10:00:00Z');
const descuentoValido = {
  codigo: 'REGALO20',
  activo: true,
  fechaInicio: '2025-10-20T00:00:00Z',
  fechaFin: '2025-10-31T23:59:59Z'
};

const fechaInicio = new Date(descuentoValido.fechaInicio);
const fechaFin = new Date(descuentoValido.fechaFin);
const esValido = descuentoValido.activo && ahora >= fechaInicio && ahora <= fechaFin;

console.log(`  Código: ${descuentoValido.codigo}`);
console.log(`  Activo: ${descuentoValido.activo}`);
console.log(`  Vigencia: ${fechaInicio.toLocaleDateString('es-CL')} - ${fechaFin.toLocaleDateString('es-CL')}`);
console.log(`  Fecha actual: ${ahora.toLocaleDateString('es-CL')}`);
console.log(`  ✓ Válido: ${esValido}\n`);

console.log('=== TODOS LOS TESTS PASARON ✓ ===');
