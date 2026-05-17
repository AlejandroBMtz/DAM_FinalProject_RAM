import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  ScrollView,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { auth, db } from '../../services/firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { ALL_BADGES } from '../../utils/badges';

import i18next from '../../services/staticTL';

//Helpers

const getLevelName = (level) => {
  const names = {
    1: i18next.t("profile.levelName.1"),
    2: i18next.t("profile.levelName.2"),
    3: i18next.t("profile.levelName.3"),
    4: i18next.t("profile.levelName.4"),
    5: i18next.t("profile.levelName.5"),
    6: i18next.t("profile.levelName.6"),
    7: i18next.t("profile.levelName.7"),
    8: i18next.t("profile.levelName.8"),
    9: i18next.t("profile.levelName.9"),
    10: i18next.t("profile.levelName.10"),
    11: i18next.t("profile.levelName.11"),
    12: i18next.t("profile.levelName.12"),
    13: i18next.t("profile.levelName.13"),
    14: i18next.t("profile.levelName.14"),
    15: i18next.t("profile.levelName.15"),
  };
  return names[level] || `${i18next.t("profile.nivel")} ${level}`;
};

// Component

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
  const [photoUrl, setPhotoUrl] = useState('');
  const [previousLevel, setPreviousLevel] = useState(null);
  const [showAllBadges, setShowAllBadges] = useState(false);

  // IDs de insignias que el usuario ya gano (vienen de Firestore)
  const [earnedBadgeIds, setEarnedBadgeIds] = useState([]);

  const [points, setPoints] = useState(0);
  const level = Math.max(1, Math.floor(points / 100) + 1);
  const progress = points % 100;
  const puntosRestantes = progress === 0 ? 100 : 100 - progress;
  const levelName = getLevelName(level);

  const formattedDate = fechaRegistro
    ? new Date(fechaRegistro).toLocaleDateString('es-ES')
    : '';

  // Mezcla ALL_BADGES con el estado earned/locked del usuario
  const badges = ALL_BADGES();
  const badgesWithStatus = badges.map((b) => ({
    ...b,
    earned: earnedBadgeIds.includes(b.id),
  }));

  const PREVIEW_COUNT = 6;
  const visibleBadges = showAllBadges
    ? badgesWithStatus
    : badgesWithStatus.slice(0, PREVIEW_COUNT);

  //Firestore listener
  useEffect(() => {
    if (!auth.currentUser) return;

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (!docSnap.exists()) return;

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
      setPhotoUrl(data.fotoPerfil || '');
      setEarnedBadgeIds(data.badges || []);

      // Alerta de subida de nivel
      const newLevel = Math.max(1, Math.floor((data.points || 0) / 100) + 1);
      if (previousLevel !== null && newLevel > previousLevel) {
        Alert.alert(
          i18next.t("profile.newLevel.titulo"),
          i18next.t("profile.newLevel.mensaje", {newLevel: newLevel, levelTitle: getLevelName(newLevel)}),
          [{ text: 'OK' }]
        );
      }
      setPreviousLevel(newLevel);
    });

    return () => unsubscribe();
  }, [previousLevel]);

  // Logout


  // Render
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.hero}>
        <TouchableOpacity
          style={styles.settingsFloating}
          onPress={() => navigation.navigate('SettingsScreen')}
        >
          <MaterialCommunityIcons name="cog" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
            ) : (
              <MaterialCommunityIcons name="account" size={44} color="#fff" />
            )}
          </View>
        </View>
      </View>

      {/* INFO */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.subtitle}>
          {carrera} · {semestre}° {i18next.t("profile.semestre")}
        </Text>
        <Text style={styles.subtitleDate}>{i18next.t("profile.activeSince", {date: formattedDate})}</Text>

        <View style={styles.pointsRow}>
          <MaterialCommunityIcons name="lightning-bolt" size={26} color="#FACC15" />
          <Text style={styles.points}>{points}</Text>
          <Text style={styles.pointsLabel}>{i18next.t("profile.puntos")}</Text>
        </View>

        <View style={styles.levelBadge}>
          <MaterialCommunityIcons name="chevron-up" size={14} color="#A78BFA" style={{ marginRight: 2 }} />
          <Text style={styles.levelText}>{i18next.t("profile.nivel")} {level} - {levelName}</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {progress === 0 && points !== 0
            ? i18next.t("profile.levelClimb")
            : i18next.t("profile.faltan", {puntos: puntosRestantes})}
        </Text>
      </View>

      {/* HABILIDADES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18next.t("profile.habilidades")}</Text>
        <View style={styles.skillsList}>
          {habilidades.map((skill, i) => (
            <View key={i} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ESTADÍSTICAS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18next.t("profile.estadisticas.titulo")}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.card}>
            <Text style={styles.cardNumber0}>{helpGiven}</Text>
            <Text style={styles.cardLabel}>{i18next.t("profile.estadisticas.ayuda")}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardNumber1}>{rated.toFixed(1)}</Text>
            <Text style={styles.cardLabel}>{i18next.t("profile.estadisticas.calificacion")}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardNumber2}>{helpAsked}</Text>
            <Text style={styles.cardLabel}>{i18next.t("profile.estadisticas.solicitudes")}</Text>
          </View>
        </View>
      </View>

      {/* INSIGNIAS */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>INSIGNIAS</Text>
          <Text style={styles.badgeCount}>
            {earnedBadgeIds.length}/{badges.length}
          </Text>
        </View>

        <View style={styles.badgesGrid}>
          {visibleBadges.map((badge) => (
            <TouchableOpacity
              key={badge.id}
              style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}
              onPress={() =>
                Alert.alert(
                  badge.earned ? badge.label : `🔒 ${badge.label}`,
                  badge.earned
                    ? `${i18next.t("badges.desbloq")}\n${badge.desc}`
                    : `${i18next.t("badges.req")} ${badge.desc}`
                )
              }
              activeOpacity={0.75}
            >
              <Text style={[styles.badgeEmoji, !badge.earned && styles.badgeEmojiLocked]}>
                {badge.earned ? badge.emoji : '🔒'}
              </Text>
              <Text style={[styles.badgeLabel, !badge.earned && styles.badgeLabelLocked]}>
                {badge.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {badges.length > PREVIEW_COUNT && (
          <TouchableOpacity
            style={styles.verMasButton}
            onPress={() => setShowAllBadges(!showAllBadges)}
          >
            <Text style={styles.verMasText}>
              {showAllBadges ? i18next.t("profile.seeLess") : i18next.t("profile.seeMore")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LOGOUT */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D14',
  },

  hero: {
    backgroundColor: '#4338CA',
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  settingsFloating: {
    position: 'absolute',
    top: 52,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    padding: 8,
    borderRadius: 10,
  },

  avatarWrapper: {
    position: 'absolute',
    bottom: -44,
    alignSelf: 'center',
  },

  avatar: {
    width: 135,
    height: 135,
    borderRadius: 75,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#0B0D14',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  infoContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },

  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },

  subtitleDate: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },

  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },

  points: {
    color: '#FACC15',
    fontSize: 32,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: -0.5,
  },

  pointsLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 6,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },

  levelBadge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },

  levelText: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
  },

  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    marginTop: 12,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 10,
  },

  progressText: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
  },

  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  badgeCount: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 12,
  },

  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  skillChip: {
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },

  skillText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '500',
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  card: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },

  cardNumber0: {
    fontSize: 24,
    fontWeight: '800',
    color: '#22C55E'
  },
  cardNumber1: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F59E0B'
  },
  cardNumber2: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B82F6'
  },

  cardLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },

  // Badges grid
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  badgeCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  badgeCardLocked: {
    backgroundColor: '#0D111A',
    opacity: 0.5,
  },

  badgeEmoji: {
    fontSize: 30,
  },

  badgeEmojiLocked: {
    fontSize: 26,
    opacity: 0.4,
  },

  badgeLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  badgeLabelLocked: {
    color: '#4B5563',
  },

  verMasButton: {
    alignSelf: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },

  verMasText: {
    color: '#9CA3AF',
    fontSize: 13,
  },

  logoutButton: {
    marginTop: 28,
    marginHorizontal: 20,
    backgroundColor: '#1F0A0A',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  logoutText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default ProfileScreen;