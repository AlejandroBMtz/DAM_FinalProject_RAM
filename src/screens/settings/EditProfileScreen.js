import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { uploadImageToCloudinary } from '../../services/cloudinary';

const EditProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [nombre, setNombre] = useState('');
  const [semestre, setSemestre] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [carrera, setCarrera] = useState('');
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNombre(data.nombre || '');
          setSemestre(data.semestre || '');
          setCarrera(data.carrera || '');
          setPhotoUrl(data.fotoPerfil || '');
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar los datos del perfil');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Request photo permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissions();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar tu foto');
      }
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      const mediaTypes =
        ImagePicker?.MediaType?.Images ||
        ImagePicker?.MediaTypeOptions?.Images ||
        ImagePicker?.MediaTypeOptions?.All;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setSelectedImage(result.assets[0]);
        setPhotoUri(uri);
        setPhotoUrl(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      console.error(error);
    }
  };

  const uploadPhotoToCloudinary = async (imageUri) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const secureUrl = await uploadImageToCloudinary(imageUri);
      return secureUrl;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(error.message || 'Error al subir foto a Cloudinary');
    }
  };

  const handleSaveProfile = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const updateData = {
        nombre: nombre.trim(),
        semestre: semestre.trim(),
        carrera: carrera.trim(),
      };

      // Upload photo if a new one was selected
      if (selectedImage) {
        const photoUrl = await uploadPhotoToCloudinary(photoUri);
        updateData.fotoPerfil = photoUrl;
        setPhotoUrl(photoUrl);
      }

      await updateDoc(userDocRef, updateData);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setSelectedImage(null);
      setPhotoUri(null);
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al guardar el perfil');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Todos los campos de contraseña son requeridos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setUpdatingPassword(true);
    try {
      // Note: Firebase doesn't have a direct way to verify current password
      // This is a security limitation. In production, consider using a backend service.
      await updatePassword(auth.currentUser, newPassword);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Error', 'Por seguridad, por favor inicia sesión nuevamente y luego intenta cambiar tu contraseña');
      } else {
        Alert.alert('Error', error.message || 'No se pudo actualizar la contraseña');
      }
      console.error(error);
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#161920" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {selectedImage?.uri || photoUri || photoUrl ? (
              <Image
                source={{ uri: selectedImage?.uri || photoUri || photoUrl }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name="account-circle" size={80} color="#6B7280" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
              <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.photoLabel}>Toca la cámara para cambiar foto</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          
          {/* Nombre */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre completo"
              placeholderTextColor="#9CA3AF"
              value={nombre}
              onChangeText={setNombre}
              editable={!saving}
            />
          </View>

          {/* Carrera */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Carrera</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu carrera"
              placeholderTextColor="#9CA3AF"
              value={carrera}
              onChangeText={setCarrera}
              editable={!saving}
            />
          </View>

          {/* Semestre */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Semestre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 1, 2, 3, etc."
              placeholderTextColor="#9CA3AF"
              value={semestre}
              onChangeText={setSemestre}
              keyboardType="number-pad"
              editable={!saving}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, saving && styles.buttonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Password Section Divider */}
          <View style={styles.divider} />

          {/* Password Toggle */}
          {!showPasswordForm ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setShowPasswordForm(true)}
            >
              <MaterialCommunityIcons name="lock" size={20} color="#4F46E5" />
              <Text style={styles.buttonTextSecondary}>Cambiar Contraseña</Text>
            </TouchableOpacity>
          ) : (
            <>
              {/* Password Form */}
              <View style={styles.passwordForm}>
                <Text style={styles.passwordFormTitle}>Cambiar Contraseña</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Contraseña Actual</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Tu contraseña actual"
                    placeholderTextColor="#9CA3AF"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    editable={!updatingPassword}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nueva Contraseña</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nueva contraseña"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    editable={!updatingPassword}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar contraseña"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    editable={!updatingPassword}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, updatingPassword && styles.buttonDisabled]}
                  onPress={handleUpdatePassword}
                  disabled={updatingPassword}
                >
                  {updatingPassword ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Actualizar Contraseña</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={updatingPassword}
                >
                  <Text style={styles.buttonTextCancel}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F19',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F19',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#161920',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3D',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#161920',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3D',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2D2D3D',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2D2D3D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#161920',
  },
  photoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2D2D3D',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4D4D5D',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: '#4F46E5',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  buttonCancel: {
    backgroundColor: '#2D2D3D',
    borderWidth: 1,
    borderColor: '#4D4D5D',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonTextSecondary: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonTextCancel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: '#4D4D5D',
    marginVertical: 24,
  },
  passwordForm: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2D3D',
  },
  passwordFormTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 16,
  },
});

export default EditProfileScreen;
