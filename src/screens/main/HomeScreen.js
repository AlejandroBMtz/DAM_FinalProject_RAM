import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';


const AVAILABLE_TAGS = ['Todas', 'Python', 'Programación', 'Matemáticas', 'Estructura de Datos', 'React Native'];

export default function FeedScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Todas');
  const [tickets, setTickets] = useState([]);
  const [userTags, setUserTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserTags = async () => {
    if (!auth.currentUser) {
      return [];
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return Array.isArray(data.habilidades) ? data.habilidades : [];
      }
    } catch (error) {
      console.log('Error al obtener las habilidades del usuario:', error);
    }

    return [];
  };

  const obtenerSolicitudes = async () => {
    try {
      const solRef = collection(db, 'solicitudes');
      const q = query(solRef, where('usuario', '!=', auth.currentUser.uid), orderBy("prioridad"), orderBy("fechaCreacion"));
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const tags = await fetchUserTags();
      setUserTags(tags);
      await obtenerSolicitudes();
    };

    load();
  }, []);

  const getMatchCount = (ticket) => {
    if (!Array.isArray(ticket.etiquetas) || ticket.etiquetas.length === 0) {
      return 0;
    }
    return ticket.etiquetas.filter((tag) => userTags.includes(tag)).length;
  };

  const ticketRelevanceComparator = (a, b) => {
    if (a.prioridad !== b.prioridad) {
      return a.prioridad - b.prioridad;
    }

    const matchA = getMatchCount(a);
    const matchB = getMatchCount(b);
    if (matchA !== matchB) {
      return matchB - matchA;
    }

    const dateA = new Date(a.fechaCreacion).getTime();
    const dateB = new Date(b.fechaCreacion).getTime();
    return dateB - dateA;
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

  // Logica de filtrado
  const filteredTickets = tickets
    .filter((ticket) => {
      if (!ticket || !ticket.titulo || !ticket.desc) {
        return false;
      }

      const matchesSearch =
        ticket.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.desc.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        selectedTag === 'Todas' ||
        (Array.isArray(ticket.etiquetas) && ticket.etiquetas.includes(selectedTag));

      return matchesSearch && matchesTag;
    })
    .sort(ticketRelevanceComparator);

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

  const renderTicket = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('TicketScreen', { ticketData: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.priorityBadge}>
          <Text style={[styles.priorityText, { color: getPriorityColor(item.prioridad) }]}>
            {getPriorityText(item.prioridad)}
          </Text>
        </View>
        <Text style={styles.timeText}>{tiempoPasado(item.fechaCreacion)}</Text>
      </View>
      
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>{item.desc}</Text>
      
      <View style={styles.tagsContainer}>
        {item.etiquetas.map((tag, index) => (
          <View key={index} style={styles.cardTag}>
            <Text style={[
              styles.cardTagText,
              (userTags.includes(tag)) ? styles.tagTextSelected : styles.tagTextUnselected
              ]}>{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filtrar búsqueda"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Horizontal Tags Scroll */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {AVAILABLE_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.filterTag, isSelected && styles.filterTagSelected]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text style={[styles.filterTagText, isSelected && styles.filterTagTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tickets List */}
      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        renderItem={renderTicket}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? 'Cargando...' : 'No se encontraron tickets con esos filtros.'}
          </Text>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 15,
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
    borderRadius: 12,
    borderColor: '#1F2229',
    borderWidth: 1.9,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 15,
    paddingLeft: 20,
  },
  filterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 10,
  },
  filterTagSelected: {
    borderColor: '#7B61FF', // Acento morado
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
  },
  filterTagText: {
    color: '#888',
    fontSize: 14,
  },
  filterTagTextSelected: {
    color: '#7B61FF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  tagTextUnselected: {
    color: '#7E8494', 
  },
  tagTextSelected: {
    color: '#8B85FF', 
  },
});