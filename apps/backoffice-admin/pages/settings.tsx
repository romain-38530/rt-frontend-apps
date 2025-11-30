import { useState, useEffect } from 'react';
import { Save, Bell, Shield, Globe, Database, Mail } from 'lucide-react';

const ADMIN_GATEWAY = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'http://localhost:3008';

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    alerts: boolean;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: number;
  };
  system: {
    language: string;
    timezone: string;
    maintenanceMode: boolean;
  };
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: true,
      alerts: true,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
    },
    system: {
      language: 'fr',
      timezone: 'Europe/Paris',
      maintenanceMode: false,
    },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (typeof window !== 'undefined') {
        const t = window.localStorage.getItem('admin_jwt');
        if (t) headers['authorization'] = `Bearer ${t}`;
      }
      await fetch(`${ADMIN_GATEWAY}/admin/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Erreur lors de la sauvegarde:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Parametres</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {saved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Parametres sauvegardes avec succes
        </div>
      )}

      {/* Notifications */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="text-primary-500" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700">Notifications par email</span>
            <input
              type="checkbox"
              checked={settings.notifications.email}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, email: e.target.checked }
              })}
              className="w-5 h-5 text-primary-500 rounded"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700">Notifications push</span>
            <input
              type="checkbox"
              checked={settings.notifications.push}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, push: e.target.checked }
              })}
              className="w-5 h-5 text-primary-500 rounded"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-700">Alertes systeme</span>
            <input
              type="checkbox"
              checked={settings.notifications.alerts}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, alerts: e.target.checked }
              })}
              className="w-5 h-5 text-primary-500 rounded"
            />
          </label>
        </div>
      </section>

      {/* Securite */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-primary-500" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">Securite</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700">Authentification a deux facteurs</span>
            <input
              type="checkbox"
              checked={settings.security.twoFactor}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, twoFactor: e.target.checked }
              })}
              className="w-5 h-5 text-primary-500 rounded"
            />
          </label>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Delai d'expiration de session (minutes)</span>
            <select
              value={settings.security.sessionTimeout}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, sessionTimeout: Number(e.target.value) }
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 heure</option>
              <option value={120}>2 heures</option>
            </select>
          </div>
        </div>
      </section>

      {/* Systeme */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="text-primary-500" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">Systeme</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Langue</span>
            <select
              value={settings.system.language}
              onChange={(e) => setSettings({
                ...settings,
                system: { ...settings.system, language: e.target.value }
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="fr">Francais</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="es">Espanol</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Fuseau horaire</span>
            <select
              value={settings.system.timezone}
              onChange={(e) => setSettings({
                ...settings,
                system: { ...settings.system, timezone: e.target.value }
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
            </select>
          </div>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-700">Mode maintenance</span>
              <p className="text-sm text-gray-500">Desactive l'acces aux portails utilisateurs</p>
            </div>
            <input
              type="checkbox"
              checked={settings.system.maintenanceMode}
              onChange={(e) => setSettings({
                ...settings,
                system: { ...settings.system, maintenanceMode: e.target.checked }
              })}
              className="w-5 h-5 text-primary-500 rounded"
            />
          </label>
        </div>
      </section>
    </main>
  );
}
