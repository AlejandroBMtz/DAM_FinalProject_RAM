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
import { useNavigation } from '@react-navigation/native';

import { auth, db } from '../../services/firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const ProfileScreen = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('Nombre del usuario');
  const [helpGiven, setHelpGiven] = useState(0);
  const [rated, setRated] = useState(0);
  const [helpAsked, setHelpAsked] = useState(0);
  const [fechaRegistro, setFechaRegistro] = useState('');
  const [habilidades, setHabilidades] = useState([]);
  const [carrera, setCarrera] = useState('');
  const [semestre, setSemestre] = useState('');
  const [previousLevel, setPreviousLevel] = useState(null);

  const [points, setPoints] = useState(0);
  const level = Math.max(1, Math.floor(points / 100) + 1);
  const progress = points % 100;
  const puntosRestantes = progress === 0 ? 100 : 100 - progress;

  const formattedDate = fechaRegistro
    ? new Date(fechaRegistro).toLocaleDateString('es-ES')
    : '';

  useEffect(() => {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          setUserName(data.nombre || 'Nombre del usuario');
          setHelpGiven(data.helpGiven || 0);
          setRated(data.rated || 0);
          setHelpAsked(data.helpAsked || 0);
          setPoints(data.points || 0);
          setFechaRegistro(data.fechaRegistro || '');
          setHabilidades(data.habilidades || []);
          setCarrera(data.carrera || '');
          setSemestre(data.semestre || '');

          const newLevel = Math.max(1, Math.floor((data.points || 0) / 100) + 1);
          if (previousLevel !== null && newLevel > previousLevel) {
            Alert.alert(
              "¡Felicidades!",
              `¡Has subido al nivel ${newLevel}!`,
              [{ text: "OK" }]
            );
          }
          setPreviousLevel(newLevel);
        }
      });

      return () => unsubscribe(); // Cleanup on unmount
    }
  }, [previousLevel]);

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, salir",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await signOut(auth);
            } catch (error) {
              console.log("Error al cerrar sesión:", error);
              Alert.alert("Error", "No se pudo cerrar la sesión.");
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.hero}>
        <TouchableOpacity 
          style={styles.settingsFloating}
          onPress={() => navigation.navigate('Settings')}
        >
          <MaterialCommunityIcons name="cog" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={40} color="#fff" />
        </View>
      </View>

      {/* INFO */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.subtitle}>
          {carrera} · {semestre}° Semestre
        </Text>

        {/* PUNTOS */}
        <View style={styles.pointsRow}>
          <MaterialCommunityIcons name="lightning-bolt" size={22} color="#FACC15" />
          <Text style={styles.points}>{points}</Text>
          <Text style={styles.pointsLabel}>Puntos</Text>
        </View>

        {/* NIVEL */}
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Nivel {level}</Text>
        </View>

        {/* PROGRESO */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${points % 100}%` }]} />
        </View>
      </View>
      <Text style={styles.progressText}>
      {progress === 0 && points != 0 
        ? '¡Subiste de nivel!' 
        : `Faltan ${puntosRestantes} puntos para el siguiente nivel`}
      </Text>

      {/* SKILLS */}
      <View style={styles.skillsList}>
        {habilidades.map((skill, i) => (
          <View key={i} style={styles.skillChip}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      {/* STATS */}
      <View style={styles.statsGrid}>
        <View style={styles.card}>
          <Text style={styles.cardNumber0}>{helpGiven}</Text>
          <Text style={styles.cardLabel}>Ayudas dadas</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardNumber1}>{rated}</Text>
          <Text style={styles.cardLabel}>Calificación</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardNumber2}>{helpAsked}</Text>
          <Text style={styles.cardLabel}>Ayudas pedidas</Text>
        </View>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D14',
  },

  hero: {
    backgroundColor: '#4F46E5',
    height: 160,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },

  settingsFloating: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 10,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },

  name: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  subtitle: {
    color: '#9CA3AF',
    marginTop: 5,
  },

  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  points: {
    color: '#FACC15',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 5,
  },

  pointsLabel: {
    color: '#9CA3AF',
    marginLeft: 5,
  },

  levelBadge: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  levelText: {
    color: '#6366F1',
  },

  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    marginTop: 10,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },

  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
  },

  skillChip: {
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 5,
  },

  skillText: {
    color: '#6366F1',
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },

  card: {
    backgroundColor: '#111827',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: 100,
  },

  cardNumber0: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22C55E',
  },

  cardNumber1: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  cardNumber2: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  cardLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 5,
  },

  logoutButton: {
    marginTop: 30,
    marginHorizontal: 20,
    backgroundColor: '#7F1D1D',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  logoutText: {
    color: '#F87171',
    fontWeight: 'bold',
  },
  progressText: {
  marginTop: 6,
  color: '#9CA3AF',
  fontSize: 12,
  textAlign: 'center',
},
});

export default ProfileScreen;