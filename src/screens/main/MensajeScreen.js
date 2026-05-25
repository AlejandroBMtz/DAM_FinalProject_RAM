import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, TextInput, Platform, StatusBar, ScrollView, ImageBackground, Image, Keyboard, Modal, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { collection, query, where, orderBy, doc, addDoc, setDoc, onSnapshot, getDoc, updateDoc, increment, } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { evaluateBadges } from '../../utils/badges';
import { otorgarPuntosResolucion, penalizarAbandono } from '../../utils/points';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../../services/cloudinary';
import i18next from '../../services/staticTL';

const FEEDBACK_TAGS = ['Paciente', 'Claro', 'Rápido', 'Conoce el tema', 'Amable'];

// Motivos de reporte especificos para el chat
const REPORT_REASONS_CHAT = [
  { id: 1, icon: '😤', label: 'Actitud grosera o irrespetuosa' },
  { id: 2, icon: '💰', label: 'Intentó cobrar por la ayuda' },
  { id: 3, icon: '🚫', label: 'No se presentó a la sesión acordada' },
  { id: 4, icon: '🖼️', label: 'Envió contenido inapropiado' },
  { id: 5, icon: '⚠️', label: 'Otro motivo' },
];

function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e) => setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);
    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);
    return () => { subShow.remove(); subHide.remove(); };
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

  // Modales
  const [ratingModal, setRatingModal] = useState(false); // Calificacion (solicitante)
  const [cancelModal, setCancelModal] = useState(false); // Cancelar/Abandonar (ayudante)
  const [terminarModal, setTerminarModal] = useState(false); // Confirmar terminar (solicitante)
  const [reportModal, setReportModal] = useState(false); // Reporte de conducta
  const [puntosModal, setPuntosModal] = useState(false); // Puntos ganados/perdidos
  const [imagenVisor, setImagenVisor] = useState(null);

  //Rating state
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [puntosGanados, setPuntosGanados] = useState(0);

  //Reporte state 
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [reportDetails, setReportDetails] = useState('');
  const [sendingReport, setSendingReport] = useState(false);

  // conversacion
  const conversacionData = route.params?.conversacionData;
  const title = route.params?.nombre || conversacionData?.nombre || 'Usuario';
  const fotoUrl = conversacionData?.fotoPerfil || conversacionData?.fotoUrl;
  const currentUid = auth.currentUser?.uid;
  const otherUid = conversacionData?.solicitante === currentUid
    ? conversacionData?.ayudante
    : conversacionData?.solicitante;
  const esAyudante = conversacionData?.ayudante === currentUid;
  const typingKey = `typing_${currentUid}`;
  const otherTypingKey = `typing_${otherUid}`;

  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Typing
  const setTypingStatus = useCallback(async (value) => {
    if (!conversacionData?.id || !currentUid) return;
    try {
      await updateDoc(doc(db, 'conversaciones', conversacionData.id), { [typingKey]: value });
    } catch (e) { console.log('Error typing:', e); }
  }, [conversacionData?.id, currentUid, typingKey]);

  const clearTypingStatus = useCallback(async () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    await setTypingStatus(false);
  }, [setTypingStatus]);

  const handleTypingChange = (text) => {
    setMessage(text);
    if (!conversacionData?.id || !currentUid) return;
    if (text.trim().length === 0) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) { setIsTyping(false); setTypingStatus(false); }
      return;
    }
    if (!isTyping) { setIsTyping(true); setTypingStatus(true); }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { setIsTyping(false); setTypingStatus(false); }, 1500);
  };

  // Message status
  const getMessageStatusIcon = (status) => {
    const s = status || 'sent';
    if (s === 'read') return { name: 'checkmark-done-circle', color: '#4ADE80' };
    if (s === 'delivered') return { name: 'checkmark-done', color: '#A78BFA' };
    return { name: 'ellipse-outline', color: '#9CA3AF' };
  };

  const markIncomingMessagesDelivered = async (messages) => {
    if (!messages?.length) return;
    await Promise.all(messages.map((m) => updateDoc(doc(db, 'mensajes', m.id), { status: 'delivered' })));
  };

  const markIncomingMessagesRead = async (messages) => {
    if (!messages?.length) return;
    await Promise.all(messages.map((m) => updateDoc(doc(db, 'mensajes', m.id), { status: 'read' })));
  };

  const marcarComoLeido = useCallback(async () => {
    if (!conversacionData?.id || !currentUid) return;
    try {
      await updateDoc(doc(db, 'conversaciones', conversacionData.id), {
        [`noLeidos_${currentUid}`]: 0,
      });
    } catch (e) { console.log('Error marcar leído:', e); }
  }, [conversacionData?.id]);

  useFocusEffect(useCallback(() => {
    marcarComoLeido();
    return () => { clearTypingStatus(); };
  }, [marcarComoLeido, clearTypingStatus]));

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      clearTypingStatus();
    };
  }, [conversacionData?.id, currentUid]);

  // Listeners Firestore
  useEffect(() => {
    if (!conversacionData?.id || !otherUid) return;
    return onSnapshot(doc(db, 'conversaciones', conversacionData.id), (snap) => {
      setOtherTyping(!!snap.data()?.[otherTypingKey]);
    });
  }, [conversacionData?.id, otherUid, otherTypingKey]);

  useEffect(() => {
    if (!otherUid) return;
    return onSnapshot(doc(db, 'users', otherUid), (snap) => {
      setOtherOnline(!!snap.data()?.online);
    });
  }, [otherUid]);

  useEffect(() => {
    const convoUid = conversacionData?.id;
    if (!convoUid || !currentUid) return;
    const q = query(
      collection(db, 'mensajes'),
      where('idConversacion', '==', convoUid),
      orderBy('tiempoEnviado')
    );
    return onSnapshot(q, async (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMensajes(docs);
      setLoading(false);
      const incomingSent = docs.filter((m) => m.idUsuario !== currentUid && m.status === 'sent');
      const incomingDelivered = docs.filter((m) => m.idUsuario !== currentUid && m.status === 'delivered');
      if (incomingSent.length > 0) await markIncomingMessagesDelivered(incomingSent);
      if (incomingSent.length > 0 || incomingDelivered.length > 0) {
        setTimeout(() => {
          const toRead = docs.filter((m) => m.idUsuario !== currentUid && ['sent', 'delivered'].includes(m.status));
          if (toRead.length > 0) markIncomingMessagesRead(toRead);
        }, 1200);
      }
    });
  }, [conversacionData?.id, currentUid]);

  useEffect(() => {
    if (mensajes.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [mensajes, keyboardHeight]);

  // Send message
  const handleSend = async () => {
    const convoUid = conversacionData?.id;
    if (!message.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'mensajes'), {
        idConversacion: convoUid,
        idUsuario: currentUid,
        texto: message,
        tiempoEnviado: new Date().toISOString(),
        status: 'sent',
      });
      await updateDoc(doc(db, 'conversaciones', convoUid), {
        ultimoMensaje: message,
        ultimaActividad: new Date().toISOString(),
        [`noLeidos_${otherUid}`]: increment(1),
      });
      await setTypingStatus(false);
    } catch (e) { console.log('Error send:', e); }
    finally { setLoading(false); setMessage(''); }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (result.canceled) return;
      setLoading(true);
      const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
      const convoUid = conversacionData?.id;
      await addDoc(collection(db, 'mensajes'), {
        idConversacion: convoUid,
        idUsuario: currentUid,
        tipo: 'imagen',
        imageUrl,
        tiempoEnviado: new Date().toISOString(),
        status: 'sent',
      });
      await updateDoc(doc(db, 'conversaciones', convoUid), {
        ultimoMensaje: '📷 Foto',
        ultimaActividad: new Date().toISOString(),
        [`noLeidos_${otherUid}`]: increment(1),
      });
      await setTypingStatus(false);
    } catch (e) { console.log('Error imagen:', e); }
    finally { setLoading(false); }
  };

  // ayudantr
  const abandonarYLiberar = async () => {
    try {
      let prioridad = 3;
      if (conversacionData?.solicitudId) {
        const snap = await getDoc(doc(db, 'solicitudes', conversacionData.solicitudId));
        if (snap.exists()) prioridad = snap.data().prioridad || 3;
      }
      await penalizarAbandono(currentUid, prioridad);
      await updateDoc(doc(db, 'conversaciones', conversacionData.id), { estado: 'cancelada' });
      await updateDoc(doc(db, 'solicitudes', conversacionData.solicitudId), {
        estado: 'disponible', ayudante: null,
      });
      setCancelModal(false);
      navigation.goBack();
    } catch (e) { console.log('Error abandonar:', e); setCancelModal(false); navigation.goBack(); }
  };

  const finalizarComoCancelado = async () => {
    try {
      let prioridad = 3;
      if (conversacionData?.solicitudId) {
        const snap = await getDoc(doc(db, 'solicitudes', conversacionData.solicitudId));
        if (snap.exists()) prioridad = snap.data().prioridad || 3;
      }
      await penalizarAbandono(currentUid, prioridad);
      await updateDoc(doc(db, 'conversaciones', conversacionData.id), { estado: 'cancelada' });
      await updateDoc(doc(db, 'solicitudes', conversacionData.solicitudId), { estado: 'cancelado' });
      setCancelModal(false);
      navigation.goBack();
    } catch (e) { console.log('Error cancelar:', e); setCancelModal(false); navigation.goBack(); }
  };

  // Acciones solicitante
  const confirmarTerminacion = () => {
    setTerminarModal(false);
    setRating(0); setFeedback(''); setSelectedTags([]);
    setRatingModal(true);
  };

  const performTermination = async () => {
    const convoUid = conversacionData?.id;
    const solicitudId = conversacionData?.solicitudId;
    if (!convoUid || !solicitudId) return;
    try {
      const ayudante = conversacionData?.ayudante;

      await addDoc(collection(db, 'valoraciones'), {
        solicitudId,
        de: currentUid,
        para: ayudante,
        estrellas: rating,
        comentario: feedback,
        etiquetas: selectedTags,
        fecha: new Date().toISOString(),
      });

      const userSnap = await getDoc(doc(db, 'users', ayudante));
      const ud = userSnap.data();
      const newRating = ((ud.rated || 0) * (ud.helpGiven || 0) + rating) / ((ud.helpGiven || 0) + 1);
      await updateDoc(doc(db, 'users', ayudante), { rated: newRating, helpGiven: (ud.helpGiven || 0) + 1 });

      let prioridad = 3;
      try {
        const solSnap = await getDoc(doc(db, 'solicitudes', solicitudId));
        if (solSnap.exists()) prioridad = solSnap.data().prioridad || 3;
      } catch (_) {}

      const puntosOtorgados = await otorgarPuntosResolucion(
        ayudante, prioridad, rating, conversacionData?.fechaCreacion || null
      );
      try { await evaluateBadges(); } catch (_) {}

      await updateDoc(doc(db, 'conversaciones', convoUid), {
        estado: 'completada', fechaActualizacion: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'solicitudes', solicitudId), {
        estado: 'resuelto', fechaActualizacion: new Date().toISOString(),
      });

      if (ayudante === currentUid && puntosOtorgados !== 0) {
        setPuntosGanados(puntosOtorgados);
        setRatingModal(false);
        setPuntosModal(true);
      } else {
        setRatingModal(false);
        navigation.popToTop();
      }
    } catch (e) { console.log('Error terminar:', e); }
  };

  //Reporte de conducta
  const openReportModal = () => {
    setSelectedReportReason(null);
    setReportDetails('');
    setReportModal(true);
  };

  const enviarReporte = async () => {
    if (!selectedReportReason) return; // el boton ya estara deshabilitado
    setSendingReport(true);
    try {
      const motivoLabel = REPORT_REASONS_CHAT.find((r) => r.id === selectedReportReason)?.label || '';
      await addDoc(collection(db, 'reportes'), {
        tipo: 'conducta_chat',
        conversacionId: conversacionData?.id,
        solicitudId: conversacionData?.solicitudId,
        reportadoUserId: otherUid,
        reportanteUserId: currentUid,
        motivoId: selectedReportReason,
        motivoLabel,
        detalles: reportDetails.trim(),
        fecha: new Date().toISOString(),
      });
      if (otherUid) {
        await updateDoc(doc(db, 'users', otherUid), { reportes: increment(1) });
      }
      setReportModal(false);
    } catch (e) { console.log('Error reporte:', e); }
    finally { setSendingReport(false); }
  };

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
          {otherTyping ? (
            <Text style={styles.statusText}>{i18next.t('mensajes.typing')}</Text>
          ) : otherOnline ? (
            <Text style={styles.statusText}>{i18next.t('mensajes.online')}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.terminarBtn}
          onPress={esAyudante ? () => setCancelModal(true) : () => setTerminarModal(true)}
        >
          <Text style={styles.terminarText}>
            {esAyudante ? i18next.t('cancelar') : i18next.t('terminar')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CHAT */}
      <ImageBackground source={require('../../../assets/images/FondoChat.png')} style={styles.background} resizeMode="cover">
        <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {mensajes.map((msg) => {
            const isMine = msg.idUsuario === currentUid;
            const si = getMessageStatusIcon(msg.status);
            return (
              <View key={msg.id} style={[styles.cuerpoMensaje, isMine ? styles.cuerpoEnviado : styles.cuerpoRecibido]}>
                {msg.tipo === 'imagen' ? (
                  <TouchableOpacity onPress={() => setImagenVisor(msg.imageUrl)} activeOpacity={0.9}>
                    <Image source={{ uri: msg.imageUrl }} style={styles.imagenMensaje} resizeMode="cover" />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.textoMensaje}>{msg.texto}</Text>
                )}
                {isMine && (
                  <View style={styles.messageStatus}>
                    <Ionicons name={si.name} size={14} color={si.color} />
                  </View>
                )}
              </View>
            );
          })}
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
          onChangeText={handleTypingChange}
          placeholder={i18next.t('mensajes.place')}
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

      {/*MODAL: CONFIRMAR TERMINAR (Solicitante) se cierra tocando fuera*/}
      <Modal visible={terminarModal} transparent animationType="fade" onRequestClose={() => setTerminarModal(false)}>
        <TouchableWithoutFeedback onPress={() => setTerminarModal(false)}>
          <View style={styles.overlayCenter}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.cardCenter}>
                <Ionicons name="checkmark-circle" size={48} color="#4ADE80" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>{i18next.t('mensajes.resuelto')}</Text>
                <Text style={styles.cardSubtitle}>{i18next.t('mensajes.cerrar')}</Text>
                <TouchableOpacity style={styles.btnPrimary} onPress={confirmarTerminacion}>
                  <Text style={styles.btnPrimaryText}>{i18next.t('mensajes.siTerminar')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setTerminarModal(false)}>
                  <Text style={styles.btnGhostText}>{i18next.t('mensajes.seguir')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/*MODAL: CALIFICACION (Solicitante) se cierra tocando fuera */}
      <Modal visible={ratingModal} transparent animationType="slide" onRequestClose={() => setRatingModal(false)}>
        <TouchableWithoutFeedback onPress={() => setRatingModal(false)}>
          <View style={styles.ratingOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.ratingSheet}>
                {/* Drag handle */}
                <View style={styles.dragHandle} />

                <Text style={styles.ratingTitle}>{i18next.t('mensajes.califica')}</Text>
                <Text style={styles.ratingSubtitle}>¿Cómo fue tu experiencia?</Text>

                {/* Estrellas */}
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.7}>
                      <Ionicons
                        name={rating >= s ? 'star' : 'star-outline'}
                        size={44}
                        color="#FFD700"
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Tags de feedback */}
                <Text style={styles.ratingTagsLabel}>¿QUÉ DESTACAS?</Text>
                <View style={styles.tagsRow}>
                  {FEEDBACK_TAGS.map((t, i) => {
                    const active = selectedTags.includes(t);
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[styles.tagChip, active && styles.tagChipActive]}
                        onPress={() => setSelectedTags(active ? selectedTags.filter((x) => x !== t) : [...selectedTags, t])}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Comentario */}
                <TextInput
                  style={styles.commentInput}
                  placeholder="Comentario opcional (ej. Explicó muy bien los pasos)..."
                  placeholderTextColor="#4B5563"
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline
                />

                {/* Boton enviar */}
                <TouchableOpacity
                  style={[styles.submitRatingBtn, rating === 0 && styles.submitRatingBtnDisabled]}
                  onPress={performTermination}
                  disabled={rating === 0}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitRatingBtnText}>{i18next.t('mensajes.enviar')}</Text>
                </TouchableOpacity>

                {/* Reporte discreto */}
                <TouchableOpacity style={styles.reportLinkRow} onPress={() => { setRatingModal(false); openReportModal(); }} activeOpacity={0.7}>
                  <Text style={styles.reportLinkPre}>¿Algo salió mal? </Text>
                  <Text style={styles.reportLinkBtn}>Reportar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL: CANCELAR / ABANDONAR (Ayudante) se cierra tocando fuera */}
      <Modal visible={cancelModal} transparent animationType="fade" onRequestClose={() => setCancelModal(false)}>
        <TouchableWithoutFeedback onPress={() => setCancelModal(false)}>
          <View style={styles.overlayCenter}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.cardCenter}>
                <Ionicons name="warning" size={40} color="#FFD166" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>{i18next.t('mensajes.proceder')}</Text>
                <Text style={styles.cardSubtitle}>{i18next.t('mensajes.elegir')}</Text>

                <TouchableOpacity style={styles.btnSecondary} onPress={abandonarYLiberar}>
                  <Text style={styles.btnSecondaryText}>{i18next.t('mensajes.abandonar')}</Text>
                  <Text style={styles.btnSubText}>{i18next.t('mensajes.libera')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnDestructive} onPress={finalizarComoCancelado}>
                  <Text style={styles.btnDestructiveText}>{i18next.t('mensajes.finalizar')}</Text>
                  <Text style={styles.btnSubTextDestructive}>{i18next.t('mensajes.cierra')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnGhost} onPress={() => setCancelModal(false)}>
                  <Text style={styles.btnGhostText}>{i18next.t('mensajes.volver')}</Text>
                </TouchableOpacity>

                {/* Reporte discreto para el ayudante */}
                <TouchableOpacity
                  style={styles.reportLinkRowCenter}
                  onPress={() => { setCancelModal(false); openReportModal(); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flag-outline" size={13} color="#4B5563" style={{ marginRight: 4 }} />
                  <Text style={styles.reportLinkPre}>Reportar conducta</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL: REPORTE DE CONDUCTA (ambos roles) se cierra tocando fuera */}
      <Modal visible={reportModal} transparent animationType="slide" onRequestClose={() => setReportModal(false)}>
        <TouchableWithoutFeedback onPress={() => setReportModal(false)}>
          <View style={styles.reportOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.reportSheet}>
                <View style={styles.dragHandle} />

                {/* Icono y titulo */}
                <View style={styles.reportHeaderIcon}>
                  <Ionicons name="remove-circle" size={36} color="#FF4D4D" />
                </View>
                <Text style={styles.reportTitle}>Reportar conducta</Text>
                <Text style={styles.reportSubtitle}>
                  ¿Qué tipo de conducta inapropiada ocurrió durante esta sesión?
                </Text>

                <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
                  {REPORT_REASONS_CHAT.map((item) => {
                    const active = selectedReportReason === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.reportReasonItem, active && styles.reportReasonItemActive]}
                        onPress={() => setSelectedReportReason(item.id)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.reportReasonIcon}>{item.icon}</Text>
                        <Text style={[styles.reportReasonLabel, active && styles.reportReasonLabelActive]}>
                          {item.label}
                        </Text>
                        {active && (
                          <Ionicons name="checkmark-circle" size={18} color="#FF4D4D" style={{ marginLeft: 'auto' }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  <TextInput
                    style={styles.reportInput}
                    placeholder="Describe lo que ocurrió..."
                    placeholderTextColor="#4B5563"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={reportDetails}
                    onChangeText={setReportDetails}
                  />
                </ScrollView>

                <TouchableOpacity
                  style={[styles.reportSubmitBtn, (!selectedReportReason || sendingReport) && styles.reportSubmitBtnDisabled]}
                  onPress={enviarReporte}
                  disabled={!selectedReportReason || sendingReport}
                  activeOpacity={0.85}
                >
                  <Text style={styles.reportSubmitBtnText}>
                    {sendingReport ? i18next.t('loadingSave') : 'Enviar reporte'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnGhost} onPress={() => setReportModal(false)}>
                  <Text style={styles.btnGhostText}>{i18next.t('cancelar')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL: PUNTOS GANADOS / PENALIZACION Requiere boton OK*/}
      <Modal visible={puntosModal} transparent animationType="fade">
        <View style={styles.overlayCenter}>
          <View style={styles.cardCenter}>
            {puntosGanados > 0 ? (
              <>
                <Ionicons name="trophy" size={44} color="#FFD166" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>¡Ayuda completada!</Text>
                <Text style={styles.puntosNum}>{`+${puntosGanados} pts`}</Text>
                <Text style={styles.cardSubtitle}>Gracias por tu apoyo. Los puntos han sido añadidos a tu perfil.</Text>
              </>
            ) : (
              <>
                <Ionicons name="alert-circle" size={44} color="#FF4D4D" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>Sesión finalizada</Text>
                <Text style={[styles.puntosNum, { color: '#FF4D4D' }]}>{`${puntosGanados} pts`}</Text>
                <Text style={styles.cardSubtitle}>La calificación baja afectó tus puntos esta vez. ¡Ánimo para la próxima!</Text>
              </>
            )}
            <TouchableOpacity style={styles.btnPrimary} onPress={() => { setPuntosModal(false); navigation.navigate('Tickets'); }}>
              <Text style={styles.btnPrimaryText}>Ver mis tickets</Text>
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

  // Header
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
  statusText: {
    color: '#A5B4FC',
    fontSize: 12,
    marginTop: 4,
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

  // Messages
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
  messageStatus: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  imagenMensaje: {
    width: 220,
    height: 180,
    borderRadius: 12,
  },

  // Input bar
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
  attachButton: {
    padding: 4,
    marginLeft: 4,
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

  // Overlay / card base
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'center',
    padding: 24,
  },
  cardCenter: {
    backgroundColor: '#161920',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D3243',
  },
  cardIcon: {
    alignSelf: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    color: '#8A8F9E',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
  },

  // Botones reutilizables
  btnPrimary: {
    backgroundColor: 'rgba(37,99,235,0.15)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#60A5FA',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnSecondary: {
    backgroundColor: '#1C1F2B',
    borderWidth: 1,
    borderColor: '#2D3243',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnSubText: {
    color: '#8A8F9E',
    fontSize: 11,
    marginTop: 2,
  },
  btnDestructive: {
    backgroundColor: 'rgba(255,77,77,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.3)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  btnDestructiveText: {
    color: '#FF4D4D',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnSubTextDestructive: {
    color: 'rgba(255,77,77,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  btnGhost: {
    padding: 12,
    alignItems: 'center',
  },
  btnGhostText: {
    color: '#8A8F9E',
    fontWeight: '600',
  },

  // Enlace de reporte discreto
  reportLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  reportLinkRowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 6,
  },
  reportLinkPre: {
    color: '#4B5563',
    fontSize: 12,
  },
  reportLinkBtn: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Modal puntos
  puntosNum: {
    color: '#FFD166',
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },

  // Modal calificacin (bottom sheet)
  ratingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  ratingSheet: {
    backgroundColor: '#13151C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  dragHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#2D3243',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  ratingTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  ratingSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 22,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  ratingTagsLabel: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  tagChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D3243',
    backgroundColor: '#1C1F2B',
  },
  tagChipActive: {
    borderColor: '#6C63FF',
    backgroundColor: 'rgba(108,99,255,0.15)',
  },
  tagChipText: {
    color: '#8A8F9E',
    fontSize: 13,
    fontWeight: '500',
  },
  tagChipTextActive: {
    color: '#8B85FF',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#2D3243',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    minHeight: 80,
    marginBottom: 20,
    fontSize: 14,
    backgroundColor: '#1C1F2B',
  },
  submitRatingBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  submitRatingBtnDisabled: {
    opacity: 0.45,
  },
  submitRatingBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal reporte conducta (bottom sheet)
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  reportSheet: {
    backgroundColor: '#13151C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '88%',
  },
  reportHeaderIcon: {
    alignItems: 'center',
    marginBottom: 10,
  },
  reportTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  reportSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  reportReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F2B',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2D3243',
  },
  reportReasonItemActive: {
    borderColor: '#FF4D4D',
    backgroundColor: 'rgba(255,77,77,0.06)',
  },
  reportReasonIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  reportReasonLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  reportReasonLabelActive: {
    color: '#FFF',
  },
  reportInput: {
    backgroundColor: '#1C1F2B',
    color: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D3243',
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
    minHeight: 90,
    fontSize: 14,
  },
  reportSubmitBtn: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  reportSubmitBtnDisabled: {
    opacity: 0.45,
  },
  reportSubmitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Visor imagen
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
  }
});