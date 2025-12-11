import { useState, useEffect } from 'react';
import {
  Compass, Search, Globe, Calendar, ExternalLink, Plus, RefreshCw,
  CheckCircle, AlertCircle, Sparkles, MapPin, Link, Download, Database
} from 'lucide-react';
import { crmApi } from '../../lib/api';

interface DiscoveredSalon {
  nom: string;
  edition?: string;
  lieu?: string;
  pays: string;
  dateDebut?: string;
  dateFin?: string;
  url?: string;
  urlListeExposants?: string;
  description?: string;
  source: string;
  confiance: number;
}

const COUNTRIES = [
  'France', 'Allemagne', 'Espagne', 'Italie', 'Royaume-Uni',
  'Pays-Bas', 'Belgique', 'Suisse', 'Autriche', 'Portugal'
];

export default function SalonDiscoveryPage() {
  const [knownSalons, setKnownSalons] = useState<DiscoveredSalon[]>([]);
  const [discoveredSalons, setDiscoveredSalons] = useState<DiscoveredSalon[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [importedSalons, setImportedSalons] = useState<Set<string>>(new Set());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  useEffect(() => {
    loadKnownSalons();
  }, [year, selectedCountries]);

  const loadKnownSalons = async () => {
    setLoading(true);
    try {
      const result = await crmApi.discoverSalons({
        year,
        countries: selectedCountries.join(',') || undefined,
        discover: false
      });
      if (result.success) {
        setKnownSalons(result.known || []);
      }
    } catch (error) {
      console.error('Error loading known salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const result = await crmApi.discoverSalons({
        year,
        countries: selectedCountries.join(',') || undefined,
        discover: true
      });
      if (result.success) {
        setKnownSalons(result.known || []);
        setDiscoveredSalons(result.discovered || []);
      }
    } catch (error) {
      console.error('Error discovering salons:', error);
    } finally {
      setDiscovering(false);
    }
  };

  const handleImport = async (salon: DiscoveredSalon) => {
    const key = salon.nom + salon.edition;
    setImporting(key);
    try {
      const result = await crmApi.importDiscoveredSalon(salon);
      if (result.success) {
        setImportedSalons(prev => new Set([...prev, key]));
        alert(`Salon "${salon.nom}" importe avec succes!`);
      } else {
        alert('Erreur: ' + (result.error || 'Import impossible'));
      }
    } catch (error) {
      console.error('Error importing salon:', error);
    } finally {
      setImporting(null);
    }
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Compass size={32} />
          <h1 className="text-3xl font-bold">Decouverte de Salons</h1>
        </div>
        <p className="text-lg opacity-90">
          Trouvez automatiquement des salons Transport & Logistique a scraper
        </p>
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all hover:shadow-lg flex items-center gap-2"
          >
            {discovering ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Decouvrir de nouveaux salons
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annee</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map(country => (
                <button
                  key={country}
                  onClick={() => toggleCountry(country)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCountries.includes(country)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {country}
                </button>
              ))}
              {selectedCountries.length > 0 && (
                <button
                  onClick={() => setSelectedCountries([])}
                  className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Known Salons */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <Database size={20} className="text-emerald-500" />
          <h2 className="text-lg font-semibold text-gray-900">Salons connus ({knownSalons.length})</h2>
          <span className="text-sm text-gray-500 ml-2">Base de donnees pre-configuree</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-emerald-500" />
            <span className="ml-2 text-gray-600">Chargement...</span>
          </div>
        ) : knownSalons.length === 0 ? (
          <div className="text-center py-12">
            <Database size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">Aucun salon connu pour ces criteres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {knownSalons.map((salon, idx) => (
              <SalonCard
                key={idx}
                salon={salon}
                isKnown={true}
                onImport={() => handleImport(salon)}
                importing={importing === salon.nom + salon.edition}
                imported={importedSalons.has(salon.nom + salon.edition)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Discovered Salons */}
      {discoveredSalons.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Salons decouverts ({discoveredSalons.length})</h2>
            <span className="text-sm text-gray-500 ml-2">Trouves par recherche web</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {discoveredSalons.map((salon, idx) => (
              <SalonCard
                key={idx}
                salon={salon}
                isKnown={false}
                onImport={() => handleImport(salon)}
                importing={importing === salon.nom + salon.edition}
                imported={importedSalons.has(salon.nom + salon.edition)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Comment ca marche?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Les <strong>salons connus</strong> sont pre-configures avec leurs URLs d'exposants</li>
          <li>2. Cliquez sur <strong>"Decouvrir"</strong> pour rechercher de nouveaux salons sur le web</li>
          <li>3. <strong>Importez</strong> les salons interessants dans votre base</li>
          <li>4. Lancez le <strong>scraping</strong> depuis la page Salons pour collecter les exposants</li>
          <li>5. L'<strong>enrichissement</strong> et l'ajout au <strong>pool</strong> sont automatiques!</li>
        </ul>
      </div>
    </div>
  );
}

function SalonCard({
  salon,
  isKnown,
  onImport,
  importing,
  imported
}: {
  salon: DiscoveredSalon;
  isKnown: boolean;
  onImport: () => void;
  importing: boolean;
  imported: boolean;
}) {
  return (
    <div className={`border rounded-xl p-4 transition-shadow hover:shadow-lg ${
      isKnown ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{salon.nom}</h3>
          {salon.edition && (
            <span className="text-sm text-gray-500">{salon.edition}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isKnown ? (
            <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">
              <CheckCircle size={12} />
              Connu
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">
              <Sparkles size={12} />
              {salon.confiance}%
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Globe size={14} />
          <span>{salon.pays}</span>
        </div>
        {salon.lieu && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} />
            <span>{salon.lieu}</span>
          </div>
        )}
        {salon.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{salon.description}</p>
        )}
      </div>

      {/* URLs */}
      <div className="space-y-1 mb-4">
        {salon.url && (
          <a
            href={salon.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
          >
            <ExternalLink size={12} />
            Site web
          </a>
        )}
        {salon.urlListeExposants ? (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <Link size={12} />
            URL exposants disponible
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-orange-600">
            <AlertCircle size={12} />
            URL exposants a configurer
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isKnown ? (
          <a
            href="/crm/salons"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
          >
            <Download size={14} />
            Voir dans Salons
          </a>
        ) : imported ? (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm"
          >
            <CheckCircle size={14} />
            Importe
          </button>
        ) : (
          <button
            onClick={onImport}
            disabled={importing}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {importing ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {importing ? 'Import...' : 'Importer'}
          </button>
        )}
      </div>
    </div>
  );
}
