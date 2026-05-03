import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

export default function TicketScreen({ route }) {
  const navigation = useNavigation();
  const { ticketData } = route.params || {};

  const [creator, setCreator] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Estados para el Modal de Reporte
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [reportDetails, setReportDetails] = useState('');

  const reportReasons = [
    { id: 1, icon: '🔞', label: 'Contenido inapropiado o adulto' },
    { id: 2, icon: '💰', label: 'Solicita dinero o cobro por la ayuda' },
    { id: 3, icon: '😡', label: 'Lenguaje ofensivo o acoso' },
    { id: 4, icon: '🤖', label: 'Spam o contenido falso' },
    { id: 5, icon: '⚠️', label: 'Otro motivo' },
  ];

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
    const fetchUser = async () => {
      if (ticketData?.usuario) {
        try {
          const docRef = doc(db, 'users', ticketData.usuario);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCreator(docSnap.data());
          }
        } catch (error) {
          console.log("Error al obtener creador del ticket:", error);
        } finally {
          setLoadingUser(false);
        }
      } else {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [ticketData]);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 1: return { text: 'Alta', color: '#FF4D4D', bg: 'rgba(255, 77, 77, 0.1)' };
      case 2: return { text: 'Media', color: '#FFD166', bg: 'rgba(255, 209, 102, 0.1)' };
      case 3: return { text: 'Baja', color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.1)' };
      default: return { text: 'Normal', color: '#888', bg: '#222' };
    }
  };

  const priorityData = getPriorityStyle(ticketData?.prioridad);

  const enviarReporte = () => {
    if (!selectedReason) {
      Alert.alert("Atención", "Por favor selecciona un motivo de reporte.");
      return;
    }
    // Aquí puedes agregar la lógica para guardar el reporte en Firebase
    console.log("Reportando:", selectedReason, reportDetails);
    Alert.alert("Reporte enviado", "Hemos recibido tu reporte y lo revisaremos pronto.");
    setModalVisible(false);
    setSelectedReason(null);
    setReportDetails('');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButtonContainer} 
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonIcon}>
            <Ionicons name="arrow-back" size={20} color="#878FA9" />
          </View>
          <Text style={styles.backButtonText}>Regresar al feed</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionPillBlue}>
            <Ionicons name="globe-outline" size={14} color="#3B82F6" />
            <Text style={styles.actionPillTextBlue}>Traducir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPillRed} onPress={() => setModalVisible(true)}>
            <Ionicons name="flag" size={14} color="#FF4D4D" />
            <Text style={styles.actionPillTextRed}>Reportar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PREMURA / PRIORIDAD */}
        <View style={[styles.priorityBadge, { backgroundColor: priorityData.bg }]}>
          <Text style={[styles.priorityText, { color: priorityData.color }]}>
            Premura: {priorityData.text}
          </Text>
        </View>

        {/* TÍTULO */}
        <Text style={styles.title}>{ticketData?.titulo}</Text>

        {/* TARJETA DE USUARIO */}
        <View style={styles.userCard}>
          <Image 
            source={
              creator?.fotoUrl 
                ? { uri: creator.fotoUrl } 
                : require('../../../assets/images/Logo.png') 
            } 
            style={styles.userAvatar} 
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {loadingUser ? 'Cargando...' : (creator?.nombre || 'Usuario Desconocido')}
            </Text>
            <Text style={styles.userCareer}>
              {creator?.carrera || 'Estudiante'} {creator?.semestre ? `- ${creator.semestre}° Semestre` : ''}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD166" />
              <Text style={styles.ratingText}>
                {creator?.calificacion || '4.0'} como tutor
              </Text>
            </View>
          </View>
        </View>

        {/* DESCRIPCIÓN */}
        <Text style={styles.descriptionText}>
          {ticketData?.desc}
        </Text>

        {/* ETIQUETAS */}
        <View style={styles.tagsContainer}>
          {ticketData?.etiquetas?.map((tag, index) => (
            <View key={index} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* ESPACIO PARA EL BOTÓN  DE APOYO */}
        <View style={{ height: 40 }} />

        {/* BOTÓN  DE APOYO */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          style={styles.supportButton}
          onPress={() => navigation.navigate('Mensajes', { contactId: ticketData?.usuario })}
        >
          <Text style={styles.supportButtonText}>¡Yo te apoyo!</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>


      {/* ================= MODAL DE REPORTE ================= */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Indicador de arrastre (visual) */}
            <View style={styles.dragIndicator} />

            <View style={styles.modalHeader}>
              <Ionicons name="flag" size={32} color="#FF4D4D" style={{marginBottom: 10}}/>
              <Text style={styles.modalTitle}>Reportar ticket</Text>
              <Text style={styles.modalSubtitle}>
                ¿Por qué consideras que este ticket no es apropiado?
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{width: '100%'}}>
              {reportReasons.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.reasonItem,
                    selectedReason === item.id && styles.reasonItemSelected
                  ]}
                  onPress={() => setSelectedReason(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reasonIcon}>{item.icon}</Text>
                  <Text style={styles.reasonLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              <TextInput
                style={styles.reportInput}
                placeholder="Describe lo que ocurrió..."
                placeholderTextColor="#7E8494"
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                value={reportDetails}
                onChangeText={setReportDetails}
              />
            </ScrollView>

            <TouchableOpacity style={styles.submitReportBtn} onPress={enviarReporte}>
              <Text style={styles.submitReportBtnText}>Enviar reporte</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelReportBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelReportBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B', // Mismo fondo oscuro de CreateScreen
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2D3243',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#8A8F9E',
    fontSize: 14,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPillBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  actionPillTextBlue: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  actionPillRed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  actionPillTextRed: {
    color: '#FF4D4D',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    lineHeight: 34,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#15171E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#2D3243', // Color de fondo por si no carga la imagen
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userCareer: {
    color: '#8A8F9E',
    fontSize: 12,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#8A8F9E',
    fontSize: 12,
  },
  descriptionText: {
    color: '#A0A4B8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagPill: {
    backgroundColor: '#15171E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D3243',
  },
  tagText: {
    color: '#8A8F9E',
    fontSize: 13,
    fontWeight: '500',
  },
  bottomButtonContainer: {
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: '#09090B', // Mismo fondo para tapar el scroll
    borderTopWidth: 1,
    borderTopColor: '#15171E',
    marginBottom: 50,
  },
  supportButton: {
    backgroundColor: '#2563EB',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // ESTILOS DEL MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#15171E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#2D3243',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#8A8F9E',
    fontSize: 14,
    textAlign: 'center',
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F2B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2D3243',
  },
  reasonItemSelected: {
    borderColor: '#FF4D4D',
    backgroundColor: 'rgba(255, 77, 77, 0.05)',
  },
  reasonIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  reasonLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  reportInput: {
    backgroundColor: '#1C1F2B',
    color: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D3243',
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    minHeight: 100,
    fontSize: 14,
  },
  submitReportBtn: {
    backgroundColor: '#FF4D4D', // Rojo rosado de la imagen
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitReportBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelReportBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3243',
  },
  cancelReportBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});