import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import i18next from '../../services/staticTL';

// --- Importaciones reales de Firebase ---
import { auth, db } from '../../services/firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// --- Importar lista de habilidades centralizada ---
import { getAllSkillNames } from '../../utils/tagsList';

export default function Crear({ route, navigation }) {
  const [titulo, setTitulo] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prioridad, setPrioridad] = useState(null);
  
  useFocusEffect(
    useCallback(() => {
      setTitulo('');
      setDesc('');
      setSelectedSkills([]);
      setPrioridad(null);
    }, [])
  );

  // -funcion sin alerta
  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((item) => item !== skill));
    } else if (selectedSkills.length < 3) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const togglePrio = (prio) => {
    if (prioridad == prio) {
      setPrioridad(null);
    } else {
      setPrioridad(prio);
    }
  }

  const CrearSolicitud = async () => {
    if (selectedSkills.length === 0) {
      Alert.alert(i18next.t("error.atencion"), i18next.t("error.seleccionMin"));
      return;
    }

    if (!titulo || !desc) {
      Alert.alert("Error", i18next.t("error.faltanDatos"));
      return;
    }

    if (!prioridad) {
      Alert.alert(i18next.t("error.atencion"), i18next.t("error.seleccionUrgencia"));
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "solicitudes"), {
        titulo: titulo,
        desc: desc,
        etiquetas: selectedSkills,
        usuario: auth.currentUser.uid,
        prioridad: prioridad,
        estado: 'disponible',
        fechaCreacion: new Date().toISOString()
      });
      console.log("Éxito");

      const usersRef = collection(db, 'users');

      const q = query(usersRef, where('habilidades', 'array-contains-any', selectedSkills));
      const querySnapshot = await getDocs(q);

      let tokensToNotify = [];

      for (const documento of querySnapshot.docs) {
        const userData = documento.data();

        // Evitamos al usuario que crea el ticket
        if (documento.id !== auth.currentUser.uid) {

          // Token toke push
          await addDoc(collection(db, 'notificaciones'), {
            usuarioId: documento.id,
            tipo: 'ticket_match',
            tags: selectedSkills,
            leida: false,
            fecha: new Date().toISOString()
          });

          // Guardamos el token para el Push
          if (userData.pushToken) {
            tokensToNotify.push(userData.pushToken);
          }
        }
      }

      // si se encuentra se envia la notificacion
      if (tokensToNotify.length > 0) {
        const pushMessages = tokensToNotify.map(token => ({
          to: token,
          sound: 'default',
          title: "¡Nueva solicitud de ayuda! 🚨",
          body: `Alguien en la facultad necesita ayuda con: ${selectedSkills.join(', ')}. ¡Gana algo de karma!`,
          data: { tipo: 'nueva_solicitud' },
        }));

        //multiples notificaciones
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pushMessages),
        });
        console.log(`Notificaciones enviadas a ${tokensToNotify.length} usuarios.`);
      }

      navigation.navigate('Tickets', { screen: 'MyTicketsMain' });
    } catch (error) {
      console.log("Error en Firebase:", error);
      Alert.alert("Error de Registro", error.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18next.t("crear.titulo")}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.creaTicket}>{i18next.t("crear.subtitulo")}</Text>
          <Text style={styles.creaSub}>{i18next.t("crear.subtexto")}</Text>
        </View>

        <Text style={styles.sectionLabel}>{i18next.t("crear.tituloProblema")}</Text>
        <TextInput
          style={styles.input}
          placeholder={i18next.t("crear.tituloPlace")}
          placeholderTextColor="#5E6376"
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={styles.sectionLabel}>{i18next.t("crear.tituloDesc")}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={i18next.t("crear.descPlace")}
          placeholderTextColor="#5E6376"
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
          value={desc}
          onChangeText={setDesc}
        />

        <Text style={styles.sectionLabel}>{i18next.t("crear.urgencia")}</Text>
        <View style={styles.prioridadesContainer}>
          <TouchableOpacity
            style={[
              styles.prioBox,
              prioridad === 1 ? styles.prioAltaSelected : styles.prioUnselected
            ]}
            onPress={() => togglePrio(1)}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, { backgroundColor: '#FF4D4D' }]} />
            <Text style={styles.prioText}>{i18next.t("prioridad.alta")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.prioBox,
              prioridad === 2 ? styles.prioMediaSelected : styles.prioUnselected
            ]}
            onPress={() => togglePrio(2)}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, { backgroundColor: '#FFD166' }]} />
            <Text style={styles.prioText}>{i18next.t("prioridad.media")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.prioBox,
              prioridad === 3 ? styles.prioBajaSelected : styles.prioUnselected
            ]}
            onPress={() => togglePrio(3)}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, { backgroundColor: '#4ADE80' }]} />
            <Text style={styles.prioText}>{i18next.t("prioridad.baja")}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>{i18next.t("crear.tags")}</Text>
        <View style={styles.tagsContainer}>
          {getAllSkillNames().map((skill, index) => {
            const isSelected = selectedSkills.includes(skill);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tag,
                  isSelected ? styles.tagSelected : styles.tagUnselected
                ]}
                onPress={() => toggleSkill(skill)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tagText,
                  isSelected ? styles.tagTextSelected : styles.tagTextUnselected
                ]}>
                  {skill}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.submit} onPress={CrearSolicitud} disabled={loading}>
          <Text style={styles.submitText}>{i18next.t("crear.crear")}</Text>
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  creaTicket: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  creaSub: {
    color: "#878FA9",
    fontSize: 15,
    marginTop: 8,
  },
  sectionLabel: {
    color: '#8A8F9E',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 15,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 15,
    backgroundColor: '#15171E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D3243',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  prioridadesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 25,
  },
  prioBox: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  prioUnselected: {
    backgroundColor: '#15171E',
    borderColor: '#2D3243',
  },
  prioAltaSelected: {
    backgroundColor: 'rgba(255, 77, 77, 0.05)',
    borderColor: '#FF4D4D',
  },
  prioMediaSelected: {
    backgroundColor: 'rgba(255, 209, 102, 0.05)',
    borderColor: '#FFD166',
  },
  prioBajaSelected: {
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
    borderColor: '#4ADE80',
  },
  dot: {
    width: 25,
    height: 25,
    borderRadius: 15,
    marginBottom: 8,
  },
  prioText: {
    color: '#A0A4B8',
    fontSize: 13,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  tag: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagUnselected: {
    backgroundColor: '#15171E',
    borderColor: '#2D3243',
  },
  tagSelected: {
    backgroundColor: 'rgba(67, 56, 202, 0.15)',
    borderColor: '#6C63FF',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagTextUnselected: {
    color: '#8A8F9E',
  },
  tagTextSelected: {
    color: '#8B85FF',
  },
  submit: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold"
  },
});