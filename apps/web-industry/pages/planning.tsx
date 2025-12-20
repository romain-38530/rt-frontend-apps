import { useEffect, useState, useCallback } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { planningApi, appointmentsApi } from '../lib/api';
import toast from 'react-hot-toast';

interface Site {
  id: string;
  siteId?: string;
  name: string;
  address: string | { street?: string; city?: string; postalCode?: string; country?: string };
  docks: Dock[];
  timeSlotDuration: 15 | 30 | 60;
  operatingHours: { start: string; end: string };
  holidays: string[];
  status?: string;
  maxCapacity?: number;
}

interface Dock {
  id: string;
  dockId?: string;
  name: string;
  type: 'loading' | 'unloading' | 'both';
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'blocked';
  vehicleTypes?: string[];
  equipment?: string[];
}

interface TimeSlot {
  id: string;
  slotId?: string;
  dockId: string;
  date?: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'blocked' | 'completed';
  booking?: {
    appointmentId?: string;
    carrierId?: string;
    carrierName?: string;
    orderId?: string;
    vehiclePlate?: string;
    type?: string;
  };
  blockedReason?: string;
}

interface NewSiteForm {
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  timeSlotDuration: 15 | 30 | 60;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  maxCapacity: number;
}

interface NewDockForm {
  name: string;
  type: 'loading' | 'unloading' | 'both';
  capacity: number;
  vehicleTypes: string[];
}

export default function PlanningPage() {
  const router = useSafeRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'docks' | 'slots'>('overview');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showDockModal, setShowDockModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Stats calculees dynamiquement
  const [stats, setStats] = useState({
    totalSites: 0,
    totalDocks: 0,
    todayBookings: 0,
    availableSlots: 0,
    occupancyRate: 0
  });

  // Forms
  const [newSiteForm, setNewSiteForm] = useState<NewSiteForm>({
    name: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'France',
    timeSlotDuration: 30,
    operatingHoursStart: '06:00',
    operatingHoursEnd: '20:00',
    maxCapacity: 10
  });

  const [newDockForm, setNewDockForm] = useState<NewDockForm>({
    name: '',
    type: 'both',
    capacity: 2,
    vehicleTypes: ['Camion', 'Semi-remorque']
  });

  // Client-side only mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, [mounted]);

  // Charger les slots quand le site ou la date change
  useEffect(() => {
    if (selectedSite && selectedDate) {
      loadSlots(selectedSite.id || selectedSite.siteId!, selectedDate);
    }
  }, [selectedSite, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await planningApi.getSites();
      const data = response || {};

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const sitesWithDocks = await Promise.all(
          data.data.map(async (site: any) => {
            try {
              const docksData = await planningApi.getDocks(site._id || site.siteId || site.id);
              return {
                ...site,
                id: site._id || site.siteId || site.id,
                address: typeof site.address === 'object'
                  ? `${site.address.street || ''}, ${site.address.postalCode || ''} ${site.address.city || ''}`.trim()
                  : site.address,
                docks: Array.isArray(docksData?.data) ? docksData.data.map((d: any) => ({
                  ...d,
                  id: d._id || d.dockId || d.id
                })) : []
              };
            } catch {
              return { ...site, id: site._id || site.siteId || site.id, docks: [] };
            }
          })
        );
        setSites(sitesWithDocks);
        setSelectedSite(sitesWithDocks[0] || null);
        updateStats(sitesWithDocks, []);
      } else {
        setSites(mockSites);
        setSelectedSite(mockSites[0]);
        updateStats(mockSites, []);
      }
    } catch (error) {
      console.log('API unavailable, using mock data:', error);
      setSites(mockSites);
      setSelectedSite(mockSites[0]);
      updateStats(mockSites, []);
    }
    setLoading(false);
  };

  const loadSlots = async (siteId: string, date: string) => {
    setSlotsLoading(true);
    try {
      const response = await planningApi.getSlots(siteId, date);
      if (response?.data && Array.isArray(response.data)) {
        const formattedSlots = response.data.map((slot: any) => ({
          ...slot,
          id: slot._id || slot.slotId || slot.id
        }));
        setTimeSlots(formattedSlots);
        updateStats(sites, formattedSlots);
      } else {
        // Generer les slots depuis l'API si pas de slots existants
        await generateSlotsFromAPI(siteId, date);
      }
    } catch (error) {
      console.log('Loading slots failed, generating mock:', error);
      if (selectedSite) {
        const mockSlots = generateMockSlots(selectedSite);
        setTimeSlots(mockSlots);
        updateStats(sites, mockSlots);
      }
    }
    setSlotsLoading(false);
  };

  const generateSlotsFromAPI = async (siteId: string, date: string) => {
    try {
      const response = await planningApi.generateSlots({
        siteId,
        startDate: date,
        endDate: date
      });
      if (response?.data) {
        setTimeSlots(response.data);
        toast.success('Creneaux generes avec succes');
      }
    } catch (error) {
      console.log('Generate slots failed:', error);
      if (selectedSite) {
        const mockSlots = generateMockSlots(selectedSite);
        setTimeSlots(mockSlots);
      }
    }
  };

  const updateStats = (sitesData: Site[], slotsData: TimeSlot[]) => {
    const totalSites = sitesData.length;
    const totalDocks = sitesData.reduce((acc, s) => acc + (s.docks?.length || 0), 0);
    const bookedSlots = slotsData.filter(s => s.status === 'booked').length;
    const availableSlots = slotsData.filter(s => s.status === 'available').length;
    const totalSlots = slotsData.length || 1;
    const occupancyRate = Math.round((bookedSlots / totalSlots) * 100);

    setStats({
      totalSites,
      totalDocks,
      todayBookings: bookedSlots,
      availableSlots,
      occupancyRate: isNaN(occupancyRate) ? 0 : occupancyRate
    });
  };

  // Mock data pour fallback
  const mockSites: Site[] = [
    {
      id: 'SITE-001',
      name: 'Entrepot Paris Nord',
      address: '123 Rue de la Logistique, 93200 Saint-Denis',
      timeSlotDuration: 30,
      operatingHours: { start: '06:00', end: '22:00' },
      holidays: [],
      docks: [
        { id: 'DOCK-001', name: 'Quai A1', type: 'loading', capacity: 2, status: 'available' },
        { id: 'DOCK-002', name: 'Quai A2', type: 'loading', capacity: 2, status: 'occupied' },
        { id: 'DOCK-003', name: 'Quai B1', type: 'unloading', capacity: 3, status: 'available' },
        { id: 'DOCK-004', name: 'Quai B2', type: 'unloading', capacity: 3, status: 'maintenance' },
        { id: 'DOCK-005', name: 'Quai C1', type: 'both', capacity: 4, status: 'available' }
      ]
    },
    {
      id: 'SITE-002',
      name: 'Plateforme Lyon Est',
      address: '45 Avenue Industrielle, 69800 Saint-Priest',
      timeSlotDuration: 60,
      operatingHours: { start: '07:00', end: '20:00' },
      holidays: [],
      docks: [
        { id: 'DOCK-006', name: 'Quai 1', type: 'both', capacity: 5, status: 'available' },
        { id: 'DOCK-007', name: 'Quai 2', type: 'both', capacity: 5, status: 'occupied' },
        { id: 'DOCK-008', name: 'Quai 3', type: 'loading', capacity: 3, status: 'available' }
      ]
    },
    {
      id: 'SITE-003',
      name: 'Hub Marseille Fos',
      address: '78 Port de Fos, 13270 Fos-sur-Mer',
      timeSlotDuration: 30,
      operatingHours: { start: '05:00', end: '23:00' },
      holidays: [],
      docks: [
        { id: 'DOCK-009', name: 'Quai Maritime 1', type: 'unloading', capacity: 10, status: 'available' },
        { id: 'DOCK-010', name: 'Quai Maritime 2', type: 'unloading', capacity: 10, status: 'occupied' },
        { id: 'DOCK-011', name: 'Quai Routier 1', type: 'loading', capacity: 4, status: 'available' },
        { id: 'DOCK-012', name: 'Quai Routier 2', type: 'both', capacity: 4, status: 'available' }
      ]
    }
  ];

  // Generer des slots mock de maniere deterministe (pas aleatoire)
  const generateMockSlots = useCallback((site: Site): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const { start, end } = site.operatingHours;
    const duration = site.timeSlotDuration;
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);

    // Utiliser la date comme seed pour avoir des resultats consistants
    const dateNum = parseInt(selectedDate.replace(/-/g, ''));

    site.docks.forEach((dock, dockIndex) => {
      let slotIndex = 0;
      for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += duration) {
          const slotStart = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          const endMin = min + duration;
          const slotEnd = endMin >= 60
            ? `${(hour + 1).toString().padStart(2, '0')}:${(endMin - 60).toString().padStart(2, '0')}`
            : `${hour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

          // Determiner le statut de maniere deterministe
          const seed = (dateNum + dockIndex * 100 + slotIndex) % 10;
          const isBooked = seed < 3; // 30% booked
          const isBlocked = seed === 9; // 10% blocked

          slots.push({
            id: `SLOT-${dock.id}-${slotStart}`,
            dockId: dock.id,
            date: selectedDate,
            startTime: slotStart,
            endTime: slotEnd,
            status: isBlocked ? 'blocked' : isBooked ? 'booked' : 'available',
            booking: isBooked ? {
              carrierId: `CARR-${(seed + 1).toString().padStart(3, '0')}`,
              carrierName: ['Transport Express', 'Logistique Pro', 'Trans Europe'][seed % 3],
              orderId: `ORD-2024-${(dateNum % 1000 + slotIndex).toString().padStart(4, '0')}`
            } : undefined,
            blockedReason: isBlocked ? 'Maintenance planifiee' : undefined
          });
          slotIndex++;
        }
      }
    });

    return slots;
  }, [selectedDate]);

  // Actions sur les slots
  const handleBlockSlot = async (slotId: string, reason: string) => {
    try {
      await planningApi.blockSlot({ slotId, reason });
      toast.success('Creneau bloque');
      if (selectedSite) {
        loadSlots(selectedSite.id, selectedDate);
      }
    } catch (error) {
      toast.error('Erreur lors du blocage');
      // Update local state for demo
      setTimeSlots(prev => prev.map(s =>
        s.id === slotId ? { ...s, status: 'blocked', blockedReason: reason } : s
      ));
    }
  };

  const handleUnblockSlot = async (slotId: string) => {
    try {
      await planningApi.unblockSlot({ slotId });
      toast.success('Creneau debloque');
      if (selectedSite) {
        loadSlots(selectedSite.id, selectedDate);
      }
    } catch (error) {
      toast.error('Erreur lors du deblocage');
      setTimeSlots(prev => prev.map(s =>
        s.id === slotId ? { ...s, status: 'available', blockedReason: undefined } : s
      ));
    }
  };

  // Actions sur les sites
  const handleCreateSite = async () => {
    try {
      const siteData = {
        name: newSiteForm.name,
        address: {
          street: newSiteForm.street,
          city: newSiteForm.city,
          postalCode: newSiteForm.postalCode,
          country: newSiteForm.country
        },
        operatingHours: {
          start: newSiteForm.operatingHoursStart,
          end: newSiteForm.operatingHoursEnd
        },
        timeSlotDuration: newSiteForm.timeSlotDuration,
        maxCapacity: newSiteForm.maxCapacity,
        status: 'active'
      };

      const response = await planningApi.createSite(siteData);
      if (response?.data) {
        toast.success('Site cree avec succes');
        setShowSiteModal(false);
        resetSiteForm();
        loadData();
      }
    } catch (error) {
      toast.error('Erreur lors de la creation du site');
      // Demo mode: add locally
      const newSite: Site = {
        id: `SITE-${Date.now()}`,
        name: newSiteForm.name,
        address: `${newSiteForm.street}, ${newSiteForm.postalCode} ${newSiteForm.city}`,
        timeSlotDuration: newSiteForm.timeSlotDuration,
        operatingHours: {
          start: newSiteForm.operatingHoursStart,
          end: newSiteForm.operatingHoursEnd
        },
        holidays: [],
        docks: []
      };
      setSites(prev => [...prev, newSite]);
      toast.success('Site cree (mode demo)');
      setShowSiteModal(false);
      resetSiteForm();
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Etes-vous sur de vouloir supprimer ce site ?')) return;

    try {
      await planningApi.deleteSite(siteId);
      toast.success('Site supprime');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      setSites(prev => prev.filter(s => s.id !== siteId));
    }
  };

  // Actions sur les quais
  const handleCreateDock = async () => {
    if (!selectedSite) return;

    try {
      const dockData = {
        name: newDockForm.name,
        type: newDockForm.type,
        capacity: newDockForm.capacity,
        vehicleTypes: newDockForm.vehicleTypes,
        status: 'available'
      };

      const response = await planningApi.createDock(selectedSite.id, dockData);
      if (response?.data) {
        toast.success('Quai cree avec succes');
        setShowDockModal(false);
        resetDockForm();
        loadData();
      }
    } catch (error) {
      toast.error('Erreur lors de la creation du quai');
      // Demo mode
      const newDock: Dock = {
        id: `DOCK-${Date.now()}`,
        name: newDockForm.name,
        type: newDockForm.type,
        capacity: newDockForm.capacity,
        status: 'available',
        vehicleTypes: newDockForm.vehicleTypes
      };
      setSites(prev => prev.map(s =>
        s.id === selectedSite.id
          ? { ...s, docks: [...s.docks, newDock] }
          : s
      ));
      setSelectedSite(prev => prev ? { ...prev, docks: [...prev.docks, newDock] } : null);
      toast.success('Quai cree (mode demo)');
      setShowDockModal(false);
      resetDockForm();
    }
  };

  const handleSetMaintenance = async (dockId: string, inMaintenance: boolean) => {
    try {
      // Appeler l'API pour changer le statut
      await planningApi.updateDock(dockId, {
        status: inMaintenance ? 'maintenance' : 'available'
      });
      toast.success(inMaintenance ? 'Quai mis en maintenance' : 'Quai remis en service');
      loadData();
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
      // Update local state
      setSites(prev => prev.map(s => ({
        ...s,
        docks: s.docks.map(d =>
          d.id === dockId ? { ...d, status: inMaintenance ? 'maintenance' : 'available' } : d
        )
      })));
      setSelectedSite(prev => prev ? {
        ...prev,
        docks: prev.docks.map(d =>
          d.id === dockId ? { ...d, status: inMaintenance ? 'maintenance' : 'available' } : d
        )
      } : null);
    }
  };

  const handleDeleteDock = async (dockId: string) => {
    if (!confirm('Etes-vous sur de vouloir supprimer ce quai ?')) return;

    try {
      await planningApi.deleteDock(dockId);
      toast.success('Quai supprime');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      setSites(prev => prev.map(s => ({
        ...s,
        docks: s.docks.filter(d => d.id !== dockId)
      })));
      setSelectedSite(prev => prev ? {
        ...prev,
        docks: prev.docks.filter(d => d.id !== dockId)
      } : null);
    }
  };

  const resetSiteForm = () => {
    setNewSiteForm({
      name: '',
      street: '',
      city: '',
      postalCode: '',
      country: 'France',
      timeSlotDuration: 30,
      operatingHoursStart: '06:00',
      operatingHoursEnd: '20:00',
      maxCapacity: 10
    });
  };

  const resetDockForm = () => {
    setNewDockForm({
      name: '',
      type: 'both',
      capacity: 2,
      vehicleTypes: ['Camion', 'Semi-remorque']
    });
  };

  const getDockStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#00D084';
      case 'occupied': return '#FF6B6B';
      case 'maintenance': return '#FFB800';
      case 'blocked': return '#666';
      default: return '#666';
    }
  };

  const getDockTypeLabel = (type: string) => {
    switch (type) {
      case 'loading': return 'Chargement';
      case 'unloading': return 'Dechargement';
      case 'both': return 'Mixte';
      default: return type;
    }
  };

  const getSlotStatusColor = (status: string) => {
    switch (status) {
      case 'available': return { bg: 'rgba(0,208,132,0.3)', border: '#00D084', text: 'Libre' };
      case 'booked': return { bg: 'rgba(255,107,107,0.3)', border: '#FF6B6B', text: 'Reserve' };
      case 'blocked': return { bg: 'rgba(255,184,0,0.3)', border: '#FFB800', text: 'Bloque' };
      case 'completed': return { bg: 'rgba(102,126,234,0.3)', border: '#667eea', text: 'Termine' };
      default: return { bg: 'rgba(102,102,102,0.3)', border: '#666', text: status };
    }
  };

  // Obtenir les heures uniques pour l'affichage
  const getUniqueHours = (): string[] => {
    if (!selectedSite) return [];
    const { start, end } = selectedSite.operatingHours;
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    const hours: string[] = [];
    for (let h = startHour; h <= endHour; h += 2) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return hours;
  };

  // Obtenir les slots pour un quai et une heure donnee
  const getSlotsForDockAndHour = (dockId: string, hour: string): TimeSlot[] => {
    const hourNum = parseInt(hour.split(':')[0]);
    return timeSlots.filter(slot => {
      const slotHour = parseInt(slot.startTime.split(':')[0]);
      return slot.dockId === dockId && slotHour >= hourNum && slotHour < hourNum + 2;
    });
  };

  // Styles communs
  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    marginTop: '8px'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '4px',
    opacity: 0.9
  };

  // Wait for client-side mount
  if (!mounted || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white'
      }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Planning Quais - Industry | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80) center/cover',
        position: 'relative',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 0
        }} />

        {/* Header */}
        <div style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 1,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>📅</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Planning Quais</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => router.push('/rdv-transporteurs')}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px'
              }}
            >
              RDV Transporteurs
            </button>
            <button
              onClick={() => router.push('/borne-chauffeur')}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Borne Chauffeur
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '40px',
          position: 'relative',
          zIndex: 1,
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          {/* Stats Cards - Dynamiques */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {[
              { label: 'Sites', value: stats.totalSites, icon: '🏭', color: '#667eea' },
              { label: 'Quais', value: stats.totalDocks, icon: '🚚', color: '#00D084' },
              { label: 'RDV Aujourd\'hui', value: stats.todayBookings, icon: '📅', color: '#FFB800' },
              { label: 'Creneaux libres', value: stats.availableSlots, icon: '✅', color: '#00D084' },
              { label: 'Taux occupation', value: `${stats.occupancyRate}%`, icon: '📊', color: '#764ba2' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[
              { key: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
              { key: 'sites', label: 'Sites', icon: '🏭' },
              { key: 'docks', label: 'Quais', icon: '🚚' },
              { key: 'slots', label: 'Creneaux', icon: '📅' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '12px 24px',
                  background: activeTab === tab.key
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: activeTab === tab.key ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Site Selector */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.2)',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Selection du site</h3>
              <button
                onClick={() => setShowSiteModal(true)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(0,208,132,0.3)',
                  color: '#00D084',
                  border: '1px solid #00D084',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                + Ajouter site
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {sites.map(site => (
                <button
                  key={site.id}
                  onClick={() => setSelectedSite(site)}
                  style={{
                    padding: '16px 24px',
                    background: selectedSite?.id === site.id
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: selectedSite?.id === site.id ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: '250px'
                  }}
                >
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>{site.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>{site.docks.length} quais - Creneaux {site.timeSlotDuration}min</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content based on active tab */}
          {activeTab === 'overview' && selectedSite && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Site Info */}
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>
                  Informations site
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Nom</div>
                    <div style={{ fontWeight: '600' }}>{selectedSite.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Adresse</div>
                    <div style={{ fontWeight: '600' }}>
                      {typeof selectedSite.address === 'string'
                        ? selectedSite.address
                        : `${selectedSite.address.street || ''}, ${selectedSite.address.postalCode || ''} ${selectedSite.address.city || ''}`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Horaires</div>
                    <div style={{ fontWeight: '600' }}>{selectedSite.operatingHours.start} - {selectedSite.operatingHours.end}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Duree creneaux</div>
                    <div style={{ fontWeight: '600' }}>{selectedSite.timeSlotDuration} minutes</div>
                  </div>
                </div>
              </div>

              {/* Docks Overview */}
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Quais</h3>
                  <button
                    onClick={() => setShowDockModal(true)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(0,208,132,0.3)',
                      color: '#00D084',
                      border: '1px solid #00D084',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  >
                    + Ajouter
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedSite.docks.map(dock => (
                    <div key={dock.id} style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{dock.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>{getDockTypeLabel(dock.type)} - Capacite: {dock.capacity}</div>
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        background: `${getDockStatusColor(dock.status)}20`,
                        color: getDockStatusColor(dock.status),
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {dock.status === 'available' ? 'Disponible' : dock.status === 'occupied' ? 'Occupe' : 'Maintenance'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'slots' && selectedSite && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                  Creneaux du {selectedDate} {slotsLoading && '(chargement...)'}
                </h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() - 1);
                      setSelectedDate(newDate.toISOString().split('T')[0]);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    ←
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() + 1);
                      setSelectedDate(newDate.toISOString().split('T')[0]);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Time slots grid */}
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: '800px' }}>
                  {/* Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `120px repeat(${getUniqueHours().length}, 1fr)`,
                    gap: '4px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ padding: '8px', fontWeight: '600', fontSize: '13px' }}>Quai</div>
                    {getUniqueHours().map(time => (
                      <div key={time} style={{ padding: '8px', fontWeight: '600', fontSize: '12px', textAlign: 'center' }}>{time}</div>
                    ))}
                  </div>

                  {/* Dock rows */}
                  {selectedSite.docks.map(dock => (
                    <div key={dock.id} style={{
                      display: 'grid',
                      gridTemplateColumns: `120px repeat(${getUniqueHours().length}, 1fr)`,
                      gap: '4px',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        padding: '12px 8px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        {dock.name}
                      </div>
                      {getUniqueHours().map(time => {
                        const slotsInHour = getSlotsForDockAndHour(dock.id, time);
                        const hasBooked = slotsInHour.some(s => s.status === 'booked');
                        const hasBlocked = slotsInHour.some(s => s.status === 'blocked');
                        const allAvailable = slotsInHour.length > 0 && slotsInHour.every(s => s.status === 'available');

                        const status = hasBlocked ? 'blocked' : hasBooked ? 'booked' : 'available';
                        const colors = getSlotStatusColor(status);

                        return (
                          <div
                            key={`${dock.id}-${time}`}
                            onClick={() => {
                              if (status === 'blocked') {
                                const slot = slotsInHour.find(s => s.status === 'blocked');
                                if (slot && confirm('Debloquer ce creneau ?')) {
                                  handleUnblockSlot(slot.id);
                                }
                              } else if (status === 'available') {
                                const slot = slotsInHour[0];
                                if (slot) {
                                  const reason = prompt('Raison du blocage:');
                                  if (reason) {
                                    handleBlockSlot(slot.id, reason);
                                  }
                                }
                              }
                            }}
                            style={{
                              padding: '12px 8px',
                              background: colors.bg,
                              borderRadius: '8px',
                              textAlign: 'center',
                              fontSize: '11px',
                              cursor: 'pointer',
                              border: `1px solid ${colors.border}`,
                              transition: 'transform 0.2s ease'
                            }}
                            title={hasBooked && slotsInHour[0]?.booking ?
                              `${slotsInHour[0].booking.carrierName} - ${slotsInHour[0].booking.orderId}` :
                              hasBlocked ? slotsInHour[0]?.blockedReason : 'Cliquer pour bloquer'}
                          >
                            {colors.text}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '24px', marginTop: '24px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', background: 'rgba(0,208,132,0.3)', border: '1px solid #00D084', borderRadius: '4px' }} />
                  <span style={{ fontSize: '13px' }}>Disponible</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', background: 'rgba(255,107,107,0.3)', border: '1px solid #FF6B6B', borderRadius: '4px' }} />
                  <span style={{ fontSize: '13px' }}>Reserve</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', background: 'rgba(255,184,0,0.3)', border: '1px solid #FFB800', borderRadius: '4px' }} />
                  <span style={{ fontSize: '13px' }}>Bloque</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sites' && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Gestion des sites</h3>
                <button
                  onClick={() => setShowSiteModal(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #00D084 0%, #00B073 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}
                >
                  + Nouveau site
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {sites.map(site => (
                  <div key={site.id} style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, fontWeight: '700' }}>{site.name}</h4>
                      <span style={{
                        padding: '4px 12px',
                        background: 'rgba(0,208,132,0.3)',
                        color: '#00D084',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Actif
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '12px' }}>
                      {typeof site.address === 'string'
                        ? site.address
                        : `${site.address.street || ''}, ${site.address.postalCode || ''} ${site.address.city || ''}`}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                      <div>
                        <span style={{ opacity: 0.7 }}>Quais:</span> {site.docks.length}
                      </div>
                      <div>
                        <span style={{ opacity: 0.7 }}>Creneaux:</span> {site.timeSlotDuration}min
                      </div>
                      <div>
                        <span style={{ opacity: 0.7 }}>Ouverture:</span> {site.operatingHours.start}
                      </div>
                      <div>
                        <span style={{ opacity: 0.7 }}>Fermeture:</span> {site.operatingHours.end}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button
                        onClick={() => {
                          setSelectedSite(site);
                          setActiveTab('overview');
                        }}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: 'rgba(102,126,234,0.3)',
                          color: '#667eea',
                          border: '1px solid #667eea',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '12px'
                        }}
                      >
                        Voir
                      </button>
                      <button
                        onClick={() => handleDeleteSite(site.id)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: 'rgba(255,107,107,0.3)',
                          color: '#FF6B6B',
                          border: '1px solid #FF6B6B',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '12px'
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'docks' && selectedSite && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Quais de {selectedSite.name}</h3>
                <button
                  onClick={() => setShowDockModal(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #00D084 0%, #00B073 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}
                >
                  + Nouveau quai
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Nom</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Capacite</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Statut</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSite.docks.map(dock => (
                    <tr key={dock.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '16px 12px', fontWeight: '600' }}>{dock.name}</td>
                      <td style={{ padding: '16px 12px' }}>{getDockTypeLabel(dock.type)}</td>
                      <td style={{ padding: '16px 12px' }}>{dock.capacity} camions</td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: `${getDockStatusColor(dock.status)}20`,
                          color: getDockStatusColor(dock.status),
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {dock.status === 'available' ? 'Disponible' : dock.status === 'occupied' ? 'Occupe' : 'Maintenance'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleSetMaintenance(dock.id, dock.status !== 'maintenance')}
                            style={{
                              padding: '6px 12px',
                              background: dock.status === 'maintenance' ? 'rgba(0,208,132,0.3)' : 'rgba(255,184,0,0.3)',
                              color: dock.status === 'maintenance' ? '#00D084' : '#FFB800',
                              border: `1px solid ${dock.status === 'maintenance' ? '#00D084' : '#FFB800'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '11px'
                            }}
                          >
                            {dock.status === 'maintenance' ? 'Activer' : 'Maintenance'}
                          </button>
                          <button
                            onClick={() => handleDeleteDock(dock.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(255,107,107,0.3)',
                              color: '#FF6B6B',
                              border: '1px solid #FF6B6B',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '11px'
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Creation Site */}
        {showSiteModal && (
          <div style={modalOverlayStyle} onClick={() => setShowSiteModal(false)}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700' }}>
                Nouveau Site
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Nom du site *</label>
                  <input
                    type="text"
                    value={newSiteForm.name}
                    onChange={e => setNewSiteForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Entrepot Paris Nord"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Adresse *</label>
                  <input
                    type="text"
                    value={newSiteForm.street}
                    onChange={e => setNewSiteForm(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Rue et numero"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Code postal *</label>
                    <input
                      type="text"
                      value={newSiteForm.postalCode}
                      onChange={e => setNewSiteForm(prev => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="75001"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Ville *</label>
                    <input
                      type="text"
                      value={newSiteForm.city}
                      onChange={e => setNewSiteForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Paris"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Heure ouverture</label>
                    <input
                      type="time"
                      value={newSiteForm.operatingHoursStart}
                      onChange={e => setNewSiteForm(prev => ({ ...prev, operatingHoursStart: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Heure fermeture</label>
                    <input
                      type="time"
                      value={newSiteForm.operatingHoursEnd}
                      onChange={e => setNewSiteForm(prev => ({ ...prev, operatingHoursEnd: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Duree creneaux</label>
                    <select
                      value={newSiteForm.timeSlotDuration}
                      onChange={e => setNewSiteForm(prev => ({ ...prev, timeSlotDuration: parseInt(e.target.value) as 15 | 30 | 60 }))}
                      style={inputStyle}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Capacite max</label>
                    <input
                      type="number"
                      value={newSiteForm.maxCapacity}
                      onChange={e => setNewSiteForm(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) }))}
                      min={1}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowSiteModal(false); resetSiteForm(); }}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateSite}
                  disabled={!newSiteForm.name || !newSiteForm.street || !newSiteForm.city}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #00D084 0%, #00B073 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    opacity: (!newSiteForm.name || !newSiteForm.street || !newSiteForm.city) ? 0.5 : 1
                  }}
                >
                  Creer le site
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Creation Quai */}
        {showDockModal && (
          <div style={modalOverlayStyle} onClick={() => setShowDockModal(false)}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700' }}>
                Nouveau Quai - {selectedSite?.name}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Nom du quai *</label>
                  <input
                    type="text"
                    value={newDockForm.name}
                    onChange={e => setNewDockForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Quai A1"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Type de quai *</label>
                  <select
                    value={newDockForm.type}
                    onChange={e => setNewDockForm(prev => ({ ...prev, type: e.target.value as 'loading' | 'unloading' | 'both' }))}
                    style={inputStyle}
                  >
                    <option value="loading">Chargement uniquement</option>
                    <option value="unloading">Dechargement uniquement</option>
                    <option value="both">Mixte (chargement et dechargement)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Capacite (nombre de camions)</label>
                  <input
                    type="number"
                    value={newDockForm.capacity}
                    onChange={e => setNewDockForm(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    min={1}
                    max={10}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Types de vehicules acceptes</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {['Camion', 'Semi-remorque', 'Fourgon', 'Camionnette'].map(type => (
                      <label key={type} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        background: newDockForm.vehicleTypes.includes(type) ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.1)',
                        border: `1px solid ${newDockForm.vehicleTypes.includes(type) ? '#667eea' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}>
                        <input
                          type="checkbox"
                          checked={newDockForm.vehicleTypes.includes(type)}
                          onChange={e => {
                            if (e.target.checked) {
                              setNewDockForm(prev => ({ ...prev, vehicleTypes: [...prev.vehicleTypes, type] }));
                            } else {
                              setNewDockForm(prev => ({ ...prev, vehicleTypes: prev.vehicleTypes.filter(t => t !== type) }));
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowDockModal(false); resetDockForm(); }}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateDock}
                  disabled={!newDockForm.name}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #00D084 0%, #00B073 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    opacity: !newDockForm.name ? 0.5 : 1
                  }}
                >
                  Creer le quai
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
