import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { collection, query, where, getDocs, orderBy, or, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function mensajes() {
  const navigation = useNavigation();
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const tiempoPasado = (tiempo) => {
    const actual = new Date().getTime();
    const pasado = new Date(tiempo).getTime();
    const difSegundos = Math.floor((actual - pasado) / 1000);

    if (difSegundos < 60) return `Hace ${difSegundos} segundos`;

    const difMinutos = Math.floor(difSegundos / 60);

    if (difMinutos < 60) return `Hace ${difMinutos} minutos`;

    const difHoras = Math.floor(difMinutos / 60);

    if (difHoras < 24) return `Hace ${difHoras} horas`;

    const difDias = Math.floor(difHoras / 24);

    return `Hace ${difDias} días`;
  }

  const getNombre = async (solicitante, ayudante) => {
    const currentUid = auth.currentUser?.uid;
    const otherUid = solicitante === currentUid ? ayudante : solicitante;
    if (!otherUid) return '';

    try {
      const userRef = doc(db, 'users', otherUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        return data.nombre || '';
      }
    } catch (error) {
      console.log('Error al obtener nombre del usuario:', error);
    }

    return '';
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
        orderBy('ultimaActividad')
      );
      const querySnapshot = await getDocs(q);

      const unsub = onSnapshot(q, async (querySnapshot) => {
        const results = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const nombre = await getNombre(data.solicitante, data.ayudante);
          return {
          id: docSnap.id,
          nombre,
          ...data,
          };
        }));
        setConversaciones(results);
        console.log(results);
      });

    } catch (error) {
      console.log('Error al obtener solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      obtenerConversaciones();
    }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Inicio', { screen: 'Notifications' })}>
          <Ionicons name="notifications" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.infoText}>Cargando...</Text>
      ) : conversaciones.length === 0 ? (
        <Text style={styles.infoText}>No hay conversaciones registrados.</Text>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {conversaciones.map((convo) => (
            <TouchableOpacity 
                  key={convo.id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('MensajeScreen', { conversacionData: convo })}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{convo.nombre || ""}</Text>
                    <Text style={styles.timeText}>{tiempoPasado(convo.ultimaActividad)}</Text>
                  </View>
                  <Text style={styles.cardDescription}>{convo.ultimoMensaje}</Text>
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
    backgroundColor: '#0B0D14',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  text: {
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 15,
    width: '100%',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  card: {
    backgroundColor: '#161920',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.9,
    borderColor: '#1F2229',
  },
  scrollView: {
    width: '100%',
  },
  listContainer: {
    width: '90%',
    paddingBottom: 30,
    alignSelf: "center"
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeText: {
    color: '#666',
    fontSize: 12,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardDescription: {
    color: '#AAA',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});