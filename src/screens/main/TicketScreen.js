import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { evaluateBadges } from '../../utils/badges';
import i18next from '../../services/staticTL';

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
    { id: 1, icon: '🔞', label: i18next.t("reporte.contenido") },
    { id: 2, icon: '💰', label: i18next.t("reporte.solicita") },
    { id: 3, icon: '😡', label: i18next.t("reporte.lenguaje") },
    { id: 4, icon: '🤖', label: i18next.t("reporte.spam") },
    { id: 5, icon: '⚠️', label: i18next.t("reporte.otro") },
  ];


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
      case 1: return { text: i18next.t("prioridad.alta"), color: '#FF4D4D', bg: 'rgba(255, 77, 77, 0.1)' };
      case 2: return { text: i18next.t("prioridad.media"), color: '#FFD166', bg: 'rgba(255, 209, 102, 0.1)' };
      case 3: return { text: i18next.t("prioridad.baja"), color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.1)' };
      default: return { text: i18next.t('prioridad.normal'), color: '#888', bg: '#222' };
    }
  };

  const priorityData = getPriorityStyle(ticketData?.prioridad);

  const enviarReporte = () => {
    if (!selectedReason) {
      Alert.alert(i18next.t("error.atencion"), i18next.t("error.reporte"));
      return;
    }
    // Aqui puedes agregar la lógica para guardar el reporte en Firebase
    console.log(i18next.t("error.reportando"), selectedReason, reportDetails);
    Alert.alert(i18next.t("error.envio"), i18next.t("error.recibido"));
    setModalVisible(false);
    setSelectedReason(null);
    setReportDetails('');
  };

  const crearConversacion = async () => {
    try {
      // conversacion 
      const convoRef = await addDoc(collection(db, "conversaciones"), {
        solicitudId: ticketData.id,        // <-- Vinculado al problema
        tituloProblema: ticketData.titulo, // <-- Guardamos el titulo para mostrarlo
        solicitante: ticketData.usuario,
        ayudante: auth.currentUser.uid,
        ultimoMensaje: "¡Hola, yo te apoyo!",
        ultimaActividad: new Date().toISOString(),
        estado: 'activa' // <-- este es el nuevo campo para controlar el estado de la conversacion
      });

      // estado del ticket
      const ticketRef = doc(db, 'solicitudes', ticketData.id);
      await updateDoc(ticketRef, { estado: 'en proceso', ayudante: auth.currentUser.uid });

      await addDoc(collection(db, "mensajes"), {
        idConversacion: convoRef.id,
        idUsuario: auth.currentUser.uid,
        texto: "¡Hola, yo te apoyo!",
        tiempoEnviado: new Date().toISOString()
      });

      if (ticketData.usuario) {
        await addDoc(collection(db, 'notificaciones'), {
          usuarioId: ticketData.usuario,
          tipo: 'mensaje',
          titulo: "¡Alguien quiere ayudarte! 🚀",
          descripcion: `Han aceptado tu ticket: "${ticketData.titulo}".`,
          leida: false,
          fecha: new Date().toISOString()
        });
      }

      if (creator && creator.pushToken) {
        const pushMessage = {
          to: creator.pushToken,
          sound: 'default',
          title: "¡Alguien quiere ayudarte! ",
          body: `Han aceptado tu ticket: "${ticketData.titulo}". Toca para ir al chat.`,
          data: { conversacionId: convoRef.id },
        };

        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pushMessage),
        });
      }
      console.log("Conversación e inicio automático exitosos");

      // Construimos la data para la siguiente pantalla
      const convoData = {
        id: convoRef.id,
        solicitudId: ticketData.id,
        tituloProblema: ticketData.titulo,
        nombre: creator?.nombre || 'Usuario', // Nombre de quien recibe la ayuda
        estado: 'activa',
      };

      await evaluateBadges(); // ← evalúa fast_reply u otras al aceptar un ticket

      navigation.navigate('Mensajes', {
        screen: 'MensajeScreen',
        params: { conversacionData: convoData }
      });

    } catch (error) {
      console.log("Error en Firebase:", error);
      Alert.alert(i18next.t('error.genericHeader'), error.message || String(error));
    }
  }

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
          <Text style={styles.backButtonText}>{i18next.t("back")}</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionPillBlue}>
            <Ionicons name="globe-outline" size={14} color="#3B82F6" />
            <Text style={styles.actionPillTextBlue}>{i18next.t("traducir")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPillRed} onPress={() => setModalVisible(true)}>
            <Ionicons name="flag" size={14} color="#FF4D4D" />
            <Text style={styles.actionPillTextRed}>{i18next.t("reportar")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PREMURA / PRIORIDAD */}
        <View style={[styles.priorityBadge, { backgroundColor: priorityData.bg }]}>
          <Text style={[styles.priorityText, { color: priorityData.color }]}>
            {priorityData.text}
          </Text>
        </View>

        {/* TÍTULO */}
        <Text style={styles.title}>{ticketData?.titulo}</Text>

        {/* TARJETA DE USUARIO */}
        <View style={styles.userCard}>
          <Image source={
            creator?.fotoPerfil ? { uri: creator.fotoPerfil } : require('../../../assets/images/Logo.png')
          }
          style={styles.userAvatar} />

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {loadingUser ? i18next.t("loading") : (creator?.nombre || i18next.t("desconocido"))}
            </Text>

            <Text style={styles.userCareer}>
              {creator?.carrera || i18next.t('profile.student')} 
              {creator?.semestre ? ` - ${creator.semestre}° ${i18next.t("profile.semestre")}` : ''}
            </Text>

            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD166" />
              <Text style={styles.ratingText}>
                {creator?.calificacion || '4.0'} {i18next.t("tutor")}
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
            onPress={crearConversacion}
          >
            <Text style={styles.supportButtonText}>{i18next.t("tickets.apoyo")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>


      {/*MODAL DE REPORTE*/}
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
              <Ionicons name="flag" size={32} color="#FF4D4D" style={{ marginBottom: 10 }} />
              <Text style={styles.modalTitle}>{i18next.t("reportar")}</Text>
              <Text style={styles.modalSubtitle}>
                {i18next.t("tickets.reporte")}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
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
                placeholder={i18next.t("tickets.reporteDesc")}
                placeholderTextColor="#7E8494"
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                value={reportDetails}
                onChangeText={setReportDetails}
              />
            </ScrollView>

            <TouchableOpacity style={styles.submitReportBtn} onPress={enviarReporte}>
              <Text style={styles.submitReportBtnText}>{i18next.t("enviarReporte")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelReportBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelReportBtnText}>{i18next.t("cancelar")}</Text>
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
    backgroundColor: '#09090B',
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
    backgroundColor: '#2D3243',
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
    backgroundColor: '#09090B',
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
    backgroundColor: '#FF4D4D',
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