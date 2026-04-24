import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  StatusBar,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SignUpScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Manejo de errores de validacion
  const [errors, setErrors] = useState({});

  const handleContinue = () => {
    let newErrors = {};

    if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    
    if (!email.trim()) {
      newErrors.email = 'El correo es obligatorio.';
    } else if (!email.trim().endsWith('@alumnos.uaq.mx')) {
      newErrors.email = 'Debe ser tu correo institucional.';
    }

    // Evaluamos que contiene la contraseña
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneMinuscula = /[a-z]/.test(password);
    const tieneNumero = /\d/.test(password);
    const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else if (password.length < 8) {
      newErrors.password = 'Debe tener al menos 8 caracteres.';
    } else if (!tieneMayuscula || !tieneMinuscula || !tieneNumero || !tieneEspecial) {
      newErrors.password = 'Debe incluir mayúscula, minúscula, número y un símbolo.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    if (!acceptTerms) {
      newErrors.terms = 'Debes aceptar los términos para continuar.';
    }

    setErrors(newErrors);

    // Si no hay errores, navegamos a la siguiente pantalla pasando los datos
    if (Object.keys(newErrors).length === 0) {
      navigation.navigate('InformacionRegistro', {
        nombre: nombre.trim(),
        email: email.trim(),
        password: password
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor="#0B0D14" />
      
      {/* Contenedor del Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../../assets/images/Logo.png')} 
          style={{ width: 90, height: 90, resizeMode: 'contain' }} 
        />
      </View>

      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Completa los datos para registrarte</Text>

      {/* Input Nombre */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre completo</Text>
        <View style={[styles.inputContainer, errors.nombre ? styles.inputError : null]}>
          <MaterialCommunityIcons name="account-outline" size={20} color="#7E8494" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor="#7E8494"
            autoCapitalize="words"
            value={nombre}
            onChangeText={(text) => {
              setNombre(text);
              if (errors.nombre) setErrors({...errors, nombre: null});
            }}
          />
        </View>
        {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
      </View>

      {/* Input Correo */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Correo electrónico</Text>
        <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
          <MaterialCommunityIcons name="email-outline" size={20} color="#7E8494" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#7E8494"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({...errors, email: null});
            }}
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      {/* Input Contraseña */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
          <MaterialCommunityIcons name="lock-outline" size={20} color="#7E8494" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#7E8494"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({...errors, password: null});
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
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      {/* Input Confirmar Contraseña */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmar contraseña</Text>
        <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : null]}>
          <MaterialCommunityIcons name="lock-outline" size={20} color="#7E8494" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#7E8494"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({...errors, confirmPassword: null});
            }}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <MaterialCommunityIcons 
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#7E8494" 
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      {/* Checkbox de Términos */}
      <View style={styles.termsContainer}>
        <TouchableOpacity style={styles.checkbox} onPress={() => {
          setAcceptTerms(!acceptTerms);
          if (errors.terms) setErrors({...errors, terms: null});
        }}>
          <MaterialCommunityIcons 
            name={acceptTerms ? "checkbox-marked" : "checkbox-blank-outline"} 
            size={22} 
            color={acceptTerms ? "#2563EB" : "#2D3243"} 
          />
        </TouchableOpacity>
        <Text style={styles.termsText}>
          Acepto los <Text style={styles.linkText}>términos y condiciones</Text> y las <Text style={styles.linkText}>políticas de privacidad</Text>
        </Text>
      </View>
      {errors.terms && <Text style={[styles.errorText, { marginBottom: 15 }]}>{errors.terms}</Text>}

      {/* Botón Principal */}
      <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
        <Text style={styles.primaryButtonText}>Crear cuenta</Text>
      </TouchableOpacity>

      {/* Divisor */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>o regístrate con</Text>
        <View style={styles.divider} />
      </View>

      {/* Botón Google */}
      <TouchableOpacity style={styles.googleButton}>
        <MaterialCommunityIcons name="google" size={20} color="#FFF" style={{ marginRight: 10 }} />
        <Text style={styles.googleButtonText}>Google</Text>
      </TouchableOpacity>

      {/* Link de Login */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkTextBold}>Inicia sesión</Text>
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
    paddingTop: 50,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#7E8494',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#E5E7EB',
    fontSize: 13,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 10,
  },
  checkbox: {
    marginRight: 10,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    color: '#E5E7EB',
    fontSize: 13,
    lineHeight: 20,
  },
  linkText: {
    color: '#2563EB',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#2563EB', 
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  primaryButtonText: {
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
    fontSize: 13,
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
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#7E8494',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default SignUpScreen;