import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Tablasd de puntos

// prioridad: 1 = Alta, 2 = Media, 3 = Baja
const RESOLUCION_PUNTOS = {
  1: { 5: 40, 4: 32, 3: 20, 2: 0, 1: -10, 0: -10 }, // Alta
  2: { 5: 20, 4: 16, 3: 10, 2: 0, 1: -5,  0: -5  }, // Media
  3: { 5: 10, 4: 8,  3: 5,  2: 0, 1: -2,  0: -2  }, // Baja
};

const ABANDONO_PUNTOS = {
  1: -10, // Alta
  2: -5,  // Media
  3: -3,  // Baja
};

// rangos de tiempo para el speed bonus
const SPEED_LIMIT_MS = {
  1: 15 * 60 * 1000,  // Alta: 15 minutos
  2: 60 * 60 * 1000,  // Media: 1 hora
  3: null,            // Baja: sin lmite
};

// Umbrales de racha
const STREAK_MULTIPLIERS = [
  { minStreak: 10, multiplier: 1.3 },
  { minStreak: 5,  multiplier: 1.2 },
  { minStreak: 3,  multiplier: 1.1 },
];


// Devuelve el multiplicador de racha segun la racha actual del usuario.
const getStreakMultiplier = (streak) => {
  for (const { minStreak, multiplier } of STREAK_MULTIPLIERS) {
    if (streak >= minStreak) return multiplier;
  }
  return 1.0;
};

// Normaliza la calificacion de estrellas a la clave de la tabla.
// 0-1 → 0, 2 → 2, 3 → 3, 4 → 4, 5 → 5
const normalizarEstrellas = (estrellas) => {
  if (estrellas <= 1) return 0;
  return estrellas;
};

// Funcion principal: otorgar puntos por resolucion

/**
 * Calcula y aplica los puntos al ayudante cuando se resuelve un ticket.
 *
 * @param {string}  ayudanteUid   - UID del ayudante que recibe los puntos
 * @param {number}  prioridad     - Prioridad del ticket (1=Alta, 2=Media, 3=Baja)
 * @param {number}  estrellas     - Calificacion recibida (0-5)
 * @param {string}  [fechaInicio] - ISO string de cuando empezo la conversacion (para speed bonus)
 * @returns {Promise<number>}     - Pu finntosales aplicados (puede ser negativo)
 */
export const otorgarPuntosResolucion = async (ayudanteUid, prioridad, estrellas, fechaInicio = null) => {
  try {
    const user = auth.currentUser;
    if (!user || !ayudanteUid) return 0;

    const userRef = doc(db, 'users', ayudanteUid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return 0;

    const data = snap.data();
    const estrellasKey = normalizarEstrellas(estrellas);
    const prioridadKey = prioridad in RESOLUCION_PUNTOS ? prioridad : 3;

    let puntosBase = RESOLUCION_PUNTOS[prioridadKey][estrellasKey] ?? 0;

    // Solo aplicar multiplicadores si los puntos son positivos
    if (puntosBase > 0) {
      // Multiplicador de racha
      const streak = data.streak || 0;
      const streakMult = getStreakMultiplier(streak);

      // Speed bonus
      let speedMult = 1.0;
      const limite = SPEED_LIMIT_MS[prioridadKey];
      if (fechaInicio && limite) {
        const elapsed = Date.now() - new Date(fechaInicio).getTime();
        if (elapsed <= limite) speedMult = 1.2;
      }

      // Multiplicador de rescate: primera vez que un usuario con < 100 pts resuelve Alta
      let rescateMult = 1.0;
      const puntosTotales = data.points || 0;
      const primerasAltas = data.primerasAltas || 0;
      if (prioridadKey === 1 && puntosTotales < 100 && primerasAltas === 0) {
        rescateMult = 2.0;
        await updateDoc(userRef, { primerasAltas: 1 });
      }

      puntosBase = Math.round(puntosBase * streakMult * speedMult * rescateMult);

      // Actualizar racha (solo si resolucion es positiva)
      const nuevaRacha = (data.streak || 0) + 1;
      await updateDoc(userRef, { streak: nuevaRacha });
    } else {
      // Resolucion mala o penalizacion: romper racha
      await updateDoc(userRef, { streak: 0 });
    }

    await updateDoc(userRef, {
      points: increment(puntosBase),
    });

    return puntosBase;
  } catch (error) {
    console.log('Error en otorgarPuntosResolucion:', error);
    return 0;
  }
};

// Penalizacion por abandono

/**
 * Aplica la penalizacion de puntos cuando el ayudante abandona un ticket.
 *
 * @param {string} ayudanteUid - UID del ayudante penalizado
 * @param {number} prioridad   - Prioridad del ticket (1=Alta, 2=Media, 3=Baja)
 * @returns {Promise<number>}  - Puntos aplicados (negativo)
 */
export const penalizarAbandono = async (ayudanteUid, prioridad) => {
  try {
    const user = auth.currentUser;
    if (!user || !ayudanteUid) return 0;

    const prioridadKey = prioridad in ABANDONO_PUNTOS ? prioridad : 3;
    const puntos = ABANDONO_PUNTOS[prioridadKey];

    const userRef = doc(db, 'users', ayudanteUid);
    await updateDoc(userRef, {
      points: increment(puntos),
      streak: 0, // Rompe la racha
    });

    return puntos;
  } catch (error) {
    console.log('Error en penalizarAbandono:', error);
    return 0;
  }
};

export const addPoints = async (amount) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      points: increment(amount),
    });
  } catch (error) {
    console.log('Error sumando puntos:', error);
  }
};

// Nivel y rangu

const NIVELES = [
  { nivel: 1,  minPuntos: 0,    maxPuntos: 99,   nombre: 'Novato',   rango: 'Novato'   },
  { nivel: 2,  minPuntos: 100,  maxPuntos: 249,   nombre: 'Ayudante', rango: 'Ayudante' },
  { nivel: 3,  minPuntos: 250,  maxPuntos: 499,   nombre: 'Experto',  rango: 'Experto'  },
  { nivel: 4,  minPuntos: 500,  maxPuntos: 849,   nombre: 'Maestro',  rango: 'Maestro'  },
  { nivel: 5,  minPuntos: 850,  maxPuntos: 1299,  nombre: 'Líder',    rango: 'Líder'    },
  { nivel: 6,  minPuntos: 1300, maxPuntos: Infinity, nombre: 'Héroe', rango: 'Héroe'   },
];

//d evuelve { nivel, rango, puntosEnNivel, puntosParaSiguiente, progresoPct } dado un total de puntos.
export const calcularNivel = (totalPuntos) => {
  const entry = NIVELES.slice().reverse().find(n => totalPuntos >= n.minPuntos) || NIVELES[0];
  const siguiente = NIVELES.find(n => n.nivel === entry.nivel + 1);

  const puntosEnNivel = totalPuntos - entry.minPuntos;
  const puntosParaSiguiente = siguiente
    ? siguiente.minPuntos - entry.minPuntos
    : null; // Nivel maximo

  const progresoPct = siguiente
    ? Math.min(100, Math.round((puntosEnNivel / puntosParaSiguiente) * 100))
    : 100;

  return {
    nivel: entry.nivel,
    rango: entry.rango,
    puntosEnNivel,
    puntosParaSiguiente,
    progresoPct,
  };
};