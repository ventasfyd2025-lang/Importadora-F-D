import * as functions from 'firebase-functions';

export const testOrderTrigger = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderId = context.params.orderId;
    const order = snap.data();

    console.log(`TEST: Order ${orderId} created with status: ${order.status}`);
    console.log(`TEST: Customer email: ${order.customerEmail}`);

    return null;
  });