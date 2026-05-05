import React, { useEffect, useState} from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import { collection, query, where, getDocs, orderBy, or, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function MensajesScreen() {
  const navigation = useNavigation();
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Formateador de tiempo para mostrar "hace X minutos", "ayer", o la fecha si es más antiguo
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffDias = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0 && now.getDate() === date.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDias === 1 || (diffDias === 0 && now.getDate() !== date.getDate())) {
      return 'Ayer';
    } else if (diffDias < 7) {
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return dias[date.getDay()];
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  const getUserData = async (solicitante, ayudante) => {
    const currentUid = auth.currentUser?.uid;
    const otherUid = solicitante === currentUid ? ayudante : solicitante;
    if (!otherUid) return { nombre: '', fotoUrl: null };

    try {
      const userRef = doc(db, 'users', otherUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        return { nombre: data.nombre || '', fotoUrl: data.fotoUrl || null };
      }
    } catch (error) {
      console.log('Error al obtener info del usuario:', error);
    }
    return { nombre: '', fotoUrl: null };
  };

  const obtenerConversaciones = async () => {
    if (!auth.currentUser) return;
    const userUid = auth.currentUser.uid;

    try {
      const convRef = collection(db, 'conversaciones');
      const q = query(
        convRef,
        or(
          where('solicitante', '==', userUid),
          where('ayudante', '==', userUid)
        ),
        orderBy('ultimaActividad', 'desc') // Mostrar los mas recientes arriba
      );

      const unsub = onSnapshot(q, async (querySnapshot) => {
        const results = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const userInfo = await getUserData(data.solicitante, data.ayudante);
          return {
            id: docSnap.id,
            nombre: userInfo.nombre,
            fotoUrl: userInfo.fotoUrl,
            ...data,
          };
        }));
        setConversaciones(results);
        setLoading(false);
      });

    } catch (error) {
      console.log('Error al obtener conversaciones:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerConversaciones();
  }, []);

  const filteredConversaciones = conversaciones.filter(c => 
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.tituloProblema && c.tituloProblema.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Inicio', { screen: 'Notifications' })}>
          <Ionicons name="notifications" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <Text style={styles.infoText}>Cargando...</Text>
      ) : filteredConversaciones.length === 0 ? (
        <Text style={styles.infoText}>No tienes conversaciones activas.</Text>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {filteredConversaciones.map((convo) => (
            <TouchableOpacity 
              key={convo.id}
              style={styles.chatRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('MensajeScreen', { conversacionData: convo })}
            >
              <Image 
                source={convo.fotoUrl ? { uri: convo.fotoUrl } : require('../../../assets/images/Logo.png')} 
                style={styles.avatar} 
              />
              
              <View style={styles.chatInfoContainer}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.chatName}>{convo.nombre || "Usuario"}</Text>
                  <Text style={styles.chatTime}>{formatTime(convo.ultimaActividad)}</Text>
                </View>
                
                {/* Título del problema - Truncado con numberOfLines=1 */}
                <Text style={styles.chatTitle} numberOfLines={1}>
                  {convo.tituloProblema || "Problema no especificado"}
                </Text>
                
                {/* Último mensaje - Truncado con numberOfLines=1 */}
                <Text style={styles.chatMessage} numberOfLines={1}>
                  {convo.ultimoMensaje || ""}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
    borderBottomColor: '#161920', // Lnea sutil separadora
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
  chatName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chatTime: {
    color: '#5E6376',
    fontSize: 12,
  },
  chatTitle: {
    color: '#6A8DFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  chatMessage: {
    color: '#8A8F9E',
    fontSize: 14,
  },
});