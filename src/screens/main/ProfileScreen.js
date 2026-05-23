import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Modal, Image, ScrollView, } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { auth, db } from '../../services/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

import { ALL_BADGES } from '../../utils/badges';

import i18next from '../../services/staticTL';

import { getSkillByName } from '../../utils/tagsList';


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

  // IDs de insignias que el usuario ya gano
  const [earnedBadgeIds, setEarnedBadgeIds] = useState([]);

  const [points, setPoints] = useState(0);
  const level = Math.max(1, Math.floor(points / 100) + 1);
  const progress = points % 100;
  const puntosRestantes = progress === 0 ? 100 : 100 - progress;

  const formattedDate = fechaRegistro
    ? new Date(fechaRegistro).toLocaleDateString('es-ES')
    : '';

  //Modales
  const [levelUpModal, setLevelUpModal] = useState({ visible: false, newLevel: 1, levelTitle: '' });
  const [badgeModal, setBadgeModal] = useState({ visible: false, badge: null });

  // Mezcla ALL_BADGES con estado earned/locked
  const badges = ALL_BADGES();
  const badgesWithStatus = badges.map((b) => ({
    ...b,
    earned: earnedBadgeIds.includes(b.id),
  }));

  const PREVIEW_COUNT = 6;
  const visibleBadges = showAllBadges
    ? badgesWithStatus
    : badgesWithStatus.slice(0, PREVIEW_COUNT);

  // Firestore listener 
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

      // Modal de subida de nivel
      const newLevel = Math.max(1, Math.floor((data.points || 0) / 100) + 1);
      if (previousLevel !== null && newLevel > previousLevel) {
        setLevelUpModal({
          visible: true,
          newLevel,
          levelTitle: getLevelName(newLevel),
        });
      }
      setPreviousLevel(newLevel);
    });

    return () => unsubscribe();
  }, [previousLevel]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.hero}>
        <TouchableOpacity
          style={styles.settingsFloating}
          onPress={() => navigation.navigate('SettingsScreen')}
        >
          <MaterialCommunityIcons name="cog" size={22} color="#F5F3FF" />
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
        <Text style={styles.subtitleDate}>{i18next.t("profile.activeSince", { date: formattedDate })}</Text>

        <View style={styles.pointsRow}>
          <MaterialCommunityIcons name="lightning-bolt" size={26} color="#FACC15" />
          <Text style={styles.points}>{points}</Text>
          <Text style={styles.pointsLabel}>{i18next.t("profile.puntos")}</Text>
        </View>

        {/* Nivel  y ango */}
        <View style={styles.levelBadge}>
          <MaterialCommunityIcons name="chevron-up" size={14} color="#A78BFA" style={{ marginRight: 2 }} />
          <Text style={styles.levelText}>
            {i18next.t("profile.nivel")} {level}
            <Text style={styles.rangoSeparator}> · </Text>
            <Text style={styles.rangoText}>{getLevelName(level)}</Text>
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {progress === 0 && points !== 0
            ? i18next.t("profile.levelClimb")
            : i18next.t("profile.faltan", { puntos: puntosRestantes })}
        </Text>
      </View>

      {/* HABILIDADES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18next.t("profile.habilidades")}</Text>
        <View style={styles.skillsList}>
          {habilidades.map((skill, i) => (
            <View key={i} style={styles.skillChip}>
              <MaterialCommunityIcons
              name="lightning-bolt"
              size={14}
              color="#818CF8"
              style={{ marginRight: 6 }}
            />

            <Text style={styles.skillText}>
              {getSkillByName(skill)}
            </Text>
          </View>
          ))}
        </View>
      </View>

      {/* ESTADISTICAS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18next.t("profile.estadisticas.titulo")}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.card}>
            <MaterialCommunityIcons name="hand-heart" size={20} color="#22C55E" style={{ marginBottom: 6 }} />
            <Text style={styles.cardNumber0}>{helpGiven}</Text>
            <Text style={styles.cardLabel}>{i18next.t("profile.estadisticas.ayuda")}</Text>
          </View>
          <View style={styles.card}>
            <MaterialCommunityIcons name="star" size={20} color="#F59E0B" style={{ marginBottom: 6 }} />
            <Text style={styles.cardNumber1}>{rated.toFixed(1)}</Text>
            <Text style={styles.cardLabel}>{i18next.t("profile.estadisticas.calificacion")}</Text>
          </View>
          <View style={styles.card}>
            <MaterialCommunityIcons name="message-text" size={20} color="#3B82F6" style={{ marginBottom: 6 }} />
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
              onPress={() => setBadgeModal({ visible: true, badge })}
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

      <View style={{ height: 30 }} />

      {/* ── MODAL: SUBIDA DE NIVEL ── */}
      <Modal visible={levelUpModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* Destellos decorativos */}
            <Text style={styles.levelUpEmoji}>🎉</Text>
            <Text style={styles.modalMainTitle}>{i18next.t("profile.newLevel.titulo")}</Text>
            <Text style={styles.newLevelNumber}>Nivel {levelUpModal.newLevel}</Text>
            <View style={styles.newRangoBadge}>
              <MaterialCommunityIcons name="chevron-double-up" size={14} color="#A78BFA" style={{ marginRight: 4 }} />
              <Text style={styles.newRangoText}>{levelUpModal.levelTitle}</Text>
            </View>
            <Text style={styles.modalDescription}>
              {i18next.t("profile.newLevel.mensaje", {
                newLevel: levelUpModal.newLevel,
                levelTitle: levelUpModal.levelTitle,
              })}
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setLevelUpModal(prev => ({ ...prev, visible: false }))}
            >
              <Text style={styles.modalPrimaryBtnText}>¡Genial!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: DETALLE INSIGNIA ── */}
      <Modal visible={badgeModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {badgeModal.badge && (
              <>
                <Text style={styles.badgeModalEmoji}>
                  {badgeModal.badge.earned ? badgeModal.badge.emoji : '🔒'}
                </Text>
                <Text style={styles.modalMainTitle}>
                  {badgeModal.badge.earned
                    ? badgeModal.badge.label
                    : `${badgeModal.badge.label}`}
                </Text>

                {badgeModal.badge.earned ? (
                  <>
                    <View style={styles.badgeEarnedChip}>
                      <Ionicons name="checkmark-circle" size={14} color="#4ADE80" style={{ marginRight: 4 }} />
                      <Text style={styles.badgeEarnedChipText}>{i18next.t("badges.desbloq")}</Text>
                    </View>
                    <Text style={styles.modalDescription}>{badgeModal.badge.desc}</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.badgeLockedChip}>
                      <Ionicons name="lock-closed" size={14} color="#8A8F9E" style={{ marginRight: 4 }} />
                      <Text style={styles.badgeLockedChipText}>Bloqueada</Text>
                    </View>
                    <Text style={styles.modalDescription}>
                      {i18next.t("badges.req")} {badgeModal.badge.desc}
                    </Text>
                  </>
                )}

                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={() => setBadgeModal({ visible: false, badge: null })}
                >
                  <Text style={styles.modalPrimaryBtnText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

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
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7C6CF6',
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: '#D4D1FF',
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'visible',
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

  rangoSeparator: {
    color: '#6366F1',
    fontWeight: '400',
  },

  rangoText: {
    color: '#C4B5FD',
    fontWeight: '700',
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
    marginTop: 4,
  },

  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.35)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },

  skillText: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  card: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  cardNumber0: {
    fontSize: 30,
    fontWeight: '900',
    color: '#22C55E',
    textShadowColor: 'rgba(34,197,94,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    letterSpacing: -1,
  },

  cardNumber1: {
    fontSize: 30,
    fontWeight: '900',
    color: '#F59E0B',
    textShadowColor: 'rgba(245,158,11,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    letterSpacing: -1,
  },

  cardNumber2: {
    fontSize: 30,
    fontWeight: '900',
    color: '#3B82F6',
    textShadowColor: 'rgba(59,130,246,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    letterSpacing: -1,
  },

  cardLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Badges grid
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  badgeCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    padding: 10,
    backgroundColor: '#131A2A',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },

  badgeCardLocked: {
    backgroundColor: '#0B1120',
    borderColor: 'rgba(255,255,255,0.04)',
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },

  badgeEmoji: {
    fontSize: 34,
    textShadowColor: 'rgba(139,92,246,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },

  badgeEmojiLocked: {
    fontSize: 28,
    opacity: 0.35,
  },

  badgeLabel: {
    color: '#E5E7EB',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  badgeLabelLocked: {
    color: '#4B5563',
  },

  verMasButton: {
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: '#151C2C',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  verMasText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Modales compartidos ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },

  modalBox: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },

  modalMainTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },

  modalDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 4,
  },

  modalPrimaryBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },

  modalPrimaryBtnText: {
    color: '#A78BFA',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // modal subida de nivel
  levelUpEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },

  newLevelNumber: {
    color: '#FACC15',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 10,
    textShadowColor: 'rgba(250,204,21,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },

  newRangoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.1)',
    marginBottom: 18,
  },

  newRangoText: {
    color: '#C4B5FD',
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal insignia
  badgeModalEmoji: {
    fontSize: 64,
    marginBottom: 12,
    textShadowColor: 'rgba(139,92,246,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },

  badgeEarnedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },

  badgeEarnedChipText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
  },

  badgeLockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 143, 158, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(138, 143, 158, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },

  badgeLockedChipText: {
    color: '#8A8F9E',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProfileScreen;