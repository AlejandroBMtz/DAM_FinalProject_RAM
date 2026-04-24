import React, { useState } from 'react';
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

// Datos de prueba, despues hay que conectarlo con Firebase
const MOCK_TICKETS = [
  {
    id: '1',
    priority: 'Alta',
    time: 'Hace 10 min',
    title: 'Script de Python no itera bien',
    description: 'Un bucle for me está arrojando IndexError y no encuentro la fuga',
    tags: ['Python']
  },
  {
    id: '2',
    priority: 'Alta',
    time: 'Hace 1 horas',
    title: 'Error en árbol AVL, no sé cómo rotar los nodos',
    description: 'Tengo el examen en 2 horas y el nodo se rompe al insertar el 4to elemento. ¡Por favor ayuda!',
    tags: ['Estructura de Datos', 'Java']
  },
  {
    id: '3',
    priority: 'Media',
    time: 'Hace 1 hora',
    title: 'Problema con dependencias en React Native',
    description: 'No me compila el proyecto, me sale un error de Gradle que no entiendo. Estoy en la biblioteca.',
    tags: ['React Native', 'Desarrollo Móvil']
  },
  {
    id: '4',
    priority: 'Baja',
    time: 'Hace 2 horas',
    title: 'Proyecto de diseño UI — necesito feedback',
    description: 'Busco a alguien que me revise los wireframes de mi proyecto final. Tiene que verse profesional.',
    tags: ['Diseño']
  }
];

const AVAILABLE_TAGS = ['Todas', 'Python', 'Programación', 'Matemáticas', 'Estructura de Datos', 'React Native'];

export default function FeedScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Todas');

  // Logica de filtrado
  const filteredTickets = MOCK_TICKETS.filter((ticket) => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = 
      selectedTag === 'Todas' || ticket.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Alta': return '#FF4C4C'; // Rojo
      case 'Media': return '#FFA500'; // Naranja
      case 'Baja': return '#00FF7F'; // Verde
      default: return '#888';
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
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority}
          </Text>
        </View>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
      
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.tagsContainer}>
        {item.tags.map((tag, index) => (
          <View key={index} style={styles.cardTag}>
            <Text style={styles.cardTagText}>{tag}</Text>
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
          <Text style={styles.emptyText}>No se encontraron tickets con esos filtros.</Text>
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
  }
});