import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Modal, Platform, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import i18next from '../../services/staticTL';

const LANGUAGES = [
  {
    code: 'es',
    label: 'Español',
    sublabel: 'Spanish',
    flag: '🇲🇽',
    region: 'Latinoamérica / España',
  },
  {
    code: 'en',
    label: 'English',
    sublabel: 'Inglés',
    flag: '🇺🇸',
    region: 'United States / UK',
  },
];

export default function ChangeLanguageScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState(
    i18next.language || 'es'
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('success');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchLang = async () => {
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
    fetchLang();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ln: preferredLanguage,
      });

      // Mostramos modal de exito antes de cambiar el idioma, es medio engañoso pero se ve mejor y queda claro para el usuario 
      setModalType('success');
      setModalVisible(true);

      // Esperamos que el modal sea visible (1500ms), luego cambiar idioma
      timerRef.current = setTimeout(() => {
        setModalVisible(false);
        i18next.changeLanguage(preferredLanguage);
      }, 1500);

    } catch (e) {
      console.log(e);
      setModalType('error');
      setModalVisible(true);
      timerRef.current = setTimeout(() => {
        setModalVisible(false);
      }, 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0D14" />
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D14" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backBtnIcon}>
            <Ionicons name="arrow-back" size={20} color="#8A8F9E" />
          </View>
          <Text style={styles.backText}>{i18next.t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {i18next.t('settings.cuenta.idioma')}
        </Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Bloque titulo */}
        <View style={styles.titleBlock}>
          <View style={styles.titleIconWrap}>
            <Ionicons name="language-outline" size={28} color="#6366F1" />
          </View>
          <Text style={styles.titleText}>
            {i18next.t('settings.cuenta.idioma')}
          </Text>
          <Text style={styles.titleSub}>
            {i18next.language === 'es'
              ? 'Elige el idioma que prefieras para la app'
              : 'Choose your preferred language for the app'}
          </Text>
        </View>

        {/* Tarjetas de idioma */}
        <View style={styles.cardsContainer}>
          {LANGUAGES.map((lang) => {
            const isActive = preferredLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langCard, isActive && styles.langCardActive]}
                onPress={() => setPreferredLanguage(lang.code)}
                activeOpacity={0.75}
              >
                <View style={styles.langCardLeft}>
                  <Text style={styles.flagEmoji}>{lang.flag}</Text>
                  <View style={styles.langTextBlock}>
                    <Text style={[styles.langLabel, isActive && styles.langLabelActive]}>
                      {lang.label}
                    </Text>
                    <Text style={styles.langSublabel}>{lang.sublabel}</Text>
                    <Text style={styles.langRegion}>{lang.region}</Text>
                  </View>
                </View>
                <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                  {isActive && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Boton guardar */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-done-outline"
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.saveBtnText}>{i18next.t('save')}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL EXITO / ERROR */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              {modalType === 'success' ? (
                <Ionicons name="checkmark-circle" size={60} color="#4ADE80" />
              ) : (
                <Ionicons name="close-circle" size={60} color="#EF4444" />
              )}
            </View>
            <Text style={styles.modalTitle}>
              {modalType === 'success'
                ? i18next.t('settings.languageUpdatedTitle')
                : i18next.t('error.genericHeader')}
            </Text>
            <Text style={styles.modalSubtitle}>
              {modalType === 'success'
                ? i18next.t('settings.languageUpdatedSuccess')
                : i18next.t('settings.languageUpdatedError')}
            </Text>
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
    alignItems: 'center',
    width: 80
  },
  backBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D3243',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    color: '#9CA3AF',
    fontSize: 14 
  },
  headerTitle: {
    color: '#FFFFFF', 
    fontSize: 17, fontWeight: '700', 
    textAlign: 'center', 
    flex: 1 
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 28
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 32
  },
  titleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1, 
    borderColor: 'rgba(99,102,241,0.25)',
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 14,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 22, 
    fontWeight: '700', 
    letterSpacing: 0.5, 
    marginBottom: 6
  },
  titleSub: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center', 
    paddingHorizontal: 20 
  },

  cardsContainer: {
    gap: 12,
    marginBottom: 32
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827', 
    borderRadius: 14,
    borderWidth: 1.5, 
    borderColor: '#1F2937',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  langCardActive: { 
    borderColor: '#4F46E5', 
    backgroundColor: 'rgba(79,70,229,0.08)'
  },
  langCardLeft: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1
},
  flagEmoji: { 
    fontSize: 34,
    marginRight: 14 
  },
  langTextBlock: { 
    flex: 1 
  },
  langLabel: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2
  },
  langLabelActive: { 
    color: '#FFFFFF' 
  },
  langSublabel: { 
    color: '#4B5563', 
    fontSize: 13, 
    fontWeight: '400', 
    marginBottom: 2 
  },
  langRegion: {
    color: '#374151',
    fontSize: 11
  },
  radioOuter: {
    width: 22, 
    height: 22, 
    borderRadius: 11,
    borderWidth: 2, 
    borderColor: '#374151',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  radioOuterActive: { 
    borderColor: '#4F46E5' 
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#4F46E5'
  },

  saveBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.55
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#15171E',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2229',
  },
  modalIconWrap: {
    marginBottom: 15
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  modalSubtitle: {
    color: '#8A8F9E',
    fontSize: 14,
    textAlign: 'center'
  },
});