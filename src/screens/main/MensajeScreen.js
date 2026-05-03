import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, query, where, getDocs, orderBy, or, doc, getDoc, addDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';

export default function MensajeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [message, setMessage] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);

  const conversacionData = route.params?.conversacionData;
  const title =
    route.params?.nombre ||
    conversacionData?.nombre ||
    'Mensaje';
  
  //const unsub = onSnapshot(doc(db, "conversaciones", conversacionData?.id), (doc) => {
    //obtenerMensajes;
  //});

  const handleSend = async () => {

    const convoUid = conversacionData?.id;

    if ( message == '' ) {
      return;
    }

    setLoading(true);

    try{
      await addDoc(collection(db, "mensajes"), {
        idConversacion: convoUid,
        idUsuario: auth.currentUser.uid,
        texto: message,
        tiempoEnviado: new Date().toISOString()
      });
      await setDoc(doc(db, "conversaciones", convoUid), {
        ultimoMensaje: message,
        ultimaActividad: new Date().toISOString()
      }, {merge: true})
      console.log("Éxito");

    } catch (error) {
      console.log("Error en Firebase:", error);
      Alert.alert("Error de Registro", error.message || String(error));
    } finally {
      setLoading(false);
      setMessage('');
    };
    
  };

  const obtenerMensajes = async () => {
    const convoUid = conversacionData?.id;

    if (!convoUid) {
      console.log('Conversación inválida: falta id de conversación');
      setMensajes([]);
      setLoading(false);
      return;
    }

    try {
      const msgRef = collection(db, 'mensajes');
      const q = query(
        msgRef,
        where('idConversacion', '==', convoUid),
        orderBy('tiempoEnviado')
      );
      
      const unsub = onSnapshot(q, (querySnapshot) => {
        const results = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setMensajes(results);
      })
    } catch (error) {
      console.log('Error al obtener mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerMensajes();
  }, []);

  let scrollViewRef = null;


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>

        {loading ? (
          <Text style={styles.infoText}>Cargando...</Text>
        ) : mensajes.length === 0 ? (
          <Text style={styles.bodyPlaceholder}>Aquí aparecerá la conversación con {title}.</Text>
        ) : (
          <ScrollView
            ref={(ref) => {
            scrollViewRef = ref;
          }}
          onContentSizeChange={() => {
            if (scrollViewRef) {
              scrollViewRef.scrollToEnd({ animated: true });
            }
          }}
            style={styles.scrollView}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {mensajes.map((msg) => (
              <View 
                key={msg.id}
                style={[
                styles.cuerpoMensaje,
                (msg.idUsuario != auth.currentUser.uid) ? styles.cuerpoRecibido : styles.cuerpoEnviado
                ]}
              >
                <Text style={[
                  styles.textoMensaje,
                  msg.idUsuario === auth.currentUser.uid && styles.textoEnviado
                ]}>{msg.texto}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#8B95A1"
            multiline={false}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.8}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 30,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E242F',
    backgroundColor: '#0B0D14',
  },
  backButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  headerSpacer: {
    width: 40,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  bodyPlaceholder: {
    color: '#8892A3',
    fontSize: 15,
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E242F',
    backgroundColor: '#0B0D14',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 999,
    backgroundColor: '#161920',
    color: '#FFF',
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  sendButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cuerpoMensaje: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 15,
    width: "80%",
  }, 
  cuerpoEnviado: {
    backgroundColor: "#265BA6",
    alignSelf: "flex-end",
    marginLeft: 40,
    marginVertical: 6,
    justifyContent: "flex-end",
    alignItems: 'flex-end',
    width: "auto"
  },
  cuerpoRecibido: {
    backgroundColor: "#161920",
    alignSelf: "flex-start",
    marginRight: 40,
    marginVertical: 6,
    width: "auto"
  },
  textoMensaje: {
    color: "#fff"
  },
  textoEnviado: {
    textAlign: 'right',
  },
  scrollView: {
    width: '100%',
  },
  listContainer: {
    width: '100%',
  },
});