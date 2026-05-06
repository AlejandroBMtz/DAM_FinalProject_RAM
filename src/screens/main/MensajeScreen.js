import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, StatusBar, ScrollView, ImageBackground, Image, Keyboard, Animated, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { collection, query, where, orderBy, doc, addDoc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';


// Hook: mide la altura real del teclado en el dispositivo actual y la devuelve en tiempo real

function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // iOS dispara Will* antes de la animación → transición suave sin salto.
    // Android solo tiene Did*, que igualmente funciona bien.
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

// Componente principal
export default function MensajeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef(null);

  const [message, setMessage] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);

  const keyboardHeight = useKeyboardHeight();

  const conversacionData = route.params?.conversacionData;
  const title = route.params?.nombre || conversacionData?.nombre || 'Usuario';
  const fotoUrl = conversacionData?.fotoUrl;

  // Enviar mensaj
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
      await setDoc(
        doc(db, 'conversaciones', convoUid),
        {
          ultimoMensaje: message,
          ultimaActividad: new Date().toISOString(),
        },
        { merge: true }
      );
      // Quien envia el mensaje
      const currentUid = auth.currentUser.uid;
      // quien es quien 
      const otherUid = conversacionData.solicitante === currentUid
        ? conversacionData.ayudante
        : conversacionData.solicitante;

      // Buscar el token del otro
      if (otherUid) {

        await addDoc(collection(db, 'notificaciones'), {
          usuarioId: otherUid,
          tipo: 'mensaje',
          titulo: `Nuevo mensaje`,
          descripcion: message.length > 30 ? message.substring(0, 30) + '...' : message,
          leida: false,
          fecha: new Date().toISOString()
        });

        const otherUserSnap = await getDoc(doc(db, 'users', otherUid));
        if (otherUserSnap.exists()) {
          const otherUserData = otherUserSnap.data();

          if (otherUserData.pushToken) {
            // peticion al servidor
            const pushMessage = {
              to: otherUserData.pushToken,
              sound: 'default',
              title: `Nuevo mensaje de ${auth.currentUser.displayName || 'un compañero'}`,
              body: message,
              data: { conversacionId: convoUid }, // Datos extra para saber qué chat abrir si la tocan
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
            console.log("Notificación enviada al token:", otherUserData.pushToken);
          }
        }
      }
    } catch (error) {
      console.log('Error en Firebase:', error);
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  //escuchar mensajes en tiempo real
  const obtenerMensajes = () => {
    const convoUid = conversacionData?.id;

    if (!convoUid) {
      setMensajes([]);
      setLoading(false);
      return;
    }

    const msgRef = collection(db, 'mensajes');
    const q = query(
      msgRef,
      where('idConversacion', '==', convoUid),
      orderBy('tiempoEnviado')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setMensajes(results);
        setLoading(false);
      },
      (error) => {
        console.log('Error al obtener mensajes:', error);
        setLoading(false);
      }
    );

    // Devolver unsub para limpiar el listener al desmontar
    return unsub;
  };

  // Ocultar TabBar al entrar
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({ tabBarStyle: { display: 'none' } });
      }
      return () => {
        if (parent) {
          parent.setOptions({ tabBarStyle: { display: 'flex' } });
        }
      };
    }, [navigation])
  );

  // Montar listener
  useEffect(() => {
    const unsub = obtenerMensajes();
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  //Scroll al último mensaje
  useEffect(() => {
    if (mensajes.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [mensajes]);

  //Scroll al abrir teclado
  useEffect(() => {
    if (keyboardHeight > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [keyboardHeight]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D14" />

      {/*HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Image
          source={fotoUrl ? { uri: fotoUrl } : require('../../../assets/images/Logo.png')}
          style={styles.avatar}
        />

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <TouchableOpacity style={styles.terminarBtn}>
          <Text style={styles.terminarText}>Terminar</Text>
        </TouchableOpacity>
      </View>

      {/*areas de mensaje*/}
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
          {loading && mensajes.length === 0 ? (
            <Text style={styles.infoText}>Cargando...</Text>
          ) : mensajes.length === 0 ? (
            <Text style={styles.infoText}>Inicia la conversación.</Text>
          ) : (
            mensajes.map((msg) => {
              const esMio = msg.idUsuario === auth.currentUser.uid;
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.cuerpoMensaje,
                    esMio ? styles.cuerpoEnviado : styles.cuerpoRecibido,
                  ]}
                >
                  <Text style={styles.textoMensaje}>{msg.texto}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </ImageBackground>

      {/* barra de imput */}
      <View style={[styles.inputRow, { marginBottom: keyboardHeight + 50 }]}>
        <View style={styles.inputLeftIcons}>
          <Ionicons name="mail-outline" size={22} color="#8A8F9E" />
          <View style={styles.verticalDivider} />
        </View>

        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#8A8F9E"
          multiline={true}
        />

        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="attach-outline" size={26} color="#8A8F9E" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
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
    paddingTop: Platform.OS === 'ios' ? 10 : 45,
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
  infoText: {
    color: '#8A8F9E',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
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
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  attachButton: {
    paddingHorizontal: 10,
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
});