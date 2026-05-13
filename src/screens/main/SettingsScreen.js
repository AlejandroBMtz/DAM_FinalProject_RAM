import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Switch, Platform, StatusBar, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { auth, db } from '../../services/firebaseConfig'; // Asegúrate de exportar 'db' en tu config
import { signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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

  // Estados originales
  const [notifPush, setNotifPush] = useState(true);
  const [notifTickets, setNotifTickets] = useState(true);
  const [notifBadges, setNotifBadges] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        try {
          const userDoc = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDoc);

          if (docSnap.exists() && docSnap.data().settings) {
            const settings = docSnap.data().settings;
            // Actualizamos los estados con lo que hay en la nube
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
  // Lógica de guardado en Firebase
  const handleToggle = async (key, value, setter) => {
    setter(value); // Cambio visual instantáneo
    if (user) {
      try {
        const userDoc = doc(db, 'users', user.uid);
        await setDoc(userDoc, {
          settings: { [key]: value }
        }, { merge: true });
      } catch (error) {
        console.error("Error al guardar:", error);
        setter(!value); // Revertir si falla
      }
    }
  };

  // Ocultar el TabBar (Tu lógica original)
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({ tabBarStyle: { display: 'none' } });
      }
      return () => {
        if (parent) {
          parent.setOptions({ tabBarStyle: { display: 'flex' } });
        }
      };
    }, [navigation])
  );

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es irreversible. ¿Seguro que deseas eliminar tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { } },
      ]
    );
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="chevron-left" size={22} color="#9CA3AF" />
        <Text style={styles.backText}>Regresar</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Ajustes</Text>

      <SectionLabel title="CUENTA" />
      <View style={styles.group}>
        <SettingRow
          icon="account-edit-outline"
          label="Editar datos personales"
          onPress={() => navigation.navigate('EditProfileScreen')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="lock-outline"
          label="Cambiar contraseña"
          onPress={() => navigation.navigate('ChangePasswordScreen')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="translate"
          label="Idioma"
          onPress={() => alert('Próximamente')}
        />
      </View>

      <SectionLabel title="NOTIFICACIONES" />
      <View style={styles.group}>
        <SettingRow
          icon="bell-outline"
          iconColor="#F59E0B"
          iconBg="#2A1F0A"
          label="Notificaciones push"
          rightElement={toggle(notifPush, setNotifPush, 'notifPush')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="ticket-outline"
          iconColor="#3B82F6"
          iconBg="#0A1A2A"
          label="Tickets que coinciden"
          rightElement={toggle(notifTickets, setNotifTickets, 'notifTickets')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="medal-outline"
          iconColor="#A78BFA"
          iconBg="#1A0A2A"
          label="Nuevas insignias"
          rightElement={toggle(notifBadges, setNotifBadges, 'notifBadges')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="message-outline"
          iconColor="#10B981"
          iconBg="#0A1F15"
          label="Mensajes nuevos"
          rightElement={toggle(notifMessages, setNotifMessages, 'notifMessages')}
        />
      </View>

      <SectionLabel title="LEGAL" />
      <View style={styles.group}>
        <SettingRow
          icon="file-document-outline"
          iconColor="#9CA3AF"
          iconBg="#1C1F2B"
          label="Términos de Comunidad"
          onPress={() => navigation.navigate('TermsScreen')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="shield-outline"
          iconColor="#9CA3AF"
          iconBg="#1C1F2B"
          label="Políticas de privacidad"
          onPress={() => navigation.navigate('PrivacyScreen')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="logout"
          iconColor="#EE951D"
          iconBg="#2a2809"
          label="Cerrar sesión"
          labelStyle={styles.dangerLabel1}
          onPress={handleLogout}
          rightElement={<View />}
        />
      </View>


      {/* ── CUENTA PELIGROSA ── */}
      <SectionLabel title="CUENTA" />
      <View style={styles.group}>
        <SettingRow
          icon="delete-outline"
          iconColor="#F87171"
          iconBg="#2A0A0A"
          label="Eliminar Cuenta"
          labelStyle={styles.dangerLabel}
          onPress={handleDeleteAccount}
          rightElement={<View />}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D14',
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
});

export default SettingsScreen;