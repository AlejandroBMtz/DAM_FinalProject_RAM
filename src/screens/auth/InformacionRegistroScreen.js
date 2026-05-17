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
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import i18next from '../../services/staticTL';

// --- Importaciones reales de Firebase ---
import { auth, db } from '../../services/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 

const HABILIDADES_INFORMATICA = [
  'Programación', 'Python', 'Álgebra', 'Cálculo', 'Diseño', 
  'JavaScript', 'Algoritmos', 'React Native', 'Node.js', 
  'UX/UI', 'Figma', 'Recursión', 'Java', 'Express', 
  'Base de Datos', 'SQL', 'NoSQL', 'AWS', 'Octave'
];

const CARRERAS = [
  'Licenciatura en Informática',
  'Licenciatura en Administración de las TI',
  'Ingeniería de Software',
  'Ingeniería en Computación',
  'Ingeniería en Telecomunicaciones y Redes',
  'Ingeniería en Ciencia y Analítica de Datos',
  'Ingeniería en Tecnologías de Información y Ciberseguridad'
];

const SEMESTRES = ['0','1', '2', '3', '4', '5', '6', '7', '8', '9'];

const InformacionRegistroScreen = ({ route, navigation }) => {
  const { nombre, email, password } = route.params || {};

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para los datos de carrera y semestre
  const [carrera, setCarrera] = useState(null);
  const [semestre, setSemestre] = useState(null);
  
  // Estados para controlar la visibilidad de los modales
  const [modalCarreraVisible, setModalCarreraVisible] = useState(false);
  const [modalSemestreVisible, setModalSemestreVisible] = useState(false);

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((item) => item !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/email-already-in-use': return i18next.t('auth.register.errors.emailInUse');
      case 'auth/invalid-email': return i18next.t('auth.register.errors.invalidEmail');
      case 'auth/weak-password': return i18next.t('auth.register.errors.weakPassword');
      default: return i18next.t('auth.register.errors.default');
    }
  };

  const finalizarRegistro = async () => {
    if (!carrera) {
      Alert.alert(i18next.t('error.atencion'), i18next.t('auth.register.errors.missingCareer'));
      return;
    }

    if (!semestre) {
      Alert.alert(i18next.t('error.atencion'), i18next.t('auth.register.errors.missingSemester'));
      return;
    }

    if (selectedSkills.length === 0) {
      Alert.alert(i18next.t('error.atencion'), i18next.t('auth.register.errors.missingSkills'));
      return;
    }

    if (!email || !password || !nombre) {
      Alert.alert(i18next.t('error.genericHeader'), i18next.t('auth.register.errors.missingRegistrationData'));
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        nombre: nombre.trim(),
        email: email.trim(),
        carrera: carrera,
        semestre: semestre,
        habilidades: selectedSkills,
        fechaRegistro: new Date().toISOString(),
        helpGiven: 0,
        rated: 0,
        helpAsked: 0,
        points: 0
      });

      // Firebase iniciará sesión automáticamente al crear el usuario.

    } catch (error) {
      console.log("Error en Firebase:", error);
      Alert.alert("Error de Registro", getFriendlyError(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D14" />
      
      <View style={styles.header}>
        <Text style={styles.title}>{i18next.t('auth.register.title')}</Text>
        <Text style={styles.subtitle}>{i18next.t('auth.register.subtitle')}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- SELECTOR DE CARRERA --- */}
        <Text style={styles.sectionLabel}>{i18next.t('auth.register.careerLabel')}</Text>
        <TouchableOpacity 
          style={styles.selectorButton} 
          onPress={() => setModalCarreraVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectorText, !carrera && styles.placeholderText]}>
            {carrera ? carrera : i18next.t('auth.register.careerPlaceholder')}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#7E8494" />
        </TouchableOpacity>

        {/* --- SELECTOR DE SEMESTRE --- */}
        <Text style={styles.sectionLabel}>{i18next.t('auth.register.semesterLabel')}</Text>
        <TouchableOpacity 
          style={styles.selectorButton} 
          onPress={() => setModalSemestreVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectorText, !semestre && styles.placeholderText]}>
            {semestre ? `${semestre}° ${i18next.t('profile.semestre')}` : i18next.t('auth.register.semesterPlaceholder')}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#7E8494" />
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>{i18next.t('auth.register.skillsLabel')}</Text>
        <Text style={styles.sectionSubtitle}>{i18next.t('auth.register.skillsHint')}</Text>
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
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
          onPress={finalizarRegistro}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>{i18next.t('auth.register.readyButton')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* --- MODAL PARA CARRERAS --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalCarreraVisible}
        onRequestClose={() => setModalCarreraVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragIndicator} />
            <Text style={styles.modalTitle}>{i18next.t('auth.register.selectCareer')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CARRERAS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalOption}
                  onPress={() => {
                    setCarrera(item);
                    setModalCarreraVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    carrera === item && styles.modalOptionTextSelected
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- MODAL PARA SEMESTRES --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalSemestreVisible}
        onRequestClose={() => setModalSemestreVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragIndicator} />
            <Text style={styles.modalTitle}>{i18next.t('auth.register.selectSemester')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SEMESTRES.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalOption}
                  onPress={() => {
                    setSemestre(item);
                    setModalSemestreVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    semestre === item && styles.modalOptionTextSelected
                  ]}>
                    {item}° Semestre
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D14', 
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#7E8494',
    fontSize: 16,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  sectionLabel: {
    color: '#8A8F9E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 15,
  },
  sectionSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 10,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#15171E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D3243',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 15,
  },
  selectorText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  placeholderText: {
    color: '#5E6376',
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
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
    backgroundColor: '#0B0D14', 
    borderTopWidth: 1,
    borderTopColor: '#15171E',
  },
  primaryButton: {
    backgroundColor: '#2563EB', 
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // --- ESTILOS DE LOS MODALES ---
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
    maxHeight: '70%', 
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#2D3243',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1F2B',
  },
  modalOptionText: {
    color: '#A0A4B8',
    fontSize: 16,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
});

export default InformacionRegistroScreen;