import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APPID, APIKEY } from '@env'

const firebaseConfig = {
  apiKey: "AIzaSyB3HqFQ2Tcct7hVMdaIm2ZgyQC-5tli1rI",
  authDomain: "studentbank-97835.firebaseapp.com",
  projectId: "studentbank-97835",
  storageBucket: "studentbank-97835.firebasestorage.app",
  messagingSenderId: "980989913613",
  appId: "1:980989913613:web:9cff20f4b9b7615c3c4344",
  measurementId: "G-TGQRJJKNLV"
};
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);