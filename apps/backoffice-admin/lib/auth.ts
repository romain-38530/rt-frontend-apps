// Utilitaires d'authentification

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('authToken');
};

export const getUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const logout = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // Check both possible token keys for backward compatibility
  return localStorage.getItem('admin_jwt') || localStorage.getItem('authToken');
};
