import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, StatusBar, Platform, Modal, } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import i18next from '../../services/staticTL';

const getStrength = (pwd) => {
  if (!pwd) return null;
  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  if (passed <= 2) return { label: i18next.t("profile.edit.strength.debil"), color: '#EF4444', width: '25%'  };
  if (passed <= 3) return { label: i18next.t("profile.edit.strength.regular"), color: '#F59E0B', width: '55%'  };
  if (passed <= 4) return { label: i18next.t("profile.edit.strength.buena"), color: '#3B82F6', width: '78%'  };
  return { label: i18next.t("profile.edit.strength.fuerte"), color: '#10B981', width: '100%' };
};

const PasswordField = ({ label, value, onChangeText, visible, onToggle, placeholder, error }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputRow, error && styles.inputRowError]}>
      <MaterialCommunityIcons name="lock-outline" size={18} color={error ? '#EF4444' : '#4B5563'} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#4B5563"
        secureTextEntry={!visible}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onToggle} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <MaterialCommunityIcons name={visible ? 'eye-outline' : 'eye-off-outline'} size={18} color="#6B7280" />
      </TouchableOpacity>
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function ChangePasswordScreen({ navigation }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    type: 'success',
    title: '',
    subtitle: '',
    autoClose: false,
  });

  const timerRef = useRef(null);
  const strength = getStrength(next);

  const showFeedback = ({ type, title, subtitle, autoClose = false, onClose }) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFeedbackModal({ visible: true, type, title, subtitle, autoClose });
    if (autoClose) {
      timerRef.current = setTimeout(() => {
        setFeedbackModal((prev) => ({ ...prev, visible: false }));
        if (onClose) onClose();
      }, 2000);
    }
  };

  const closeFeedback = () => setFeedbackModal((prev) => ({ ...prev, visible: false }));

  const validate = () => {
    const e = {};
    if (!current.trim()) e.current = i18next.t('profile.edit.error.currentRequired');
    if (!next) {
      e.next = i18next.t('profile.edit.error.newRequired');
    } else if (next.length < 8) {
      e.next = i18next.t('profile.edit.error.minLength');
    } else if (!/[A-Z]/.test(next) || !/[a-z]/.test(next) || !/\d/.test(next) || !/[!@#$%^&*(),.?":{}|<>]/.test(next)) {
      e.next = i18next.t('profile.edit.error.requirements');
    }
    if (!confirm) {
      e.confirm = i18next.t('profile.edit.error.confirmRequired');
    } else if (next !== confirm) {
      e.confirm = i18next.t('profile.edit.error.noMatch');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, next);

      showFeedback({
        type: 'success',
        title: i18next.t('profile.edit.successPasswordTitle'),
        subtitle: i18next.t('profile.edit.successPasswordMessage'),
        autoClose: true,
        onClose: () => navigation.goBack(),
      });
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrors({ current: i18next.t('profile.edit.error.currentIncorrect') });
      } else if (error.code === 'auth/requires-recent-login') {
        showFeedback({
          type: 'error',
          title: i18next.t('profile.edit.error.sessionExpiredTitle'),
          subtitle: i18next.t('profile.edit.error.sessionExpiredMessage'),
        });
      } else {
        console.log(error);
        showFeedback({
          type: 'error',
          title: i18next.t('error.genericHeader'),
          subtitle: i18next.t('profile.edit.error.generic'),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#9CA3AF" />
          <Text style={styles.backText}>{i18next.t("back")}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18next.t("profile.edit.password")}</Text>
        <View style={{ width: 90 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Info card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="shield-lock-outline" size={22} color="#4F46E5" />
          <Text style={styles.infoText}>{i18next.t("profile.edit.proteger")}</Text>
        </View>

        <PasswordField
          label={i18next.t("profile.edit.actual")}
          value={current}
          onChangeText={(t) => { setCurrent(t); setErrors({ ...errors, current: null }); }}
          visible={showCurrent}
          onToggle={() => setShowCurrent(!showCurrent)}
          placeholder="••••••••"
          error={errors.current}
        />

        <View style={styles.divider} />

        <PasswordField
          label={i18next.t("profile.edit.nueva")}
          value={next}
          onChangeText={(t) => { setNext(t); setErrors({ ...errors, next: null }); }}
          visible={showNext}
          onToggle={() => setShowNext(!showNext)}
          placeholder={i18next.t("profile.edit.minimo")}
          error={errors.next}
        />

        {next.length > 0 && strength && (
          <View style={styles.strengthWrapper}>
            <View style={styles.strengthBar}>
              <View style={[styles.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
          </View>
        )}

        {next.length > 0 && (
          <View style={styles.requirements}>
            {[
              { label: i18next.t("profile.edit.req.caracteres"), ok: next.length >= 8 },
              { label: i18next.t("profile.edit.req.mayu"), ok: /[A-Z]/.test(next) },
              { label: i18next.t("profile.edit.req.minu"), ok: /[a-z]/.test(next) },
              { label: i18next.t("profile.edit.req.numero"), ok: /\d/.test(next) },
              { label: i18next.t("profile.edit.req.simbolo"), ok: /[!@#$%^&*(),.?":{}|<>]/.test(next) },
            ].map(({ label, ok }) => (
              <View key={label} style={styles.reqItem}>
                <MaterialCommunityIcons
                  name={ok ? 'check-circle' : 'circle-outline'}
                  size={13}
                  color={ok ? '#10B981' : '#374151'}
                />
                <Text style={[styles.reqText, ok && styles.reqTextOk]}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        <PasswordField
          label={i18next.t("profile.edit.confirmar")}
          value={confirm}
          onChangeText={(t) => { setConfirm(t); setErrors({ ...errors, confirm: null }); }}
          visible={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
          placeholder={i18next.t("profile.edit.repite")}
          error={errors.confirm}
        />

        {confirm.length > 0 && (
          <Text style={[styles.matchText, { color: next === confirm ? '#10B981' : '#EF4444' }]}>
            {next === confirm ? i18next.t("profile.edit.coinciden") : i18next.t("profile.edit.noCoinciden")}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{i18next.t("profile.edit.actualizar")}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL FEEDBACK */}
      <Modal visible={feedbackModal.visible} transparent animationType="fade">
        <View style={styles.feedbackOverlay}>
          <View style={styles.feedbackContent}>
            <View style={styles.feedbackIconWrap}>
              {feedbackModal.type === 'success' ? (
                <Ionicons name="checkmark-circle" size={60} color="#4ADE80" />
              ) : (
                <Ionicons name="close-circle" size={60} color="#EF4444" />
              )}
            </View>
            <Text style={styles.feedbackTitle}>{feedbackModal.title}</Text>
            <Text style={styles.feedbackSubtitle}>{feedbackModal.subtitle}</Text>
            {!feedbackModal.autoClose && (
              <TouchableOpacity style={styles.feedbackBtn} onPress={closeFeedback} activeOpacity={0.8}>
                <Text style={styles.feedbackBtnText}>{i18next.t('ok')}</Text>
              </TouchableOpacity>
            )}
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center' },
  backText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 2 },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700'
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79,70,229,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 28,
    gap: 10,
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 13,
    flex: 1,
    lineHeight: 18
  },
  divider: {
    height: 1,
    backgroundColor: '#111827',
    marginBottom: 20
  },
  fieldGroup: {
    marginBottom: 18
  },
  fieldLabel: {
    color: '#4B5563', 
    fontSize: 11, 
    fontWeight: '700',
    letterSpacing: 1.2, 
    marginBottom: 8, 
    marginLeft: 2,
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
  inputRowError: {
    borderColor: '#7F1D1D',
    backgroundColor: '#150A0A' },
  icon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 14
  },
  eyeBtn: {
    padding: 4
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4 },

  strengthWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -8,
    marginBottom: 14,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#1F2937',
    borderRadius: 4,
    overflow: 'hidden'
  },
  strengthFill: {
    height: '100%',
    borderRadius: 4
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 50,
    textAlign: 'right'
  },
  requirements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18, 
    backgroundColor: '#0D1017',
    borderRadius: 10,
    padding: 12,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  reqText: {
    color: '#374151',
    fontSize: 11
  },
  reqTextOk: {
    color: '#6B7280'
  },
  matchText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4 
  },

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

  // Modal feedback
  feedbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  feedbackContent: {
    backgroundColor: '#15171E', borderRadius: 16,
    padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: '#1F2229',
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