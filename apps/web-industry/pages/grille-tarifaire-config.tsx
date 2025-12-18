/**
 * Configuration Grille Tarifaire - Portail Industrie
 * Définir la structure de grille que les transporteurs devront renseigner
 * + Frais annexes prévus à l'exploitation
 */

import { useEffect, useState, useCallback } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../lib/api';

// Types pour la configuration de grille
interface ZoneDefinition {
  id: string;
  code: string;
  name: string;
  type: 'region' | 'department' | 'country' | 'custom';
  isRequired: boolean;
}

interface PricingColumn {
  id: string;
  name: string;
  type: 'price' | 'rate' | 'percentage' | 'integer' | 'text';
  unit: string;
  isRequired: boolean;
  defaultValue?: string | number;
  minValue?: number;
  maxValue?: number;
  description?: string;
}

interface VehicleType {
  id: string;
  name: string;
  code: string;
  capacity: string;
  isActive: boolean;
}

interface AdditionalFee {
  id: string;
  code: string;
  name: string;
  description: string;
  calculationType: 'fixed' | 'percentage' | 'per_unit' | 'per_hour' | 'per_km';
  unit: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  isRequired: boolean;
  isActive: boolean;
  applicableTo: ('LTL' | 'FTL' | 'MESSAGERIE')[];
  category: 'manutention' | 'attente' | 'livraison' | 'administratif' | 'exceptionnel' | 'carburant' | 'autre';
}

interface PricingGridConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  transportTypes: ('LTL' | 'FTL' | 'MESSAGERIE')[];
  zones: ZoneDefinition[];
  columns: PricingColumn[];
  vehicleTypes: VehicleType[];
  additionalFees: AdditionalFee[];
  fuelSurcharge: {
    type: 'indexed' | 'fixed' | 'none';
    indexReference?: string;
    updateFrequency?: 'weekly' | 'monthly' | 'quarterly';
    minRate?: number;
    maxRate?: number;
  };
  paymentTerms: {
    defaultDays: number;
    options: number[];
  };
  volumeDiscounts: {
    enabled: boolean;
    thresholds: Array<{ minTransports: number; discountPercent: number }>;
  };
  validityPeriod: {
    defaultMonths: number;
    minMonths: number;
    maxMonths: number;
  };
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'archived';
}

// Frais annexes standards prédéfinis
const DEFAULT_FEES: AdditionalFee[] = [
  {
    id: 'fee-1',
    code: 'MANUT_PALETTE',
    name: 'Manutention palette',
    description: 'Manutention et déchargement par palette',
    calculationType: 'per_unit',
    unit: '€/palette',
    defaultValue: 3.50,
    minValue: 0,
    maxValue: 20,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'manutention'
  },
  {
    id: 'fee-2',
    code: 'ATTENTE_HEURE',
    name: 'Attente chauffeur',
    description: 'Temps d\'attente au-delà du temps gratuit (1h)',
    calculationType: 'per_hour',
    unit: '€/heure',
    defaultValue: 45,
    minValue: 20,
    maxValue: 100,
    isRequired: true,
    isActive: true,
    applicableTo: ['LTL', 'FTL', 'MESSAGERIE'],
    category: 'attente'
  },
  {
    id: 'fee-3',
    code: 'LIVRAISON_EXPRESS',
    name: 'Livraison express (J+1)',
    description: 'Supplément pour livraison le lendemain',
    calculationType: 'percentage',
    unit: '% du tarif base',
    defaultValue: 30,
    minValue: 10,
    maxValue: 100,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'MESSAGERIE'],
    category: 'livraison'
  },
  {
    id: 'fee-4',
    code: 'LIVRAISON_SAMEDI',
    name: 'Livraison samedi',
    description: 'Supplément pour livraison le samedi',
    calculationType: 'percentage',
    unit: '% du tarif base',
    defaultValue: 50,
    minValue: 20,
    maxValue: 150,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL', 'MESSAGERIE'],
    category: 'livraison'
  },
  {
    id: 'fee-5',
    code: 'RDV_FIXE',
    name: 'Rendez-vous fixe (créneau 2h)',
    description: 'Livraison sur créneau horaire précis',
    calculationType: 'fixed',
    unit: '€',
    defaultValue: 25,
    minValue: 10,
    maxValue: 80,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'livraison'
  },
  {
    id: 'fee-6',
    code: 'HAYON',
    name: 'Livraison hayon',
    description: 'Véhicule avec hayon élévateur requis',
    calculationType: 'fixed',
    unit: '€',
    defaultValue: 35,
    minValue: 15,
    maxValue: 100,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL'],
    category: 'manutention'
  },
  {
    id: 'fee-7',
    code: 'ADR',
    name: 'Transport ADR (matières dangereuses)',
    description: 'Supplément pour transport de matières dangereuses',
    calculationType: 'percentage',
    unit: '% du tarif base',
    defaultValue: 40,
    minValue: 20,
    maxValue: 100,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'exceptionnel'
  },
  {
    id: 'fee-8',
    code: 'ETAGE',
    name: 'Livraison en étage',
    description: 'Montée en étage sans ascenseur',
    calculationType: 'per_unit',
    unit: '€/étage',
    defaultValue: 8,
    minValue: 5,
    maxValue: 25,
    isRequired: false,
    isActive: true,
    applicableTo: ['MESSAGERIE'],
    category: 'manutention'
  },
  {
    id: 'fee-9',
    code: 'CONTRE_REMBOURSEMENT',
    name: 'Contre-remboursement',
    description: 'Encaissement à la livraison',
    calculationType: 'percentage',
    unit: '% du montant',
    defaultValue: 2,
    minValue: 1,
    maxValue: 5,
    isRequired: false,
    isActive: true,
    applicableTo: ['MESSAGERIE'],
    category: 'administratif'
  },
  {
    id: 'fee-10',
    code: 'SURCHARGE_CARBURANT',
    name: 'Surcharge carburant',
    description: 'Indexation carburant (CNR Gazole)',
    calculationType: 'percentage',
    unit: '% du tarif base',
    defaultValue: 15,
    minValue: 0,
    maxValue: 50,
    isRequired: true,
    isActive: true,
    applicableTo: ['LTL', 'FTL', 'MESSAGERIE'],
    category: 'carburant'
  },
  {
    id: 'fee-11',
    code: 'IMMOBILISATION',
    name: 'Immobilisation véhicule',
    description: 'Immobilisation du véhicule pour chargement/déchargement prolongé',
    calculationType: 'per_hour',
    unit: '€/heure',
    defaultValue: 75,
    minValue: 40,
    maxValue: 150,
    isRequired: false,
    isActive: true,
    applicableTo: ['FTL'],
    category: 'attente'
  },
  {
    id: 'fee-12',
    code: 'DOCUMENT_DOUANE',
    name: 'Formalités douanières',
    description: 'Gestion des documents douaniers (export/import)',
    calculationType: 'fixed',
    unit: '€',
    defaultValue: 50,
    minValue: 20,
    maxValue: 200,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'administratif'
  },
  {
    id: 'fee-13',
    code: 'TEMPERATURE_DIRIGEE',
    name: 'Transport température dirigée',
    description: 'Véhicule frigorifique ou isotherme',
    calculationType: 'percentage',
    unit: '% du tarif base',
    defaultValue: 25,
    minValue: 10,
    maxValue: 80,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'exceptionnel'
  },
  {
    id: 'fee-14',
    code: 'NOTIFICATION_LIVRAISON',
    name: 'Notification de livraison (SMS/Email)',
    description: 'Avis de passage et notification au destinataire',
    calculationType: 'fixed',
    unit: '€',
    defaultValue: 1.50,
    minValue: 0.50,
    maxValue: 5,
    isRequired: false,
    isActive: true,
    applicableTo: ['MESSAGERIE'],
    category: 'administratif'
  },
  {
    id: 'fee-15',
    code: 'ASSURANCE_AD_VALOREM',
    name: 'Assurance Ad Valorem',
    description: 'Assurance complémentaire sur valeur déclarée',
    calculationType: 'percentage',
    unit: '% de la valeur',
    defaultValue: 0.3,
    minValue: 0.1,
    maxValue: 2,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL', 'MESSAGERIE'],
    category: 'administratif'
  }
];

// Types de véhicules prédéfinis
const DEFAULT_VEHICLES: VehicleType[] = [
  { id: 'v1', code: 'VL', name: 'Véhicule Léger (3.5T)', capacity: '1.5T / 12m³', isActive: true },
  { id: 'v2', code: 'PORTEUR', name: 'Porteur (19T)', capacity: '9T / 45m³', isActive: true },
  { id: 'v3', code: 'SEMI', name: 'Semi-remorque', capacity: '25T / 90m³', isActive: true },
  { id: 'v4', code: 'MEGA', name: 'Méga (Grand volume)', capacity: '24T / 100m³', isActive: true },
  { id: 'v5', code: 'FRIGO', name: 'Frigorifique', capacity: 'Variable', isActive: true },
  { id: 'v6', code: 'BACHE', name: 'Bâché / Tautliner', capacity: '25T / 90m³', isActive: true },
  { id: 'v7', code: 'PLATEAU', name: 'Plateau / Savoyarde', capacity: '25T', isActive: false },
  { id: 'v8', code: 'CITERNE', name: 'Citerne', capacity: '30m³', isActive: false },
];

// Zones France
const ZONES_FRANCE = [
  { code: 'IDF', name: 'Île-de-France' },
  { code: 'ARA', name: 'Auvergne-Rhône-Alpes' },
  { code: 'BFC', name: 'Bourgogne-Franche-Comté' },
  { code: 'BRE', name: 'Bretagne' },
  { code: 'CVL', name: 'Centre-Val de Loire' },
  { code: 'GES', name: 'Grand Est' },
  { code: 'HDF', name: 'Hauts-de-France' },
  { code: 'NOR', name: 'Normandie' },
  { code: 'NAQ', name: 'Nouvelle-Aquitaine' },
  { code: 'OCC', name: 'Occitanie' },
  { code: 'PDL', name: 'Pays de la Loire' },
  { code: 'PAC', name: 'Provence-Alpes-Côte d\'Azur' },
  { code: 'COR', name: 'Corse' },
];

const ZONES_EUROPE = [
  { code: 'BE', name: 'Belgique' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'ES', name: 'Espagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'CH', name: 'Suisse' },
  { code: 'UK', name: 'Royaume-Uni' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AT', name: 'Autriche' },
  { code: 'PL', name: 'Pologne' },
];

export default function GrilleTarifaireConfigPage() {
  const router = useSafeRouter();
  const [activeTab, setActiveTab] = useState<'structure' | 'fees' | 'vehicles' | 'zones' | 'settings'>('structure');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Configuration state
  const [configName, setConfigName] = useState('Grille Tarifaire 2024');
  const [configDescription, setConfigDescription] = useState('Configuration standard pour les transporteurs référencés');
  const [selectedTransportTypes, setSelectedTransportTypes] = useState<string[]>(['LTL', 'FTL']);
  const [additionalFees, setAdditionalFees] = useState<AdditionalFee[]>(DEFAULT_FEES);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(DEFAULT_VEHICLES);
  const [selectedZones, setSelectedZones] = useState<string[]>(['IDF', 'ARA', 'HDF', 'PAC', 'NAQ', 'OCC']);
  const [includeEurope, setIncludeEurope] = useState(false);

  // Settings
  const [fuelSurchargeType, setFuelSurchargeType] = useState<'indexed' | 'fixed' | 'none'>('indexed');
  const [fuelIndexReference, setFuelIndexReference] = useState('CNR Gazole');
  const [defaultPaymentDays, setDefaultPaymentDays] = useState(30);
  const [enableVolumeDiscounts, setEnableVolumeDiscounts] = useState(true);
  const [volumeThresholds, setVolumeThresholds] = useState([
    { minTransports: 50, discountPercent: 3 },
    { minTransports: 100, discountPercent: 5 },
    { minTransports: 200, discountPercent: 8 },
  ]);
  const [validityMonths, setValidityMonths] = useState(12);

  // Modal state
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [editingFee, setEditingFee] = useState<AdditionalFee | null>(null);
  const [newFee, setNewFee] = useState<Partial<AdditionalFee>>({
    code: '',
    name: '',
    description: '',
    calculationType: 'fixed',
    unit: '€',
    defaultValue: 0,
    isRequired: false,
    isActive: true,
    applicableTo: ['LTL', 'FTL'],
    category: 'autre'
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => { setError(null); setSuccess(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const toggleFeeActive = (feeId: string) => {
    setAdditionalFees(fees =>
      fees.map(f => f.id === feeId ? { ...f, isActive: !f.isActive } : f)
    );
  };

  const updateFeeValue = (feeId: string, field: keyof AdditionalFee, value: any) => {
    setAdditionalFees(fees =>
      fees.map(f => f.id === feeId ? { ...f, [field]: value } : f)
    );
  };

  const addNewFee = () => {
    if (!newFee.code || !newFee.name) {
      setError('Code et nom requis');
      return;
    }
    const fee: AdditionalFee = {
      id: `fee-custom-${Date.now()}`,
      code: newFee.code!,
      name: newFee.name!,
      description: newFee.description || '',
      calculationType: newFee.calculationType as any || 'fixed',
      unit: newFee.unit || '€',
      defaultValue: newFee.defaultValue || 0,
      minValue: newFee.minValue,
      maxValue: newFee.maxValue,
      isRequired: newFee.isRequired || false,
      isActive: true,
      applicableTo: newFee.applicableTo as any || ['LTL', 'FTL'],
      category: newFee.category as any || 'autre'
    };
    setAdditionalFees([...additionalFees, fee]);
    setShowAddFeeModal(false);
    setNewFee({
      code: '', name: '', description: '', calculationType: 'fixed',
      unit: '€', defaultValue: 0, isRequired: false, isActive: true,
      applicableTo: ['LTL', 'FTL'], category: 'autre'
    });
    setSuccess('Frais ajouté');
  };

  const deleteFee = (feeId: string) => {
    if (!confirm('Supprimer ce frais ?')) return;
    setAdditionalFees(fees => fees.filter(f => f.id !== feeId));
    setSuccess('Frais supprimé');
  };

  const toggleVehicle = (vehicleId: string) => {
    setVehicleTypes(vehicles =>
      vehicles.map(v => v.id === vehicleId ? { ...v, isActive: !v.isActive } : v)
    );
  };

  const toggleZone = (zoneCode: string) => {
    setSelectedZones(zones =>
      zones.includes(zoneCode)
        ? zones.filter(z => z !== zoneCode)
        : [...zones, zoneCode]
    );
  };

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      // Ici on sauvegarderait vers l'API
      const config: PricingGridConfig = {
        id: `config-${Date.now()}`,
        name: configName,
        description: configDescription,
        version: '1.0',
        transportTypes: selectedTransportTypes as any[],
        zones: selectedZones.map(code => ({
          id: code,
          code,
          name: [...ZONES_FRANCE, ...ZONES_EUROPE].find(z => z.code === code)?.name || code,
          type: ZONES_EUROPE.some(z => z.code === code) ? 'country' : 'region',
          isRequired: false
        })),
        columns: [],
        vehicleTypes: vehicleTypes.filter(v => v.isActive),
        additionalFees: additionalFees.filter(f => f.isActive),
        fuelSurcharge: {
          type: fuelSurchargeType,
          indexReference: fuelIndexReference,
          updateFrequency: 'monthly'
        },
        paymentTerms: {
          defaultDays: defaultPaymentDays,
          options: [15, 30, 45, 60]
        },
        volumeDiscounts: {
          enabled: enableVolumeDiscounts,
          thresholds: volumeThresholds
        },
        validityPeriod: {
          defaultMonths: validityMonths,
          minMonths: 3,
          maxMonths: 24
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft'
      };

      console.log('Saving config:', config);
      setSuccess('Configuration enregistrée !');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = { background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '20px' };
  const buttonStyle = { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' as const };
  const inputStyle = { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', width: '100%' };
  const selectStyle = { ...inputStyle, background: 'rgba(30,30,50,0.8)' };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      manutention: '🏗️ Manutention',
      attente: '⏱️ Attente',
      livraison: '🚚 Livraison',
      administratif: '📋 Administratif',
      exceptionnel: '⚠️ Exceptionnel',
      carburant: '⛽ Carburant',
      autre: '📦 Autre'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      manutention: '#f59e0b',
      attente: '#ef4444',
      livraison: '#3b82f6',
      administratif: '#8b5cf6',
      exceptionnel: '#ec4899',
      carburant: '#10b981',
      autre: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  return (
    <>
      <Head><title>Configuration Grille Tarifaire | SYMPHONI.A</title></Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>⚙️</span>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Configuration Grille Tarifaire</h1>
                <p style={{ fontSize: '13px', margin: 0, opacity: 0.7 }}>Définir la structure que les transporteurs devront renseigner</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => router.push('/pricing-grids')} style={{ ...buttonStyle, background: 'rgba(255,255,255,0.1)' }}>
              📋 Voir les grilles
            </button>
            <button onClick={saveConfiguration} style={buttonStyle} disabled={loading}>
              {loading ? '⏳ Enregistrement...' : '💾 Enregistrer'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && <div style={{ background: 'rgba(239,68,68,0.3)', padding: '15px 40px', borderBottom: '1px solid rgba(239,68,68,0.5)' }}>❌ {error}</div>}
        {success && <div style={{ background: 'rgba(16,185,129,0.3)', padding: '15px 40px', borderBottom: '1px solid rgba(16,185,129,0.5)' }}>✅ {success}</div>}

        {/* Tabs */}
        <div style={{ padding: '0 40px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'structure', label: '📊 Structure', desc: 'Types de transport' },
              { id: 'fees', label: '💰 Frais Annexes', desc: 'Frais d\'exploitation' },
              { id: 'vehicles', label: '🚛 Véhicules', desc: 'Types de véhicules' },
              { id: 'zones', label: '🗺️ Zones', desc: 'Zones géographiques' },
              { id: 'settings', label: '⚙️ Paramètres', desc: 'Carburant, remises' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '16px 24px',
                  background: activeTab === tab.id ? 'rgba(102,126,234,0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? '700' : '400',
                  opacity: activeTab === tab.id ? 1 : 0.7,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>

          {/* Tab: Structure */}
          {activeTab === 'structure' && (
            <>
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Informations générales</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Nom de la configuration</label>
                    <input
                      style={inputStyle}
                      value={configName}
                      onChange={e => setConfigName(e.target.value)}
                      placeholder="Ex: Grille Tarifaire 2024"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Description</label>
                    <input
                      style={inputStyle}
                      value={configDescription}
                      onChange={e => setConfigDescription(e.target.value)}
                      placeholder="Description de la grille"
                    />
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Types de transport acceptés</h3>
                <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '20px' }}>
                  Sélectionnez les types de transport pour lesquels les transporteurs devront fournir des tarifs
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'LTL', icon: '📦', name: 'Groupage (LTL)', desc: 'Tarification par palette' },
                    { id: 'FTL', icon: '🚛', name: 'Lot complet (FTL)', desc: 'Tarification par véhicule' },
                    { id: 'MESSAGERIE', icon: '📬', name: 'Messagerie', desc: 'Tarification par poids' },
                  ].map(type => (
                    <div
                      key={type.id}
                      onClick={() => {
                        setSelectedTransportTypes(types =>
                          types.includes(type.id)
                            ? types.filter(t => t !== type.id)
                            : [...types, type.id]
                        );
                      }}
                      style={{
                        padding: '20px',
                        background: selectedTransportTypes.includes(type.id)
                          ? 'rgba(102,126,234,0.3)'
                          : 'rgba(255,255,255,0.05)',
                        border: selectedTransportTypes.includes(type.id)
                          ? '2px solid #667eea'
                          : '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        minWidth: '200px',
                        flex: 1,
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{type.icon}</div>
                      <div style={{ fontWeight: '700', marginBottom: '4px' }}>{type.name}</div>
                      <div style={{ fontSize: '13px', opacity: 0.7 }}>{type.desc}</div>
                      {selectedTransportTypes.includes(type.id) && (
                        <div style={{ marginTop: '8px', color: '#667eea', fontSize: '13px', fontWeight: '600' }}>
                          ✓ Activé
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Structure des tarifs</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {selectedTransportTypes.includes('LTL') && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                      <h4 style={{ margin: '0 0 12px 0' }}>📦 Groupage (LTL)</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', opacity: 0.8 }}>
                        <li>Tarif par zone origine → destination</li>
                        <li>Paliers par nombre de palettes</li>
                        <li>Prix minimum par expédition</li>
                        <li>Délai de transit</li>
                      </ul>
                    </div>
                  )}
                  {selectedTransportTypes.includes('FTL') && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                      <h4 style={{ margin: '0 0 12px 0' }}>🚛 Lot complet (FTL)</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', opacity: 0.8 }}>
                        <li>Tarif forfaitaire par zone</li>
                        <li>Tarif au km (option)</li>
                        <li>Par type de véhicule</li>
                        <li>Délai de transit</li>
                      </ul>
                    </div>
                  )}
                  {selectedTransportTypes.includes('MESSAGERIE') && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                      <h4 style={{ margin: '0 0 12px 0' }}>📬 Messagerie</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', opacity: 0.8 }}>
                        <li>Tarif par département</li>
                        <li>Paliers par tranche de poids</li>
                        <li>Diviseur volumétrique</li>
                        <li>Prix minimum</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Tab: Frais Annexes */}
          {activeTab === 'fees' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Frais Annexes d'Exploitation</h2>
                  <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '14px' }}>
                    Définissez les frais supplémentaires que les transporteurs devront renseigner
                  </p>
                </div>
                <button onClick={() => setShowAddFeeModal(true)} style={buttonStyle}>
                  + Ajouter un frais
                </button>
              </div>

              {/* Grouper par catégorie */}
              {['manutention', 'attente', 'livraison', 'administratif', 'exceptionnel', 'carburant', 'autre'].map(category => {
                const categoryFees = additionalFees.filter(f => f.category === category);
                if (categoryFees.length === 0) return null;

                return (
                  <div key={category} style={{ ...cardStyle, marginBottom: '16px' }}>
                    <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: getCategoryColor(category) }}>{getCategoryLabel(category)}</span>
                      <span style={{ fontSize: '12px', opacity: 0.5 }}>({categoryFees.length})</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {categoryFees.map(fee => (
                        <div
                          key={fee.id}
                          style={{
                            background: fee.isActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                            padding: '16px',
                            borderRadius: '8px',
                            opacity: fee.isActive ? 1 : 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                          }}
                        >
                          {/* Toggle */}
                          <div
                            onClick={() => toggleFeeActive(fee.id)}
                            style={{
                              width: '48px',
                              height: '24px',
                              borderRadius: '12px',
                              background: fee.isActive ? '#10b981' : 'rgba(255,255,255,0.2)',
                              position: 'relative',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'white',
                              position: 'absolute',
                              top: '2px',
                              left: fee.isActive ? '26px' : '2px',
                              transition: 'left 0.2s',
                            }} />
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                              {fee.name}
                              {fee.isRequired && <span style={{ color: '#ef4444', marginLeft: '8px' }}>*</span>}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>{fee.description}</div>
                            <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
                              Applicable: {fee.applicableTo.join(', ')}
                            </div>
                          </div>

                          {/* Valeur */}
                          <div style={{ textAlign: 'right', minWidth: '150px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="number"
                                value={fee.defaultValue}
                                onChange={e => updateFeeValue(fee.id, 'defaultValue', parseFloat(e.target.value))}
                                style={{ ...inputStyle, width: '80px', textAlign: 'right', padding: '6px 10px' }}
                                disabled={!fee.isActive}
                              />
                              <span style={{ fontSize: '13px', opacity: 0.7 }}>{fee.unit}</span>
                            </div>
                            {fee.minValue !== undefined && fee.maxValue !== undefined && (
                              <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
                                Min: {fee.minValue} / Max: {fee.maxValue}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <button
                            onClick={() => deleteFee(fee.id)}
                            style={{
                              background: 'rgba(239,68,68,0.2)',
                              border: 'none',
                              color: '#ef4444',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Tab: Véhicules */}
          {activeTab === 'vehicles' && (
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Types de véhicules</h3>
              <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '20px' }}>
                Sélectionnez les types de véhicules pour lesquels les transporteurs devront fournir des tarifs
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {vehicleTypes.map(vehicle => (
                  <div
                    key={vehicle.id}
                    onClick={() => toggleVehicle(vehicle.id)}
                    style={{
                      padding: '20px',
                      background: vehicle.isActive
                        ? 'rgba(102,126,234,0.2)'
                        : 'rgba(255,255,255,0.02)',
                      border: vehicle.isActive
                        ? '2px solid #667eea'
                        : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      opacity: vehicle.isActive ? 1 : 0.5,
                    }}
                  >
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>{vehicle.name}</div>
                    <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>
                      Code: {vehicle.code}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>
                      Capacité: {vehicle.capacity}
                    </div>
                    {vehicle.isActive && (
                      <div style={{ marginTop: '8px', color: '#667eea', fontSize: '12px', fontWeight: '600' }}>
                        ✓ Sélectionné
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Zones */}
          {activeTab === 'zones' && (
            <>
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Zones France</h3>
                <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '20px' }}>
                  Régions pour lesquelles les transporteurs devront fournir des tarifs
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ZONES_FRANCE.map(zone => (
                    <button
                      key={zone.code}
                      onClick={() => toggleZone(zone.code)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: selectedZones.includes(zone.code)
                          ? '2px solid #667eea'
                          : '1px solid rgba(255,255,255,0.2)',
                        background: selectedZones.includes(zone.code)
                          ? 'rgba(102,126,234,0.3)'
                          : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      {selectedZones.includes(zone.code) && '✓ '}
                      {zone.name}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => setSelectedZones(ZONES_FRANCE.map(z => z.code))}
                    style={{ ...buttonStyle, padding: '8px 16px', fontSize: '12px', marginRight: '8px' }}
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={() => setSelectedZones([])}
                    style={{ ...buttonStyle, padding: '8px 16px', fontSize: '12px', background: 'rgba(255,255,255,0.1)' }}
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>Zones Europe</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeEurope}
                      onChange={e => setIncludeEurope(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Inclure les zones européennes
                  </label>
                </div>
                {includeEurope && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {ZONES_EUROPE.map(zone => (
                      <button
                        key={zone.code}
                        onClick={() => toggleZone(zone.code)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: selectedZones.includes(zone.code)
                            ? '2px solid #667eea'
                            : '1px solid rgba(255,255,255,0.2)',
                          background: selectedZones.includes(zone.code)
                            ? 'rgba(102,126,234,0.3)'
                            : 'rgba(255,255,255,0.05)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        {selectedZones.includes(zone.code) && '✓ '}
                        {zone.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab: Paramètres */}
          {activeTab === 'settings' && (
            <>
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Surcharge carburant</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Type d'indexation</label>
                    <select
                      style={selectStyle}
                      value={fuelSurchargeType}
                      onChange={e => setFuelSurchargeType(e.target.value as any)}
                    >
                      <option value="indexed">Indexé (CNR ou autre)</option>
                      <option value="fixed">Taux fixe</option>
                      <option value="none">Aucun</option>
                    </select>
                  </div>
                  {fuelSurchargeType === 'indexed' && (
                    <div>
                      <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Référence d'index</label>
                      <input
                        style={inputStyle}
                        value={fuelIndexReference}
                        onChange={e => setFuelIndexReference(e.target.value)}
                        placeholder="Ex: CNR Gazole"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Conditions de paiement</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Délai de paiement par défaut</label>
                    <select
                      style={selectStyle}
                      value={defaultPaymentDays}
                      onChange={e => setDefaultPaymentDays(parseInt(e.target.value))}
                    >
                      <option value="15">15 jours</option>
                      <option value="30">30 jours</option>
                      <option value="45">45 jours</option>
                      <option value="60">60 jours</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Durée de validité par défaut</label>
                    <select
                      style={selectStyle}
                      value={validityMonths}
                      onChange={e => setValidityMonths(parseInt(e.target.value))}
                    >
                      <option value="3">3 mois</option>
                      <option value="6">6 mois</option>
                      <option value="12">12 mois</option>
                      <option value="24">24 mois</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>Remises volume</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enableVolumeDiscounts}
                      onChange={e => setEnableVolumeDiscounts(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Activer les remises volume
                  </label>
                </div>
                {enableVolumeDiscounts && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {volumeThresholds.map((threshold, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ opacity: 0.7 }}>À partir de</span>
                        <input
                          type="number"
                          value={threshold.minTransports}
                          onChange={e => {
                            const newThresholds = [...volumeThresholds];
                            newThresholds[idx].minTransports = parseInt(e.target.value);
                            setVolumeThresholds(newThresholds);
                          }}
                          style={{ ...inputStyle, width: '80px' }}
                        />
                        <span style={{ opacity: 0.7 }}>transports →</span>
                        <input
                          type="number"
                          value={threshold.discountPercent}
                          onChange={e => {
                            const newThresholds = [...volumeThresholds];
                            newThresholds[idx].discountPercent = parseFloat(e.target.value);
                            setVolumeThresholds(newThresholds);
                          }}
                          style={{ ...inputStyle, width: '60px' }}
                        />
                        <span style={{ opacity: 0.7 }}>% de remise</span>
                        <button
                          onClick={() => setVolumeThresholds(t => t.filter((_, i) => i !== idx))}
                          style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setVolumeThresholds([...volumeThresholds, { minTransports: 0, discountPercent: 0 }])}
                      style={{ ...buttonStyle, width: 'fit-content', padding: '8px 16px', fontSize: '13px' }}
                    >
                      + Ajouter un palier
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal: Ajouter un frais */}
        {showAddFeeModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ ...cardStyle, width: '600px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}>Ajouter un frais annexe</h3>
                <button onClick={() => setShowAddFeeModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Code *</label>
                    <input
                      style={inputStyle}
                      value={newFee.code}
                      onChange={e => setNewFee({ ...newFee, code: e.target.value.toUpperCase() })}
                      placeholder="Ex: FRAIS_CUSTOM"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Nom *</label>
                    <input
                      style={inputStyle}
                      value={newFee.name}
                      onChange={e => setNewFee({ ...newFee, name: e.target.value })}
                      placeholder="Nom du frais"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Description</label>
                  <input
                    style={inputStyle}
                    value={newFee.description}
                    onChange={e => setNewFee({ ...newFee, description: e.target.value })}
                    placeholder="Description du frais"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Type de calcul</label>
                    <select
                      style={selectStyle}
                      value={newFee.calculationType}
                      onChange={e => setNewFee({ ...newFee, calculationType: e.target.value as any })}
                    >
                      <option value="fixed">Montant fixe</option>
                      <option value="percentage">Pourcentage</option>
                      <option value="per_unit">Par unité</option>
                      <option value="per_hour">Par heure</option>
                      <option value="per_km">Par km</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Unité</label>
                    <input
                      style={inputStyle}
                      value={newFee.unit}
                      onChange={e => setNewFee({ ...newFee, unit: e.target.value })}
                      placeholder="€, %, €/h..."
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Valeur par défaut</label>
                    <input
                      type="number"
                      style={inputStyle}
                      value={newFee.defaultValue}
                      onChange={e => setNewFee({ ...newFee, defaultValue: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Catégorie</label>
                  <select
                    style={selectStyle}
                    value={newFee.category}
                    onChange={e => setNewFee({ ...newFee, category: e.target.value as any })}
                  >
                    <option value="manutention">🏗️ Manutention</option>
                    <option value="attente">⏱️ Attente</option>
                    <option value="livraison">🚚 Livraison</option>
                    <option value="administratif">📋 Administratif</option>
                    <option value="exceptionnel">⚠️ Exceptionnel</option>
                    <option value="carburant">⛽ Carburant</option>
                    <option value="autre">📦 Autre</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '6px' }}>Applicable à</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {['LTL', 'FTL', 'MESSAGERIE'].map(type => (
                      <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newFee.applicableTo?.includes(type as any)}
                          onChange={e => {
                            const current = newFee.applicableTo || [];
                            setNewFee({
                              ...newFee,
                              applicableTo: e.target.checked
                                ? [...current, type as any]
                                : current.filter(t => t !== type)
                            });
                          }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newFee.isRequired}
                    onChange={e => setNewFee({ ...newFee, isRequired: e.target.checked })}
                  />
                  Ce frais est obligatoire
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={addNewFee} style={buttonStyle}>
                  Ajouter le frais
                </button>
                <button onClick={() => setShowAddFeeModal(false)} style={{ ...buttonStyle, background: 'rgba(255,255,255,0.1)' }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
