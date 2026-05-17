import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image, StatusBar, Modal, Platform, } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadImageToCloudinary } from '../../services/cloudinary';
import i18next from '../../services/staticTL';

const CARRERAS = [
  'Licenciatura en Informática',
  'Licenciatura en Administración de las TI',
  'Ingeniería de Software',
  'Ingeniería en Computación',
  'Ingeniería en Telecomunicaciones y Redes',
  'Ingeniería en Ciencia y Analítica de Datos',
  'Ingeniería en Tecnologías de Información y Ciberseguridad',
];

const SEMESTRES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const HABILIDADES = [
  'Programación', 'Python', 'Álgebra', 'Cálculo', 'Diseño',
  'JavaScript', 'Algoritmos', 'React Native', 'Node.js',
  'UX/UI', 'Figma', 'Recursión', 'Java', 'Express',
  'Base de Datos', 'SQL', 'NoSQL', 'AWS', 'Octave',
];

export default function EditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState('');
  const [carrera, setCarrera] = useState('');
  const [semestre, setSemestre] = useState('');
  const [habilidades, setHabilidades] = useState([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const [modalCarrera, setModalCarrera] = useState(false);
  const [modalSemestre, setModalSemestre] = useState(false);

  // Load data
  useEffect(() => {
    const fetch = async () => {
      if (!auth.currentUser) return;
      try {
        const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          setNombre(d.nombre || '');
          setCarrera(d.carrera || '');
          setSemestre(d.semestre || '');
          setHabilidades(d.habilidades || []);
          setPhotoUrl(d.fotoPerfil || '');
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Image picker
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar tu foto.');
      }
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || ImagePicker.MediaType?.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  // Skills toggle
  const toggleSkill = (skill) => {
    setHabilidades((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Save
  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre no puede estar vacío.');
      return;
    }
    if (!carrera) {
      Alert.alert('Campo requerido', 'Por favor selecciona tu carrera.');
      return;
    }
    if (!semestre) {
      Alert.alert('Campo requerido', 'Por favor selecciona tu semestre.');
      return;
    }
    if (habilidades.length === 0) {
      Alert.alert('Campo requerido', 'Selecciona al menos una habilidad.');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        nombre: nombre.trim(),
        carrera,
        semestre,
        habilidades,
      };

      if (selectedImage) {
        const url = await uploadImageToCloudinary(selectedImage.uri);
        updateData.fotoPerfil = url;
        setPhotoUrl(url);
        setSelectedImage(null);
      }

      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);
      Alert.alert('¡Listo!', 'Tu perfil fue actualizado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el perfil. Intenta de nuevo.');
      console.log(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/*  HEADER  */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#9CA3AF" />
          <Text style={styles.backText}>{i18next.t("back")}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18next.t("profile.edit.titulo")}</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/*  FOTO  */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoWrapper} onPress={handlePickImage} activeOpacity={0.8}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name="account" size={50} color="#4B5563" />
              </View>
            )}
            <View style={styles.photoOverlay}>
              <MaterialCommunityIcons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>{i18next.t("profile.edit.foto")}</Text>
        </View>

        {/*  NOMBRE  */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{i18next.t("profile.edit.nombre")}</Text>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="account-outline" size={18} color="#4B5563" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder={i18next.t("profile.edit.nombrePlace")}
              placeholderTextColor="#4B5563"
              autoCapitalize="words"
            />
          </View>
        </View>

        {/*  CARRERA  */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{i18next.t("profile.edit.carrera")}</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setModalCarrera(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="school-outline" size={18} color="#4B5563" style={styles.inputIcon} />
            <Text style={[styles.selectorText, !carrera && styles.placeholder]} numberOfLines={1}>
              {carrera || 'Selecciona tu carrera'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* SEMESTRE  */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{i18next.t("profile.edit.semestre")}</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setModalSemestre(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="calendar-outline" size={18} color="#4B5563" style={styles.inputIcon} />
            <Text style={[styles.selectorText, !semestre && styles.placeholder]}>
              {semestre ? `${semestre}° ${i18next.t("profile.semestre")}` : 'Selecciona tu semestre'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* HABILIDADES */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{i18next.t("profile.edit.habilidades")}</Text>
          <Text style={styles.fieldHint}>{i18next.t("profile.edit.selecciona")}</Text>
          <View style={styles.tagsGrid}>
            {HABILIDADES.map((skill) => {
              const active = habilidades.includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  style={[styles.tag, active && styles.tagActive]}
                  onPress={() => toggleSkill(skill)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>{skill}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{i18next.t("profile.edit.guardar")}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL CARRERA */}
      <Modal visible={modalCarrera} transparent animationType="slide" onRequestClose={() => setModalCarrera(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>{i18next.t("profile.edit.selectCarrera")}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CARRERAS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalOption, carrera === item && styles.modalOptionActive]}
                  onPress={() => { setCarrera(item); setModalCarrera(false); }}
                >
                  <Text style={[styles.modalOptionText, carrera === item && styles.modalOptionTextActive]}>
                    {item}
                  </Text>
                  {carrera === item && <Ionicons name="checkmark" size={16} color="#4F46E5" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/*  MODAL SEMESTRE  */}
      <Modal visible={modalSemestre} transparent animationType="slide" onRequestClose={() => setModalSemestre(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '55%' }]}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>{i18next.t("profile.edit.selectSemestre")}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SEMESTRES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalOption, semestre === item && styles.modalOptionActive]}
                  onPress={() => { setSemestre(item); setModalSemestre(false); }}
                >
                  <Text style={[styles.modalOptionText, semestre === item && styles.modalOptionTextActive]}>
                    {item}° {i18next.t("profile.semestre")}
                  </Text>
                  {semestre === item && <Ionicons name="checkmark" size={16} color="#4F46E5" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0B0D14' 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#0B0D14' 
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  backBtn: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  backText: { 
    color: '#9CA3AF', 
    fontSize: 14, 
    marginLeft: 2 
  },
  headerTitle: { 
    color: '#FFFFFF', 
    fontSize: 17, 
    fontWeight: '700' 
  },

  scroll: { 
    paddingHorizontal: 20, 
    paddingTop: 28 
  },

  // Photo
  photoSection: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  photoWrapper: { 
    position: 'relative' 
  },
  photo: { 
    width: 140,
    height: 140, 
    borderRadius: 70, 
    borderWidth: 2.5, 
    borderColor: '#4F46E5' 
  },
  photoPlaceholder: {
    width: 140, 
    height: 140, 
    borderRadius: 70,
    backgroundColor: '#111827', 
    borderWidth: 2, 
    borderColor: '#1F2937',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  photoOverlay: {
    position: 'absolute', 
    bottom: 2, 
    right: 2,
    width: 30, 
    height: 30, 
    borderRadius: 15,
    backgroundColor: '#4F46E5',
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2, 
    borderColor: '#0B0D14',
  },
  photoHint: { 
    color: '#6B7280', 
    fontSize: 12, 
    marginTop: 10 
  },

  // Fields
  fieldGroup: { 
    marginBottom: 22 
  },
  fieldLabel: {
    color: '#4B5563', 
    fontSize: 11, 
    fontWeight: '700',
    letterSpacing: 1.2, 
    marginBottom: 8, 
    marginLeft: 2,
  },
  fieldHint: { 
    color: '#6B7280', 
    fontSize: 12, 
    marginBottom: 10, 
    marginLeft: 2 
  },

  inputRow: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#111827', 
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: '#1F2937', 
    paddingHorizontal: 14,
  },
  inputIcon: { 
    marginRight: 10 
  },
  input: { 
    flex: 1, 
    color: '#FFFFFF', 
    fontSize: 15, 
    paddingVertical: 14 
  },

  selector: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#111827', 
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: '#1F2937',
    paddingHorizontal: 14, 
    paddingVertical: 14,
  },
  selectorText: { 
    flex: 1, 
    color: '#FFFFFF', 
    fontSize: 15 
  },
  placeholder: { 
    color: '#4B5563' 
  },

  // Tags
  tagsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  tag: {
    paddingVertical: 8, 
    paddingHorizontal: 14,
    borderRadius: 20, 
    borderWidth: 1,
    borderColor: '#1F2937', 
    backgroundColor: '#111827',
  },
  tagActive: { 
    borderColor: '#6366F1', 
    backgroundColor: 'rgba(99,102,241,0.12)' 
  },
  tagText: { 
    color: '#6B7280', 
    fontSize: 13, 
    fontWeight: '500' 
  },
  tagTextActive: { 
    color: '#818CF8' 
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  languageButtonText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },

  // Save button
  saveBtn: {
    backgroundColor: '#4F46E5', 
    borderRadius: 14,
    paddingVertical: 16, 
    alignItems: 'center', 
    marginTop: 8,
  },
  saveBtnDisabled: { 
    opacity: 0.55 
  },
  saveBtnText: { 
    color: '#FFFFFF', 
    fontSize: 15, 
    fontWeight: '700' 
  },

  // Modal
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24,
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '75%',
  },
  dragHandle: {
    width: 38, 
    height: 4, 
    backgroundColor: '#1F2937',
    borderRadius: 2, 
    alignSelf: 'center', 
    marginBottom: 18,
  },
  modalTitle: {
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '700',
    textAlign: 'center', 
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1F2937',
  },
  modalOptionActive: { 
    borderBottomColor: '#1F2937' 
  },
  modalOptionText: { 
    color: '#9CA3AF', 
    fontSize: 14, 
    flex: 1 
  },
  modalOptionTextActive: { 
    color: '#818CF8', 
    fontWeight: '600' 
  },
});