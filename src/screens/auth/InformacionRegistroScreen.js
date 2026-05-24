import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, Modal, Platform, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import i18next from '../../services/staticTL';
import { auth, db } from '../../services/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { getAllSkillNames } from '../../utils/tagsList';

const CARRERAS = [
  'Licenciatura en Informática',
  'Licenciatura en Administración de las TI',
  'Ingeniería de Software',
  'Ingeniería en Computación',
  'Ingeniería en Telecomunicaciones y Redes',
  'Ingeniería en Ciencia y Analítica de Datos',
  'Ingeniería en Tecnologías de Información y Ciberseguridad',
];

const SEMESTRES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const InformacionRegistroScreen = ({ route, navigation }) => {
  const { nombre, email, password } = route.params || {};

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carrera, setCarrera] = useState(null);
  const [semestre, setSemestre] = useState(null);

  const [modalCarreraVisible, setModalCarreraVisible] = useState(false);
  const [modalSemestreVisible, setModalSemestreVisible] = useState(false);

  // Modal de feedback (validacion)
  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    title: '',
    subtitle: '',
  });
  const timerRef = useRef(null);

  const showFeedback = (title, subtitle) => {
    setFeedbackModal({ visible: true, title, subtitle });
  };

  const closeFeedback = () => {
    setFeedbackModal((prev) => ({ ...prev, visible: false }));
  };

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
      case 'auth/invalid-email':        return i18next.t('auth.register.errors.invalidEmail');
      case 'auth/weak-password':        return i18next.t('auth.register.errors.weakPassword');
      default:                          return i18next.t('auth.register.errors.default');
    }
  };

  const finalizarRegistro = async () => {
    if (!carrera) {
      showFeedback(i18next.t('error.atencion'), i18next.t('auth.register.errors.missingCareer'));
      return;
    }
    if (!semestre) {
      showFeedback(i18next.t('error.atencion'), i18next.t('auth.register.errors.missingSemester'));
      return;
    }
    if (selectedSkills.length === 0) {
      showFeedback(i18next.t('error.atencion'), i18next.t('auth.register.errors.missingSkills'));
      return;
    }
    if (!email || !password || !nombre) {
      showFeedback(i18next.t('error.genericHeader'), i18next.t('auth.register.errors.missingRegistrationData'));
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        nombre: nombre.trim(),
        email: email.trim(),
        carrera,
        semestre,
        habilidades: selectedSkills,
        fechaRegistro: new Date().toISOString(),
        helpGiven: 0,
        rated: 0,
        helpAsked: 0,
        points: 0,
      });

      // Firebase iniciará sesión automáticamente al crear el usuario
    } catch (error) {
      console.log('Error en Firebase:', error);
      showFeedback('Error de Registro', getFriendlyError(error.code));
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* SELECTOR CARRERA */}
        <Text style={styles.sectionLabel}>{i18next.t('auth.register.careerLabel')}</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setModalCarreraVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectorText, !carrera && styles.placeholderText]}>
            {carrera || i18next.t('auth.register.careerPlaceholder')}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#7E8494" />
        </TouchableOpacity>

        {/* SELECTOR SEMESTRE */}
        <Text style={styles.sectionLabel}>{i18next.t('auth.register.semesterLabel')}</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setModalSemestreVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectorText, !semestre && styles.placeholderText]}>
            {semestre
              ? `${semestre}° ${i18next.t('profile.semestre')}`
              : i18next.t('auth.register.semesterPlaceholder')}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#7E8494" />
        </TouchableOpacity>

        {/* HABILIDADES */}
        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>
          {i18next.t('auth.register.skillsLabel')}
        </Text>
        <Text style={styles.sectionSubtitle}>{i18next.t('auth.register.skillsHint')}</Text>
        <View style={styles.tagsContainer}>
          {getAllSkillNames().map((skill, index) => {
            const isSelected = selectedSkills.includes(skill);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.tag, isSelected ? styles.tagSelected : styles.tagUnselected]}
                onPress={() => toggleSkill(skill)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, isSelected ? styles.tagTextSelected : styles.tagTextUnselected]}>
                  {skill}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* FOOTER CON BOTON */}
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

      {/* MODAL CARRERAS */}
      <Modal
        animationType="slide"
        transparent
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
                  onPress={() => { setCarrera(item); setModalCarreraVisible(false); }}
                >
                  <Text style={[styles.modalOptionText, carrera === item && styles.modalOptionTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL SEMESTRES */}
      <Modal
        animationType="slide"
        transparent
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
                  onPress={() => { setSemestre(item); setModalSemestreVisible(false); }}
                >
                  <Text style={[styles.modalOptionText, semestre === item && styles.modalOptionTextSelected]}>
                    {item}° Semestre
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL FEEDBACK — validacion y errores de Firebase */}
      <Modal visible={feedbackModal.visible} transparent animationType="fade">
        <View style={styles.feedbackOverlay}>
          <View style={styles.feedbackContent}>
            <View style={styles.feedbackIconWrap}>
              <Ionicons name="close-circle" size={60} color="#EF4444" />
            </View>
            <Text style={styles.feedbackTitle}>{feedbackModal.title}</Text>
            <Text style={styles.feedbackSubtitle}>{feedbackModal.subtitle}</Text>
            <TouchableOpacity style={styles.feedbackBtn} onPress={closeFeedback} activeOpacity={0.8}>
              <Text style={styles.feedbackBtnText}>{i18next.t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D14'
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
    marginBottom: 8
  },
  subtitle: {
    color: '#7E8494',
    fontSize: 16,
    textAlign: 'center'
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20
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
    marginBottom: 10
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
    fontSize: 14, flex: 1
  },
  placeholderText: {
    color: '#5E6376'
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  tag: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1
  },
  tagUnselected: {
    backgroundColor: '#1C1F2B',
    borderColor: '#2D3243'
  },
  tagSelected: {
    backgroundColor: 'rgba(67,56,202,0.15)',
    borderColor: '#6C63FF'
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500'
  },
  tagTextUnselected: {
    color: '#7E8494'
  },
  tagTextSelected: {
    color: '#8B85FF'
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
    fontWeight: 'bold'
  },

  // Modales de seleccion
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
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
    textAlign: 'center'
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1F2B'
  },
  modalOptionText: {
    color: '#A0A4B8',
    fontSize: 16,
    textAlign: 'center'
  },
  modalOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: 'bold'
  },

  // Modal de feedback
  feedbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  feedbackContent: {
    backgroundColor: '#15171E',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  feedbackIconWrap: {
    marginBottom: 15
  },
  feedbackTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  feedbackSubtitle: {
    color: '#8A8F9E',
    fontSize: 14,
    textAlign: 'center'
  },
  feedbackBtn: {
    marginTop: 20,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  feedbackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
});

export default InformacionRegistroScreen;