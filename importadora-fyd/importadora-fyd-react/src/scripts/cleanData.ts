import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export const cleanAllOrders = async () => {
  try {
    console.log('🧹 Limpiando todos los pedidos...');
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    
    const deletePromises = ordersSnapshot.docs.map(orderDoc => 
      deleteDoc(doc(db, 'orders', orderDoc.id))
    );
    
    await Promise.all(deletePromises);
    console.log(`✅ Se eliminaron ${ordersSnapshot.docs.length} pedidos`);
  } catch (error) {
    console.error('❌ Error al limpiar pedidos:', error);
  }
};

export const cleanAllChatMessages = async () => {
  try {
    console.log('🧹 Limpiando todos los mensajes de chat...');
    const messagesSnapshot = await getDocs(collection(db, 'chat_messages'));
    
    const deletePromises = messagesSnapshot.docs.map(messageDoc => 
      deleteDoc(doc(db, 'chat_messages', messageDoc.id))
    );
    
    await Promise.all(deletePromises);
    console.log(`✅ Se eliminaron ${messagesSnapshot.docs.length} mensajes de chat`);
  } catch (error) {
    console.error('❌ Error al limpiar mensajes:', error);
  }
};

export const cleanAllData = async () => {
  console.log('🚀 Iniciando limpieza completa de datos...');
  await cleanAllOrders();
  await cleanAllChatMessages();
  console.log('🎉 Limpieza completa finalizada');
};