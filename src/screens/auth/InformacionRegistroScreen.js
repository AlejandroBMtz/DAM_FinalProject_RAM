import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';

// Cuando estés listo para conectar Firebase, descomenta esto:
// import { auth } from '../../services/firebaseConfig';
// import { createUserWithEmailAndPassword } from 'firebase/auth';

const InformacionRegistroScreen = ({ route, navigation }) => {
  // 1. Recibimos los datos de la pantalla SignUpScreen
  // Ponemos "|| {}" para evitar un error si entras a la pantalla sin datos
  const { nombre, email, password } = route.params || {};

  const finalizarRegistro = async () => {
    console.log("Intentando crear cuenta para:", email);
    
    // Aquí irá tu lógica final:
    /*
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("¡Usuario creado!", userCredential.user.uid);
    } catch (error) {
      console.log(error);
    }
    */
  };

  // 2. OBLIGATORIO: Todo componente debe retornar algo visual (JSX)
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D14" />
      
      <Text style={styles.title}>¡Casi listo!</Text>
      
      {/* Mostramos el nombre para comprobar que el dato pasó correctamente */}
      <Text style={styles.subtitle}>Hola {nombre}, confirma que este es tu correo institucional:</Text>
      <Text style={styles.emailText}>{email}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={finalizarRegistro}>
        <Text style={styles.primaryButtonText}>Finalizar Registro</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D14', 
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    color: '#7E8494',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  emailText: {
    color: '#2563EB',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// 3. OBLIGATORIO: Exportar el componente para que el Navigator lo pueda leer
export default InformacionRegistroScreen;