import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import i18next from '../services/staticTL';

/**
 * Catálogo completo de insignias.
 *
 * Cada entrada tiene:
 *  - id        → clave única que se guarda en Firestore (campo `badges` del usuario)
 *  - emoji     → ícono visual
 *  - label     → nombre mostrado en la UI
 *  - desc      → descripción corta del requisito
 *  - check(d)  → función pura que recibe el documento del usuario y devuelve true/false
 */
const buildAllBadges = () => [
  {
    id: 'first_help',
    emoji: '🚀',
    label: i18next.t('badges.firstHelp'),
    desc: i18next.t('badges.firstHelpDesc'),
    check: (d) => (d.helpGiven || 0) >= 1,
  },
  {
    id: 'streak_7',
    emoji: '🔥',
    label: i18next.t('badges.rachaSiete'),
    desc: i18next.t('badges.rachaSieteDesc'),
    check: (d) => (d.streak || 0) >= 7,
  },
  {
    id: 'five_stars',
    emoji: '⭐',
    label: i18next.t('badges.estrellas'),
    desc: i18next.t('badges.estrellasDesc'),
    check: (d) => (d.rated || 0) >= 5,
  },
  {
    id: 'fast_reply',
    emoji: '⚡',
    label: i18next.t('badges.rapida'),
    desc: i18next.t('badges.rapidaDesc'),
    check: (d) => (d.fastReplies || 0) >= 1,
  },
  {
    id: 'db_expert',
    emoji: '💡',
    label: i18next.t('badges.expertoDB'),
    desc: i18next.t('badges.expertoDBDesc'),
    check: (d) => (d.categoryCount?.['Bases de Datos'] || 0) >= 5,
  },
  {
    id: 'top_tutor',
    emoji: '👑',
    label: i18next.t('badges.top'),
    desc: i18next.t('badges.topDesc'),
    check: (d) => (d.helpGiven || 0) >= 25,
  },
  {
    id: 'helper_10',
    emoji: '🎯',
    label: i18next.t('badges.dedicado'),
    desc: i18next.t('badges.dedicadoDesc'),
    check: (d) => (d.helpGiven || 0) >= 10,
  },
  {
    id: 'level_5',
    emoji: '🏅',
    label: i18next.t('badges.nivelCinco'),
    desc: i18next.t('badges.nivelCincoDesc'),
    check: (d) => Math.max(1, Math.floor((d.points || 0) / 100) + 1) >= 5,
  },
];

export const ALL_BADGES = () => buildAllBadges();

/**
 * Evalúa todas las insignias contra los datos actuales del usuario.
 * Si encuentra insignias nuevas, las añade al array `badges` en Firestore
 * y devuelve las que se acaban de desbloquear (para mostrar alerta).
 *
 * Llamar desde cualquier lugar donde cambien los datos del usuario,
 * por ejemplo después de addPoints() o al cerrar un ticket.
 *
 * @returns {Promise<string[]>} ids de las insignias recién ganadas
 */
export const evaluateBadges = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return [];

    const data = snap.data();
    const earned = new Set(data.badges || []);
    const newlyEarned = [];

    for (const badge of ALL_BADGES()) {
      if (!earned.has(badge.id) && badge.check(data)) {
        newlyEarned.push(badge.id);
      }
    }

    if (newlyEarned.length > 0) {
      await updateDoc(userRef, {
        badges: arrayUnion(...newlyEarned),
      });
    }

    return newlyEarned;
  } catch (error) {
    console.log('Error evaluando insignias:', error);
    return [];
  }
};