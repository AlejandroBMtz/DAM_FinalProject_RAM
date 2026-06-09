import i18next from '../services/staticTL';

/**
 * Encoded skills/tags list with numeric IDs for translation support
 * Each skill uses a numeric ID as the key to support multi-language translation
 */

export const SKILLS_ENCODED = [
  { id: 1, key: 'skills.programming' },
  { id: 2, key: 'skills.python' },
  { id: 3, key: 'skills.algebra' },
  { id: 4, key: 'skills.calculus' },
  { id: 5, key: 'skills.design' },
  { id: 6, key: 'skills.javascript' },
  { id: 7, key: 'skills.algorithms' },
  { id: 8, key: 'skills.reactNative' },
  { id: 9, key: 'skills.nodejs' },
  { id: 10, key: 'skills.uxui' },
  { id: 11, key: 'skills.figma' },
  { id: 12, key: 'skills.recursion' },
  { id: 13, key: 'skills.java' },
  { id: 14, key: 'skills.express' },
  { id: 15, key: 'skills.database' },
  { id: 16, key: 'skills.sql' },
  { id: 17, key: 'skills.nosql' },
  { id: 18, key: 'skills.aws' },
  { id: 19, key: 'skills.octave' },
];

export const getSkillName = (skillId) => {
  const skill = SKILLS_ENCODED.find(s => s.id === skillId);
  if (skill) {
    return i18next.t(skill.key);
  }
  return '';
};

export const getAllSkillNames = () => {
  return SKILLS_ENCODED.map(skill => i18next.t(skill.key));
};

export const getAllSkillIds = () => {
  return SKILLS_ENCODED.map(skill => skill.id);
};

/**
 * Find a skill by name in ANY language and return the translated name in the CURRENT language
 * Useful for displaying stored tags that might be in a different language
 * @param {string} name - Skill name in any language (English or Spanish)
 * @returns {string} - Skill name translated to current app language
 */
export const normalizeSkillName = (name) => {
  if (!name) return '';
  
  // Find the skill by checking if name matches in English or Spanish
  const skill = SKILLS_ENCODED.find(skill => {
    const enName = i18next.t(skill.key, { lng: 'en' });
    const esName = i18next.t(skill.key, { lng: 'es' });
    return name === enName || name === esName;
  });
  
  if (skill) {
    // Return the translated name in current app language
    return i18next.t(skill.key);
  }
  
  // Return original if not found
  return name;
};

/**
 * Get skill ID from a skill name (works with any language)
 * @param {string} name - Skill name in any language
 * @returns {number|null} - Skill ID or null if not found
 */
export const getSkillIdByName = (name) => {
  if (!name) return null;
  
  const skill = SKILLS_ENCODED.find(skill => {
    const enName = i18next.t(skill.key, { lng: 'en' });
    const esName = i18next.t(skill.key, { lng: 'es' });
    return name === enName || name === esName;
  });
  
  return skill ? skill.id : null;
};

/**
 * Convert array of skill names (in any language) to current language
 * @param {string[]} skillNames - Array of skill names in any language
 * @returns {string[]} - Array of skill names in current app language
 */
export const normalizeSkillNames = (skillNames) => {
  if (!Array.isArray(skillNames)) return [];
  return skillNames.map(name => normalizeSkillName(name));
};

/**
 * Convert array of skill names to numeric IDs for storage in Firebase
 * @param {string[]} skillNames - Array of skill names in any language
 * @returns {number[]} - Array of skill IDs
 */
export const convertSkillsToIds = (skillNames) => {
  if (!Array.isArray(skillNames)) return [];
  return skillNames
    .map(name => getSkillIdByName(name))
    .filter(id => id !== null);
};

/**
 * Convert array of skill IDs to translated names in current language
 * @param {number[]} skillIds - Array of skill IDs
 * @returns {string[]} - Array of translated skill names in current language
 */
export const convertIdsToSkills = (skillIds) => {
  if (!Array.isArray(skillIds)) return [];
  return skillIds.map(id => getSkillName(id));
};

/**
 * Backward compatibility: legacy function name for normalizeSkillName
 */
export const getSkillByName = (name) => {
  return normalizeSkillName(name);
};

/**
 * Backward compatibility: legacy conversion functions
 */
export const convertSkillsToDisplay = (skillIds) => {
  return convertIdsToSkills(skillIds);
};

export const convertSkillsToStorage = (skillNames) => {
  return convertSkillsToIds(skillNames);
};

export default SKILLS_ENCODED;
