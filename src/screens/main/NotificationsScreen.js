import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { auth, db } from '../../services/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ocultar el TabBar inferior al entrar a esta pantalla
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({ tabBarStyle: { display: 'none' } });
      }
      return () => {
        if (parent) {
          // devolvemos el display a 'flex', el CustomTabBar hara el resto
          parent.setOptions({ tabBarStyle: { display: 'flex' } });
        }
      };
    }, [navigation])
  );

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', auth.currentUser.uid),
      orderBy('fecha', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = [];
        snapshot.forEach((documento) => {
          notifs.push({ id: documento.id, ...documento.data() });
        });
        setNotificaciones(notifs);
        setLoading(false);
      },
      (error) => {
        console.log("Error al cargar notificaciones:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const marcarComoLeida = async (id, leida) => {
    if (!leida) {
      try {
        await updateDoc(doc(db, 'notificaciones', id), { leida: true });
      } catch (error) {
        console.log("Error al marcar como leída:", error);
      }
    }
  };

  const getIconConfig = (tipo) => {
    switch (tipo) {
      case 'ticket_match':
        return { Icono: MaterialCommunityIcons, name: 'ticket-confirmation', color: '#FFD700' };
      case 'mensaje':
        return { Icono: Ionicons, name: 'chatbubble-ellipses', color: '#3B82F6' };
      default:
        return { Icono: Ionicons, name: 'notifications', color: '#FFF' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.goBack()}>
          <View style={styles.backButtonIcon}>
            <Ionicons name="arrow-back" size={20} color="#8A8F9E" />
          </View>
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.mainTitle}>Notificaciones</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : notificaciones.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No tienes notificaciones aún.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
        >
          {notificaciones.map((notif) => {
            const { Icono, name, color } = getIconConfig(notif.tipo);
            return (
              <View key={notif.id}>
                <TouchableOpacity
                  style={styles.notificationItem}
                  activeOpacity={0.7}
                  onPress={() => marcarComoLeida(notif.id, notif.leida)}
                >
                  <View style={styles.iconCircle}>
                    <Icono name={name} size={24} color={color} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.itemTitle}>{notif.titulo}</Text>
                    <Text style={styles.itemDescription} numberOfLines={2}>{notif.descripcion}</Text>
                  </View>
                  {!notif.leida && <View style={styles.unreadDot} />}
                </TouchableOpacity>
                <View style={styles.separator} />
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D3243',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    color: '#8A8F9E',
    fontSize: 15,
    fontWeight: '500',
  },
  mainTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  iconCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#161920',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  itemTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    color: '#888',
    fontSize: 14,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#1F2229',
    marginHorizontal: 20,
  },
});