import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Platform, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../services/firebaseConfig';
import i18next from '../services/staticTL';
import { initializeAppLanguage } from '../services/startup';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import TutorialScreen from '../screens/tutoSlides/TutorialScreen';

const Stack = createNativeStackNavigator();
const GUEST_TUTORIAL_KEY = '@hasSeenTutorial_guest';
const userTutorialKey = (uid) => `@hasSeenTutorial_${uid}`;

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tutorialLoaded, setTutorialLoaded] = useState(false);
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // FIX: Se elimina navKey para no recrear NavigationContainer al volver
  // de background (ej. cuando el ImagePicker abre la galería).
  // Recrear el NavigationContainer destruye el stack de navegación activo
  // y saca al usuario de pantallas como MensajeScreen.

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        try {
          await authenticatedUser.reload();
          const currentUser = auth.currentUser;

          if (currentUser && currentUser.emailVerified) {
            setUser(currentUser);
            await loadLanguage(currentUser);
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              online: true,
              lastActive: new Date().toISOString(),
            });
          } else {
            setUser(null);
            setLanguageLoaded(true);
            await signOut(auth);
          }
        } catch (error) {
          console.log("Error al recargar usuario:", error);
          setUser(null);
          setLanguageLoaded(true);
        }
      } else {
        setUser(null);
        setLanguageLoaded(true);
      }
      setLoading(false);
    });

    checkTutorialStatus();

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        if (auth.currentUser) {
          try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              online: false,
              lastActive: new Date().toISOString(),
            });
          } catch (e) {
            console.log("Error actualizando online status al background:", e);
          }
        }
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (auth.currentUser) {
          try {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
              setUser(auth.currentUser);
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                online: true,
                lastActive: new Date().toISOString(),
              });
            }
          } catch (e) {
            console.log("Error recargando en background:", e);
          }
        }
        // FIX: Se eliminó setNavKey aquí. Incrementar navKey al volver de
        // background (incluyendo cuando el usuario elige una imagen) destruía
        // el NavigationContainer y sacaba al usuario del chat.
      }
      appState.current = nextAppState;
    });

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  const checkTutorialStatus = async () => {
    try {
      const key = user ? userTutorialKey(user.uid) : GUEST_TUTORIAL_KEY;
      const hasSeen = await AsyncStorage.getItem(key);
      setShowTutorial(hasSeen !== 'true');
    } catch (error) {
      console.log('Error checking tutorial status:', error);
    } finally {
      setTutorialLoaded(true);
    }
  };

  const loadLanguage = async (authenticatedUser) => {
    try {
      await initializeAppLanguage(authenticatedUser);
    } catch (error) {
      console.log('Error loading language:', error);
    } finally {
      setLanguageLoaded(true);
    }
  };

  const handleTutorialDone = async () => {
    try {
      const key = user ? userTutorialKey(user.uid) : GUEST_TUTORIAL_KEY;
      await AsyncStorage.setItem(key, 'true');
      setShowTutorial(false);
    } catch (error) {
      console.log('Error guardando estado del tutorial:', error);
    }
  };

  if (loading || !tutorialLoaded || !languageLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D14' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (showTutorial) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tutorial">
            {(props) => <TutorialScreen {...props} onDone={handleTutorialDone} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}