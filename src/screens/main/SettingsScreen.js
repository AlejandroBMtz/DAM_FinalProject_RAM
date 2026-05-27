import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text, ScrollView,
  Switch, Platform, StatusBar, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { auth, db } from '../../services/firebaseConfig';
import {
  signOut,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import i18next from '../../services/staticTL';

const SectionLabel = ({ title }) => (
  <Text style={styles.sectionLabel}>{title}</Text>
);

const SettingRow = ({ icon, iconColor = '#4F46E5', iconBg = '#1E1B3A', label, onPress, rightElement, labelStyle }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
      <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={[styles.rowLabel, labelStyle]}>{label}</Text>
    {rightElement ?? <MaterialCommunityIcons name="chevron-right" size={20} color="#4B5563" />}
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const navigation = useNavigation();
  const user = auth.currentUser;

  const [notifPush, setNotifPush] = useState(true);
  const [notifTickets, setNotifTickets] = useState(true);
  const [notifBadges, setNotifBadges] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalConfig, setInfoModalConfig] = useState({ title: '', message: '', type: 'info' });

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        try {
          const userDoc = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists() && docSnap.data().settings) {
            const settings = docSnap.data().settings;
            if (settings.notifPush !== undefined) setNotifPush(settings.notifPush);
            if (settings.notifTickets !== undefined) setNotifTickets(settings.notifTickets);
            if (settings.notifBadges !== undefined) setNotifBadges(settings.notifBadges);
            if (settings.notifMessages !== undefined) setNotifMessages(settings.notifMessages);
            if (settings.darkMode !== undefined) setDarkMode(settings.darkMode);
          }
        } catch (error) {
          console.error("Error al obtener ajustes:", error);
        }
      }
    };
    fetchSettings();
  }, [user]);

  const handleToggle = async (key, value, setter) => {
    setter(value);
    if (user) {
      try {
        const userDoc = doc(db, 'users', user.uid);
        await setDoc(userDoc, { settings: { [key]: value } }, { merge: true });
      } catch (error) {
        console.error("Error al guardar:", error);
        setter(!value);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) parent.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        if (parent) parent.setOptions({ tabBarStyle: { display: 'flex' } });
      };
    }, [navigation])
  );

  const showInfoModal = (title, message, type = 'info') => {
    setInfoModalConfig({ title, message, type });
    setInfoModalVisible(true);
  };

  const handleLogoutPress = () => setLogoutModalVisible(true);

  const handleDeletePress = () => {
    setPassword('');
    setPasswordError('');
    setDeleteModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      setLogoutModalVisible(false);

      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            online: false,
            lastActive: new Date().toISOString(),
          });
        } catch (_) {}
      }

      await signOut(auth);
    } catch (error) {
      showInfoModal('Error', i18next.t("profile.errorCerrar") || 'No se pudo cerrar sesión', 'error');
    }
  };

  const confirmDeleteAccount = async () => {
    if (!password) {
      setPasswordError(i18next.t("profile.errorPassVacia") || "La contraseña es requerida.");
      return;
    }

    setIsDeleting(true);
    setPasswordError('');

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Marcar offline antes de eliminar
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          online: false,
          lastActive: new Date().toISOString(),
        });
      } catch (_) {}

      await deleteUser(user);
      setDeleteModalVisible(false);

    } catch (error) {
      console.log("Error al eliminar cuenta:", error.code);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setPasswordError(i18next.t("profile.errorPassIncorrecta") || "La contraseña no es correcta. Inténtalo de nuevo.");
      } else if (error.code === 'auth/too-many-requests') {
        setPasswordError("Demasiados intentos fallidos. Inténtalo más tarde.");
      } else {
        setPasswordError("Hubo un problema al verificar tu cuenta.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const toggle = (value, setter, key) => (
    <Switch
      value={value}
      onValueChange={(val) => handleToggle(key, val, setter)}
      trackColor={{ false: '#2D3243', true: '#4F46E5' }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#2D3243"
      style={Platform.OS === 'android' ? { transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] } : {}}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0D14' }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle="light-content" />

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#9CA3AF" />
          <Text style={styles.backText}>{i18next.t("back") || "Atrás"}</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>{i18next.t("settings.titulo")}</Text>

        <SectionLabel title={i18next.t("settings.cuenta.titulo")} />
        <View style={styles.group}>
          <SettingRow
            icon="account-edit-outline"
            label={i18next.t("settings.cuenta.editar")}
            onPress={() => navigation.navigate('EditProfileScreen')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="lock-outline"
            label={i18next.t("settings.cuenta.cont")}
            onPress={() => navigation.navigate('ChangePasswordScreen')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="translate"
            label={i18next.t("settings.cuenta.idioma")}
            onPress={() => navigation.navigate('ChangeLanguageScreen')}
          />
        </View>

        <SectionLabel title={i18next.t("settings.notificaciones.titulo")} />
        <View style={styles.group}>
          <SettingRow
            icon="bell-outline"
            iconColor="#F59E0B"
            iconBg="#2A1F0A"
            label={i18next.t("settings.notificaciones.push")}
            rightElement={toggle(notifPush, setNotifPush, 'notifPush')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="ticket-outline"
            iconColor="#3B82F6"
            iconBg="#0A1A2A"
            label={i18next.t("settings.notificaciones.tickets")}
            rightElement={toggle(notifTickets, setNotifTickets, 'notifTickets')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="medal-outline"
            iconColor="#A78BFA"
            iconBg="#1A0A2A"
            label={i18next.t("settings.notificaciones.insignias")}
            rightElement={toggle(notifBadges, setNotifBadges, 'notifBadges')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="message-outline"
            iconColor="#10B981"
            iconBg="#0A1F15"
            label={i18next.t("settings.notificaciones.mensajes")}
            rightElement={toggle(notifMessages, setNotifMessages, 'notifMessages')}
          />
        </View>

        <SectionLabel title={i18next.t("settings.legal.titulo")} />
        <View style={styles.group}>
          <SettingRow
            icon="file-document-outline"
            iconColor="#9CA3AF"
            iconBg="#1C1F2B"
            label={i18next.t("settings.legal.terminos")}
            onPress={() => navigation.navigate('TermsScreen')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="shield-outline"
            iconColor="#9CA3AF"
            iconBg="#1C1F2B"
            label={i18next.t("settings.legal.politicas")}
            onPress={() => navigation.navigate('PrivacyScreen')}
          />
        </View>

        <SectionLabel title={i18next.t("settings.eliminar.titulo")} />
        <View style={styles.group}>
          <SettingRow
            icon="logout"
            iconColor="#EE951D"
            iconBg="#2a2809"
            label={i18next.t("settings.cerrar")}
            labelStyle={styles.dangerLabel1}
            onPress={handleLogoutPress}
            rightElement={<View />}
          />
          <SettingRow
            icon="delete-outline"
            iconColor="#F87171"
            iconBg="#2A0A0A"
            label={i18next.t("settings.eliminar.eliminar")}
            labelStyle={styles.dangerLabel}
            onPress={handleDeletePress}
            rightElement={<View />}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL GENERICO */}
      <Modal visible={infoModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[
              styles.modalIconBoxGeneric,
              { backgroundColor: infoModalConfig.type === 'error' ? '#2A0A0A' : '#1E1B3A' }
            ]}>
              <MaterialCommunityIcons
                name={infoModalConfig.type === 'error' ? "alert-circle-outline" : "information-outline"}
                size={32}
                color={infoModalConfig.type === 'error' ? "#F87171" : "#4F46E5"}
              />
            </View>
            <Text style={styles.modalTitle}>{infoModalConfig.title}</Text>
            <Text style={styles.modalMessage}>{infoModalConfig.message}</Text>
            <TouchableOpacity
              style={[
                styles.modalBtnSingleAction,
                { backgroundColor: infoModalConfig.type === 'error' ? '#EF4444' : '#4F46E5' }
              ]}
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={styles.modalBtnActionText}>{i18next.t("aceptar") || "Aceptar"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CERRAR SESION */}
      <Modal visible={logoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconBoxLogout}>
              <MaterialCommunityIcons name="logout" size={28} color="#EE951D" />
            </View>
            <Text style={styles.modalTitle}>{i18next.t("profile.cerrarSesion")}</Text>
            <Text style={styles.modalMessage}>{i18next.t("profile.cerrarConfirmacion")}</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>{i18next.t("cancelar") || "Cancelar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnActionLogout} onPress={confirmLogout}>
                <Text style={styles.modalBtnActionText}>{i18next.t("profile.si") || "Sí, cerrar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL ELIMINAR CUENTA */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconBoxDelete}>
              <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#F87171" />
            </View>
            <Text style={styles.modalTitle}>{i18next.t("profile.eliminar")}</Text>
            <Text style={styles.modalMessage}>{i18next.t("profile.eliminarConfirmacion")}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.modalInput, passwordError ? styles.modalInputError : null]}
                placeholder={i18next.t("settings.cuenta.cont2") || "Contraseña"}
                placeholderTextColor="#6B7280"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                editable={!isDeleting}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={styles.modalBtnCancelText}>{i18next.t("cancelar") || "Cancelar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnActionDelete, (!password || isDeleting) && styles.modalBtnDisabled]}
                onPress={confirmDeleteAccount}
                disabled={!password || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnActionText}>{i18next.t("eliminar") || "Eliminar"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 2,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 0.2,
  },
  sectionLabel: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 4,
  },
  group: {
    backgroundColor: '#111827',
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowLabel: {
    flex: 1,
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
  },
  dangerLabel: {
    color: '#F87171',
  },
  dangerLabel1: {
    color: '#EE951D',
  },
  divider: {
    height: 1,
    backgroundColor: '#1F2937',
    marginLeft: 66,
  },

  /* ESTILOS DE LOS MODALES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  modalIconBoxGeneric: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconBoxLogout: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2809',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconBoxDelete: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalInputError: {
    borderColor: '#F87171',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: '#D1D5DB',
    fontWeight: '600',
    fontSize: 15,
  },
  modalBtnActionLogout: {
    flex: 1,
    backgroundColor: '#EE951D',
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalBtnActionDelete: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSingleAction: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnDisabled: {
    opacity: 0.5,
  },
  modalBtnActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default SettingsScreen;