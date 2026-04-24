import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Dimensions,} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Importaciones de tus pantallas principales
import HomeScreen from '../screens/main/HomeScreen';
import MyTicketsScreen from '../screens/main/MyTicketsScreen';
import CreateScreen from '../screens/main/CreateScreen';
import MessajesScreen from '../screens/main/MessajesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

//Importar las pantallas secundarias
import NotificationsScreen from '../screens/main/NotificationsScreen';
import TicketScreen from '../screens/main/TicketScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


// Configuracion de los iconos por ruta
const TAB_ICONS = {
  Inicio:   { icon: 'home-outline',        iconFocused: 'home' },
  Tickets:  { icon: 'ticket-outline',      iconFocused: 'ticket' },
  Agregar:  { icon: 'add-circle-outline',  iconFocused: 'add-circle' },
  Mensajes: { icon: 'chatbubble-outline',  iconFocused: 'chatbubble' },
  Perfil:   { icon: 'person-outline',      iconFocused: 'person' },
};

const TAB_BAR_HEIGHT = 70;
const INDICATOR_SIZE = 48;
const ACTIVE_COLOR   = '#4F46E5';
const INACTIVE_COLOR = '#6B7280';
const BG_COLOR       = '#161920';


// Stack de Inicio
function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="TicketScreen" component={TicketScreen} />
    </Stack.Navigator>
  );
}


// Custom Tab Bar Animado
function CustomTabBar({ state, descriptors, navigation }) {
  const { width } = Dimensions.get('window');
  const tabWidth = width / state.routes.length;

  // Posicion X inicial del indicador
  const indicatorX = useRef(
    new Animated.Value(state.index * tabWidth + tabWidth / 2 - INDICATOR_SIZE / 2)
  ).current;

  useEffect(() => {
    const toValue = state.index * tabWidth + tabWidth / 2 - INDICATOR_SIZE / 2;

    Animated.spring(indicatorX, {
      toValue,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={[styles.tabBar, { width }]}>
      {/* Fondo circular morado*/}
      <Animated.View
        style={[
          styles.indicator,
          { transform: [{ translateX: indicatorX }] },
        ]}
      />

      {/*Tabs (Sin nombres, solo íconos) */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused   = state.index === index;
        const tabData     = TAB_ICONS[route.name]; 

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFocused ? tabData.iconFocused : tabData.icon}
              size={24}
              color={isFocused ? '#FFFFFF' : INACTIVE_COLOR}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Inicio"   component={HomeStackNavigator} />
      <Tab.Screen name="Tickets"  component={MyTicketsScreen} />
      <Tab.Screen name="Agregar"  component={CreateScreen} />
      <Tab.Screen name="Mensajes" component={MessajesScreen} />
      <Tab.Screen name="Perfil"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    backgroundColor: BG_COLOR,
    borderTopWidth: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    backgroundColor: ACTIVE_COLOR,
    top: (TAB_BAR_HEIGHT - INDICATOR_SIZE) / 2,
    shadowColor: ACTIVE_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: TAB_BAR_HEIGHT,
    zIndex: 1,
  },
});