import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image, StatusBar, Modal, Platform, } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import i18next from '../../services/staticTL';

export default function EditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preferredLanguage, setPreferredLanguage] = useState(i18next.language || 'es');


  // Load data
  useEffect(() => {
    const fetch = async () => {
      if (!auth.currentUser) return;
      try {
        const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          setPreferredLanguage(d.ln || i18next.language || 'es');
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Save
  const handleSave = async () => {

    setSaving(true);
    try {
      const updateData = {
        ln: preferredLanguage,
      };

      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);
      i18next.changeLanguage(preferredLanguage);
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

  const handleLanguageSelection = (lang) => {
    setPreferredLanguage(lang);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/*  HEADER  */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#9CA3AF" />
          <Text style={styles.backText}>{i18next.t("back")}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18next.t("settings.cuenta.idioma")}</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.fieldGroup}>
          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[styles.languageButton, preferredLanguage === 'es' && styles.languageButtonActive]}
              onPress={() => handleLanguageSelection('es')}
              activeOpacity={0.8}
            >
              <Text style={[styles.languageButtonText, preferredLanguage === 'es' && styles.languageButtonTextActive]}>
                Español
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageButton, preferredLanguage === 'en' && styles.languageButtonActive]}
              onPress={() => handleLanguageSelection('en')}
              activeOpacity={0.8}
            >
              <Text style={[styles.languageButtonText, preferredLanguage === 'en' && styles.languageButtonTextActive]}>
                English
              </Text>
            </TouchableOpacity>
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
            <Text style={styles.saveBtnText}>{i18next.t("save")}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    
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