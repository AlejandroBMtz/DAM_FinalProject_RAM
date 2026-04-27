import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- Importaciones de Firebase ---
import { auth, db } from '../../services/firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const ProfileScreen = () => {
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('Nombre del usuario');

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data().nombre || 'Nombre del usuario');
          }
        } catch (error) {
          console.log('Error fetching user data:', error);
        }
      }
    };
    fetchUserData();
  }, []);

  // Función para cerrar sesión
  const handleLogout = () => {
    // Es buena práctica pedir confirmación antes de cerrar sesión
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas salir de tu cuenta?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Sí, salir", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Esta simple línea cierra la sesión en Firebase.
              // Tu AppNavigator lo detectará y te enviará al Login automáticamente.
              await signOut(auth);
            } catch (error) {
              console.log("Error al cerrar sesión:", error);
              Alert.alert("Error", "No se pudo cerrar la sesión. Intenta de nuevo.");
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D14" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      {/* Tarjeta de información del usuario (Ejemplo visual) */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account" size={50} color="#6C63FF" />
        </View>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{auth.currentUser?.email || "correo@alumnos.uaq.mx"}</Text>
      </View>

      {/* Otras opciones de perfil podrían ir aquí... */}

      {/* Separador flexible para empujar el botón de logout hacia abajo */}
      <View style={{ flex: 1 }} />

      {/* Botón de Cerrar Sesión */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#EF4444" />
        ) : (
          <>
            <MaterialCommunityIcons name="logout" size={22} color="#EF4444" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D14', // Fondo oscuro
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#1C1F2B',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D3243',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#7E8494',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Fondo rojo translúcido
    borderWidth: 1,
    borderColor: '#EF4444', // Borde rojo
    borderRadius: 8,
    height: 50,
    marginTop: 20,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;