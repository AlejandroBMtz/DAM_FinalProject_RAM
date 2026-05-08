import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

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
export const ALL_BADGES = [
  {
    id: 'first_help',
    emoji: '🚀',
    label: 'Primer Ayuda',
    desc: 'Da tu primera ayuda',
    check: (d) => (d.helpGiven || 0) >= 1,
  },
  {
    id: 'streak_7',
    emoji: '🔥',
    label: 'En Racha x7',
    desc: 'Ayuda en 7 tickets consecutivos',
    check: (d) => (d.streak || 0) >= 7,
  },
  {
    id: 'five_stars',
    emoji: '⭐',
    label: '5 Estrellas',
    desc: 'Mantén una calificación de 5.0',
    check: (d) => (d.rated || 0) >= 5,
  },
  {
    id: 'fast_reply',
    emoji: '⚡',
    label: 'Respuesta Rápida',
    desc: 'Responde un ticket en menos de 5 minutos',
    check: (d) => (d.fastReplies || 0) >= 1,
  },
  {
    id: 'db_expert',
    emoji: '💡',
    label: 'Experto BD',
    desc: 'Resuelve 5 tickets de Bases de Datos',
    check: (d) => (d.categoryCount?.['Bases de Datos'] || 0) >= 5,
  },
  {
    id: 'top_tutor',
    emoji: '👑',
    label: 'Top Tutor',
    desc: 'Da 25 ayudas en total',
    check: (d) => (d.helpGiven || 0) >= 25,
  },
  {
    id: 'helper_10',
    emoji: '🎯',
    label: 'Dedicado',
    desc: 'Da 10 ayudas en total',
    check: (d) => (d.helpGiven || 0) >= 10,
  },
  {
    id: 'level_5',
    emoji: '🏅',
    label: 'Nivel 5',
    desc: 'Alcanza el nivel 5',
    check: (d) => Math.max(1, Math.floor((d.points || 0) / 100) + 1) >= 5,
  },
];

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

    for (const badge of ALL_BADGES) {
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