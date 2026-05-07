import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();

  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.settingsSection}>
        
        {/* Edit Profile Option */}
        <TouchableOpacity 
          style={styles.settingOption} 
          onPress={handleEditProfile}
          activeOpacity={0.7}
        >
          <View style={styles.optionIconContainer}>
            <MaterialCommunityIcons name="account-edit" size={24} color="#4F46E5" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Editar Perfil</Text>
            <Text style={styles.optionDescription}>Nombre, foto, semestre y contraseña</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#6B7280" />
        </TouchableOpacity>

        {/* Other Settings Options */}
        <TouchableOpacity 
          style={styles.settingOption} 
          onPress={() => alert('Privacidad - Próximamente')}
          activeOpacity={0.7}
        >
          <View style={styles.optionIconContainer}>
            <MaterialCommunityIcons name="lock" size={24} color="#4F46E5" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Privacidad</Text>
            <Text style={styles.optionDescription}>Controla tu privacidad</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingOption} 
          onPress={() => alert('Notificaciones - Próximamente')}
          activeOpacity={0.7}
        >
          <View style={styles.optionIconContainer}>
            <MaterialCommunityIcons name="bell" size={24} color="#4F46E5" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Notificaciones</Text>
            <Text style={styles.optionDescription}>Gestiona tus notificaciones</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingOption} 
          onPress={() => alert('Acerca de - Próximamente')}
          activeOpacity={0.7}
        >
          <View style={styles.optionIconContainer}>
            <MaterialCommunityIcons name="information" size={24} color="#4F46E5" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Acerca de</Text>
            <Text style={styles.optionDescription}>Versión y detalles</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#6B7280" />
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F19',
  },
  contentContainer: {
    paddingVertical: 16,
  },
  settingsSection: {
    paddingHorizontal: 16,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161920',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D2D3D',
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2D2D3D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default SettingsScreen;
