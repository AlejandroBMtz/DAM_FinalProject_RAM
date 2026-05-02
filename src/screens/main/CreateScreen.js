import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// --- Importaciones reales de Firebase ---
import { auth, db } from '../../services/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore'; 


export default function crear({ route, navigation }) {
  const [titulo, setTitulo] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prioridad, setPrioridad] = useState(null);

  const HABILIDADES_INFORMATICA = [
    'Programación', 'Python', 'Álgebra', 'Cálculo', 'Diseño', 
    'JavaScript', 'Algoritmos', 'React Native', 'Node.js', 
    'UX/UI', 'Figma', 'Recursión', 'Java', 'Express', 
    'Base de Datos', 'SQL', 'NoSQL', 'AWS', 'Octave'
  ];

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((item) => item !== skill));
    } else {
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

  const crearSolicitud = async () => {

    if (selectedSkills.length === 0) {
      Alert.alert("Atención", "Favor de seleccionar etiquetas para la solicitud.");
      return;
    } else if (selectedSkills.length > 3) {
      Alert.alert("Atención", "Favor de seleccionar un máximo de tres etiquetas para la solicitud.");
      return;
    }

    if (!titulo || !desc) {
      Alert.alert("Error", "Faltan datos de registro.");
      return;
    }

    setLoading(true);

    try{
      await addDoc(collection(db, "solicitudes"), {
        titulo: titulo,
        desc: desc,
        etiquetas: selectedSkills,
        usuario: auth.currentUser.uid,
        prioridad: prioridad,
        fechaCreacion: new Date().toISOString()
      });
      console.log("Éxito");

      navigation.navigate('Inicio', { screen: 'myTicket' });
    } catch (error) {
      console.log("Error en Firebase:", error);
      Alert.alert("Error de Registro", error.message || String(error));
    } finally {
      setLoading(false);
    };
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedir Ayuda</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Inicio', { screen: 'Notifications' })}>
          <Ionicons name="notifications" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.creaTicket}>Crea tu ticket</Text>
        <Text style={styles.creaSub}>Busca personas que te ayuden</Text>
        <Text style={styles.label}>Título del problema:</Text>
        <TextInput
          style={styles.input}
          placeholder="Título"
          placeholderTextColor="#7E8494"
          value={titulo}
          onChangeText={(text) => {
            setTitulo(text);
          }}>
        </TextInput>
        <Text style={styles.label}>Descripción del problema:</Text>
        <TextInput
          style={styles.input}
          placeholder="Descripción"
          placeholderTextColor="#7E8494"
          multiline={true}
          value={desc}
          onChangeText={(text) => {
            setDesc(text);
          }}>
        </TextInput>

        <Text style={styles.categoryTitle}>Prioridad</Text>

        <View style={styles.prioridades}>
          <TouchableOpacity 
            style={[
              styles.tagPrio, 
              (prioridad == 1) ? styles.tagSelected : styles.tagUnselected
            ]}
            onPress={() => togglePrio(1)}
            activeOpacity={0.7}
          >
            <Ionicons name="alert-circle-sharp" size={24} color="red" />
            <Text style={[
              styles.tagText,
              (prioridad == 1) ? styles.tagTextSelected : styles.tagTextUnselected
            ]}>
              Alta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tagPrio, 
              (prioridad == 2) ? styles.tagSelected : styles.tagUnselected
            ]}
            onPress={() => togglePrio(2)}
            activeOpacity={0.7}
          >
            <Ionicons name="alert-circle-sharp" size={24} color="yellow" />
            <Text style={[
              styles.tagText,
              (prioridad == 2) ? styles.tagTextSelected : styles.tagTextUnselected
            ]}>
              Media
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tagPrio, 
              (prioridad == 3) ? styles.tagSelected : styles.tagUnselected
            ]}
            onPress={() => togglePrio(3)}
            activeOpacity={0.7}
          >
            <Ionicons name="alert-circle-sharp" size={24} color="green" />
            <Text style={[
              styles.tagText,
              (prioridad == 3) ? styles.tagTextSelected : styles.tagTextUnselected
            ]}>
              Baja
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.categoryTitle}>Etiquetas (Máx. 3)</Text>
        
        <View style={styles.tagsContainer}>
          {HABILIDADES_INFORMATICA.map((skill, index) => {
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

        <TouchableOpacity style={styles.submit} onPress={crearSolicitud} disabled={loading}>
          <Text style={styles.submitText}>Crear Solicitud</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 15,
    width: '100%',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  text: {
    color: '#fff',
  },
  titulo: {
    height: "20%",
    width: "90%",
    alignSelf: "center"
  },
  creaTicket: {
    color: "#ffffff",
    fontSize: 24,
    alignSelf: "center",
    fontWeight: "bold"
  },
  creaSub: {
    color: "#878FA9",
    fontSize: 14,
    alignSelf: "center",
    marginBottom: 25,
    marginTop: 10
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  categoryTitle: {
    color: '#7E8494',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, 
  },
  tag: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagPrio: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    height: "100%",
    width: "30%"
  },
  tagUnselected: {
    backgroundColor: '#1C1F2B', 
    borderColor: '#2D3243',     
  },
  tagSelected: {
    backgroundColor: 'rgba(67, 56, 202, 0.15)', 
    borderColor: '#6C63FF',                     
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagTextUnselected: {
    color: '#7E8494', 
  },
  tagTextSelected: {
    color: '#8B85FF', 
  },
  input: {
    color: '#FFFFFF',
    fontSize: 15,
    backgroundColor: '#1C1F2B', 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D3243',
    marginBottom: 20
  },
  label: {
    color: "#878FA9",
    marginBottom: 10,
    fontSize: 16,
  },
  submit: {
    backgroundColor: '#2563EB', 
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 30
  },
  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold"
  },
  prioridades: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: "7%"
  }
});