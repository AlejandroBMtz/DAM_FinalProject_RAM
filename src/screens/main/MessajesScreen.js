import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import { collection, query, where, orderBy, or, and, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import i18next from '../../services/staticTL';

export default function MensajesScreen() {
  const navigation = useNavigation();
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Formateador de tiempo
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffDias = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDias === 0 && now.getDate() === date.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDias === 1 || (diffDias === 0 && now.getDate() !== date.getDate())) {
      return i18next.t("dias.ayer");
    } else if (diffDias < 7) {
      const dias = [i18next.t("dias.dom"), i18next.t("dias.lun"), i18next.t("dias.mar"), i18next.t("dias.mie"), i18next.t("dias.jue"), i18next.t("dias.vie"), i18next.t("dias.sab")];
      return dias[date.getDay()];
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  const getUserData = async (solicitante, ayudante) => {
    const currentUid = auth.currentUser?.uid;
    const otherUid = solicitante === currentUid ? ayudante : solicitante;
    if (!otherUid) return { nombre: '', fotoPerfil: null };

    try {
      const userRef = doc(db, 'users', otherUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        // El campo correcto en Firestore es fotoPerfil
        return {
          nombre: data.nombre || '',
          fotoPerfil: data.fotoPerfil || null,
          online: data.online || false,
          lastActive: data.lastActive || null,
        };
      }
    } catch (error) {
      console.log('Error al obtener info del usuario:', error);
    }
    return { nombre: '', fotoPerfil: null, online: false, lastActive: null };
  };

  const obtenerConversaciones = () => {
    if (!auth.currentUser) return;
    const userUid = auth.currentUser.uid;

    try {
      const convRef = collection(db, 'conversaciones');
      const q = query(
        convRef,
        and(
          or(
            where('solicitante', '==', userUid),
            where('ayudante', '==', userUid)
          ),
          where('estado', '==', 'activa')
        ),
        orderBy('ultimaActividad', 'desc')
      );

      const unsub = onSnapshot(q, async (querySnapshot) => {
        const results = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const userInfo = await getUserData(data.solicitante, data.ayudante);
          const otherUid = data.solicitante === userUid ? data.ayudante : data.solicitante;
          const typingKey = `typing_${otherUid}`;

          // Leer el campo de no leídos correspondiente al usuario actual.
          // Se guarda como noLeidos_<uid> para diferenciar por participante.
          const noLeidosKey = `noLeidos_${userUid}`;
          const noLeidos = data[noLeidosKey] || 0;
          const typing = !!data[typingKey];

          return {
            id: docSnap.id,
            nombre: userInfo.nombre,
            fotoPerfil: userInfo.fotoPerfil,
            online: userInfo.online,
            lastActive: userInfo.lastActive,
            typing,
            noLeidos,
            ...data,
          };
        }));
        setConversaciones(results);
        setLoading(false);
      });

      return unsub;
    } catch (error) {
      console.log('Error al obtener conversaciones:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = obtenerConversaciones();
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const filteredConversaciones = conversaciones.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.tituloProblema && c.tituloProblema.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18next.t("mensajes.titulo")}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={i18next.t("buscar")}
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <Text style={styles.infoText}>Cargando...</Text>
      ) : filteredConversaciones.length === 0 ? (
        <Text style={styles.infoText}>{i18next.t("mensajes.vacio")}</Text>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {filteredConversaciones.map((convo) => {
            const tieneNoLeidos = convo.noLeidos > 0;
            const previewText = convo.typing ? i18next.t('mensajes.typing') : (convo.ultimoMensaje || '');

            return (
              <TouchableOpacity
                key={convo.id}
                style={styles.chatRow}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MensajeScreen', { conversacionData: convo })}
              >
                {/* Avatar */}
                <Image
                  source={
                    convo.fotoPerfil
                      ? { uri: convo.fotoPerfil }
                      : require('../../../assets/images/Logo.png')
                  }
                  style={styles.avatar}
                />

                <View style={styles.chatInfoContainer}>
                  <View style={styles.chatHeaderRow}>
                    <View style={styles.chatNameRow}>
                      <Text style={[styles.chatName, tieneNoLeidos && styles.chatNameUnread]}>
                        {convo.nombre || 'Usuario'}
                      </Text>
                      {convo.online && <View style={styles.onlineDot} />}
                    </View>
                    <View style={styles.chatMetaRight}>
                      <Text style={[styles.chatTime, tieneNoLeidos && styles.chatTimeUnread]}>
                        {formatTime(convo.ultimaActividad)}
                      </Text>
                      {/* Badge de no leídos */}
                      {tieneNoLeidos && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>
                            {convo.noLeidos > 99 ? '99+' : convo.noLeidos}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Título del problema */}
                  <Text style={styles.chatTitle} numberOfLines={1}>
                    {convo.tituloProblema || i18next.t("mensajes.noEsp")}
                  </Text>

                  <Text
                    style={[
                      styles.chatMessage,
                      tieneNoLeidos && styles.chatMessageUnread,
                      convo.typing && styles.chatTypingMessage,
                    ]}
                    numberOfLines={1}
                  >
                    {previewText}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161920',
    borderRadius: 20,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  infoText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#161920',
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#2D3243',
    marginRight: 15,
  },
  chatInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ADE80',
    borderWidth: 1,
    borderColor: '#0B0D14',
  },
  chatName: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  chatNameUnread: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chatMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatTime: {
    color: '#5E6376',
    fontSize: 12,
  },
  chatTimeUnread: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  // Badge circular de no leídos
  unreadBadge: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chatTitle: {
    color: '#6A8DFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  chatMessage: {
    color: '#5E6376',
    fontSize: 14,
  },
  chatTypingMessage: {
    color: '#60A5FA',
    fontStyle: 'italic',
  },
  chatMessageUnread: {
    color: '#D1D5DB',
    fontWeight: '500',
  },
});