import i18next from './staticTL';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const DEFAULT_LANGUAGE = 'es';

export async function initializeAppLanguage(authenticatedUser) {
  const language = authenticatedUser ? await getUserLanguage(authenticatedUser.uid) : DEFAULT_LANGUAGE;
  try {
    await i18next.changeLanguage(language);
  } catch (error) {
    console.log('Error changing language during startup:', error);
    await i18next.changeLanguage(DEFAULT_LANGUAGE);
  }
  return language;
}

async function getUserLanguage(uid) {
  if (!uid) return DEFAULT_LANGUAGE;
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data?.ln || DEFAULT_LANGUAGE;
    }
  } catch (error) {
    console.log('Error fetching user language:', error);
  }
  return DEFAULT_LANGUAGE;
}
