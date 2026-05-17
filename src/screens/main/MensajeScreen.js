import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, StatusBar, ScrollView, ImageBackground, Image, Keyboard, Animated, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { collection, query, where, orderBy, doc, addDoc, setDoc, onSnapshot, getDocs, deleteDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { evaluateBadges } from '../../utils/badges';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../../services/cloudinary';
import i18next from '../../services/staticTL';

const FEEDBACK = [
  "Paciente", "Claro", "Rápido", "Conoce el tema", "Amable"
];

// Hook: mide la altura real del teclado
function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e) => setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);

    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  return keyboardHeight;
}

export default function MensajeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef(null);

  const [message, setMessage] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const keyboardHeight = useKeyboardHeight();

  // Estados de Modales
  const [modalVisible, setModalVisible] = useState(false); // Modal de Calificación
  const [cancelModalVisible, setCancelModalVisible] = useState(false); // Modal Cancelar/Abandonar
  const [terminarModalVisible, setTerminarModalVisible] = useState(false); // Modal Terminar
  const [imagenVisor, setImagenVisor] = useState(null);

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const conversacionData = route.params?.conversacionData;
  const title = route.params?.nombre || conversacionData?.nombre || 'Usuario';
  const fotoUrl = conversacionData?.fotoPerfil || conversacionData?.fotoUrl;
  const esAyudante = conversacionData?.ayudante === auth.currentUser?.uid;

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((item) => item !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const marcarComoLeido = useCallback(async () => {
    const convoUid = conversacionData?.id;
    const currentUid = auth.currentUser?.uid;
    if (!convoUid || !currentUid) return;
    try {
      const noLeidosKey = `noLeidos_${currentUid}`;
      await updateDoc(doc(db, 'conversaciones', convoUid), { [noLeidosKey]: 0 });
    } catch (error) {
      console.log('Error al marcar como leído:', error);
    }
  }, [conversacionData?.id]);

  useFocusEffect(
    useCallback(() => {
      marcarComoLeido();
    }, [marcarComoLeido])
  );

  const performTermination = async () => {
    const convoUid = conversacionData?.id;
    const solicitudId = conversacionData?.solicitudId;
    if (!convoUid || !solicitudId) return;

    try {
      const ayudante = conversacionData?.ayudante;
      const currentUid = auth.currentUser.uid;
      
      await addDoc(collection(db, 'valoraciones'), {
        solicitudId,
        de: currentUid,
        para: ayudante,
        estrellas: rating,
        comentario: feedback,
        etiquetas: selectedTags,
        fecha: new Date().toISOString()
      });

      const userSnap = await getDoc(doc(db, 'users', ayudante));
      const userData = userSnap.data();
      const oldRating = userData.rated || 0;
      const oldHelpGiven = userData.helpGiven || 0;
      const newRating = ((oldRating * oldHelpGiven) + rating) / (oldHelpGiven + 1);
      
      await updateDoc(doc(db, 'users', ayudante), {
        rated: newRating,
        helpGiven: oldHelpGiven + 1
      });
      await updateDoc(doc(db, 'conversaciones', convoUid), {
        estado: 'completada',
        fechaActualizacion: new Date().toISOString()
      });
      await updateDoc(doc(db, 'solicitudes', solicitudId), {
        estado: 'resuelto',
        fechaActualizacion: new Date().toISOString()
      });

      navigation.navigate('Tickets');
    } catch (error) {
      Alert.alert('Error', 'No se pudo finalizar correctamente.');
    }
  };

  const handleSend = async () => {
    const convoUid = conversacionData?.id;
    if (message.trim() === '') return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'mensajes'), {
        idConversacion: convoUid,
        idUsuario: auth.currentUser.uid,
        texto: message,
        tiempoEnviado: new Date().toISOString(),
      });
      const currentUid = auth.currentUser.uid;
      const otherUid = conversacionData.solicitante === currentUid ? conversacionData.ayudante : conversacionData.solicitante;
      const noLeidosKey = `noLeidos_${otherUid}`;
      await updateDoc(doc(db, 'conversaciones', convoUid), {
        ultimoMensaje: message,
        ultimaActividad: new Date().toISOString(),
        [noLeidosKey]: increment(1),
      });
    } catch (error) {
      console.log('Error en Firebase:', error);
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (result.canceled) return;
      
      setLoading(true);
      const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
      const convoUid = conversacionData?.id;
      const currentUid = auth.currentUser.uid;
      const otherUid = conversacionData.solicitante === currentUid ? conversacionData.ayudante : conversacionData.solicitante;
      
      await addDoc(collection(db, 'mensajes'), {
        idConversacion: convoUid,
        idUsuario: currentUid,
        tipo: 'imagen',
        imageUrl,
        tiempoEnviado: new Date().toISOString()
      });
      await updateDoc(doc(db, 'conversaciones', convoUid), {
        ultimoMensaje: '📷 Foto',
        ultimaActividad: new Date().toISOString(),
        [`noLeidos_${otherUid}`]: increment(1)
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la imagen.');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de Cancelación (Ayudante)
  const abrirModalCancelar = () => setCancelModalVisible(true);
  
  const abandonarAyuda = async () => {
    await updateDoc(doc(db, 'conversaciones', conversacionData.id), { estado: 'cancelada' });
    await updateDoc(doc(db, 'solicitudes', conversacionData.solicitudId), { estado: 'disponible', ayudante: null });
    setCancelModalVisible(false);
    navigation.goBack();
  };
  
  const finalizarComoCancelado = async () => {
    await updateDoc(doc(db, 'conversaciones', conversacionData.id), { estado: 'cancelada' });
    await updateDoc(doc(db, 'solicitudes', conversacionData.solicitudId), { estado: 'cancelado' });
    setCancelModalVisible(false);
    navigation.goBack();
  };

  // Funciones de Terminación (Solicitante)
  const abrirModalTerminar = () => setTerminarModalVisible(true);
  
  const confirmarTerminacion = () => {
    setTerminarModalVisible(false);
    setRating(0);
    setFeedback('');
    setSelectedTags([]);
    setModalVisible(true);
  };

  useEffect(() => {
    const convoUid = conversacionData?.id;
    if (!convoUid) return;
    const q = query(collection(db, 'mensajes'), where('idConversacion', '==', convoUid), orderBy('tiempoEnviado'));
    const unsub = onSnapshot(q, (snapshot) => {
      setMensajes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (mensajes.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [mensajes, keyboardHeight]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D14" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('MensajesMain')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Image 
          source={fotoUrl ? { uri: fotoUrl } : require('../../../assets/images/Logo.png')} 
          style={styles.avatar} 
        />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>
        <TouchableOpacity 
          style={styles.terminarBtn} 
          onPress={esAyudante ? abrirModalCancelar : abrirModalTerminar}
        >
          <Text style={styles.terminarText}>{esAyudante ? i18next.t("cancelar") : i18next.t("terminar")}</Text>
        </TouchableOpacity>
      </View>

      <ImageBackground 
        source={require('../../../assets/images/FondoChat.png')} 
        style={styles.background} 
        resizeMode="cover"
      >
        <ScrollView 
          ref={scrollViewRef} 
          style={styles.scrollView} 
          contentContainerStyle={styles.listContainer} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          {mensajes.map((msg) => (
            <View 
              key={msg.id} 
              style={[
                styles.cuerpoMensaje, 
                msg.idUsuario === auth.currentUser.uid ? styles.cuerpoEnviado : styles.cuerpoRecibido
              ]}
            >
              {msg.tipo === 'imagen' ? (
                <TouchableOpacity onPress={() => setImagenVisor(msg.imageUrl)} activeOpacity={0.9}>
                  <Image source={{ uri: msg.imageUrl }} style={styles.imagenMensaje} resizeMode="cover" />
                </TouchableOpacity>
              ) : (
                <Text style={styles.textoMensaje}>{msg.texto}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </ImageBackground>

      {/* INPUT BAR */}
      <View style={[styles.inputRow, { marginBottom: keyboardHeight }]}>
        <View style={styles.inputLeftIcons}>
          <Ionicons name="mail-outline" size={22} color="#8A8F9E" />
          <View style={styles.verticalDivider} />
        </View>
        <TextInput 
          style={styles.textInput} 
          value={message} 
          onChangeText={setMessage} 
          placeholder={i18next.t("mensajes.place")}
          placeholderTextColor="#8A8F9E" 
          multiline 
        />
        <TouchableOpacity style={styles.attachButton} onPress={handlePickImage}>
          <Ionicons name="attach-outline" size={26} color="#8A8F9E" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.8}>
          <Ionicons name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* MODAL: CANCELAR (Ayudante) */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentCenter}>
            <Ionicons 
              name="warning" 
              size={40} 
              color="#FFD166" 
              style={{ alignSelf: 'center', marginBottom: 15 }} 
            />
            <Text style={styles.modalTitleCenter}>{i18next.t("mensajes.proceder")}</Text>
            <Text style={styles.modalSubtitleCenter}>{i18next.t("mensajes.elegir")}</Text>
            
            <TouchableOpacity style={styles.btnActionSecondary} onPress={abandonarAyuda}>
              <Text style={styles.btnActionSecondaryText}>{i18next.t("mensajes.abandonar")}</Text>
              <Text style={styles.btnActionSubText}>{i18next.t("mensajes.libera")}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnActionDestructive} onPress={finalizarComoCancelado}>
              <Text style={styles.btnActionDestructiveText}>{i18next.t("mensajes.finalizar")}</Text>
              <Text style={styles.btnActionSubTextDestructive}>{i18next.t("mensajes.cierra")}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnActionCancel} onPress={() => setCancelModalVisible(false)}>
              <Text style={styles.btnActionCancelText}>{i18next.t("mensajes.volver")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: TERMINAR (Solicitante) */}
      <Modal visible={terminarModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentCenter}>
            <Ionicons 
              name="checkmark-circle" 
              size={48} 
              color="#4ADE80" 
              style={{ alignSelf: 'center', marginBottom: 15 }} 
            />
            <Text style={styles.modalTitleCenter}>{i18next.t("mensajes.resuelto")}</Text>
            <Text style={styles.modalSubtitleCenter}>{i18next.t("mensajes.cerrar")}</Text>
            
            <TouchableOpacity style={styles.btnActionPrimary} onPress={confirmarTerminacion}>
              <Text style={styles.btnActionPrimaryText}>{i18next.t("mensajes.siTerminar")}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnActionCancel} onPress={() => setTerminarModalVisible(false)}>
              <Text style={styles.btnActionCancelText}>{i18next.t("mensajes.seguir")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: CALIFICACIÓN */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{i18next.t("mensajes.califica")}</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Ionicons name={rating >= s ? 'star' : 'star-outline'} size={40} color="#FFD700" />
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.tagsContainer}>
              {FEEDBACK.map((t, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.tag, selectedTags.includes(t) ? styles.tagSelected : styles.tagUnselected]} 
                  onPress={() => toggleTag(t)}
                >
                  <Text style={[styles.tagText, selectedTags.includes(t) ? styles.tagTextSelected : styles.tagTextUnselected]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput 
              style={styles.feedbackInput} 
              placeholder="Feedback..." 
              placeholderTextColor="#8A8F9E" 
              value={feedback} 
              onChangeText={setFeedback} 
              multiline 
            />
            
            <TouchableOpacity style={styles.submitButton} onPress={performTermination}>
              <Text style={styles.submitText}>{i18next.t("mensajes.enviar")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VISOR IMAGEN */}
      <Modal visible={!!imagenVisor} transparent animationType="fade">
        <TouchableOpacity style={styles.visorOverlay} activeOpacity={1} onPress={() => setImagenVisor(null)}>
          <Image source={{ uri: imagenVisor }} style={styles.visorImagen} resizeMode="contain" />
          <TouchableOpacity style={styles.visorCerrar} onPress={() => setImagenVisor(null)}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#161920',
    backgroundColor: '#0B0D14',
  },
  backButton: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D3243',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  terminarBtn: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  terminarText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: 'bold',
  },
  background: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 8,
  },
  cuerpoMensaje: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  cuerpoEnviado: {
    backgroundColor: '#2563EB',
    alignSelf: 'flex-end',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  cuerpoRecibido: {
    backgroundColor: '#1C1F2B',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2D3243',
  },
  textoMensaje: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#161920',
    borderTopWidth: 1,
    borderTopColor: '#1F2229',
  },
  inputLeftIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2D3243',
    marginHorizontal: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    color: '#FFF',
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  imagenMensaje: {
    width: 220,
    height: 180,
    borderRadius: 12,
  },

  // Modales
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#161920',
    padding: 20,
    borderRadius: 12,
    width: '90%',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 20,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagUnselected: {
    backgroundColor: '#1C1F2B',
    borderColor: '#2D3243',
  },
  tagSelected: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderColor: '#6C63FF',
  },
  tagText: {
    fontSize: 13,
  },
  tagTextUnselected: {
    color: '#8A8F9E',
  },
  tagTextSelected: {
    color: '#8B85FF',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#2D3243',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    minHeight: 80,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  // Modales centrados (Terminar/Cancelar)
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContentCenter: {
    backgroundColor: '#161920',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D3243',
  },
  modalTitleCenter: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitleCenter: {
    color: '#8A8F9E',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
  },
  btnActionPrimary: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  btnActionPrimaryText: {
    color: '#60A5FA',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnActionSecondary: {
    backgroundColor: '#1C1F2B',
    borderWidth: 1,
    borderColor: '#2D3243',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  btnActionSecondaryText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnActionSubText: {
    color: '#8A8F9E',
    fontSize: 11,
  },
  btnActionDestructive: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  btnActionDestructiveText: {
    color: '#FF4D4D',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnActionSubTextDestructive: {
    color: 'rgba(255, 77, 77, 0.7)',
    fontSize: 11,
  },
  btnActionCancel: {
    padding: 12,
    alignItems: 'center',
  },
  btnActionCancelText: {
    color: '#8A8F9E',
    fontWeight: '600',
  },

  visorOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  visorImagen: {
    width: '100%',
    height: '80%',
  },
  visorCerrar: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
});