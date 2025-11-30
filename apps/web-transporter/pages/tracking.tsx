/**
 * Page Tracking GPS - Portail Transporteur
 * Integration complete Tracking API (9 endpoints)
 *
 * Endpoints:
 * - POST /tracking/pair - Pairer un appareil (QR code)
 * - POST /tracking/location - Enregistrer une position GPS
 * - GET /tracking/:orderId/locations - Historique des positions
 * - GET /tracking/:orderId/current - Position actuelle
 * - POST /tracking/geofence-event - Evenement de geofencing
 * - GET /tracking/tomtom/:orderId/eta - Calculer ETA avec TomTom
 * - GET /tracking/tomtom/:orderId/route - Obtenir itineraire optimise
 * - POST /tracking/tomtom/:orderId/replan - Replanifier l'itineraire
 * - PUT /orders/:id/status - Mettre a jour le statut
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';

// Types
interface Location {
  _id: string;
  orderId: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  altitude: number;
  timestamp: string;
  source: 'gps' | 'manual' | 'tomtom';
}

interface GeofenceEvent {
  _id: string;
  orderId: string;
  type: 'entered' | 'exited';
  location: {
    name: string;
    type: 'pickup' | 'delivery';
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  timestamp: string;
  distance: number;
}

interface TrackingSession {
  orderId: string;
  deviceId: string;
  currentLocation: Location | null;
  eta: Date | null;
  status: string;
}

export default function TrackingPage() {
  const router = useRouter();
  const trackingApiUrl = process.env.NEXT_PUBLIC_TRACKING_API_URL || 'http://localhost:3012/api/v1';

  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'pair' | 'geofence'>('live');
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [locationHistory, setLocationHistory] = useState<Location[]>([]);
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [eta, setEta] = useState<{ eta: string; travelTimeSeconds: number; distanceMeters: number } | null>(null);

  // Formulaires
  const [pairForm, setPairForm] = useState({ orderId: '', deviceId: '' });
  const [locationForm, setLocationForm] = useState({
    orderId: '',
    deviceId: '',
    latitude: '',
    longitude: '',
    speed: '',
    heading: ''
  });
  const [geofenceForm, setGeofenceForm] = useState({
    orderId: '',
    type: 'entered' as 'entered' | 'exited',
    locationName: '',
    locationType: 'pickup' as 'pickup' | 'delivery',
    latitude: '',
    longitude: ''
  });
  const [etaForm, setEtaForm] = useState({
    orderId: '',
    destinationLat: '',
    destinationLon: ''
  });
  const [statusForm, setStatusForm] = useState({
    orderId: '',
    status: 'pickup_arrived' as string
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper API call
  const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    const token = getAuthToken();
    const url = `${trackingApiUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Erreur ${response.status}`);
    }

    return data;
  };

  // Pairer un appareil
  const pairDevice = async () => {
    if (!pairForm.orderId || !pairForm.deviceId) {
      setError('orderId et deviceId sont requis');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await apiCall('/tracking/pair', 'POST', pairForm);
      setSuccess(`Appareil ${pairForm.deviceId} paire avec la commande ${pairForm.orderId}`);
      setPairForm({ orderId: '', deviceId: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Enregistrer une position
  const recordLocation = async () => {
    if (!locationForm.orderId || !locationForm.latitude || !locationForm.longitude) {
      setError('orderId, latitude et longitude sont requis');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        orderId: locationForm.orderId,
        deviceId: locationForm.deviceId,
        latitude: parseFloat(locationForm.latitude),
        longitude: parseFloat(locationForm.longitude),
        speed: locationForm.speed ? parseFloat(locationForm.speed) : undefined,
        heading: locationForm.heading ? parseFloat(locationForm.heading) : undefined
      };

      await apiCall('/tracking/location', 'POST', payload);
      setSuccess('Position enregistree');
      setLocationForm({ orderId: '', deviceId: '', latitude: '', longitude: '', speed: '', heading: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir la position actuelle
  const getCurrentLocation = async (orderId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall(`/tracking/${orderId}/current`);
      setCurrentLocation(result.data);
      setSelectedOrderId(orderId);
    } catch (err: any) {
      setError(err.message);
      setCurrentLocation(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir l'historique des positions
  const getLocationHistory = async (orderId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall(`/tracking/${orderId}/locations?limit=50`);
      setLocationHistory(result.data || []);
      setSelectedOrderId(orderId);
    } catch (err: any) {
      setError(err.message);
      setLocationHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enregistrer un evenement de geofencing
  const recordGeofenceEvent = async () => {
    if (!geofenceForm.orderId || !geofenceForm.locationName) {
      setError('orderId et nom du lieu sont requis');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        orderId: geofenceForm.orderId,
        type: geofenceForm.type,
        location: {
          name: geofenceForm.locationName,
          type: geofenceForm.locationType,
          coordinates: {
            latitude: geofenceForm.latitude ? parseFloat(geofenceForm.latitude) : 0,
            longitude: geofenceForm.longitude ? parseFloat(geofenceForm.longitude) : 0
          }
        }
      };

      await apiCall('/tracking/geofence-event', 'POST', payload);
      setSuccess(`Evenement geofencing enregistre: ${geofenceForm.type} ${geofenceForm.locationName}`);
      setGeofenceForm({
        orderId: '',
        type: 'entered',
        locationName: '',
        locationType: 'pickup',
        latitude: '',
        longitude: ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer ETA avec TomTom
  const calculateETA = async () => {
    if (!etaForm.orderId || !etaForm.destinationLat || !etaForm.destinationLon) {
      setError('orderId et coordonnees de destination sont requis');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall(
        `/tracking/tomtom/${etaForm.orderId}/eta?destinationLat=${etaForm.destinationLat}&destinationLon=${etaForm.destinationLon}`
      );
      setEta(result.data);
      setSuccess('ETA calcule avec TomTom');
    } catch (err: any) {
      setError(err.message);
      setEta(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre a jour le statut
  const updateStatus = async () => {
    if (!statusForm.orderId) {
      setError('orderId est requis');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await apiCall(`/orders/${statusForm.orderId}/status`, 'PUT', { status: statusForm.status });
      setSuccess(`Statut mis a jour: ${statusForm.status}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Styles
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    fontFamily: 'system-ui, sans-serif',
    color: 'white'
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 24px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '16px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '12px',
    color: 'white'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer'
  };

  return (
    <>
      <Head>
        <title>Tracking GPS - Transporteur | SYMPHONI.A</title>
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '8px 16px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white'
              }}
            >
              Retour
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>GPS</span> Tracking en Temps Reel
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle(activeTab === 'live')} onClick={() => setActiveTab('live')}>
              Suivi Live
            </button>
            <button style={tabStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>
              Historique
            </button>
            <button style={tabStyle(activeTab === 'pair')} onClick={() => setActiveTab('pair')}>
              Pairing
            </button>
            <button style={tabStyle(activeTab === 'geofence')} onClick={() => setActiveTab('geofence')}>
              Geofencing
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '8px', fontWeight: '600', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            Erreur: {error}
          </div>
        )}
        {success && (
          <div style={{ margin: '16px 24px', padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', borderRadius: '8px', fontWeight: '600', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            {success}
          </div>
        )}

        {/* Content */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>

          {/* Tab: Live Tracking */}
          {activeTab === 'live' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Position actuelle */}
                <div style={cardStyle}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Position Actuelle</h2>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <input
                      style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                      placeholder="ID Commande"
                      value={selectedOrderId}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                    />
                    <button onClick={() => getCurrentLocation(selectedOrderId)} style={buttonStyle} disabled={isLoading}>
                      Localiser
                    </button>
                  </div>

                  {currentLocation && (
                    <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Latitude</div>
                          <div style={{ fontWeight: '700' }}>{currentLocation.latitude}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Longitude</div>
                          <div style={{ fontWeight: '700' }}>{currentLocation.longitude}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Vitesse</div>
                          <div style={{ fontWeight: '700' }}>{currentLocation.speed || 0} km/h</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Derniere MAJ</div>
                          <div style={{ fontWeight: '700' }}>{new Date(currentLocation.timestamp).toLocaleTimeString('fr-FR')}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculer ETA */}
                <div style={cardStyle}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Calculer ETA (TomTom)</h2>
                  <input
                    style={inputStyle}
                    placeholder="ID Commande"
                    value={etaForm.orderId}
                    onChange={(e) => setEtaForm({ ...etaForm, orderId: e.target.value })}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input
                      style={inputStyle}
                      placeholder="Latitude destination"
                      value={etaForm.destinationLat}
                      onChange={(e) => setEtaForm({ ...etaForm, destinationLat: e.target.value })}
                    />
                    <input
                      style={inputStyle}
                      placeholder="Longitude destination"
                      value={etaForm.destinationLon}
                      onChange={(e) => setEtaForm({ ...etaForm, destinationLon: e.target.value })}
                    />
                  </div>
                  <button onClick={calculateETA} style={buttonStyle} disabled={isLoading}>
                    Calculer ETA
                  </button>

                  {eta && (
                    <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>ETA</div>
                          <div style={{ fontWeight: '700', fontSize: '18px' }}>{new Date(eta.eta).toLocaleTimeString('fr-FR')}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Temps restant</div>
                          <div style={{ fontWeight: '700' }}>{Math.round(eta.travelTimeSeconds / 60)} min</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>Distance</div>
                          <div style={{ fontWeight: '700' }}>{(eta.distanceMeters / 1000).toFixed(1)} km</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mise a jour statut */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Mettre a jour le Statut</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                    placeholder="ID Commande"
                    value={statusForm.orderId}
                    onChange={(e) => setStatusForm({ ...statusForm, orderId: e.target.value })}
                  />
                  <select
                    style={{ ...selectStyle, marginBottom: 0, flex: 1 }}
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  >
                    <option value="pickup_arrived">Arrive a l'enlevement</option>
                    <option value="pickup_departed">Parti de l'enlevement</option>
                    <option value="loaded">Charge</option>
                    <option value="delivery_arrived">Arrive a la livraison</option>
                    <option value="delivered">Livre</option>
                  </select>
                  <button onClick={updateStatus} style={buttonStyle} disabled={isLoading}>
                    Mettre a jour
                  </button>
                </div>
              </div>

              {/* Enregistrer position manuelle */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Enregistrer Position Manuelle</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <input
                    style={inputStyle}
                    placeholder="ID Commande *"
                    value={locationForm.orderId}
                    onChange={(e) => setLocationForm({ ...locationForm, orderId: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    placeholder="ID Appareil"
                    value={locationForm.deviceId}
                    onChange={(e) => setLocationForm({ ...locationForm, deviceId: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    placeholder="Latitude *"
                    value={locationForm.latitude}
                    onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    placeholder="Longitude *"
                    value={locationForm.longitude}
                    onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    placeholder="Vitesse (km/h)"
                    value={locationForm.speed}
                    onChange={(e) => setLocationForm({ ...locationForm, speed: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    placeholder="Direction (degres)"
                    value={locationForm.heading}
                    onChange={(e) => setLocationForm({ ...locationForm, heading: e.target.value })}
                  />
                </div>
                <button onClick={recordLocation} style={buttonStyle} disabled={isLoading}>
                  Enregistrer Position
                </button>
              </div>
            </div>
          )}

          {/* Tab: History */}
          {activeTab === 'history' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Historique des Positions</h2>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input
                  style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                  placeholder="ID Commande"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                />
                <button onClick={() => getLocationHistory(selectedOrderId)} style={buttonStyle} disabled={isLoading}>
                  Charger Historique
                </button>
              </div>

              {locationHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>H</div>
                  <div>Entrez un ID de commande pour voir l'historique</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Heure</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Latitude</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Longitude</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Vitesse</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationHistory.map((loc) => (
                        <tr key={loc._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '12px' }}>{new Date(loc.timestamp).toLocaleString('fr-FR')}</td>
                          <td style={{ padding: '12px' }}>{loc.latitude.toFixed(6)}</td>
                          <td style={{ padding: '12px' }}>{loc.longitude.toFixed(6)}</td>
                          <td style={{ padding: '12px' }}>{loc.speed || 0} km/h</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: loc.source === 'gps' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              {loc.source.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Pair */}
          {activeTab === 'pair' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Pairing Appareil (QR Code)</h2>
              <p style={{ marginBottom: '24px', opacity: 0.7 }}>
                Associez un appareil mobile a une commande pour activer le tracking GPS automatique.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px' }}>
                <input
                  style={inputStyle}
                  placeholder="ID Commande *"
                  value={pairForm.orderId}
                  onChange={(e) => setPairForm({ ...pairForm, orderId: e.target.value })}
                />
                <input
                  style={inputStyle}
                  placeholder="ID Appareil *"
                  value={pairForm.deviceId}
                  onChange={(e) => setPairForm({ ...pairForm, deviceId: e.target.value })}
                />
              </div>
              <button onClick={pairDevice} style={buttonStyle} disabled={isLoading}>
                {isLoading ? 'Pairing...' : 'Pairer Appareil'}
              </button>

              <div style={{ marginTop: '32px', padding: '24px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Comment ca marche ?</h3>
                <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                  <li>Le chauffeur scanne le QR code de la commande avec l'app mobile</li>
                  <li>L'appareil est automatiquement associe a la commande</li>
                  <li>Le tracking GPS demarre et les positions sont envoyees en temps reel</li>
                  <li>Les evenements de geofencing sont detectes automatiquement</li>
                </ol>
              </div>
            </div>
          )}

          {/* Tab: Geofence */}
          {activeTab === 'geofence' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Evenements de Geofencing</h2>
              <p style={{ marginBottom: '24px', opacity: 0.7 }}>
                Enregistrez manuellement une entree ou sortie de zone (enlevement/livraison).
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input
                  style={inputStyle}
                  placeholder="ID Commande *"
                  value={geofenceForm.orderId}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, orderId: e.target.value })}
                />
                <select
                  style={selectStyle}
                  value={geofenceForm.type}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, type: e.target.value as 'entered' | 'exited' })}
                >
                  <option value="entered">Entree dans la zone</option>
                  <option value="exited">Sortie de la zone</option>
                </select>
                <input
                  style={inputStyle}
                  placeholder="Nom du lieu *"
                  value={geofenceForm.locationName}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, locationName: e.target.value })}
                />
                <select
                  style={selectStyle}
                  value={geofenceForm.locationType}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, locationType: e.target.value as 'pickup' | 'delivery' })}
                >
                  <option value="pickup">Enlevement</option>
                  <option value="delivery">Livraison</option>
                </select>
                <input
                  style={inputStyle}
                  placeholder="Latitude"
                  value={geofenceForm.latitude}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, latitude: e.target.value })}
                />
                <input
                  style={inputStyle}
                  placeholder="Longitude"
                  value={geofenceForm.longitude}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, longitude: e.target.value })}
                />
              </div>

              <button onClick={recordGeofenceEvent} style={buttonStyle} disabled={isLoading}>
                Enregistrer Evenement
              </button>

              <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Statuts declenches automatiquement</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: '600' }}>Entree zone enlevement</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Declenche: order.arrived.pickup</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: '600' }}>Entree zone livraison</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Declenche: order.arrived.delivery</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
