import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Text, View, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Modal, Image, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import {
  collection, query, where, getDocs, orderBy,
  deleteDoc, doc, getDoc, onSnapshot, updateDoc, Timestamp
} from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import i18next from '../../services/staticTL';
import { normalizeSkillName } from '../../utils/tagsList';

const { width: SCREEN_WIDTH } = Dimensions.get('window');


// Convierte un timestamp de Firestore o Date a "hace X min / h / días"
const tiempoRelativo = (tiempo) => {
  const actual = new Date().getTime();
    const pasado = new Date(tiempo).getTime();
    const difSegundos = Math.floor((actual - pasado) / 1000);

    if (difSegundos < 60) return i18next.t("tiempo.segundos", {segundos: difSegundos});

    const difMinutos = Math.floor(difSegundos / 60);

    if (difMinutos < 60) return i18next.t("tiempo.minutos", {minutos: difMinutos});

    const difHoras = Math.floor(difMinutos / 60);

    if (difHoras < 24) return i18next.t("tiempo.horas", {horas: difHoras});

    const difDias = Math.floor(difHoras / 24);

    return i18next.t("tiempo.dias", {dias: difDias});
};

// Obtiene datos del usuario (nombre, carrera, semestre, rating, avatar) desde Firestore
const fetchUserData = async (uid) => {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return { uid, ...snap.data() };
  } catch (_) {}
  return null;
};


const AvatarMini = ({ uri, nombre }) => {
  const [error, setError] = useState(false);

  const initials = nombre
    ? nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : '?';

  return (
    <Image
      source={
        uri && !error
          ? { uri }
          : require('../../../assets/images/Logo.png')
      }
      style={styles.avatarMini}
      onError={() => setError(true)}
    />
  );
};

// Modal de alerta personalizado

const CustomAlert = ({ visible, icon, iconColor, title, message, buttons, onClose }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlayCenter}>
      <View style={styles.modalContentCenter}>
        {icon && (
          <Ionicons
            name={icon}
            size={36}
            color={iconColor || '#FFD166'}
            style={{ alignSelf: 'center', marginBottom: 12 }}
          />
        )}
        <Text style={styles.modalTitleCenter}>{title}</Text>
        {message ? (
          <Text style={styles.modalSubtitleCenter}>{message}</Text>
        ) : null}
        <View style={styles.modalBtnRow}>
          {buttons.map((btn, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.modalBtnBase,
                btn.style === 'destructive' && styles.modalBtnDestructive,
                btn.style === 'default'     && styles.modalBtnDefault,
                btn.style === 'cancel'      && styles.modalBtnCancelStyle,
              ]}
              onPress={() => { btn.onPress?.(); onClose?.(); }}
            >
              <Text style={[
                styles.modalBtnText,
                btn.style === 'destructive' && { color: '#FF4D4D' },
                btn.style === 'default'     && { color: '#FFF' },
                btn.style === 'cancel'      && { color: '#8A8F9E' },
              ]}>
                {btn.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  </Modal>
);

//Pantalla principal

export default function MyTicketsScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  // Tabs
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // Datos
  const [solicitudes, setSolicitudes] = useState([]);
  const [ayudando, setAyudando] = useState([]);
  const [historial, setHistorial] = useState([]);

  // Modales de acción
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [abandonModalVisible, setAbandonModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRatingItem, setSelectedRatingItem] = useState(null);

  // Alerta personalizada
  const [alertConfig, setAlertConfig] = useState({ visible: false });

  const showAlert = (config) => setAlertConfig({ ...config, visible: true });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Selección para modales
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);

  const razonesCancelar = [
    'Ya resolví mi solicitud por otro medio',
    'El voluntario no se presentó',
    'Publiqué el ticket por error',
    'Otro motivo',
  ];

  const razonesAbandonar = [
    'No hubo comunicación',
    'El solicitante no se presentó',
    'Acepté el ticket por error',
    'Otro motivo',
  ];

  // Carga de datos

  const obtenerDatos = useCallback(() => {
    setLoading(true);
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) { setLoading(false); return; }

    // 1. Solicitudes que yo creé (activas)
    const solRef = collection(db, 'solicitudes');
    const qSol = query(
      solRef,
      where('usuario', '==', currentUid),
      where('estado', 'in', ['disponible', 'en proceso']),
      orderBy('fechaCreacion', 'desc')
    );

    const unsubSol = onSnapshot(qSol, async (snap) => {
      const results = await Promise.all(snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let ayudanteInfo = null;

        // Si tiene ayudante asignado, cargar su info
        if (data.ayudante) {
          ayudanteInfo = await fetchUserData(data.ayudante);
        }

        return {
          id: docSnap.id,
          ...data,
          estado: data.estado || 'disponible',
          ayudanteInfo,
        };
      }));
      setSolicitudes(results);
      setLoading(false);
    }, (err) => {
      console.log('Error solicitudes:', err);
      setLoading(false);
    });

    // 2. Conversaciones donde soy el ayudante y están en proceso
    const convRef = collection(db, 'conversaciones');
    const qConv = query(
      convRef,
      where('ayudante', '==', currentUid),
      where('estado', '==', 'activa')
    );

    const unsubConv = onSnapshot(qConv, async (snap) => {
      const results = await Promise.all(snap.docs.map(async (docSnap) => {
        const data = docSnap.data();

        // Cargar datos del solicitante
        const solicitanteInfo = await fetchUserData(data.solicitante);

        // Cargar datos del ticket
        let ticketData = null;
        if (data.solicitudId) {
          const ticketSnap = await getDoc(doc(db, 'solicitudes', data.solicitudId));
          if (ticketSnap.exists()) ticketData = { id: ticketSnap.id, ...ticketSnap.data() };
        }

        return {
          id: docSnap.id,
          conversacionId: docSnap.id,
          solicitudId: data.solicitudId,
          titulo: ticketData?.titulo || 'Sin título',
          etiquetas: ticketData?.etiquetas || [],
          prioridad: ticketData?.prioridad || 3,
          fechaCreacion: ticketData?.fechaCreacion || data.fechaCreacion,
          estado: 'en proceso',
          solicitanteInfo,
        };
      }));
      setAyudando(results);
    }, (err) => {
      console.log('Error ayudando:', err);
    });

    // 3. Historial: solicitudes mías resueltas/canceladas/expiradas
    const qHist = query(
      solRef,
      where('usuario', '==', currentUid),
      where('estado', 'in', ['resuelto', 'cancelado', 'expirado']),
      orderBy('fechaCreacion', 'desc')
    );

    const unsubHist = onSnapshot(qHist, async (snap) => {
      const propias = await Promise.all(snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let ayudanteInfo = null;
        let valoracion = null;

        if (data.ayudante) {
          ayudanteInfo = await fetchUserData(data.ayudante);
        }

        // Buscar valoración asociada
        if (data.estado === 'resuelto') {
          try {
            const valRef = collection(db, 'valoraciones');
            const qVal = query(valRef, where('solicitudId', '==', docSnap.id));
            const valSnap = await getDocs(qVal);
            if (!valSnap.empty) valoracion = { id: valSnap.docs[0].id, ...valSnap.docs[0].data() };
          } catch (_) {}
        }

        return {
          id: docSnap.id,
          tipo: 'solicite',
          titulo: data.titulo || 'Sin título',
          estado: data.estado,
          detalle: data.ayudante
            ? `${i18next.t("tickets.ayudaPor")} ${ayudanteInfo?.nombre || 'alguien'}`
            : i18next.t("tickets.sinVol"),
          tiempo: tiempoRelativo(data.fechaActualizacion || data.fechaCreacion),
          valoracion,
        };
      }));

      // Conversaciones donde fui ayudante y ya terminaron
      let completadas = [];
      try {
        const qCompletadas = query(
          convRef,
          where('ayudante', '==', currentUid),
          where('estado', 'in', ['completada', 'cancelada'])
        );
        const compSnap = await getDocs(qCompletadas);
        completadas = await Promise.all(compSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let ticketData = null;
          let valoracion = null;

          if (data.solicitudId) {
            const tSnap = await getDoc(doc(db, 'solicitudes', data.solicitudId));
            if (tSnap.exists()) ticketData = tSnap.data();
          }

          if (data.estado === 'completada') {
            try {
              const valRef = collection(db, 'valoraciones');
              const qVal = query(valRef, where('solicitudId', '==', data.solicitudId), where('de', '==', data.solicitante));
              const valSnap = await getDocs(qVal);
              if (!valSnap.empty) valoracion = { id: valSnap.docs[0].id, ...valSnap.docs[0].data() };
            } catch (_) {}
          }

          const solicitanteInfo = await fetchUserData(data.solicitante);

          return {
            id: docSnap.id,
            tipo: 'ayude',
            titulo: ticketData?.titulo || 'Ayuda prestada',
            estado: data.estado === 'completada' ? 'Resuelto' : 'Cancelado',
            detalle: `Ayudé a ${solicitanteInfo?.nombre || 'alguien'}`,
            tiempo: tiempoRelativo(data.fechaActualizacion || data.fechaCreacion),
            valoracion,
          };
        }));
      } catch (_) {}

      // Unir y ordenar por recencia (las que tienen "hace" primero) — simple concat
      const todo = [...propias, ...completadas];
      setHistorial(todo);
    }, (err) => {
      console.log('Error historial:', err);
    });

    return () => {
      unsubSol();
      unsubConv();
      unsubHist();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unsub = obtenerDatos();
      return () => { if (typeof unsub === 'function') unsub(); };
    }, [obtenerDatos])
  );

  // Navegación

  const handleTabChange = (index) => {
    setActiveTab(index);
    scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  };

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (activeTab !== index) setActiveTab(index);
  };

  // Acciones

  const confirmarEliminacion = async () => {
    if (!selectedTicket) return;
    try {
      await deleteDoc(doc(db, 'solicitudes', selectedTicket.id));
      setSolicitudes(prev => prev.filter(t => t.id !== selectedTicket.id));
    } catch (error) {
      console.log('Error al eliminar', error);
      showAlert({
        icon: 'alert-circle',
        iconColor: '#FF4D4D',
        title: 'Error',
        message: 'No se pudo eliminar el ticket. Inténtalo de nuevo.',
        buttons: [{ text: 'Entendido', style: 'default', onPress: hideAlert }],
      });
    }
    setDeleteModalVisible(false);
  };

  const confirmarCancelacion = async () => {
    if (!selectedTicket || !selectedReason) {
      showAlert({
        icon: 'alert-circle',
        iconColor: '#FFD166',
        title: 'Selecciona un motivo',
        message: 'Por favor elige un motivo antes de cancelar.',
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
      return;
    }
    try {
      await updateDoc(doc(db, 'solicitudes', selectedTicket.id), {
        estado: 'cancelado',
        motivoCancelacion: selectedReason,
        fechaActualizacion: Timestamp.now(),
      });
    } catch (error) {
      console.log('Error al cancelar', error);
    }
    setCancelModalVisible(false);
    setSelectedReason(null);
  };

  const confirmarAbandono = async () => {
    if (!selectedTicket || !selectedReason) {
      showAlert({
        icon: 'alert-circle',
        iconColor: '#FFD166',
        title: 'Selecciona un motivo',
        message: 'Por favor elige un motivo antes de abandonar.',
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
      return;
    }
    try {
      // Marcar conversación como cancelada
      await updateDoc(doc(db, 'conversaciones', selectedTicket.conversacionId || selectedTicket.id), {
        estado: 'cancelada',
        motivoAbandono: selectedReason,
        fechaActualizacion: Timestamp.now(),
      });
      // Volver a dejar el ticket disponible si existe
      if (selectedTicket.solicitudId) {
        await updateDoc(doc(db, 'solicitudes', selectedTicket.solicitudId), {
          estado: 'disponible',
          ayudante: null,
          fechaActualizacion: Timestamp.now(),
        });
      }
    } catch (error) {
      console.log('Error al abandonar', error);
    }
    setAbandonModalVisible(false);
    setSelectedReason(null);
  };

  const irAlChat = async (ticket) => {
    try {
      // Si ya tenemos el conversacionId (caso de "Ayudando") lo usamos directamente
      if (ticket.conversacionId) {
        const convSnap = await getDoc(doc(db, 'conversaciones', ticket.conversacionId));
        if (convSnap.exists()) {
          const convoData = convSnap.data();
          const currentUid = auth.currentUser.uid;
          const otherUid = convoData.solicitante === currentUid ? convoData.ayudante : convoData.solicitante;
          const otherUser = await fetchUserData(otherUid);

          navigation.navigate('Mensajes', {
            screen: 'MensajeScreen',
            params: {
              conversacionData: {
                id: convSnap.id,
                nombre: otherUser?.nombre || 'Usuario',
                ...convoData,
              },
            },
          });
          return;
        }
      }

      // Caso de "Solicité": buscar conversación por solicitudId
      const convRef = collection(db, 'conversaciones');
      const q = query(convRef, where('solicitudId', '==', ticket.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const convoData = docSnap.data();
        const currentUid = auth.currentUser.uid;
        const otherUid = convoData.solicitante === currentUid ? convoData.ayudante : convoData.solicitante;
        const otherUser = await fetchUserData(otherUid);

        navigation.navigate('Mensajes', {
          screen: 'MensajeScreen',
          params: {
            conversacionData: {
              id: docSnap.id,
              nombre: otherUser?.nombre || 'Usuario',
              ...convoData,
            },
          },
        });
      } else {
        showAlert({
          icon: 'chatbubble-ellipses-outline',
          iconColor: '#6C63FF',
          title: 'Sin chat aún',
          message: 'El chat se creará cuando un voluntario acepte tu solicitud.',
          buttons: [{ text: 'Entendido', style: 'default', onPress: hideAlert }],
        });
      }
    } catch (error) {
      console.log('Error al abrir chat:', error);
      showAlert({
        icon: 'alert-circle',
        iconColor: '#FF4D4D',
        title: 'Error',
        message: 'No se pudo abrir la conversación.',
        buttons: [{ text: 'OK', style: 'default', onPress: hideAlert }],
      });
    }
  };


  const renderStatusBadge = (estado) => {
    const isAsignada = estado === 'en proceso';
    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: isAsignada ? '#4ADE80' : '#FFD166' }]} />
        <Text style={[styles.statusText, { color: isAsignada ? '#4ADE80' : '#FFD166' }]}>
          {isAsignada ? i18next.t("tickets.asignada") : i18next.t("tickets.sinVol")}
        </Text>
      </View>
    );
  };

  // TAB: Solicité

  const renderSolicite = () => (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.listContent}>
      {solicitudes.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={40} color="#2D3243" />
          <Text style={styles.emptyStateText}>{i18next.t("tickets.sinActivas")}</Text>
        </View>
      )}

      {solicitudes.map((ticket) => (
        <View key={ticket.id} style={styles.card}>
          <View style={styles.cardHeaderTop}>
            <Text style={styles.cardTitle}>{ticket.titulo}</Text>
            <View style={styles.priorityMiniBadge}>
              <Text style={styles.priorityMiniText}>
                {ticket.prioridad === 1 ? i18next.t("prioridad.alta") : ticket.prioridad === 2 ? i18next.t("prioridad.media") : i18next.t("prioridad.baja")}
              </Text>
            </View>
          </View>

          <View style={styles.cardMetaRow}>
            {renderStatusBadge(ticket.estado)}
            <Text style={styles.timeText}>{tiempoRelativo(ticket.fechaCreacion)}</Text>
          </View>

          <View style={styles.tagsContainer}>
            {ticket.etiquetas?.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={styles.cardTag}>
                <Text style={styles.cardTagText}>{normalizeSkillName(tag)}</Text>
              </View>
            ))}
          </View>

          {/* Ayudante asignado */}
          {ticket.estado === 'en proceso' && ticket.ayudanteInfo && (
            <View style={styles.helperCardInner}>
              <AvatarMini
                uri={ticket.ayudanteInfo.fotoPerfil}
                nombre={ticket.ayudanteInfo.nombre}
              />
              <View style={styles.helperInfo}>
                <Text style={styles.helperName}>{ticket.ayudanteInfo.nombre}</Text>
                <Text style={styles.helperCareer}>
                  {ticket.ayudanteInfo.carrera
                    ? `${ticket.ayudanteInfo.carrera}${ticket.ayudanteInfo.semestre ? ` · ${ticket.ayudanteInfo.semestre}° Semestre` : ''}`
                    : 'Voluntario'}
                </Text>
              </View>
              <View style={styles.helperRight}>
                <Text style={styles.enChatText}>• En chat</Text>
                {ticket.ayudanteInfo.rating != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Ionicons name="star" size={12} color="#FFD166" />
                    <Text style={styles.ratingTextInner}> {Number(ticket.ayudanteInfo.rating).toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Botones */}
          <View style={styles.actionButtonsRow}>
            {ticket.estado === 'disponible' ? (
              <>
                <TouchableOpacity
                  style={styles.actionBtnLeft}
                  onPress={() => navigation.navigate('EditarTicketScreen', { ticketData: ticket })}
                >
                  <Text style={styles.actionBtnTextBlue}>{i18next.t("tickets.editar")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnRight}
                  onPress={() => { setSelectedTicket(ticket); setDeleteModalVisible(true); }}
                >
                  <Text style={styles.actionBtnTextRed}>{i18next.t("eliminar")}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.actionBtnLeft} onPress={() => irAlChat(ticket)}>
                  <Text style={styles.actionBtnTextGreen}>Ir al chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnRight}
                  onPress={() => { setSelectedTicket(ticket); setCancelModalVisible(true); }}
                >
                  <Text style={styles.actionBtnTextRed}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.newTicketBtn} onPress={() => navigation.navigate('Agregar')}>
        <Text style={styles.newTicketText}>
          {i18next.t("tickets.masAyuda")}{' '}
          <Text style={{ color: '#6C63FF', fontWeight: 'bold' }}>{i18next.t("tickets.nuevo")}</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // TAB: Ayudando

  const renderAyudando = () => (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.listContent}>
      {ayudando.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="hand-left-outline" size={40} color="#2D3243" />
          <Text style={styles.emptyStateText}>{i18next.t("tickets.sinAyudas")}</Text>
          <TouchableOpacity
            style={styles.emptyStateBtn}
            onPress={() => navigation.navigate('Explorar')}
          >
            <Text style={styles.emptyStateBtnText}>{i18next.t("tickets.explorar")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {ayudando.map((ticket) => (
        <View key={ticket.id} style={styles.card}>
          <View style={styles.cardMetaRowTop}>
            <View style={styles.priorityMiniBadge}>
              <Text style={styles.priorityMiniText}>
                {ticket.prioridad === 1 ? i18next.t("prioridad.alta") : ticket.prioridad === 2 ? i18next.t("prioridad.media") : i18next.t("prioridad.baja")}
              </Text>
            </View>
            <Text style={styles.timeText}>{tiempoRelativo(ticket.fechaCreacion)}</Text>
          </View>

          <Text style={[styles.cardTitle, { marginLeft: 16, marginBottom: 12 }]}>{ticket.titulo}</Text>

          {/* Info del solicitante */}
          {ticket.solicitanteInfo && (
            <View style={styles.helperCardInner}>
              <AvatarMini
                uri={ticket.solicitanteInfo.fotoPerfil}
                nombre={ticket.solicitanteInfo.nombre}
              />
              <View style={styles.helperInfo}>
                <Text style={styles.helperName}>{ticket.solicitanteInfo.nombre}</Text>
                <Text style={styles.helperCareer}>
                  {ticket.solicitanteInfo.carrera
                    ? `${ticket.solicitanteInfo.carrera}${ticket.solicitanteInfo.semestre ? ` · ${ticket.solicitanteInfo.semestre}° ${i18next.t("profile.semestre")}` : ''}`
                    : 'Solicitante'}
                </Text>
              </View>
              <View style={styles.helperRight}>
                <Text style={styles.enChatText}>• {i18next.t("tickets.enChat")}</Text>
                {ticket.solicitanteInfo.rating != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Ionicons name="star" size={12} color="#FFD166" />
                    <Text style={styles.ratingTextInner}> {Number(ticket.solicitanteInfo.rating).toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.tagsContainer}>
            {ticket.etiquetas?.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={styles.cardTag}>
                <Text style={styles.cardTagText}>{normalizeSkillName(tag)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionBtnLeft} onPress={() => irAlChat(ticket)}>
              <Text style={styles.actionBtnTextGreen}>{i18next.t("tickets.irChat")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnRight}
              onPress={() => { setSelectedTicket(ticket); setAbandonModalVisible(true); }}
            >
              <Text style={styles.actionBtnTextRed}>{i18next.t("tickets.abandonar")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  //TAB: Historial

  const renderHistorial = () => {
    // Agrupar por semana: "Esta semana" / "Semana pasada" / "Anteriores"
    const ahora = Date.now();
    const UNA_SEMANA = 7 * 24 * 3600 * 1000;
    const DOS_SEMANAS = 2 * UNA_SEMANA;

    const grupos = {
      'Esta semana': [],
      'Semana pasada': [],
      'Anteriores': [],
    };

    historial.forEach((item) => {
      const texto = item.tiempo || '';
      if (texto.includes('min') || texto.includes('h') || texto.includes('momento')) {
        grupos['Esta semana'].push(item);
      } else if (texto.includes('1 día') || texto.includes('2 día') || texto.includes('3 día') ||
                 texto.includes('4 día') || texto.includes('5 día') || texto.includes('6 día') ||
                 texto.includes('7 día')) {
        grupos['Esta semana'].push(item);
      } else if (texto.includes('8 día') || texto.includes('9 día') || texto.includes('10 día') ||
                 texto.includes('11 día') || texto.includes('12 día') || texto.includes('13 día') ||
                 texto.includes('14 día')) {
        grupos['Semana pasada'].push(item);
      } else {
        grupos['Anteriores'].push(item);
      }
    });

    const estadoColor = (estado) => {
      const e = (estado || '').toLowerCase();
      if (e === 'resuelto') return { bg: 'rgba(74,222,128,0.1)', text: '#4ADE80' };
      if (e === 'expirado') return { bg: 'rgba(255,209,102,0.1)', text: '#FFD166' };
      return { bg: 'rgba(255,77,77,0.1)', text: '#FF4D4D' };
    };

    const capitalized = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

    return (
      <ScrollView style={styles.pageContainer} contentContainerStyle={styles.listContent}>
        {historial.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={40} color="#2D3243" />
            <Text style={styles.emptyStateText}>{i18next.t("tickets.tuHistorial")}</Text>
          </View>
        )}

        {Object.entries(grupos).map(([grupo, items]) => {
          if (items.length === 0) return null;
          return (
            <View key={grupo}>
              <Text style={styles.sectionHeader}>{grupo}</Text>
              {items.map((item) => {
                const colors = estadoColor(item.estado);
                return (
                  <View key={item.id} style={styles.historyCard}>
                    {/* Tipo de participación */}
                    <View style={styles.historyTypeRow}>
                      <Ionicons
                        name={item.tipo === 'ayude' ? 'hand-left-outline' : 'help-circle-outline'}
                        size={13}
                        color="#5E6376"
                      />
                      <Text style={styles.historyTypeText}>
                        {item.tipo === 'ayude' ? i18next.t("tickets.ayude") : i18next.t("tickets.solicite")}
                      </Text>
                    </View>

                    <View style={styles.historyTopRow}>
                      <Text style={styles.historyTitle}>{item.titulo}</Text>
                      <View style={[styles.historyBadge, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.historyBadgeText, { color: colors.text }]}>
                          {capitalized(item.estado)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.historyDetail}>
                      {item.detalle}{'  •  '}{item.tiempo}
                    </Text>

                    {/* Valoración recibida */}
                    {item.valoracion && (
                      <TouchableOpacity
                        style={styles.valoracionBtn}
                        onPress={() => { setSelectedRatingItem(item.valoracion); setRatingModalVisible(true); }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="star" size={14} color="#FFD166" />
                          <Text style={styles.valoracionText}>{i18next.t("tickets.valoracion")}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // Conteo activos

  const ticketsActivos = solicitudes.length + ayudando.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{i18next.t("tickets.titulo")}</Text>
          <Text style={styles.headerSubtitle}>{i18next.t("tickets.gestiona")}</Text>
        </View>
        <View style={styles.activosBadge}>
          <Text style={styles.activosTextNum}>{ticketsActivos}</Text>
          <Text style={styles.activosTextStr}>{i18next.t("tickets.activos")}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[i18next.t("tickets.solicite"), i18next.t("tickets.ayudando"), i18next.t("tickets.historial")].map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tabButton, activeTab === index && styles.tabButtonActive]}
            onPress={() => handleTabChange(index)}
          >
            <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>{tab}</Text>
            {/* Badge de conteo */}
            {index === 0 && solicitudes.length > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{solicitudes.length}</Text></View>
            )}
            {index === 1 && ayudando.length > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{ayudando.length}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido deslizable */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.infoText}>{i18next.t("loading")}</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={{ flex: 1 }}
          scrollEventThrottle={16}
        >
          {renderSolicite()}
          {renderAyudando()}
          {renderHistorial()}
        </ScrollView>
      )}

      {/* ── MODALES ── */}

      {/* Eliminar */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentCenter}>
            <Ionicons name="warning" size={36} color="#FFD166" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.modalTitleCenter}>¿Eliminar solicitud?</Text>
            <Text style={styles.modalSubtitleCenter}>
              {i18next.t("tickets.permanente")}
            </Text>
            
            <View style={styles.modalBtnRow}>
              {/* Botón Eliminar */}
              <TouchableOpacity 
                style={[styles.modalBtnBase, styles.modalBtnDestructive]} 
                onPress={confirmarEliminacion}
              >
                <Text style={[styles.modalBtnText, { color: '#FF4D4D' }]}>{i18next.t("tickets.eliminar")}</Text>
              </TouchableOpacity>

              {/* Botón Cancelar */}
              <TouchableOpacity 
                style={[styles.modalBtnBase, styles.modalBtnDefault]} 
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>{i18next.t("cancelar")}</Text>
              </TouchableOpacity>

            </View>

          </View>
        </View>
      </Modal>

      {/* Cancelar con voluntario */}
      <Modal visible={cancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalContentBottom}>
            <View style={styles.dragIndicator} />
            <Ionicons name="warning" size={32} color="#FFD166" style={{ alignSelf: 'center' }} />
            <Text style={styles.modalTitleLarge}>¿Cancelar con voluntario asignado?</Text>
            <Text style={styles.modalSubtitleLarge}>
              El voluntario ya está ayudándote. Cancelar puede afectar su karma y el tuyo.
            </Text>
            <Text style={styles.sectionLabelModal}>MOTIVO DE CANCELACIÓN</Text>
            {razonesCancelar.map((razon, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.reasonItem, selectedReason === razon && styles.reasonItemSelected]}
                onPress={() => setSelectedReason(razon)}
              >
                <View style={styles.reasonRow}>
                  <View style={[
                    styles.radioCircle,
                    selectedReason === razon && styles.radioCircleSelected
                  ]}>
                    {selectedReason === razon && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.reasonText}>{razon}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.btnConfirmRed, !selectedReason && styles.btnDisabled]}
              onPress={confirmarCancelacion}
            >
              <Text style={styles.btnTextWhiteBold}>Confirmar cancelación</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnKeepDark} onPress={() => { setCancelModalVisible(false); setSelectedReason(null); }}>
              <Text style={styles.btnTextWhiteBold}>Mantener ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Abandonar ayuda */}
      <Modal visible={abandonModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalContentBottom}>
            <View style={styles.dragIndicator} />
            <Ionicons name="ban" size={32} color="#FF4D4D" style={{ alignSelf: 'center' }} />
            <Text style={styles.modalTitleLarge}>¿Abandonar esta ayuda?</Text>
            <Text style={styles.modalSubtitleLarge}>
              Si abandonas sin completar la sesión, tu karma puede verse afectado negativamente.
            </Text>
            <Text style={styles.sectionLabelModal}>MOTIVO DE ABANDONO</Text>
            {razonesAbandonar.map((razon, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.reasonItem, selectedReason === razon && styles.reasonItemSelected]}
                onPress={() => setSelectedReason(razon)}
              >
                <View style={styles.reasonRow}>
                  <View style={[
                    styles.radioCircle,
                    selectedReason === razon && styles.radioCircleSelected
                  ]}>
                    {selectedReason === razon && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.reasonText}>{razon}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.btnConfirmRed, !selectedReason && styles.btnDisabled]}
              onPress={confirmarAbandono}
            >
              <Text style={styles.btnTextWhiteBold}>Confirmar abandono</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnKeepDark} onPress={() => { setAbandonModalVisible(false); setSelectedReason(null); }}>
              <Text style={styles.btnTextWhiteBold}>Seguir ayudando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Valoración */}
      <Modal visible={ratingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentCenterLarge}>
            <View style={styles.dragIndicator} />
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons
                  key={i}
                  name={i <= (selectedRatingItem?.estrellas || 5) ? 'star' : 'star-outline'}
                  size={24}
                  color="#FFD166"
                  style={{ marginHorizontal: 2 }}
                />
              ))}
            </View>
            {selectedRatingItem?.puntos && (
              <Text style={styles.pointsText}>+{selectedRatingItem.puntos} puntos</Text>
            )}

            {selectedRatingItem?.etiquetas?.length > 0 && (
              <View style={styles.badgesRow}>
                {selectedRatingItem.etiquetas.map((etq, i) => (
                  <View key={i} style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>{normalizeSkillName(etq)}</Text>
                  </View>
                ))}
              </View>
            )}

            {selectedRatingItem?.comentario && (
              <Text style={styles.ratingFeedback}>"{selectedRatingItem.comentario}"</Text>
            )}

            <TouchableOpacity
              style={{ marginTop: 20 }}
              onPress={() => { setRatingModalVisible(false); setSelectedRatingItem(null); }}
            >
              <Text style={{ color: '#8A8F9E', textAlign: 'center' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Alerta personalizada global */}
      <CustomAlert
        visible={alertConfig.visible}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons || []}
        onClose={hideAlert}
      />
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    color: '#8A8F9E',
    fontSize: 14,
    marginTop: 4,
  },
  activosBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderColor: '#6C63FF',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activosTextNum: {
    color: '#6C63FF',
    fontWeight: 'bold',
    fontSize: 16
  },
  activosTextStr: {
    color: '#6C63FF',
    fontSize: 10
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#15171E',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#6C63FF'
  },
  tabText: {
    color: '#8A8F9E',
    fontWeight: '600'
  },
  tabTextActive: {
    color: '#FFF'
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold'
  },

  // Contenedor por página
  pageContainer: {
    width: SCREEN_WIDTH
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10
  },

  // Cards
  card: {
    backgroundColor: '#15171E',
    borderRadius: 12,
    paddingTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 10,
  },
  priorityMiniBadge: {
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityMiniText: {
    color: '#FFD166',
    fontSize: 10,
    fontWeight: 'bold'
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  cardMetaRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  timeText: {
    color: '#5E6376',
    fontSize: 12
  },
  tagsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTag: {
    backgroundColor: '#1C1F2B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardTagText: {
    color: '#8A8F9E',
    fontSize: 12
  },

  // Botones de acción
  actionButtonsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1F2229',
  },
  actionBtnLeft: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#1F2229',
  },
  actionBtnRight: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center'
  },
  actionBtnTextBlue: {
    color: '#6C63FF', 
    fontWeight: 'bold'
  },
  actionBtnTextRed: {
    color: '#FF4D4D', 
    fontWeight: 'bold'
  },
  actionBtnTextGreen: {
    color: '#4ADE80', 
    fontWeight: 'bold'
  },

  // Helper card
  helperCardInner: {
    flexDirection: 'row',
    backgroundColor: '#1C1F2B',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  avatarMini: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    marginRight: 10 
  },
  avatarFallback: {
    backgroundColor: '#2D3243',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#8A8F9E', 
    fontSize: 13, 
    fontWeight: 'bold' 
  },
  helperInfo: {
    flex: 1
  },
  helperName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14
  },
  helperCareer: {
    color: '#8A8F9E',
    fontSize: 11
  },
  helperRight: {
    alignItems: 'flex-end'
  },
  enChatText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: 'bold'
  },
  ratingTextInner: {
    color: '#A0A4B8',
    fontSize: 11
  },

  // Nuevo ticket
  newTicketBtn: {
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#1F2229',
    borderStyle: 'dashed',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newTicketText: {
    color: '#8A8F9E'
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    color: '#5E6376',
    textAlign: 'center',
    fontSize: 14
  },
  emptyStateBtn: {
    marginTop: 4,
    backgroundColor: 'rgba(108,99,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  emptyStateBtnText: {
    color: '#6C63FF',
    fontWeight: 'bold'
  },

  // Historial
  sectionHeader: {
    color: '#5E6376',
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  historyCard: {
    backgroundColor: '#15171E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  historyTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  historyTypeText: {
    color: '#5E6376',
    fontSize: 11
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  historyTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  historyDetail: {
    color: '#5E6376',
    fontSize: 12
  },
  valoracionBtn: {
    borderTopWidth: 1,
    borderTopColor: '#1F2229',
    marginTop: 12,
    paddingTop: 12,
    alignItems: 'center',
  },
  valoracionText: {
    color: '#FFD166',
    fontWeight: 'bold',
    fontSize: 13 },

  // Loading
  loadingContainer:{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16
  },

  // Modales
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContentBottom: {
    backgroundColor: '#15171E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#2D3243',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  modalTitleLarge: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  modalSubtitleLarge: {
    color: '#8A8F9E',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  sectionLabelModal: {
    color: '#5E6376',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  reasonItem: {
    backgroundColor: '#1C1F2B',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  reasonItemSelected: {
    borderColor: '#FF4D4D',
    backgroundColor: 'rgba(255, 77, 77, 0.05)',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10 },
  reasonText: {
    color: '#D1D5DB',
    flex: 1
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#3D4255',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#FF4D4D'
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4D',
  },
  btnConfirmRed: {
    backgroundColor: '#FF4D4D',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnKeepDark: {
    backgroundColor: '#1C1F2B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnTextWhiteBold: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  btnDisabled: {
    opacity: 0.45

  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContentCenter: {
    backgroundColor: '#15171E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  modalTitleCenter: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitleCenter: {
    color: '#8A8F9E',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10
  },
  modalBtnBase: {
    flex: 1,
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalBtnDestructive: {
    backgroundColor: 'rgba(255,77,77,0.08)',
    borderColor: 'rgba(255,77,77,0.3)',
  },
  modalBtnDefault: {
    backgroundColor: '#1C1F2B',
    borderColor: '#2D3243',
  },
  modalBtnCancelStyle: {
    backgroundColor: 'transparent',
    borderColor: '#2D3243',
  },
  modalBtnText: {
    fontWeight: '600',
    fontSize: 15
  },

  // Valoración
  modalContentCenterLarge: {
    backgroundColor: '#15171E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pointsText: {
    color: '#FFD166',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderColor: '#6C63FF',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingBadgeText: {
    color: '#6C63FF',
    fontSize: 12
  },
  ratingFeedback: {
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  modalBtnCancel: {
    flex: 1,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnKeep: {
    flex: 1,
    backgroundColor: '#1C1F2B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnTextRed: {
    color: '#FF4D4D',
    fontWeight: 'bold'
  },
  modalBtnTextWhite: {
    color: '#FFF',
    fontWeight: 'bold'
  },
});