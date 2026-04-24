import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  StatusBar,
  ActivityIndicator, 
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Importaciones de Firebase
import { auth } from '../../services/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Estado para el loader
  const [loading, setLoading] = useState(false);

  // Traduccion de errores de Firebase
  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/invalid-email': return "Correo inválido";
      case 'auth/invalid-credential': return "Credenciales incorrectas";
      case 'auth/user-not-found': return "Usuario no encontrado";
      case 'auth/wrong-password': return "Contraseña incorrecta";
      default: return "Ocurrió un error. Intenta de nuevo";
    }
  };

  const handleLogin = async () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    // Validacion de correo institucional
    if (!email) {
      setEmailError('El correo es obligatorio.');
      isValid = false;
    } else if (!email.trim().endsWith('@alumnos.uaq.mx')) {
      setEmailError('Debe ser un correo institucional (@alumnos.uaq.mx).');
      isValid = false;
    }

    // Validacion de contraseña
    if (!password) {
      setPasswordError('La contraseña es obligatoria.');
      isValid = false;
    } 

    if (!isValid) return; // Si hay error, detenemos la funcion aqui

    setLoading(true);

    try {
      // Llamada a Firebase
      await signInWithEmailAndPassword(auth, email.trim(), password);
      
      
      // No usamos navigation.navigate('HomeScreen') aquí, porque el AppNavigator detectara automaticamente el inicio de sesion
      // y cambiara la pantalla.
      
    } catch (error) {
      // Si falla, mostramos el error debajo del input de contraseña
      setPasswordError(getFriendlyError(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#0B0D14" />
      
      {/* Contenedor del Logo */}
      <View style={styles.logoContainer}>
        <Image source={require('../../../assets/images/Logo.png')} style={{ width: 150, height: 150, resizeMode: 'contain' }} />
      </View>

      <Text style={styles.title}>Bienvenido</Text>
      <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>

      {/* Input Correo */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Correo electrónico</Text>
        <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
          <MaterialCommunityIcons name="email-outline" size={20} color="#7E8494" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="correo@alumnos.uaq.mx"
            placeholderTextColor="#7E8494"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>

      {/* Input Contraseña */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
          <MaterialCommunityIcons name="lock-outline" size={20} color="#7E8494" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#7E8494"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#7E8494" 
            />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      </View>

      {/* Opciones extras */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setRememberMe(!rememberMe)}>
          <MaterialCommunityIcons 
            name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"} 
            size={20} 
            color={rememberMe ? "#2563EB" : "#7E8494"} 
          />
          <Text style={styles.checkboxText}>Recordarme</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>

      {/* Botón Principal (Con estado de carga) */}
      <TouchableOpacity 
        style={[styles.loginButton, loading && { opacity: 0.7 }]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.loginButtonText}>Iniciar sesión</Text>
        )}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>o continúa con</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity style={styles.googleButton}>
        <MaterialCommunityIcons name="google" size={20} color="#FFF" style={{ marginRight: 10 }} />
        <Text style={styles.googleButtonText}>Google</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.registerLink}>Regístrate aquí</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0B0D14', 
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
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
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#E5E7EB',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F2B', 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D3243',
    paddingHorizontal: 14,
    height: 50,
  },
  inputError: {
    borderColor: '#EF4444', 
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    color: '#E5E7EB',
    fontSize: 14,
    marginLeft: 8,
  },
  forgotText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#2563EB', 
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#2D3243',
  },
  dividerText: {
    color: '#7E8494',
    paddingHorizontal: 14,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#1C1F2B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D3243',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  googleButtonText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#7E8494',
    fontSize: 14,
  },
  registerLink: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default LoginScreen;