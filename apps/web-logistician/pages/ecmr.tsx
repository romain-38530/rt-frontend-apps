/**
 * Page e-CMR Digital - Portail Logistique SYMPHONI.A
 *
 * Fonctionnalités:
 * - Liste des CMR avec filtres (statut, date, transporteur)
 * - Création de CMR liée à une commande
 * - Signature électronique tactile
 * - Visualisation et téléchargement PDF
 * - Ajout de réserves avec photos
 * - Historique des signatures
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getAuthToken, getUser } from '../lib/auth';
import { ecmrApi, ordersApi } from '../lib/api';

// Types
interface EcmrDocument {
  _id: string;
  cmrNumber: string;
  orderId?: string;
  orderRef?: string;
  createdAt: string;
  status: 'draft' | 'pending_sender' | 'pending_carrier' | 'pending_recipient' | 'completed' | 'disputed';
  // Parties
  sender: {
    name: string;
    address: string;
    city: string;
    country: string;
    contact?: string;
  };
  carrier: {
    name: string;
    address: string;
    vehiclePlate?: string;
    driverName?: string;
    driverPhone?: string;
  };
  recipient: {
    name: string;
    address: string;
    city: string;
    country: string;
    contact?: string;
  };
  // Marchandise
  goods: {
    description: string;
    quantity: number;
    weight: number;
    packaging: string;
    pallets?: number;
  };
  // Dates
  pickupDate?: string;
  deliveryDate?: string;
  // Signatures
  signatures: {
    sender?: { name: string; date: string; signature: string };
    carrier?: { name: string; date: string; signature: string };
    recipient?: { name: string; date: string; signature: string };
  };
  // Réserves
  reservations: Array<{
    type: 'damage' | 'missing' | 'delay' | 'other';
    description: string;
    photo?: string;
    createdAt: string;
    createdBy: string;
  }>;
}

interface Order {
  _id: string;
  orderRef: string;
  clientName: string;
  destinationAddress: string;
  status: string;
}

type TabType = 'all' | 'pending' | 'completed' | 'disputed';
type ModalType = 'none' | 'create' | 'view' | 'sign' | 'reserve';

export default function EcmrPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // State
  const [documents, setDocuments] = useState<EcmrDocument[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal state
  const [modalType, setModalType] = useState<ModalType>('none');
  const [selectedCmr, setSelectedCmr] = useState<EcmrDocument | null>(null);
  const [signatureType, setSignatureType] = useState<'sender' | 'carrier' | 'recipient'>('sender');
  const [signerName, setSignerName] = useState('');

  // Form state pour création
  const [newCmr, setNewCmr] = useState({
    orderId: '',
    sender: { name: '', address: '', city: '', country: 'France', contact: '' },
    carrier: { name: '', address: '', vehiclePlate: '', driverName: '', driverPhone: '' },
    recipient: { name: '', address: '', city: '', country: 'France', contact: '' },
    goods: { description: '', quantity: 0, weight: 0, packaging: 'Palettes', pallets: 0 }
  });

  // Reserve form
  const [reserveForm, setReserveForm] = useState({
    type: 'damage' as 'damage' | 'missing' | 'delay' | 'other',
    description: ''
  });

  // Charger les données
  const fetchData = async () => {
    try {
      setLoading(true);

      // Charger les CMR
      const cmrData = await ecmrApi.list();
      if (cmrData.documents || Array.isArray(cmrData)) {
        setDocuments(cmrData.documents || cmrData);
      } else {
        // Mock data
        setDocuments(generateMockCmrs());
      }

      // Charger les commandes pour création CMR
      try {
        const ordersData = await ordersApi.list();
        if (ordersData.orders) {
          setOrders(ordersData.orders);
        }
      } catch {
        setOrders([
          { _id: '1', orderRef: 'CMD-2024-1234', clientName: 'Client A', destinationAddress: 'Paris', status: 'confirmed' },
          { _id: '2', orderRef: 'CMD-2024-1235', clientName: 'Client B', destinationAddress: 'Lyon', status: 'confirmed' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setDocuments(generateMockCmrs());
    } finally {
      setLoading(false);
    }
  };

  // Générer des CMR mock
  const generateMockCmrs = (): EcmrDocument[] => {
    const now = new Date();
    return [
      {
        _id: '1',
        cmrNumber: 'CMR-2025-00001',
        orderId: 'ord-1',
        orderRef: 'CMD-2024-1234',
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
        status: 'completed',
        sender: { name: 'Entrepôt Paris Nord', address: '123 Rue de la Logistique', city: 'Roissy', country: 'France' },
        carrier: { name: 'Transports Martin', address: '45 Avenue du Transport', vehiclePlate: 'AB-123-CD', driverName: 'Jean Dupont' },
        recipient: { name: 'Carrefour Lyon', address: '78 Boulevard des Clients', city: 'Lyon', country: 'France' },
        goods: { description: 'Produits alimentaires', quantity: 24, weight: 12000, packaging: 'Palettes', pallets: 24 },
        pickupDate: new Date(now.getTime() - 86400000).toISOString(),
        deliveryDate: new Date(now.getTime() - 43200000).toISOString(),
        signatures: {
          sender: { name: 'Pierre Martin', date: new Date(now.getTime() - 86400000).toISOString(), signature: 'data:image/png;base64,...' },
          carrier: { name: 'Jean Dupont', date: new Date(now.getTime() - 82800000).toISOString(), signature: 'data:image/png;base64,...' },
          recipient: { name: 'Marie Durand', date: new Date(now.getTime() - 43200000).toISOString(), signature: 'data:image/png;base64,...' }
        },
        reservations: []
      },
      {
        _id: '2',
        cmrNumber: 'CMR-2025-00002',
        orderId: 'ord-2',
        orderRef: 'CMD-2024-1235',
        createdAt: new Date(now.getTime() - 43200000).toISOString(),
        status: 'pending_recipient',
        sender: { name: 'Entrepôt Marseille', address: '200 Quai du Port', city: 'Marseille', country: 'France' },
        carrier: { name: 'Express Fret', address: '12 Rue des Camions', vehiclePlate: 'EF-456-GH', driverName: 'Pierre Martin' },
        recipient: { name: 'Auchan Bordeaux', address: '90 Avenue des Hypermarchés', city: 'Bordeaux', country: 'France' },
        goods: { description: 'Électroménager', quantity: 15, weight: 8500, packaging: 'Palettes', pallets: 15 },
        pickupDate: new Date(now.getTime() - 43200000).toISOString(),
        signatures: {
          sender: { name: 'Alain Bernard', date: new Date(now.getTime() - 43200000).toISOString(), signature: 'data:image/png;base64,...' },
          carrier: { name: 'Pierre Martin', date: new Date(now.getTime() - 39600000).toISOString(), signature: 'data:image/png;base64,...' }
        },
        reservations: []
      },
      {
        _id: '3',
        cmrNumber: 'CMR-2025-00003',
        orderRef: 'CMD-2024-1236',
        createdAt: new Date().toISOString(),
        status: 'pending_carrier',
        sender: { name: 'Hub Lyon', address: '45 Avenue du Transport', city: 'Saint-Priest', country: 'France' },
        carrier: { name: 'Logistique Sud', address: '78 Boulevard Maritime', vehiclePlate: 'IJ-789-KL', driverName: 'Alain Bernard' },
        recipient: { name: 'Leclerc Toulouse', address: '123 Route de Toulouse', city: 'Toulouse', country: 'France' },
        goods: { description: 'Produits cosmétiques', quantity: 33, weight: 5000, packaging: 'Cartons', pallets: 10 },
        pickupDate: new Date().toISOString(),
        signatures: {
          sender: { name: 'Sophie Lefebvre', date: new Date().toISOString(), signature: 'data:image/png;base64,...' }
        },
        reservations: []
      },
      {
        _id: '4',
        cmrNumber: 'CMR-2025-00004',
        orderRef: 'CMD-2024-1237',
        createdAt: new Date().toISOString(),
        status: 'disputed',
        sender: { name: 'Entrepôt Paris Nord', address: '123 Rue de la Logistique', city: 'Roissy', country: 'France' },
        carrier: { name: 'Trans Europe', address: '45 Europastrasse', vehiclePlate: 'DE-MU-1234', driverName: 'Klaus Mueller' },
        recipient: { name: 'Metro Berlin', address: '90 Berlinerstrasse', city: 'Berlin', country: 'Allemagne' },
        goods: { description: 'Vins et spiritueux', quantity: 20, weight: 11000, packaging: 'Palettes', pallets: 20 },
        pickupDate: new Date(now.getTime() - 172800000).toISOString(),
        deliveryDate: new Date(now.getTime() - 86400000).toISOString(),
        signatures: {
          sender: { name: 'Pierre Martin', date: new Date(now.getTime() - 172800000).toISOString(), signature: 'data:image/png;base64,...' },
          carrier: { name: 'Klaus Mueller', date: new Date(now.getTime() - 169200000).toISOString(), signature: 'data:image/png;base64,...' },
          recipient: { name: 'Hans Schmidt', date: new Date(now.getTime() - 86400000).toISOString(), signature: 'data:image/png;base64,...' }
        },
        reservations: [
          { type: 'damage', description: '3 cartons endommagés - étiquettes arrachées', createdAt: new Date(now.getTime() - 86400000).toISOString(), createdBy: 'Hans Schmidt' }
        ]
      },
      {
        _id: '5',
        cmrNumber: 'CMR-2025-00005',
        createdAt: new Date().toISOString(),
        status: 'draft',
        sender: { name: '', address: '', city: '', country: 'France' },
        carrier: { name: '', address: '', vehiclePlate: '', driverName: '' },
        recipient: { name: '', address: '', city: '', country: 'France' },
        goods: { description: '', quantity: 0, weight: 0, packaging: 'Palettes', pallets: 0 },
        signatures: {},
        reservations: []
      }
    ];
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchData();
  }, []);

  // Filtrer les documents
  const filteredDocuments = documents.filter(doc => {
    // Filtre par onglet
    if (activeTab === 'pending' && !['pending_sender', 'pending_carrier', 'pending_recipient', 'draft'].includes(doc.status)) return false;
    if (activeTab === 'completed' && doc.status !== 'completed') return false;
    if (activeTab === 'disputed' && doc.status !== 'disputed') return false;

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!doc.cmrNumber.toLowerCase().includes(term) &&
          !doc.carrier.name.toLowerCase().includes(term) &&
          !doc.recipient.name.toLowerCase().includes(term) &&
          !(doc.orderRef?.toLowerCase().includes(term))) {
        return false;
      }
    }

    // Filtre par date
    if (dateFilter && doc.createdAt.split('T')[0] !== dateFilter) return false;

    return true;
  });

  // Stats
  const stats = {
    total: documents.length,
    pending: documents.filter(d => ['pending_sender', 'pending_carrier', 'pending_recipient', 'draft'].includes(d.status)).length,
    completed: documents.filter(d => d.status === 'completed').length,
    disputed: documents.filter(d => d.status === 'disputed').length
  };

  // Obtenir la couleur du statut
  const getStatusStyle = (status: EcmrDocument['status']) => {
    switch (status) {
      case 'completed': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', label: '✅ Complété' };
      case 'pending_sender': return { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24', label: '✍️ Attente expéditeur' };
      case 'pending_carrier': return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6', label: '🚛 Attente transporteur' };
      case 'pending_recipient': return { bg: 'rgba(168, 85, 247, 0.2)', text: '#a855f7', label: '📦 Attente destinataire' };
      case 'disputed': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', label: '⚠️ Litige' };
      default: return { bg: 'rgba(156, 163, 175, 0.2)', text: '#9ca3af', label: '📝 Brouillon' };
    }
  };

  // Canvas signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Sauvegarder la signature
  const saveSignature = async () => {
    if (!selectedCmr || !signerName) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');

    try {
      await ecmrApi.sign(selectedCmr._id, {
        type: signatureType,
        signatureData,
        name: signerName
      });

      // Mise à jour locale
      setDocuments(prev => prev.map(doc => {
        if (doc._id === selectedCmr._id) {
          const newSignatures = {
            ...doc.signatures,
            [signatureType]: { name: signerName, date: new Date().toISOString(), signature: signatureData }
          };

          // Calculer le nouveau statut
          let newStatus = doc.status;
          if (signatureType === 'sender') newStatus = 'pending_carrier';
          else if (signatureType === 'carrier') newStatus = 'pending_recipient';
          else if (signatureType === 'recipient') newStatus = 'completed';

          return { ...doc, signatures: newSignatures, status: newStatus };
        }
        return doc;
      }));

      setModalType('none');
      setSignerName('');
    } catch (err) {
      console.error('Error saving signature:', err);
      // Mise à jour locale en fallback
      setDocuments(prev => prev.map(doc => {
        if (doc._id === selectedCmr._id) {
          const signatureData = canvas?.toDataURL('image/png') || '';
          return {
            ...doc,
            signatures: {
              ...doc.signatures,
              [signatureType]: { name: signerName, date: new Date().toISOString(), signature: signatureData }
            }
          };
        }
        return doc;
      }));
      setModalType('none');
      setSignerName('');
    }
  };

  // Créer un nouveau CMR
  const createCmr = async () => {
    const cmrNumber = `CMR-${new Date().getFullYear()}-${String(documents.length + 1).padStart(5, '0')}`;

    const newDocument: EcmrDocument = {
      _id: String(Date.now()),
      cmrNumber,
      orderId: newCmr.orderId || undefined,
      orderRef: orders.find(o => o._id === newCmr.orderId)?.orderRef,
      createdAt: new Date().toISOString(),
      status: 'draft',
      sender: newCmr.sender,
      carrier: newCmr.carrier,
      recipient: newCmr.recipient,
      goods: newCmr.goods,
      signatures: {},
      reservations: []
    };

    setDocuments(prev => [newDocument, ...prev]);
    setModalType('none');

    // Reset form
    setNewCmr({
      orderId: '',
      sender: { name: '', address: '', city: '', country: 'France', contact: '' },
      carrier: { name: '', address: '', vehiclePlate: '', driverName: '', driverPhone: '' },
      recipient: { name: '', address: '', city: '', country: 'France', contact: '' },
      goods: { description: '', quantity: 0, weight: 0, packaging: 'Palettes', pallets: 0 }
    });
  };

  // Ajouter une réserve
  const addReservation = async () => {
    if (!selectedCmr || !reserveForm.description) return;

    const user = getUser();
    const reservation = {
      type: reserveForm.type,
      description: reserveForm.description,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || user?.email || 'Utilisateur'
    };

    setDocuments(prev => prev.map(doc => {
      if (doc._id === selectedCmr._id) {
        return {
          ...doc,
          status: 'disputed' as const,
          reservations: [...doc.reservations, reservation]
        };
      }
      return doc;
    }));

    setModalType('none');
    setReserveForm({ type: 'damage', description: '' });
  };

  // Télécharger PDF
  const downloadPdf = async (cmr: EcmrDocument) => {
    try {
      const blob = await ecmrApi.downloadPdf(cmr._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cmr.cmrNumber}.pdf`;
      a.click();
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Téléchargement PDF non disponible en mode démo');
    }
  };

  return (
    <>
      <Head>
        <title>e-CMR Digital - Logistique | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        fontFamily: 'system-ui, sans-serif',
        color: 'white'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 32px',
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              ← Retour
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                📄 e-CMR Digital
              </h1>
              <p style={{ margin: '4px 0 0 0', opacity: 0.7, fontSize: '14px' }}>
                Lettres de voiture électroniques
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalType('create')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}
          >
            ➕ Nouveau CMR
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          padding: '20px 32px'
        }}>
          <div style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            cursor: 'pointer'
          }} onClick={() => setActiveTab('all')}>
            <div style={{ fontSize: '32px', fontWeight: '800' }}>{stats.total}</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>Total CMR</div>
          </div>
          <div style={{
            padding: '20px',
            background: activeTab === 'pending' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            textAlign: 'center',
            cursor: 'pointer'
          }} onClick={() => setActiveTab('pending')}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#fbbf24' }}>{stats.pending}</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>En attente</div>
          </div>
          <div style={{
            padding: '20px',
            background: activeTab === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            textAlign: 'center',
            cursor: 'pointer'
          }} onClick={() => setActiveTab('completed')}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981' }}>{stats.completed}</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>Complétés</div>
          </div>
          <div style={{
            padding: '20px',
            background: activeTab === 'disputed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            textAlign: 'center',
            cursor: 'pointer'
          }} onClick={() => setActiveTab('disputed')}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#ef4444' }}>{stats.disputed}</div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>Litiges</div>
          </div>
        </div>

        {/* Filtres */}
        <div style={{
          padding: '0 32px 20px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="🔍 Rechercher (n° CMR, transporteur, destinataire...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px'
            }}
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px'
            }}
          />
          {(searchTerm || dateFilter || activeTab !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setDateFilter(''); setActiveTab('all'); }}
              style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>

        {/* Liste des CMR */}
        <div style={{ padding: '0 32px 32px' }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
              <div style={{ fontSize: '18px', opacity: 0.7 }}>Chargement des CMR...</div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '20px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
              <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                Aucun CMR trouvé
              </div>
              <div style={{ opacity: 0.7, marginBottom: '24px' }}>
                {searchTerm || dateFilter ? 'Modifiez vos filtres ou ' : ''}Créez votre premier CMR
              </div>
              <button
                onClick={() => setModalType('create')}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700'
                }}
              >
                ➕ Créer un CMR
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredDocuments.map(doc => {
                const statusStyle = getStatusStyle(doc.status);
                const sigCount = Object.keys(doc.signatures).length;

                return (
                  <div
                    key={doc._id}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '16px',
                      border: `2px solid ${statusStyle.bg}`,
                      borderLeft: `6px solid ${statusStyle.text}`,
                      padding: '20px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr auto',
                      gap: '20px',
                      alignItems: 'center'
                    }}
                  >
                    {/* Info principale */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: statusStyle.bg,
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: statusStyle.text
                        }}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '4px' }}>
                        {doc.cmrNumber}
                      </div>
                      {doc.orderRef && (
                        <div style={{ fontSize: '13px', opacity: 0.7 }}>
                          📦 {doc.orderRef}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>
                        Créé le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>

                    {/* Parties */}
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{ opacity: 0.6 }}>De:</span> <strong>{doc.sender.name || '(non renseigné)'}</strong>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{ opacity: 0.6 }}>🚛</span> <strong>{doc.carrier.name || '(non renseigné)'}</strong>
                        {doc.carrier.vehiclePlate && <span style={{ opacity: 0.6 }}> • {doc.carrier.vehiclePlate}</span>}
                      </div>
                      <div>
                        <span style={{ opacity: 0.6 }}>À:</span> <strong>{doc.recipient.name || '(non renseigné)'}</strong>
                      </div>
                    </div>

                    {/* Marchandise & Signatures */}
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        📦 {doc.goods.quantity} {doc.goods.packaging} • {(doc.goods.weight / 1000).toFixed(1)}t
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span title="Expéditeur" style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          background: doc.signatures.sender ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)',
                          border: doc.signatures.sender ? '2px solid #10b981' : '2px dashed rgba(255,255,255,0.3)'
                        }}>
                          {doc.signatures.sender ? '✓' : '1'}
                        </span>
                        <span title="Transporteur" style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          background: doc.signatures.carrier ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)',
                          border: doc.signatures.carrier ? '2px solid #10b981' : '2px dashed rgba(255,255,255,0.3)'
                        }}>
                          {doc.signatures.carrier ? '✓' : '2'}
                        </span>
                        <span title="Destinataire" style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          background: doc.signatures.recipient ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)',
                          border: doc.signatures.recipient ? '2px solid #10b981' : '2px dashed rgba(255,255,255,0.3)'
                        }}>
                          {doc.signatures.recipient ? '✓' : '3'}
                        </span>
                        <span style={{ opacity: 0.6, fontSize: '12px', alignSelf: 'center' }}>
                          {sigCount}/3 signatures
                        </span>
                      </div>
                      {doc.reservations.length > 0 && (
                        <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '12px' }}>
                          ⚠️ {doc.reservations.length} réserve(s)
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { setSelectedCmr(doc); setModalType('view'); }}
                        style={{
                          padding: '10px 16px',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}
                      >
                        👁️ Voir
                      </button>
                      {doc.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedCmr(doc);
                            // Déterminer quelle signature est attendue
                            if (!doc.signatures.sender) setSignatureType('sender');
                            else if (!doc.signatures.carrier) setSignatureType('carrier');
                            else setSignatureType('recipient');
                            setModalType('sign');
                          }}
                          style={{
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          ✍️ Signer
                        </button>
                      )}
                      <button
                        onClick={() => downloadPdf(doc)}
                        style={{
                          padding: '10px 16px',
                          background: 'rgba(139, 92, 246, 0.2)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '8px',
                          color: '#a78bfa',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}
                      >
                        📥 PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL: Créer CMR */}
        {modalType === 'create' && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#1e293b',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px' }}>➕ Nouveau CMR</h2>
                <button
                  onClick={() => setModalType('none')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Lier à une commande */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  📦 Lier à une commande (optionnel)
                </label>
                <select
                  value={newCmr.orderId}
                  onChange={(e) => setNewCmr({ ...newCmr, orderId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- Sélectionner une commande --</option>
                  {orders.map(o => (
                    <option key={o._id} value={o._id}>{o.orderRef} - {o.clientName}</option>
                  ))}
                </select>
              </div>

              {/* Expéditeur */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#3b82f6' }}>📤 Expéditeur</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    placeholder="Nom / Raison sociale"
                    value={newCmr.sender.name}
                    onChange={(e) => setNewCmr({ ...newCmr, sender: { ...newCmr.sender, name: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                  <input
                    placeholder="Contact"
                    value={newCmr.sender.contact}
                    onChange={(e) => setNewCmr({ ...newCmr, sender: { ...newCmr.sender, contact: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                  <input
                    placeholder="Adresse"
                    value={newCmr.sender.address}
                    onChange={(e) => setNewCmr({ ...newCmr, sender: { ...newCmr.sender, address: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', gridColumn: 'span 2' }}
                  />
                  <input
                    placeholder="Ville"
                    value={newCmr.sender.city}
                    onChange={(e) => setNewCmr({ ...newCmr, sender: { ...newCmr.sender, city: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                  <input
                    placeholder="Pays"
                    value={newCmr.sender.country}
                    onChange={(e) => setNewCmr({ ...newCmr, sender: { ...newCmr.sender, country: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                </div>
              </div>

              {/* Transporteur */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#fbbf24' }}>🚛 Transporteur</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    placeholder="Nom du transporteur"
                    value={newCmr.carrier.name}
                    onChange={(e) => setNewCmr({ ...newCmr, carrier: { ...newCmr.carrier, name: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                  <input
                    placeholder="Immatriculation"
                    value={newCmr.carrier.vehiclePlate}
                    onChange={(e) => setNewCmr({ ...newCmr, carrier: { ...newCmr.carrier, vehiclePlate: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                  <input
                    placeholder="Nom du chauffeur"
                    value={newCmr.carrier.driverName}
                    onChange={(e) => setNewCmr({ ...newCmr, carrier: { ...newCmr.carrier, driverName: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                  <input
                    placeholder="Téléphone chauffeur"
                    value={newCmr.carrier.driverPhone}
                    onChange={(e) => setNewCmr({ ...newCmr, carrier: { ...newCmr.carrier, driverPhone: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                </div>
              </div>

              {/* Destinataire */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#10b981' }}>📥 Destinataire</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    placeholder="Nom / Raison sociale"
                    value={newCmr.recipient.name}
                    onChange={(e) => setNewCmr({ ...newCmr, recipient: { ...newCmr.recipient, name: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                  <input
                    placeholder="Contact"
                    value={newCmr.recipient.contact}
                    onChange={(e) => setNewCmr({ ...newCmr, recipient: { ...newCmr.recipient, contact: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                  <input
                    placeholder="Adresse"
                    value={newCmr.recipient.address}
                    onChange={(e) => setNewCmr({ ...newCmr, recipient: { ...newCmr.recipient, address: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', gridColumn: 'span 2' }}
                  />
                  <input
                    placeholder="Ville"
                    value={newCmr.recipient.city}
                    onChange={(e) => setNewCmr({ ...newCmr, recipient: { ...newCmr.recipient, city: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                  <input
                    placeholder="Pays"
                    value={newCmr.recipient.country}
                    onChange={(e) => setNewCmr({ ...newCmr, recipient: { ...newCmr.recipient, country: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                </div>
              </div>

              {/* Marchandise */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#a855f7' }}>📦 Marchandise</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <input
                    placeholder="Description"
                    value={newCmr.goods.description}
                    onChange={(e) => setNewCmr({ ...newCmr, goods: { ...newCmr.goods, description: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', gridColumn: 'span 2' }}
                  />
                  <select
                    value={newCmr.goods.packaging}
                    onChange={(e) => setNewCmr({ ...newCmr, goods: { ...newCmr.goods, packaging: e.target.value } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  >
                    <option value="Palettes">Palettes</option>
                    <option value="Cartons">Cartons</option>
                    <option value="Colis">Colis</option>
                    <option value="Vrac">Vrac</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Quantité"
                    value={newCmr.goods.quantity || ''}
                    onChange={(e) => setNewCmr({ ...newCmr, goods: { ...newCmr.goods, quantity: parseInt(e.target.value) || 0 } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                  <input
                    type="number"
                    placeholder="Poids (kg)"
                    value={newCmr.goods.weight || ''}
                    onChange={(e) => setNewCmr({ ...newCmr, goods: { ...newCmr.goods, weight: parseInt(e.target.value) || 0 } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                  <input
                    type="number"
                    placeholder="Nb palettes"
                    value={newCmr.goods.pallets || ''}
                    onChange={(e) => setNewCmr({ ...newCmr, goods: { ...newCmr.goods, pallets: parseInt(e.target.value) || 0 } })}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setModalType('none')}
                  style={{
                    padding: '14px 28px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={createCmr}
                  style={{
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}
                >
                  ✅ Créer le CMR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Voir CMR */}
        {modalType === 'view' && selectedCmr && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#1e293b',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px' }}>{selectedCmr.cmrNumber}</h2>
                  <span style={{
                    padding: '4px 12px',
                    background: getStatusStyle(selectedCmr.status).bg,
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: getStatusStyle(selectedCmr.status).text
                  }}>
                    {getStatusStyle(selectedCmr.status).label}
                  </span>
                </div>
                <button
                  onClick={() => setModalType('none')}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Détails du CMR */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#3b82f6' }}>📤 Expéditeur</h4>
                  <div style={{ fontWeight: '600' }}>{selectedCmr.sender.name}</div>
                  <div style={{ fontSize: '13px', opacity: 0.7 }}>{selectedCmr.sender.address}</div>
                  <div style={{ fontSize: '13px', opacity: 0.7 }}>{selectedCmr.sender.city}, {selectedCmr.sender.country}</div>
                  {selectedCmr.signatures.sender && (
                    <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '12px' }}>
                      ✅ Signé par {selectedCmr.signatures.sender.name}
                      <br />
                      <span style={{ opacity: 0.7 }}>{new Date(selectedCmr.signatures.sender.date).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#fbbf24' }}>🚛 Transporteur</h4>
                  <div style={{ fontWeight: '600' }}>{selectedCmr.carrier.name}</div>
                  {selectedCmr.carrier.driverName && <div style={{ fontSize: '13px', opacity: 0.7 }}>Chauffeur: {selectedCmr.carrier.driverName}</div>}
                  {selectedCmr.carrier.vehiclePlate && <div style={{ fontSize: '13px', opacity: 0.7 }}>Plaque: {selectedCmr.carrier.vehiclePlate}</div>}
                  {selectedCmr.signatures.carrier && (
                    <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '12px' }}>
                      ✅ Signé par {selectedCmr.signatures.carrier.name}
                      <br />
                      <span style={{ opacity: 0.7 }}>{new Date(selectedCmr.signatures.carrier.date).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#10b981' }}>📥 Destinataire</h4>
                  <div style={{ fontWeight: '600' }}>{selectedCmr.recipient.name}</div>
                  <div style={{ fontSize: '13px', opacity: 0.7 }}>{selectedCmr.recipient.address}</div>
                  <div style={{ fontSize: '13px', opacity: 0.7 }}>{selectedCmr.recipient.city}, {selectedCmr.recipient.country}</div>
                  {selectedCmr.signatures.recipient && (
                    <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '12px' }}>
                      ✅ Signé par {selectedCmr.signatures.recipient.name}
                      <br />
                      <span style={{ opacity: 0.7 }}>{new Date(selectedCmr.signatures.recipient.date).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Marchandise */}
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#a855f7' }}>📦 Marchandise</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>Description</div>
                    <div style={{ fontWeight: '600' }}>{selectedCmr.goods.description || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>Quantité</div>
                    <div style={{ fontWeight: '600' }}>{selectedCmr.goods.quantity} {selectedCmr.goods.packaging}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>Poids</div>
                    <div style={{ fontWeight: '600' }}>{(selectedCmr.goods.weight / 1000).toFixed(2)} tonnes</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>Palettes</div>
                    <div style={{ fontWeight: '600' }}>{selectedCmr.goods.pallets || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Réserves */}
              {selectedCmr.reservations.length > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#ef4444' }}>⚠️ Réserves ({selectedCmr.reservations.length})</h4>
                  {selectedCmr.reservations.map((res, i) => (
                    <div key={i} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {res.type === 'damage' && '💥 Dommage'}
                        {res.type === 'missing' && '❓ Manquant'}
                        {res.type === 'delay' && '⏰ Retard'}
                        {res.type === 'other' && '📝 Autre'}
                      </div>
                      <div style={{ fontSize: '14px' }}>{res.description}</div>
                      <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                        Par {res.createdBy} • {new Date(res.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setModalType('reserve'); }}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  ⚠️ Ajouter réserve
                </button>
                {selectedCmr.status !== 'completed' && (
                  <button
                    onClick={() => {
                      if (!selectedCmr.signatures.sender) setSignatureType('sender');
                      else if (!selectedCmr.signatures.carrier) setSignatureType('carrier');
                      else setSignatureType('recipient');
                      setModalType('sign');
                    }}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}
                  >
                    ✍️ Signer
                  </button>
                )}
                <button
                  onClick={() => downloadPdf(selectedCmr)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}
                >
                  📥 Télécharger PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Signer */}
        {modalType === 'sign' && selectedCmr && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#1e293b',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px' }}>✍️ Signature électronique</h2>
                <button
                  onClick={() => { setModalType('none'); setSignerName(''); }}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Type de signature
                </label>
                <select
                  value={signatureType}
                  onChange={(e) => setSignatureType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="sender" disabled={!!selectedCmr.signatures.sender}>📤 Expéditeur {selectedCmr.signatures.sender ? '(déjà signé)' : ''}</option>
                  <option value="carrier" disabled={!!selectedCmr.signatures.carrier}>🚛 Transporteur {selectedCmr.signatures.carrier ? '(déjà signé)' : ''}</option>
                  <option value="recipient" disabled={!!selectedCmr.signatures.recipient}>📥 Destinataire {selectedCmr.signatures.recipient ? '(déjà signé)' : ''}</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Nom du signataire
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Votre nom complet"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Signez ci-dessous
                </label>
                <div style={{ position: 'relative' }}>
                  <canvas
                    ref={canvasRef}
                    width={436}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{
                      width: '100%',
                      height: '200px',
                      background: 'white',
                      borderRadius: '8px',
                      cursor: 'crosshair',
                      touchAction: 'none'
                    }}
                  />
                  <button
                    onClick={clearSignature}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '6px 12px',
                      background: 'rgba(0,0,0,0.5)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ Effacer
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setModalType('none'); setSignerName(''); }}
                  style={{
                    padding: '14px 28px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={saveSignature}
                  disabled={!signerName}
                  style={{
                    padding: '14px 28px',
                    background: signerName ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: signerName ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '700',
                    opacity: signerName ? 1 : 0.5
                  }}
                >
                  ✅ Valider la signature
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Ajouter réserve */}
        {modalType === 'reserve' && selectedCmr && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#1e293b',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px' }}>⚠️ Ajouter une réserve</h2>
                <button
                  onClick={() => setModalType('view')}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Type de réserve
                </label>
                <select
                  value={reserveForm.type}
                  onChange={(e) => setReserveForm({ ...reserveForm, type: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="damage">💥 Dommage / Avarie</option>
                  <option value="missing">❓ Manquant</option>
                  <option value="delay">⏰ Retard</option>
                  <option value="other">📝 Autre</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Description
                </label>
                <textarea
                  value={reserveForm.description}
                  onChange={(e) => setReserveForm({ ...reserveForm, description: e.target.value })}
                  placeholder="Décrivez la réserve en détail..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setModalType('view')}
                  style={{
                    padding: '14px 28px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={addReservation}
                  disabled={!reserveForm.description}
                  style={{
                    padding: '14px 28px',
                    background: reserveForm.description ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: reserveForm.description ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '700',
                    opacity: reserveForm.description ? 1 : 0.5
                  }}
                >
                  ⚠️ Ajouter la réserve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
