import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export const cleanAllOrders = async () => {
  try {    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    
    const deletePromises = ordersSnapshot.docs.map(orderDoc => 
      deleteDoc(doc(db, 'orders', orderDoc.id))
    );
    
    await Promise.all(deletePromises);  } catch (error) {
    console.error('❌ Error al limpiar pedidos:', error);
  }
};

export const cleanAllChatMessages = async () => {
  try {    const messagesSnapshot = await getDocs(collection(db, 'chat_messages'));
    
    const deletePromises = messagesSnapshot.docs.map(messageDoc => 
      deleteDoc(doc(db, 'chat_messages', messageDoc.id))
    );
    
    await Promise.all(deletePromises);  } catch (error) {
    console.error('❌ Error al limpiar mensajes:', error);
  }
};

export const cleanAllData = async () => {  await cleanAllOrders();
  await cleanAllChatMessages();};