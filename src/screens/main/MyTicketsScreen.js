import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Image, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

//DATOS SIMULADOS PARA HISTORIAL
const MOCK_HISTORIAL = [
  { id: 'h1', titulo: 'Árbol AVL — Rotaciones', estado: 'Resuelto', detalle: 'Ayudé a Sofía M.', tiempo: 'hace 2 días', valoracion: true },
  { id: 'h2', titulo: 'SQL Joins avanzados', estado: 'Expirado', detalle: 'Sin respuesta', tiempo: 'hace 5 días', valoracion: false },
  { id: 'h3', titulo: 'Recursividad en Python', estado: 'Cancelado', detalle: 'Cancelado por mí', tiempo: 'hace 6 días', valoracion: false },
];

export default function MyTicketsScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  // Estados principales
  const [activeTab, setActiveTab] = useState(0);
  const [solicitudes, setSolicitudes] = useState([]);
  const [ayudando, setAyudando] = useState([]); // Próximamente lo llenarás con Firebase
  const [loading, setLoading] = useState(true);

  // Estados de Modales
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [abandonModalVisible, setAbandonModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  
  // Seleccion actual para modales
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);

  const razonesCancelar = [
    'Ya resolví mi solicitud por otro medio',
    'El voluntario no se presentó',
    'Publiqué el ticket por error',
    'Otro motivo'
  ];

  const razonesAbandonar = [
    'No hubo comunicación',
    'El solicitante no se presentó',
    'Acepté el ticket por error',
    'Otro motivo'
  ];

  const obtenerDatos = async () => {
    setLoading(true);
    try {
      // 1. Obtener mis solicitudes
      const solRef = collection(db, 'solicitudes');
      const q = query(solRef, where('usuario', '==', auth.currentUser.uid), orderBy("fechaCreacion", "desc"));

      const unsub = onSnapshot(q, async (querySnapshot) => {
        const results = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            estado: data.estado || 'disponible' 
          };
        }));
        setSolicitudes(results);
      });

      // 2. Aqui obtendrias las ayudas que estas dando (mockeado por ahora para ver el diseño)
      setAyudando([
        { id: 'a1', titulo: '¿Alguien entiende integrales por partes?', estado: 'en proceso', usuarioInfo: { nombre: 'Jesus Enrique', carrera: 'Ing. Software · 6° Semestre', rating: '4.8', avatar: null }, etiquetas: ['Cálculo', 'Matemáticas'], prioridad: 2, fechaCreacion: new Date().toISOString() },
        { id: 'a2', titulo: 'Proyecto de diseño UI — necesito feedback', estado: 'en proceso', usuarioInfo: { nombre: 'Mateo Dwyer', carrera: 'Ing. Software · 6° Semestre', rating: '4.8', avatar: null }, etiquetas: ['Figma', 'UX/UI'], prioridad: 1, fechaCreacion: new Date().toISOString() }
      ]);

    } catch (error) {
      console.log('Error al obtener datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      obtenerDatos();
    }, [])
  );

  const handleTabChange = (index) => {
    setActiveTab(index);
    scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    if (activeTab !== index) {
      setActiveTab(index);
    }
  };

  // Acciones de los botones
  const confirmarEliminacion = async () => {
    if(selectedTicket) {
      try {
        await deleteDoc(doc(db, "solicitudes", selectedTicket.id));
        setSolicitudes(solicitudes.filter(t => t.id !== selectedTicket.id));
      } catch (error) {
        console.log("Error al eliminar", error);
      }
    }
    setDeleteModalVisible(false);
  };

  const confirmarCancelacion = () => {
    console.log("Cancelando con motivo:", selectedReason);
    setCancelModalVisible(false);
    setSelectedReason(null);
  };

  const irAlChat = async (ticket) => {
    try {
      // 1. Buscar la conversacion vinculada a este ticket
      const convRef = collection(db, 'conversaciones');
      const q = query(convRef, where('solicitudId', '==', ticket.id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const convoData = docSnap.data();
        
        // 2. Identificar quién es el "otro" usuario para poner su nombre en el Header del chat
        const currentUid = auth.currentUser.uid;
        const otherUid = convoData.solicitante === currentUid ? convoData.ayudante : convoData.solicitante;
        
        let nombreOtroUsuario = "Usuario";
        if (otherUid) {
          const userSnap = await getDoc(doc(db, 'users', otherUid));
          if (userSnap.exists()) {
            nombreOtroUsuario = userSnap.data().nombre || "Usuario";
          }
        }

        // 3. Construir la data completa
        const fullConvoData = {
          id: docSnap.id,
          nombre: nombreOtroUsuario,
          ...convoData
        };

        // 4. Navegar directo a la pantalla de MensajeScreen dentro del Stack de Mensajes
        navigation.navigate('Mensajes', { 
          screen: 'MensajeScreen', 
          params: { conversacionData: fullConvoData } 
        });
      } else {
        Alert.alert("Atención", "Aún no hay un chat creado para esta solicitud.");
      }
    } catch (error) {
      console.log("Error al abrir chat:", error);
      Alert.alert("Error", "No se pudo abrir la conversación.");
    }
  };

  const confirmarAbandono = () => {
    console.log("Abandonando con motivo:", selectedReason);
    setAbandonModalVisible(false);
    setSelectedReason(null);
  };

  const renderStatusBadge = (estado) => {
    if (estado === 'disponible') {
      return (
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: '#FFD166' }]} />
          <Text style={[styles.statusText, { color: '#FFD166' }]}>Sin voluntario aún</Text>
        </View>
      );
    }
    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: '#4ADE80' }]} />
        <Text style={[styles.statusText, { color: '#4ADE80' }]}>Asignada</Text>
      </View>
    );
  };

  // SECCIONES (TABS)
  const renderSolicite = () => (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.listContent}>
      {solicitudes.map((ticket) => (
        <View key={ticket.id} style={styles.card}>
          <View style={styles.cardHeaderTop}>
            <Text style={styles.cardTitle}>{ticket.titulo}</Text>
            <View style={styles.priorityMiniBadge}>
              <Text style={styles.priorityMiniText}>{ticket.prioridad === 1 ? 'Alta' : ticket.prioridad === 2 ? 'Media' : 'Baja'}</Text>
            </View>
          </View>
          
          <View style={styles.cardMetaRow}>
            {renderStatusBadge(ticket.estado)}
            <Text style={styles.timeText}>hace 10 min</Text>
          </View>

          <View style={styles.tagsContainer}>
            {ticket.etiquetas?.slice(0, 2).map((tag, idx) => (
              <View key={idx} style={styles.cardTag}><Text style={styles.cardTagText}>{tag}</Text></View>
            ))}
          </View>

          {/* Si esta asignada, mostramos al ayudante */}
          {ticket.estado === 'en proceso' && (
            <View style={styles.helperCardInner}>
              <Image source={require('../../../assets/images/Logo.png')} style={styles.avatarMini} />
              <View style={styles.helperInfo}>
                <Text style={styles.helperName}>Diego Martell</Text>
                <Text style={styles.helperCareer}>Ing. Software · 6° Semestre</Text>
              </View>
              <View style={styles.helperRight}>
                <Text style={styles.enChatText}>• En chat</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 2}}>
                  <Ionicons name="star" size={12} color="#FFD166" />
                  <Text style={styles.ratingTextInner}> 4.6</Text>
                </View>
              </View>
            </View>
          )}

          {/* Botones de Accion */}
          <View style={styles.actionButtonsRow}>
            {ticket.estado === 'disponible' ? (
              <>
                <TouchableOpacity style={styles.actionBtnLeft}
                // Navegamos directo a EditarTicketScreen porque estaan en el mismo Stack
                onPress={() => navigation.navigate('EditarTicketScreen', { ticketData: ticket })}>
                  <Text style={styles.actionBtnTextBlue}>Ver y editar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtnRight} 
                  onPress={() => { setSelectedTicket(ticket); setDeleteModalVisible(true); }}>
                  <Text style={styles.actionBtnTextRed}>Eliminar</Text>
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
        <Text style={styles.newTicketText}>¿Necesitas más ayuda? <Text style={{color: '#6C63FF', fontWeight: 'bold'}}>Crear nuevo ticket</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderAyudando = () => (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.listContent}>
      {ayudando.map((ticket) => (
        <View key={ticket.id} style={styles.card}>
          <View style={styles.cardMetaRowTop}>
            <View style={styles.priorityMiniBadge}>
              <Text style={styles.priorityMiniText}>{ticket.prioridad === 1 ? 'Alta' : 'Media'}</Text>
            </View>
            <Text style={styles.timeText}>hace 10 min</Text>
          </View>
          
          <Text style={styles.cardTitle}>{ticket.titulo}</Text>

          <View style={styles.helperCardInner}>
            <Image source={require('../../../assets/images/Logo.png')} style={styles.avatarMini} />
            <View style={styles.helperInfo}>
              <Text style={styles.helperName}>{ticket.usuarioInfo.nombre}</Text>
              <Text style={styles.helperCareer}>{ticket.usuarioInfo.carrera}</Text>
            </View>
            <View style={styles.helperRight}>
              <Text style={styles.enChatText}>• En chat</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 2}}>
                <Ionicons name="star" size={12} color="#FFD166" />
                <Text style={styles.ratingTextInner}> {ticket.usuarioInfo.rating}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {ticket.etiquetas.map((tag, idx) => (
              <View key={idx} style={styles.cardTag}><Text style={styles.cardTagText}>{tag}</Text></View>
            ))}
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionBtnLeft} onPress={() => irAlChat(ticket)}>
              <Text style={styles.actionBtnTextGreen}>Ir al chat</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtnRight}
              onPress={() => { setSelectedTicket(ticket); setAbandonModalVisible(true); }}
            >
              <Text style={styles.actionBtnTextRed}>Abandonar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderHistorial = () => (
    <ScrollView style={styles.pageContainer} contentContainerStyle={styles.listContent}>
      <Text style={styles.sectionHeader}>Última semana</Text>
      {MOCK_HISTORIAL.map((item) => (
        <View key={item.id} style={styles.historyCard}>
          <View style={styles.historyTopRow}>
            <Text style={styles.historyTitle}>{item.titulo}</Text>
            <View style={[styles.historyBadge, 
              item.estado === 'Resuelto' ? {backgroundColor: 'rgba(74, 222, 128, 0.1)'} : 
              item.estado === 'Expirado' ? {backgroundColor: 'rgba(255, 209, 102, 0.1)'} : 
              {backgroundColor: 'rgba(255, 77, 77, 0.1)'}
            ]}>
              <Text style={[styles.historyBadgeText,
                item.estado === 'Resuelto' ? {color: '#4ADE80'} : 
                item.estado === 'Expirado' ? {color: '#FFD166'} : 
                {color: '#FF4D4D'}
              ]}>{item.estado}</Text>
            </View>
          </View>
          <Text style={styles.historyDetail}>{item.detalle}  •  {item.tiempo}</Text>
          
          {item.valoracion && (
            <TouchableOpacity 
              style={styles.valoracionBtn}
              onPress={() => setRatingModalVisible(true)}
            >
              <Text style={styles.valoracionText}>Ver valoración</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );

  // Calcular el total de tickets activos sumando las solicitudes y las ayudas actuales
  const ticketsActivos = solicitudes.length + ayudando.length;
  return (
    <View style={styles.container}>
      {/* HEADER SUPERIOR */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Tickets</Text>
          <Text style={styles.headerSubtitle}>Gestiona tus solicitudes y ayudas</Text>
        </View>
        <View style={styles.activosBadge}>
          <Text style={styles.activosTextNum}>{ticketsActivos}</Text>
          <Text style={styles.activosTextStr}>activos</Text>
        </View>
      </View>

      {/* SELECTOR DE PESTAÑAS */}
      <View style={styles.tabsContainer}>
        {['Solicité', 'Ayudando', 'Historial'].map((tab, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.tabButton, activeTab === index && styles.tabButtonActive]}
            onPress={() => handleTabChange(index)}
          >
            <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* VISTAS DESLIZABLES */}
      {loading ? (
        <Text style={styles.infoText}>Cargando...</Text>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={{ flex: 1 }}
        >
          {renderSolicite()}
          {renderAyudando()}
          {renderHistorial()}
        </ScrollView>
      )}

      {/* MODAL ELIMINAR SOLICITUD */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentCenter}>
            <Ionicons name="warning" size={32} color="#FFD166" style={{alignSelf: 'center', marginBottom: 10}}/>
            <Text style={styles.modalTitleCenter}>¿Seguro desea eliminar su solicitud?</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={confirmarEliminacion}>
                <Text style={styles.modalBtnTextRed}>Sí</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnKeep} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalBtnTextWhite}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CANCELAR CON VOLUNTARIO */}
      <Modal visible={cancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalContentBottom}>
            <View style={styles.dragIndicator} />
            <Ionicons name="warning" size={32} color="#FFD166" style={{alignSelf: 'center'}}/>
            <Text style={styles.modalTitleLarge}>¿Cancelar con voluntario asignado?</Text>
            <Text style={styles.modalSubtitleLarge}>El voluntario ya está ayudándote. Cancelar afectará su karma y el tuyo.</Text>
            
            <Text style={styles.sectionLabelModal}>NIVEL DE URGENCIA</Text>
            {razonesCancelar.map((razon, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.reasonItem, selectedReason === razon && styles.reasonItemSelected]}
                onPress={() => setSelectedReason(razon)}
              >
                <Text style={styles.reasonText}>{razon}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.btnConfirmRed} onPress={confirmarCancelacion}>
              <Text style={styles.btnTextWhiteBold}>Confirmar cancelación</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnKeepDark} onPress={() => setCancelModalVisible(false)}>
              <Text style={styles.btnTextWhiteBold}>Mantener ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ABANDONAR AYUDA */}
      <Modal visible={abandonModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalContentBottom}>
            <View style={styles.dragIndicator} />
            <Ionicons name="ban" size={32} color="#FF4D4D" style={{alignSelf: 'center'}}/>
            <Text style={styles.modalTitleLarge}>¿Abandonar esta ayuda?</Text>
            <Text style={styles.modalSubtitleLarge}>Si abandonas sin completar la sesión, tu karma puede verse afectado.</Text>
            
            <Text style={styles.sectionLabelModal}>MOTIVO DE ABANDONO</Text>
            {razonesAbandonar.map((razon, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.reasonItem, selectedReason === razon && styles.reasonItemSelected]}
                onPress={() => setSelectedReason(razon)}
              >
                <Text style={styles.reasonText}>{razon}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.btnConfirmRed} onPress={confirmarAbandono}>
              <Text style={styles.btnTextWhiteBold}>Confirmar cancelación</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnKeepDark} onPress={() => setAbandonModalVisible(false)}>
              <Text style={styles.btnTextWhiteBold}>Mantener ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL VALORACIÓN (SIMULADO) */}
      <Modal visible={ratingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentCenterLarge}>
            <View style={styles.dragIndicator} />
            <View style={styles.starsRow}>
              {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={24} color="#FFD166" style={{marginHorizontal: 2}}/>)}
            </View>
            <Text style={styles.pointsText}>+12 puntos</Text>
            
            <View style={styles.badgesRow}>
              <View style={styles.ratingBadge}><Text style={styles.ratingBadgeText}>😊 Paciente</Text></View>
              <View style={styles.ratingBadge}><Text style={styles.ratingBadgeText}>💡 Claro</Text></View>
              <View style={styles.ratingBadge}><Text style={styles.ratingBadgeText}>⚡ Rápido</Text></View>
            </View>
            <View style={[styles.ratingBadge, {alignSelf: 'center', marginTop: 10}]}>
               <Text style={styles.ratingBadgeText}>📚 Conoce el tema</Text>
            </View>

            <Text style={styles.ratingFeedback}>Explica claramente, domina el tema muy bien y encuentra la forma clara de explicar para que uno entienda.</Text>
            
            <TouchableOpacity style={{marginTop: 20}} onPress={() => setRatingModalVisible(false)}>
              <Text style={{color: '#8A8F9E', textAlign: 'center'}}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  },
  tabButtonActive: {
    backgroundColor: '#6C63FF',
  },
  tabText: {
    color: '#8A8F9E',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
  },
  pageContainer: {
    width: SCREEN_WIDTH,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
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
    fontSize: 18,
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
    fontWeight: 'bold',
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
    alignItems: 'center',
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
    color: '#5E6376', fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  cardTag: {
    backgroundColor: '#1C1F2B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardTagText: { color: '#8A8F9E', 
    fontSize: 12 
  },
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
    alignItems: 'center',
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
    fontSize: 11, fontWeight: 'bold' 
  },
  ratingTextInner: { 
    color: '#A0A4B8', 
    fontSize: 11 
  },
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

// Historial Styles
  sectionHeader: {
    color: '#5E6376',
    marginBottom: 12,
    fontSize: 12,
  },

  historyCard: {
    backgroundColor: '#15171E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1F2229',
  },

  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  historyTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
    flex: 1,
  },

  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  historyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  historyDetail: {
    color: '#5E6376',
    fontSize: 12,
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
  },

  // General Modals
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },

  modalContentBottom: {
    backgroundColor: '#15171E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
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
  },

  sectionLabelModal: {
    color: '#8A8F9E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },

  reasonItem: {
    backgroundColor: '#1C1F2B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1F2229',
  },

  reasonItemSelected: {
    borderColor: '#FF4D4D',
    backgroundColor: 'rgba(255, 77, 77, 0.05)',
  },

  reasonText: {
    color: '#D1D5DB',
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
    fontSize: 16,
  },

  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },

  modalContentCenter: {
    backgroundColor: '#15171E',
    borderRadius: 16,
    padding: 20,
  },

  modalTitleCenter: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
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

  modalContentCenterLarge: {
    backgroundColor: '#15171E',
    borderRadius: 16,
    padding: 24,
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
    fontSize: 12,
  },

  ratingFeedback: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },

  infoText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});