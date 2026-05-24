import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Platform, Modal, Animated, TouchableWithoutFeedback, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../services/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, } from 'firebase/firestore';
import i18next from '../../services/staticTL';
import { getSkillByName } from '../../utils/tagsList';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal de detalle
  const [detailModal, setDetailModal] = useState({ visible: false, notif: null });

  // Modo seleccion multiple
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Animacion del toolbar de seleccion
  const toolbarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(toolbarAnim, {
      toValue: selectionMode ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    if (!selectionMode) setSelectedIds(new Set());
  }, [selectionMode]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', auth.currentUser.uid),
      orderBy('fecha', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = [];
      snapshot.forEach((d) => notifs.push({ id: d.id, ...d.data() }));
      setNotificaciones(notifs);
      setLoading(false);
    }, (error) => {
      console.log('Error al cargar notificaciones:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const marcarComoLeida = async (id, leida) => {
    if (!leida) {
      try {
        await updateDoc(doc(db, 'notificaciones', id), { leida: true });
      } catch (e) {
        console.log('Error al marcar como leída:', e);
      }
    }
  };

  const handlePress = (notif) => {
    if (selectionMode) {
      toggleSelect(notif.id);
      return;
    }
    marcarComoLeida(notif.id, notif.leida);
    setDetailModal({ visible: true, notif });
  };

  const handleLongPress = (id) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set([id]));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setSelectionMode(false);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.delete(doc(db, 'notificaciones', id));
      });
      await batch.commit();
    } catch (e) {
      console.log('Error al eliminar notificaciones:', e);
    } finally {
      setSelectionMode(false);
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

  const tagsString = (skills) =>
    skills.map((s) => getSkillByName(s)).join(', ');

  const getNotifContent = (notif) => {
    if (!notif) return { title: '', description: '' };
    const isMensaje = notif.tipo === 'mensaje';
    return {
      title: isMensaje
        ? i18next.t('notif.mensaje.titulo')
        : i18next.t('notif.match.titulo'),
      description: isMensaje
        ? i18next.t('notif.mensaje.desc', { ticket: notif.ticket || '' })
        : i18next.t('notif.match.desc', { tags: notif.tags ? tagsString(notif.tags) : '' }),
    };
  };

  const toolbarTranslateY = toolbarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        {selectionMode ? (
          <>
            <TouchableOpacity style={styles.backButtonContainer} onPress={() => setSelectionMode(false)}>
              <View style={styles.backButtonIcon}>
                <Ionicons name="close" size={20} color="#8A8F9E" />
              </View>
              <Text style={styles.backButtonText}>
                {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteSelected} style={styles.deleteBtn} activeOpacity={0.75}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.goBack()}>
            <View style={styles.backButtonIcon}>
              <Ionicons name="arrow-back" size={20} color="#8A8F9E" />
            </View>
            <Text style={styles.backButtonText}>{i18next.t('back')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {!selectionMode && (
        <Text style={styles.mainTitle}>{i18next.t('notif.titulo')}</Text>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : notificaciones.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>{i18next.t('notif.sinNotif')}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
        >
          {notificaciones.map((notif) => {
            const { Icono, name, color } = getIconConfig(notif.tipo);
            const { title, description } = getNotifContent(notif);
            const isSelected = selectedIds.has(notif.id);

            return (
              <View key={notif.id}>
                <TouchableOpacity
                  style={[
                    styles.notificationItem,
                    notif.leida && styles.notificationItemRead,
                    isSelected && styles.notificationItemSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handlePress(notif)}
                  onLongPress={() => handleLongPress(notif.id)}
                  delayLongPress={350}
                >
                  <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                    <Icono name={name} size={24} color={isSelected ? '#fff' : color} />
                  </View>

                  <View style={styles.textContainer}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.itemDescription} numberOfLines={2}>{description}</Text>
                  </View>

                  {!notif.leida && !selectionMode && <View style={styles.unreadDot} />}
                </TouchableOpacity>
                <View style={styles.separator} />
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* MODAL DE DETALLE */}
      <Modal
        visible={detailModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailModal({ visible: false, notif: null })}
      >
        <TouchableWithoutFeedback onPress={() => setDetailModal({ visible: false, notif: null })}>
          <View style={styles.detailOverlay}>
            {/* Evitar que el tap en el contenido cierre el modal */}
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.detailContent}>
                {(() => {
                  const n = detailModal.notif;
                  if (!n) return null;
                  const { Icono, name, color } = getIconConfig(n.tipo);
                  const { title, description } = getNotifContent(n);
                  return (
                    <>
                      {/* Icono grande */}
                      <View style={[styles.detailIconCircle, { borderColor: color + '40' }]}>
                        <Icono name={name} size={36} color={color} />
                      </View>

                      <Text style={styles.detailTitle}>{title}</Text>
                      <Text style={styles.detailDescription}>{description}</Text>

                      {/* Fecha */}
                      {n.fecha && (
                        <Text style={styles.detailDate}>
                          {new Date(
                            n.fecha?.seconds ? n.fecha.seconds * 1000 : n.fecha
                          ).toLocaleString()}
                        </Text>
                      )}

                      <TouchableOpacity
                        style={styles.detailCloseBtn}
                        onPress={() => setDetailModal({ visible: false, notif: null })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.detailCloseBtnText}>{i18next.t('ok')}</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F14' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
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
    fontWeight: '500'
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  mainTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 10
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: '#888',
    fontSize: 16
  },

  // Item de notificacion
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  notificationItemRead: {
    opacity: 0.45,
  },
  notificationItemSelected: {
    backgroundColor: 'rgba(79,70,229,0.13)',
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
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
  iconCircleSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },

  textContainer: {
    flex: 1,
    marginLeft: 15
  },
  itemTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  itemDescription: {
    color: '#888',
    fontSize: 14
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
    marginHorizontal: 20
  },

  // Modal de detalle
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  detailContent: {
    backgroundColor: '#15171E',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  detailIconCircle: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: '#0D0F14',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 18,
  },
  detailTitle: {
    color: '#FFFFFF',
    fontSize: 18, fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  detailDescription: {
    color: '#9CA3AF',
    fontSize: 14, textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  detailDate: {
    color: '#374151',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  detailCloseBtn: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 36,
    marginTop: 4,
  },
  detailCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
});