import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "apiKey",
    authDomain: "studentbank-97835.firebaseapp.com",
    projectId: "studentbank-97835",
    storageBucket: "studentbank-97835.firebasestorage.app",
    messagingSenderId: "980989913613",
    appId: "appId",
    measurementId: "G-TGQRJJKNLV"
  };
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});