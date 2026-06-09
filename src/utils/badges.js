import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import i18next from '../services/staticTL';

/**
 * Catalogo completo de insignias.
 *
 * check(d) recibe el documento Firestore del usuario y devuelve true/false
 * Todas las condiciones son puras (sin side effects)
 */
const buildAllBadges = () => [

  // Primeros pasos
  {
    id: 'first_help',
    emoji: '🚀',
    label: i18next.t('badges.firstHelp'),
    desc: i18next.t('badges.firstHelpDesc'),
    check: (d) => (d.helpGiven || 0) >= 1,
  },
  {
    id: 'first_request',
    emoji: '🙋',
    label: i18next.t('badges.firstRequest'),
    desc: i18next.t('badges.firstRequestDesc'),
    check: (d) => (d.helpAsked || 0) >= 1,
  },

  // Ayuda acumulada
  {
    id: 'helper_5',
    emoji: '🤝',
    label: i18next.t('badges.helper5'),
    desc: i18next.t('badges.helper5Desc'),
    check: (d) => (d.helpGiven || 0) >= 5,
  },
  {
    id: 'helper_10',
    emoji: '🎯',
    label: i18next.t('badges.dedicado'),
    desc: i18next.t('badges.dedicadoDesc'),
    check: (d) => (d.helpGiven || 0) >= 10,
  },
  {
    id: 'helper_25',
    emoji: '👑',
    label: i18next.t('badges.top'),
    desc: i18next.t('badges.topDesc'),
    check: (d) => (d.helpGiven || 0) >= 25,
  },
  {
    id: 'helper_50',
    emoji: '🏆',
    label: i18next.t('badges.helper50'),
    desc: i18next.t('badges.helper50Desc'),
    check: (d) => (d.helpGiven || 0) >= 50,
  },
  {
    id: 'helper_100',
    emoji: '💎',
    label: i18next.t('badges.helper100'),
    desc: i18next.t('badges.helper100Desc'),
    check: (d) => (d.helpGiven || 0) >= 100,
  },

  // Calificacion
  {
    id: 'five_stars',
    emoji: '⭐',
    label: i18next.t('badges.estrellas'),
    desc: i18next.t('badges.estrellasDesc'),
    check: (d) => (d.rated || 0) >= 5,
  },
  {
    id: 'rating_4_5',
    emoji: '🌟',
    label: i18next.t('badges.rating45'),
    desc: i18next.t('badges.rating45Desc'),
    check: (d) => (d.rated || 0) >= 4.5 && (d.helpGiven || 0) >= 5,
  },
  {
    id: 'perfect_10',
    emoji: '💯',
    label: i18next.t('badges.perfect10'),
    desc: i18next.t('badges.perfect10Desc'),
    check: (d) => (d.perfectStreak || 0) >= 10,
  },

  // Racha
  {
    id: 'streak_3',
    emoji: '🔥',
    label: i18next.t('badges.streak3'),
    desc: i18next.t('badges.streak3Desc'),
    check: (d) => (d.streak || 0) >= 3,
  },
  {
    id: 'streak_7',
    emoji: '🔥',
    label: i18next.t('badges.rachaSiete'),
    desc: i18next.t('badges.rachaSieteDesc'),
    check: (d) => (d.streak || 0) >= 7,
  },
  {
    id: 'streak_15',
    emoji: '🌋',
    label: i18next.t('badges.streak15'),
    desc: i18next.t('badges.streak15Desc'),
    check: (d) => (d.streak || 0) >= 15,
  },

  // Velocidad
  {
    id: 'fast_reply',
    emoji: '⚡',
    label: i18next.t('badges.rapida'),
    desc: i18next.t('badges.rapidaDesc'),
    check: (d) => (d.fastReplies || 0) >= 1,
  },
  {
    id: 'speed_demon',
    emoji: '🏎️',
    label: i18next.t('badges.speedDemon'),
    desc: i18next.t('badges.speedDemonDesc'),
    check: (d) => (d.fastReplies || 0) >= 10,
  },

  // Categorias especificas
  {
    id: 'db_expert',
    emoji: '💡',
    label: i18next.t('badges.expertoDB'),
    desc: i18next.t('badges.expertoDBDesc'),
    check: (d) => (d.categoryCount?.['Bases de Datos'] || 0) >= 5,
  },
  {
    id: 'math_expert',
    emoji: '📐',
    label: i18next.t('badges.mathExpert'),
    desc: i18next.t('badges.mathExpertDesc'),
    check: (d) => (d.categoryCount?.['Matemáticas'] || 0) >= 5,
  },
  {
    id: 'programming_expert',
    emoji: '💻',
    label: i18next.t('badges.programmingExpert'),
    desc: i18next.t('badges.programmingExpertDesc'),
    check: (d) => (d.categoryCount?.['Programación'] || 0) >= 5,
  },
  {
    id: 'polymath',
    emoji: '🧠',
    label: i18next.t('badges.polymath'),
    desc: i18next.t('badges.polymathDesc'),
    check: (d) => {
      const counts = d.categoryCount || {};
      return Object.values(counts).filter((v) => v >= 1).length >= 5;
    },
  },

  // Niveles
  {
    id: 'level_3',
    emoji: '🎖️',
    label: i18next.t('badges.level3'),
    desc: i18next.t('badges.level3Desc'),
    check: (d) => Math.max(1, Math.floor((d.points || 0) / 100) + 1) >= 3,
  },
  {
    id: 'level_5',
    emoji: '🏅',
    label: i18next.t('badges.nivelCinco'),
    desc: i18next.t('badges.nivelCincoDesc'),
    check: (d) => Math.max(1, Math.floor((d.points || 0) / 100) + 1) >= 5,
  },
  {
    id: 'level_6',
    emoji: '🦸',
    label: i18next.t('badges.level6'),
    desc: i18next.t('badges.level6Desc'),
    check: (d) => Math.max(1, Math.floor((d.points || 0) / 100) + 1) >= 6,
  },

  // Puntos acumulados
  {
    id: 'points_100',
    emoji: '💰',
    label: i18next.t('badges.points100'),
    desc: i18next.t('badges.points100Desc'),
    check: (d) => (d.points || 0) >= 100,
  },
  {
    id: 'points_500',
    emoji: '💵',
    label: i18next.t('badges.points500'),
    desc: i18next.t('badges.points500Desc'),
    check: (d) => (d.points || 0) >= 500,
  },
  {
    id: 'points_1000',
    emoji: '💸',
    label: i18next.t('badges.points1000'),
    desc: i18next.t('badges.points1000Desc'),
    check: (d) => (d.points || 0) >= 1000,
  },

  // Comportamiento social
  {
    id: 'rescuer',
    emoji: '🦺',
    label: i18next.t('badges.rescuer'),
    desc: i18next.t('badges.rescuerDesc'),
    check: (d) => (d.primerasAltas || 0) >= 1,
  },
  {
    id: 'comeback',
    emoji: '🔄',
    label: i18next.t('badges.comeback'),
    desc: i18next.t('badges.comebackDesc'),
    check: (d) => (d.comebackCount || 0) >= 1,
  },
  {
    id: 'night_owl',
    emoji: '🦉',
    label: i18next.t('badges.nightOwl'),
    desc: i18next.t('badges.nightOwlDesc'),
    check: (d) => (d.nightHelps || 0) >= 3,
  },
];

export const ALL_BADGES = () => buildAllBadges();

/**
 * Evalúa todas las insignias contra los datos actuales del usuario indicado.
 *
 * @param {string} [uid] - UID del usuario a evaluar.
 *                         Si se omite, usa auth.currentUser.uid.
 *                         Pasar explicitamente el uid del AYUDANTE cuando se
 *                         llama desde performTermination (quien califica es el
 *                         solicitante, no el ayudante).
 * @returns {Promise<string[]>} ids de las insignias recien ganadas
 */
export const evaluateBadges = async (uid) => {
  try {
    const resolvedUid = uid || auth.currentUser?.uid;
    if (!resolvedUid) return [];

    const userRef = doc(db, 'users', resolvedUid);
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