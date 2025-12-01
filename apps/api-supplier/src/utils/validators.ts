/**
 * Utilitaires de validation
 */

/**
 * Valide un numéro SIRET français (14 chiffres)
 */
export const validateSIRET = (siret: string): boolean => {
  if (!siret) return false;

  // Supprimer les espaces
  const cleanSiret = siret.replace(/\s/g, '');

  // Doit contenir exactement 14 chiffres
  if (!/^\d{14}$/.test(cleanSiret)) {
    return false;
  }

  // Algorithme de Luhn pour validation
  let sum = 0;
  let digit;
  let tmp;

  for (let i = 0; i < 14; i++) {
    digit = parseInt(cleanSiret.charAt(i), 10);
    if (i % 2 === 1) {
      tmp = digit * 2;
      digit = tmp > 9 ? tmp - 9 : tmp;
    }
    sum += digit;
  }

  return sum % 10 === 0;
};

/**
 * Valide un email
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone français
 */
export const validatePhoneFR = (phone: string): boolean => {
  if (!phone) return false;

  // Formats acceptés: 0X XX XX XX XX, +33 X XX XX XX XX, etc.
  const cleanPhone = phone.replace(/[\s\-\.]/g, '');

  // Doit commencer par 0 (10 chiffres) ou +33 (11 chiffres avec indicatif)
  return /^(0[1-9]\d{8}|(\+33|0033)[1-9]\d{8})$/.test(cleanPhone);
};

/**
 * Valide un code postal français
 */
export const validatePostalCodeFR = (postalCode: string): boolean => {
  if (!postalCode) return false;

  // 5 chiffres
  return /^\d{5}$/.test(postalCode);
};

/**
 * Valide un format d'heure (HH:MM)
 */
export const validateTimeFormat = (time: string): boolean => {
  if (!time) return false;

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Valide qu'une date est dans le futur
 */
export const isFutureDate = (date: Date | string): boolean => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  return checkDate.getTime() > Date.now();
};

/**
 * Valide qu'une date est dans le passé
 */
export const isPastDate = (date: Date | string): boolean => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  return checkDate.getTime() < Date.now();
};

/**
 * Valide qu'un créneau horaire est cohérent (startTime < endTime)
 */
export const validateTimeSlot = (startTime: string, endTime: string): boolean => {
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return false;
  }

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return startMinutes < endMinutes;
};

/**
 * Valide la taille d'un fichier
 */
export const validateFileSize = (size: number, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
};

/**
 * Valide l'extension d'un fichier
 */
export const validateFileExtension = (
  filename: string,
  allowedExtensions: string[]
): boolean => {
  if (!filename) return false;

  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
};

/**
 * Valide des coordonnées GPS
 */
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Sanitize une chaîne de caractères
 */
export const sanitizeString = (str: string): string => {
  if (!str) return '';

  return str
    .trim()
    .replace(/[<>]/g, '') // Supprimer les balises HTML
    .replace(/\s+/g, ' '); // Normaliser les espaces
};

/**
 * Valide un mot de passe (minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre)
 */
export const validatePassword = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Formate un SIRET pour l'affichage (XXX XXX XXX XXXXX)
 */
export const formatSIRET = (siret: string): string => {
  if (!siret) return '';

  const clean = siret.replace(/\s/g, '');
  if (clean.length !== 14) return siret;

  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
};

/**
 * Formate un numéro de téléphone français pour l'affichage (0X XX XX XX XX)
 */
export const formatPhoneFR = (phone: string): string => {
  if (!phone) return '';

  const clean = phone.replace(/[\s\-\.]/g, '');

  if (clean.startsWith('+33')) {
    const national = '0' + clean.slice(3);
    return national.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }

  if (clean.length === 10) {
    return clean.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }

  return phone;
};
