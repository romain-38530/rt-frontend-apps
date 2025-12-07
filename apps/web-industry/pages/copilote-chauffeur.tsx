import { useEffect, useState, useRef } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated, getUser } from '../lib/auth';
import { ChatbotService } from '@rt/utils';
import { useToast } from '@rt/ui-components';
import type {
  CopiloteMission,
  Checkpoint,
  Message,
  CheckpointProof,
  SignatureData,
} from '@rt/contracts';

export default function CopiloteChauffeurPage() {
  const router = useSafeRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mission en cours
  const [currentMission, setCurrentMission] = useState<CopiloteMission | null>(null);
  const [missions, setMissions] = useState<CopiloteMission[]>([]);

  // Chat Copilote IA
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Checkpoints
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [proofNotes, setProofNotes] = useState('');

  // Signature
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Tracking
  const [locationTracking, setLocationTracking] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);

  // Documents
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documentType, setDocumentType] = useState<'cmr' | 'delivery_note' | 'photo' | 'other'>('cmr');

  // Stats
  const [batteryLevel, setBatteryLevel] = useState(100);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = getUser();
    setUser(currentUser);
    loadMissions(currentUser.id);

    // Geolocalisation
    if (navigator.geolocation && locationTracking) {
      const watchId = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [router, locationTracking]);

  const loadMissions = async (driverId: string) => {
    setLoading(true);
    try {
      const data = await ChatbotService.getDriverMissions(driverId, 'active');
      setMissions(data);
      if (data.length > 0) {
        setCurrentMission(data[0]);
      } else {
        // Mission mock pour demo
        setCurrentMission(mockMission);
        setMissions([mockMission]);
      }
    } catch (error) {
      console.error('Error loading missions:', error);
      setCurrentMission(mockMission);
      setMissions([mockMission]);
    }
    setLoading(false);
  };

  const handleLocationUpdate = async (position: GeolocationPosition) => {
    setCurrentLocation(position);

    // Envoyer la position au serveur
    if (currentMission && locationTracking) {
      try {
        await ChatbotService.sendLocation({
          missionId: currentMission.id,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          },
          batteryLevel,
        });
      } catch (error) {
        console.error('Error sending location:', error);
      }
    }
  };

  const activateMission = async (missionId: string) => {
    if (!currentLocation) {
      toast.warning('Activation de la geolocalisation requise');
      return;
    }

    try {
      const updated = await ChatbotService.activateMission({
        missionId,
        startLocation: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
      });
      setCurrentMission(updated);
      toast.success('Mission activee avec succes');
    } catch (error) {
      console.error('Error activating mission:', error);
      toast.error('Erreur lors de l\'activation de la mission');
    }
  };

  const reportCheckpointArrival = async (checkpoint: Checkpoint) => {
    if (!currentMission || !currentLocation) return;

    try {
      const updated = await ChatbotService.reportCheckpointArrival(currentMission.id, {
        checkpointId: checkpoint.id,
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        timestamp: new Date().toISOString(),
      });
      setCurrentMission(updated);
      toast.success('Arrivee signalee');
    } catch (error) {
      console.error('Error reporting arrival:', error);
      toast.error('Erreur lors du signalement');
    }
  };

  const completeCheckpoint = async () => {
    if (!currentMission || !selectedCheckpoint) return;

    const proof: CheckpointProof = {
      photos: proofPhotos,
      signature: signatureData || undefined,
      notes: proofNotes || undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      const updated = await ChatbotService.completeCheckpoint(currentMission.id, {
        checkpointId: selectedCheckpoint.id,
        proof,
      });
      setCurrentMission(updated);
      setShowCheckpointModal(false);
      setProofPhotos([]);
      setProofNotes('');
      setSignatureData(null);
      toast.success('Checkpoint complete');
    } catch (error) {
      console.error('Error completing checkpoint:', error);
      toast.error('Erreur lors de la completion');
    }
  };

  const uploadDocument = async (file: File) => {
    if (!currentMission) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        await ChatbotService.uploadDocument({
          missionId: currentMission.id,
          checkpointId: selectedCheckpoint?.id,
          type: documentType,
          filename: file.name,
          mimeType: file.type,
          data: base64.split(',')[1],
        });
        toast.success('Document uploade');
        setShowDocumentUpload(false);
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error('Erreur lors de l\'upload');
      }
    };
    reader.readAsDataURL(file);
  };

  const capturePhoto = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setProofPhotos([...proofPhotos, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const startSignature = () => {
    setShowSignatureModal(true);
  };

  const saveSignature = () => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL();
    const signerName = prompt('Nom du signataire:');
    if (!signerName) return;

    setSignatureData({
      dataUrl,
      signerName,
      timestamp: new Date().toISOString(),
    });
    setShowSignatureModal(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Canvas signature handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Chat Copilote
  const openChat = async () => {
    setChatOpen(true);
    if (!conversationId) {
      try {
        const conv = await ChatbotService.createConversation({
          botType: 'copilote',
          context: currentMission ? `Mission ${currentMission.missionNumber}` : undefined,
        });
        setConversationId(conv.id);
        setMessages(conv.messages);
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !conversationId) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      role: 'user',
      content: messageInput,
      timestamp: new Date().toISOString(),
    };
    setMessages([...messages, userMessage]);
    setMessageInput('');

    try {
      const response = await ChatbotService.sendMessage(conversationId, {
        content: userMessage.content,
      });
      setMessages((prev) => [...prev, response.message]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getStatusColor = (status: CopiloteMission['status']) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'paused': return '#6b7280';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getCheckpointStatusColor = (status: Checkpoint['status']) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'arrived': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'skipped': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Chargement de vos missions...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Copilote Chauffeur - SYMPHONI.A</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>Copilote Chauffeur</h1>
            <div style={styles.headerRight}>
              <span style={styles.battery}>
                {batteryLevel}%
              </span>
              <button
                style={styles.chatButton}
                onClick={openChat}
              >
                Chat IA
              </button>
            </div>
          </div>
          {user && <p style={styles.userName}>{user.name}</p>}
        </header>

        {/* Mission en cours */}
        {currentMission && (
          <div style={styles.missionCard}>
            <div style={styles.missionHeader}>
              <div>
                <h2 style={styles.missionNumber}>{currentMission.missionNumber}</h2>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: getStatusColor(currentMission.status),
                  }}
                >
                  {currentMission.status}
                </span>
              </div>
              {currentMission.status === 'pending' && (
                <button
                  style={styles.activateButton}
                  onClick={() => activateMission(currentMission.id)}
                >
                  Activer Mission
                </button>
              )}
            </div>

            <div style={styles.routeInfo}>
              <div style={styles.location}>
                <strong>Depart:</strong> {currentMission.origin.city}
              </div>
              <div style={styles.arrow}>→</div>
              <div style={styles.location}>
                <strong>Arrivee:</strong> {currentMission.destination.city}
              </div>
            </div>

            <div style={styles.cargoInfo}>
              <p><strong>Type:</strong> {currentMission.cargo.type}</p>
              <p><strong>Poids:</strong> {currentMission.cargo.weight} kg</p>
              {currentMission.cargo.pallets && (
                <p><strong>Palettes:</strong> {currentMission.cargo.pallets}</p>
              )}
            </div>

            <div style={styles.routeStats}>
              <div style={styles.stat}>
                <span style={styles.statLabel}>Distance</span>
                <span style={styles.statValue}>{currentMission.route.distance} km</span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statLabel}>Duree estimee</span>
                <span style={styles.statValue}>{Math.round(currentMission.route.estimatedDuration / 60)} h</span>
              </div>
            </div>
          </div>
        )}

        {/* Checkpoints */}
        {currentMission && currentMission.checkpoints.length > 0 && (
          <div style={styles.checkpointsSection}>
            <h3 style={styles.sectionTitle}>Checkpoints</h3>
            {currentMission.checkpoints.map((checkpoint) => (
              <div key={checkpoint.id} style={styles.checkpointCard}>
                <div style={styles.checkpointHeader}>
                  <span
                    style={{
                      ...styles.checkpointType,
                      background: checkpoint.type === 'pickup' ? '#3b82f6' : '#10b981',
                    }}
                  >
                    {checkpoint.type}
                  </span>
                  <span
                    style={{
                      ...styles.checkpointStatus,
                      background: getCheckpointStatusColor(checkpoint.status),
                    }}
                  >
                    {checkpoint.status}
                  </span>
                </div>

                <p style={styles.checkpointLocation}>{checkpoint.location.address}</p>
                <p style={styles.checkpointCity}>{checkpoint.location.city}</p>
                <p style={styles.checkpointTime}>
                  Prevu: {new Date(checkpoint.scheduledAt).toLocaleString('fr-FR')}
                </p>

                {checkpoint.status === 'pending' && currentMission.status === 'active' && (
                  <div style={styles.checkpointActions}>
                    <button
                      style={styles.arrivalButton}
                      onClick={() => reportCheckpointArrival(checkpoint)}
                    >
                      Signaler arrivee
                    </button>
                  </div>
                )}

                {checkpoint.status === 'arrived' && (
                  <div style={styles.checkpointActions}>
                    <button
                      style={styles.completeButton}
                      onClick={() => {
                        setSelectedCheckpoint(checkpoint);
                        setShowCheckpointModal(true);
                      }}
                    >
                      Completer checkpoint
                    </button>
                  </div>
                )}

                {checkpoint.proof && (
                  <div style={styles.proofInfo}>
                    <p>✓ Proof enregistree</p>
                    {checkpoint.proof.signature && <p>✓ Signature capturee</p>}
                    {checkpoint.proof.photos && <p>✓ {checkpoint.proof.photos.length} photo(s)</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions rapides */}
        <div style={styles.quickActions}>
          <button
            style={styles.actionButton}
            onClick={() => setShowDocumentUpload(true)}
          >
            Uploader Document
          </button>
          <button
            style={styles.actionButton}
            onClick={() => setLocationTracking(!locationTracking)}
          >
            {locationTracking ? 'Pause Tracking' : 'Activer Tracking'}
          </button>
        </div>

        {/* Position actuelle */}
        {currentLocation && (
          <div style={styles.locationInfo}>
            <p><strong>Position actuelle:</strong></p>
            <p>Lat: {currentLocation.coords.latitude.toFixed(6)}</p>
            <p>Lng: {currentLocation.coords.longitude.toFixed(6)}</p>
            <p>Precision: {currentLocation.coords.accuracy.toFixed(0)} m</p>
          </div>
        )}

        {/* Modal Checkpoint */}
        {showCheckpointModal && selectedCheckpoint && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h3>Completer Checkpoint</h3>
              <p>{selectedCheckpoint.location.address}</p>

              <div style={styles.proofSection}>
                <h4>Photos</h4>
                <button style={styles.photoButton} onClick={capturePhoto}>
                  Prendre une photo
                </button>
                <div style={styles.photoGrid}>
                  {proofPhotos.map((photo, idx) => (
                    <img key={idx} src={photo} alt={`Photo ${idx + 1}`} style={styles.photoThumb} />
                  ))}
                </div>
              </div>

              <div style={styles.proofSection}>
                <h4>Signature</h4>
                {!signatureData ? (
                  <button style={styles.signatureButton} onClick={startSignature}>
                    Capturer signature
                  </button>
                ) : (
                  <div>
                    <p>✓ Signature de {signatureData.signerName}</p>
                    <img src={signatureData.dataUrl} alt="Signature" style={styles.signatureThumb} />
                  </div>
                )}
              </div>

              <div style={styles.proofSection}>
                <h4>Notes</h4>
                <textarea
                  style={styles.textarea}
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Commentaires..."
                />
              </div>

              <div style={styles.modalActions}>
                <button style={styles.cancelButton} onClick={() => setShowCheckpointModal(false)}>
                  Annuler
                </button>
                <button
                  style={styles.validateButton}
                  onClick={completeCheckpoint}
                  disabled={proofPhotos.length === 0 && !signatureData}
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Signature */}
        {showSignatureModal && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h3>Signature electronique</h3>
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                style={styles.canvas}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              <div style={styles.modalActions}>
                <button style={styles.cancelButton} onClick={clearSignature}>
                  Effacer
                </button>
                <button style={styles.cancelButton} onClick={() => setShowSignatureModal(false)}>
                  Annuler
                </button>
                <button style={styles.validateButton} onClick={saveSignature}>
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Upload Document */}
        {showDocumentUpload && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h3>Upload Document</h3>
              <select
                style={styles.select}
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as any)}
              >
                <option value="cmr">CMR</option>
                <option value="delivery_note">Bon de livraison</option>
                <option value="photo">Photo</option>
                <option value="other">Autre</option>
              </select>
              <input
                type="file"
                style={styles.fileInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadDocument(file);
                }}
              />
              <div style={styles.modalActions}>
                <button style={styles.cancelButton} onClick={() => setShowDocumentUpload(false)}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Copilote */}
        {chatOpen && (
          <div style={styles.chatPanel}>
            <div style={styles.chatHeader}>
              <h3>Copilote IA</h3>
              <button style={styles.chatClose} onClick={() => setChatOpen(false)}>
                ×
              </button>
            </div>
            <div style={styles.chatMessages}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    ...styles.message,
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.role === 'user' ? '#3b82f6' : '#e5e7eb',
                    color: msg.role === 'user' ? 'white' : 'black',
                  }}
                >
                  {msg.content}
                </div>
              ))}
            </div>
            <div style={styles.chatInput}>
              <input
                type="text"
                style={styles.chatInputField}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Message..."
              />
              <button style={styles.sendButton} onClick={sendMessage}>
                Envoyer
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Mission mock pour demo
const mockMission: CopiloteMission = {
  id: 'MISSION-001',
  missionNumber: 'M-2024-0125',
  driverId: 'DRV-001',
  status: 'pending',
  origin: {
    address: '123 Rue de Paris',
    city: 'Lyon',
    postalCode: '69000',
    country: 'France',
    coordinates: { latitude: 45.764043, longitude: 4.835659 },
  },
  destination: {
    address: '456 Avenue des Champs',
    city: 'Paris',
    postalCode: '75008',
    country: 'France',
    coordinates: { latitude: 48.856614, longitude: 2.352222 },
  },
  cargo: {
    type: 'Palettes',
    weight: 15000,
    pallets: 33,
    quantity: 33,
    description: 'Produits industriels',
  },
  route: {
    distance: 465,
    estimatedDuration: 270,
    waypoints: [],
  },
  checkpoints: [
    {
      id: 'CP-001',
      type: 'pickup',
      location: {
        address: '123 Rue de Paris',
        city: 'Lyon',
        postalCode: '69000',
        country: 'France',
      },
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      status: 'pending',
    },
    {
      id: 'CP-002',
      type: 'delivery',
      location: {
        address: '456 Avenue des Champs',
        city: 'Paris',
        postalCode: '75008',
        country: 'France',
      },
      scheduledAt: new Date(Date.now() + 18000000).toISOString(),
      status: 'pending',
    },
  ],
  documents: [],
  tracking: {
    lastUpdate: new Date().toISOString(),
  },
  timeline: [],
  createdAt: new Date().toISOString(),
};

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid rgba(255,255,255,0.3)',
    borderTop: '5px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#1f2937',
  },
  headerRight: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  battery: {
    padding: '8px 12px',
    background: '#10b981',
    color: 'white',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  chatButton: {
    padding: '8px 16px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  userName: {
    margin: '10px 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  missionCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  missionNumber: {
    margin: '0 0 8px',
    fontSize: '20px',
    color: '#1f2937',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activateButton: {
    padding: '10px 20px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  routeInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    marginBottom: '15px',
    padding: '15px',
    background: '#f3f4f6',
    borderRadius: '8px',
  },
  location: {
    flex: 1,
  },
  arrow: {
    fontSize: '24px',
    color: '#3b82f6',
  },
  cargoInfo: {
    marginBottom: '15px',
    padding: '15px',
    background: '#fef3c7',
    borderRadius: '8px',
  },
  routeStats: {
    display: 'flex',
    gap: '15px',
  },
  stat: {
    flex: 1,
    padding: '10px',
    background: '#e0e7ff',
    borderRadius: '6px',
    textAlign: 'center',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    display: 'block',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  checkpointsSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    color: 'white',
    marginBottom: '12px',
    fontSize: '18px',
  },
  checkpointCard: {
    background: 'white',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  checkpointHeader: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  checkpointType: {
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  checkpointStatus: {
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  checkpointLocation: {
    margin: '0 0 5px',
    fontWeight: '600',
    color: '#1f2937',
  },
  checkpointCity: {
    margin: '0 0 5px',
    color: '#6b7280',
  },
  checkpointTime: {
    margin: 0,
    fontSize: '12px',
    color: '#9ca3af',
  },
  checkpointActions: {
    marginTop: '10px',
    display: 'flex',
    gap: '10px',
  },
  arrivalButton: {
    padding: '8px 16px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    flex: 1,
  },
  completeButton: {
    padding: '8px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    flex: 1,
  },
  proofInfo: {
    marginTop: '10px',
    padding: '10px',
    background: '#d1fae5',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#065f46',
  },
  quickActions: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  actionButton: {
    flex: 1,
    padding: '12px',
    background: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  locationInfo: {
    background: 'white',
    padding: '15px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  proofSection: {
    marginBottom: '20px',
  },
  photoButton: {
    width: '100%',
    padding: '12px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    marginBottom: '10px',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '10px',
  },
  photoThumb: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '6px',
  },
  signatureButton: {
    width: '100%',
    padding: '12px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  signatureThumb: {
    width: '100%',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginTop: '10px',
  },
  textarea: {
    width: '100%',
    minHeight: '80px',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  cancelButton: {
    flex: 1,
    padding: '10px',
    background: '#e5e7eb',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  validateButton: {
    flex: 1,
    padding: '10px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  canvas: {
    border: '2px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'crosshair',
    width: '100%',
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    marginBottom: '10px',
    fontSize: '14px',
  },
  fileInput: {
    width: '100%',
    marginBottom: '10px',
  },
  chatPanel: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'white',
    height: '400px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -4px 6px rgba(0,0,0,0.1)',
    zIndex: 999,
  },
  chatHeader: {
    padding: '15px 20px',
    background: '#3b82f6',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatClose: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
  },
  chatMessages: {
    flex: 1,
    padding: '15px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  message: {
    padding: '10px 15px',
    borderRadius: '12px',
    maxWidth: '70%',
    wordBreak: 'break-word',
  },
  chatInput: {
    padding: '15px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '10px',
  },
  chatInputField: {
    flex: 1,
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  sendButton: {
    padding: '10px 20px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};
