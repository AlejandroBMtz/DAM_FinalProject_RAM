import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../services/firebaseConfig';

// imports de expo  
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import TutorialScreen from '../screens/tutoSlides/TutorialScreen';

// configuracion de notificaciones 
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator();

const GUEST_TUTORIAL_KEY = '@hasSeenTutorial_guest';
const userTutorialKey = (uid) => `@hasSeenTutorial_${uid}`;

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialLoaded, setTutorialLoaded] = useState(false);
  const tutorialLoadedForRef = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // obtener token 
  const registerForPushNotificationsAsync = async (uid) => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Permiso denegado para notificaciones');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Tu Push Token es:", token);

      // Guardar el token en el documento del usuario en Firestore
      try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { pushToken: token });
      } catch (error) {
        console.log("Error guardando el token:", error);
      }

    } else {
      console.log('Debes usar un dispositivo físico para recibir Push Notifications');
    }

    return token;
  };

  useEffect(() => {
    const loadTutorialState = async (authenticatedUser) => {
      try {
        const key = authenticatedUser ? userTutorialKey(authenticatedUser.uid) : GUEST_TUTORIAL_KEY;
        const value = await AsyncStorage.getItem(key);
        setShowTutorial(value !== 'true');
        tutorialLoadedForRef.current = authenticatedUser ? authenticatedUser.uid : 'guest';
      } catch (error) {
        console.log('Error cargando estado del tutorial:', error);
        setShowTutorial(true);
        tutorialLoadedForRef.current = authenticatedUser ? authenticatedUser.uid : 'guest';
      } finally {
        setTutorialLoaded(true);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);

      if (authenticatedUser) {
        registerForPushNotificationsAsync(authenticatedUser.uid);
      }

      const checkKey = authenticatedUser ? authenticatedUser.uid : 'guest';
      if (
        tutorialLoadedForRef.current === null ||
        (authenticatedUser && tutorialLoadedForRef.current !== authenticatedUser.uid)
      ) {
        loadTutorialState(authenticatedUser);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notificación recibida:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Usuario tocó la notificación:", response);
    });

    return () => {
      unsubscribe();
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const handleTutorialDone = async () => {
    try {
      const key = user ? userTutorialKey(user.uid) : GUEST_TUTORIAL_KEY;
      await AsyncStorage.setItem(key, 'true');
      setShowTutorial(false);
    } catch (error) {
      console.log('Error guardando estado del tutorial:', error);
    }
  };

  if (loading || !tutorialLoaded) {
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