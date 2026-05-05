import { doc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

export const addPoints = async (amount) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);

    await updateDoc(userRef, {
      points: increment(amount)
    });

  } catch (error) {
    console.log('Error sumando puntos:', error);
  }
};