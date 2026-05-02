import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';


export default function tickets() {
  const navigation = useNavigation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const obtenerSolicitudes = async () => {
    try {
      const solRef = collection(db, 'solicitudes');
      const q = query(solRef, where('usuario', '==', auth.currentUser.uid), orderBy("prioridad"), orderBy("fechaCreacion"));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTickets(results);
    } catch (error) {
      console.log('Error al obtener solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: 
        return '#FF4C4C'; // Rojo
      case 2:
        return '#FFA500'; // Naranja
      case 3:
        return '#00FF7F'; // Verde
      default: return '#888';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 1: 
        return "Alta";
      case 2:
        return "Media";
      case 3:
        return "Baja";
      default: return '';
    }
  };

  useEffect(() => {
    obtenerSolicitudes();
  }, []);

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Tickets</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Inicio', { screen: 'Notifications' })}>
          <Ionicons name="notifications" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.infoText}>Cargando...</Text>
      ) : tickets.length === 0 ? (
        <Text style={styles.infoText}>No hay tickets registrados.</Text>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {tickets.map((ticket) => (
            <TouchableOpacity 
                  key={ticket.id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Inicio', { screen: 'TicketScreen', params: { ticketData: ticket } })}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.priorityBadge}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(ticket.prioridad) }]}>
                        {getPriorityText(ticket.prioridad)}
                      </Text>
                    </View>
                    <Text style={styles.timeText}>{tiempoPasado(ticket.fechaCreacion)}</Text>
                  </View>
                  
                  <Text style={styles.cardTitle}>{ticket.titulo}</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>{ticket.desc}</Text>
                  
                  <View style={styles.tagsContainer}>
                    {ticket.etiquetas.map((tag, index) => (
                      <View key={index} style={styles.cardTag}>
                        <Text style={styles.cardTagText}>{tag}</Text>
                      </View>
                    ))}
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
    backgroundColor: '#0B0D14',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  text: {
    color: '#fff',
  },
  scrollView: {
    width: '100%',
  },
  listContainer: {
    width: '90%',
    paddingBottom: 30,
    alignSelf: "center"
  },
  card: {
    backgroundColor: '#161920',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.9,
    borderColor: '#1F2229',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priorityBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardTag: {
    backgroundColor: '#222',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  cardTagText: {
    color: '#888',
    fontSize: 12,
  },
  infoText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});