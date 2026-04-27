import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "Apikey",
    authDomain: "studentbank-97835.firebaseapp.com",
    projectId: "studentbank-97835",
    storageBucket: "studentbank-97835.firebasestorage.app",
    messagingSenderId: "980989913613",
    appId: "appid",
    measurementId: "G-TGQRJJKNLV"
  };
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);