import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';

// --- Importaciones reales de Firebase ---
import { auth, db } from '../../services/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 

const HABILIDADES_INFORMATICA = [
  'Programación', 'Python', 'Álgebra', 'Cálculo', 'Diseño', 
  'JavaScript', 'Algoritmos', 'React Native', 'Node.js', 
  'UX/UI', 'Figma', 'Recursión', 'Java', 'Express', 
  'Base de Datos', 'SQL', 'NoSQL', 'AWS', 'Octave'
];

const InformacionRegistroScreen = ({ route, navigation }) => {
  // Recibimos los datos de SignUpScreen
  const { nombre, email, password } = route.params || {};

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((item) => item !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Traducción amigable de errores de Firebase
  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/email-already-in-use': return "Este correo ya está registrado.";
      case 'auth/invalid-email': return "El formato del correo es inválido.";
      case 'auth/weak-password': return "La contraseña es muy débil.";
      default: return "Ocurrió un error al registrar. Intenta de nuevo.";
    }
  };

  const finalizarRegistro = async () => {
    // Validación
    if (selectedSkills.length === 0) {
      Alert.alert("Atención", "Por favor selecciona al menos una habilidad para compartir.");
      return;
    }

    // Protegemos contra datos vacíos en caso de que route.params falle
    if (!email || !password || !nombre) {
      Alert.alert("Error", "Faltan datos de registro. Por favor vuelve al paso anterior.");
      return;
    }

    setLoading(true);

    try {
      // 1. Creamos el usuario en Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Guardamos su perfil en Firestore (Colección "users", documento con su UID)
      await setDoc(doc(db, "users", user.uid), {
        nombre: nombre.trim(),
        email: email.trim(),
        habilidades: selectedSkills,
        fechaRegistro: new Date().toISOString()
      });

      // ¡Todo listo! 
      // No necesitamos un navigation.navigate() aquí porque al crearse la cuenta,
      // Firebase inicia sesión automáticamente y tu AppNavigator nos moverá al MainNavigator.

    } catch (error) {
      console.log("Error en Firebase:", error);
      Alert.alert("Error de Registro", getFriendlyError(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D14" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Tus habilidades</Text>
        <Text style={styles.subtitle}>¿Qué habilidades podrías compartir?</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.categoryTitle}>Informática</Text>
        
        <View style={styles.tagsContainer}>
          {HABILIDADES_INFORMATICA.map((skill, index) => {
            const isSelected = selectedSkills.includes(skill);
            
            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.tag, 
                  isSelected ? styles.tagSelected : styles.tagUnselected
                ]}
                onPress={() => toggleSkill(skill)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tagText,
                  isSelected ? styles.tagTextSelected : styles.tagTextUnselected
                ]}>
                  {skill}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
          onPress={finalizarRegistro}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Listo</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D14', 
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#7E8494',
    fontSize: 16,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  categoryTitle: {
    color: '#7E8494',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, 
  },
  tag: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagUnselected: {
    backgroundColor: '#1C1F2B', 
    borderColor: '#2D3243',     
  },
  tagSelected: {
    backgroundColor: 'rgba(67, 56, 202, 0.15)', 
    borderColor: '#6C63FF',                     
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagTextUnselected: {
    color: '#7E8494', 
  },
  tagTextSelected: {
    color: '#8B85FF', 
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: '#0B0D14', 
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
    fontWeight: 'bold',
  },
});

export default InformacionRegistroScreen;