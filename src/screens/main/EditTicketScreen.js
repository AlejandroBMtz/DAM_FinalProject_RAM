import React, { useState, useEffect, useCallback } from 'react';
import { View,  Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Modal, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// --- Importaciones reales de Firebase ---
import { db } from '../../services/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore'; 

export default function EditTicketScreen({ route, navigation }) {
  // Recibimos los datos del ticket a editar mediante los parámetros de navegación
  const { ticketData } = route.params || {};

  // Inicializamos los estados con la informacion existente
  const [titulo, setTitulo] = useState(ticketData?.titulo || '');
  const [desc, setDesc] = useState(ticketData?.desc || '');
  const [selectedSkills, setSelectedSkills] = useState(ticketData?.etiquetas || []);
  const [prioridad, setPrioridad] = useState(ticketData?.prioridad || null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const HABILIDADES_INFORMATICA = [
    'Programación', 'Python', 'Álgebra', 'Cálculo', 'Diseño', 
    'JavaScript', 'Algoritmos', 'React Native', 'Node.js', 
    'UX/UI', 'Figma', 'Recursión', 'Java', 'Express'
  ];

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((item) => item !== skill));
    } else if (selectedSkills.length < 3) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const togglePrio = (prio) => {
    if (prioridad === prio) {
      setPrioridad(null);
    } else {
      setPrioridad(prio);
    }
  }

  const guardarCambios = async () => {
    if (selectedSkills.length === 0) {
      Alert.alert("Atención", "Favor de seleccionar al menos una etiqueta para la solicitud.");
      return;
    } 

    if (!titulo || !desc) {
      Alert.alert("Error", "Faltan datos en el registro.");
      return;
    }

    if (!prioridad) {
      Alert.alert("Atención", "Por favor selecciona un nivel de urgencia.");
      return;
    }

    setLoading(true);

    try {
      // Referencia directa al documento existente
      const ticketRef = doc(db, "solicitudes", ticketData.id);
      
      await updateDoc(ticketRef, {
        titulo: titulo,
        desc: desc,
        etiquetas: selectedSkills,
        prioridad: prioridad,
        fechaActualizacion: new Date().toISOString()
      });

      // Mostramos el modal de exito
      setShowSuccessModal(true);

      // Esperamos 2 segundos y luego navegamos de regreso
      setTimeout(() => {
        setShowSuccessModal(false);
        navigation.goBack();
      }, 2000);

    } catch (error) {
      console.log("Error en Firebase al editar:", error);
      Alert.alert("Error de Actualización", error.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />
      
      {/* Header estilo "Regresar" */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <View style={styles.backButtonIcon}>
            <Ionicons name="arrow-back" size={20} color="#8A8F9E" />
          </View>
          <Text style={styles.backText}>Regresar</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.creaTicket}>Edita tu ticket</Text>
          <Text style={styles.creaSub}>Alguien de la facultad puede ayudarte</Text>
        </View>

        <Text style={styles.sectionLabel}>TÍTULO DEL PROBLEMA</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: No entiendo recursividad en Python"
          placeholderTextColor="#5E6376"
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={styles.sectionLabel}>DESCRIPCIÓN DETALLADA</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Explica tu duda con más detalle.&#10;Entre más info, más fácil es ayudarte..."
          placeholderTextColor="#5E6376"
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
          value={desc}
          onChangeText={setDesc}
        />

        <Text style={styles.sectionLabel}>NIVEL DE URGENCIA</Text>
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
            <Text style={styles.prioText}>Alta</Text>
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
            <Text style={styles.prioText}>Media</Text>
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
            <Text style={styles.prioText}>Baja</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>ETIQUETAS (MÁX. 3)</Text>
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

        <TouchableOpacity style={styles.submit} onPress={guardarCambios} disabled={loading}>
          <Text style={styles.submitText}>Guardar Cambios</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de exito automatico */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentCenter}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4ADE80" />
            </View>
            <Text style={styles.modalTitleCenter}>Editado correctamente</Text>
            <Text style={styles.modalSubtitleCenter}>Tus cambios han sido guardados.</Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D3243',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backText: {
    color: '#8A8F9E',
    fontSize: 15,
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
    fontSize: 14,
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
    width: 20,
    height: 20,
    borderRadius: 10,
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
  
  // Estilos del Modal
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContentCenter: {
    backgroundColor: '#15171E',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  successIconContainer: {
    marginBottom: 15,
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
    fontSize: 14,
    textAlign: 'center',
  }
});