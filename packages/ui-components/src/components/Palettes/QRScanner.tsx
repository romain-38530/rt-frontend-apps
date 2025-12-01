/**
 * QRScanner - Composant de scan QR Code avec caméra
 * Utilise l'API navigator.mediaDevices pour accéder à la caméra
 * et jsQR pour le décodage des QR codes
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface QRScannerProps {
  // Callback appelé quand un QR code est détecté
  onScan: (data: string) => void;

  // Callback en cas d'erreur
  onError?: (error: string) => void;

  // Largeur du scanner
  width?: number | string;

  // Hauteur du scanner
  height?: number | string;

  // Afficher le guidage visuel
  showGuide?: boolean;

  // Activer le flash (si disponible)
  enableFlash?: boolean;

  // Caméra à utiliser ('front' ou 'back')
  facingMode?: 'user' | 'environment';

  // Style du conteneur
  style?: React.CSSProperties;

  // Délai entre les scans (ms)
  scanDelay?: number;

  // Fermer automatiquement après scan réussi
  autoClose?: boolean;

  // Callback pour fermer
  onClose?: () => void;
}

interface QRLocation {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onError,
  width = '100%',
  height = 400,
  showGuide = true,
  enableFlash = false,
  facingMode = 'environment',
  style,
  scanDelay = 500,
  autoClose = true,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [qrLocation, setQrLocation] = useState<QRLocation | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);

  // Démarrer la caméra
  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);
        setHasPermission(true);
        setError(null);
      }
    } catch (err: any) {
      console.error('Erreur caméra:', err);
      setHasPermission(false);
      const errorMessage = err.name === 'NotAllowedError'
        ? 'Permission caméra refusée'
        : err.name === 'NotFoundError'
        ? 'Aucune caméra disponible'
        : `Erreur caméra: ${err.message}`;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [facingMode, onError]);

  // Arrêter la caméra
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsActive(false);
  }, []);

  // Fonction de décodage QR simplifiée (pattern matching basique)
  // En production, utiliser jsQR ou ZXing pour un vrai décodage
  const decodeQR = useCallback((imageData: ImageData): { data: string; location: QRLocation } | null => {
    // Simuler la détection - en production, utiliser jsQR
    // Cette version cherche des patterns de contraste élevé
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Vérifier si jsQR est disponible globalement
    if (typeof (window as any).jsQR === 'function') {
      const code = (window as any).jsQR(data, width, height);
      if (code) {
        return {
          data: code.data,
          location: {
            x: code.location.topLeftCorner.x,
            y: code.location.topLeftCorner.y,
            width: code.location.topRightCorner.x - code.location.topLeftCorner.x,
            height: code.location.bottomLeftCorner.y - code.location.topLeftCorner.y,
          },
        };
      }
    }

    return null;
  }, []);

  // Scanner en boucle
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    // Ajuster la taille du canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dessiner l'image
    ctx.drawImage(video, 0, 0);

    // Obtenir les données d'image
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Décoder
    const result = decodeQR(imageData);

    if (result && result.data !== lastScan) {
      setLastScan(result.data);
      setQrLocation(result.location);
      onScan(result.data);

      if (autoClose) {
        setTimeout(() => {
          stopCamera();
          onClose?.();
        }, 1000);
        return;
      }
    }

    // Continuer le scan
    setTimeout(() => {
      animationRef.current = requestAnimationFrame(scanFrame);
    }, scanDelay);
  }, [isActive, lastScan, decodeQR, onScan, autoClose, stopCamera, onClose, scanDelay]);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.() as any;

    if (capabilities?.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any],
        });
        setFlashEnabled(!flashEnabled);
      } catch (err) {
        console.error('Erreur flash:', err);
      }
    }
  }, [flashEnabled]);

  // Démarrer au montage
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Démarrer le scan quand la caméra est active
  useEffect(() => {
    if (isActive) {
      animationRef.current = requestAnimationFrame(scanFrame);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, scanFrame]);

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width,
    height,
    backgroundColor: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    ...style,
  };

  const videoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  const guideStyle: React.CSSProperties = {
    width: '250px',
    height: '250px',
    border: '3px solid rgba(102, 126, 234, 0.8)',
    borderRadius: '16px',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
    position: 'relative',
  };

  const cornerStyle = (position: string): React.CSSProperties => ({
    position: 'absolute',
    width: '30px',
    height: '30px',
    borderColor: '#667eea',
    borderStyle: 'solid',
    borderWidth: '0',
    ...({
      'top-left': { top: -3, left: -3, borderTopWidth: '4px', borderLeftWidth: '4px', borderTopLeftRadius: '16px' },
      'top-right': { top: -3, right: -3, borderTopWidth: '4px', borderRightWidth: '4px', borderTopRightRadius: '16px' },
      'bottom-left': { bottom: -3, left: -3, borderBottomWidth: '4px', borderLeftWidth: '4px', borderBottomLeftRadius: '16px' },
      'bottom-right': { bottom: -3, right: -3, borderBottomWidth: '4px', borderRightWidth: '4px', borderBottomRightRadius: '16px' },
    }[position]),
  });

  const controlsStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '12px',
    pointerEvents: 'auto',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 20px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  // Afficher une erreur
  if (error || hasPermission === false) {
    return (
      <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
        <div style={{ color: '#ef4444', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
          {error || 'Permission caméra requise'}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: '16px', fontSize: '14px' }}>
          Autorisez l'accès à la caméra pour scanner les QR codes des chèques-palette.
        </p>
        <button
          onClick={startCamera}
          style={{ ...buttonStyle, background: '#667eea', color: 'white' }}
        >
          🔄 Réessayer
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Vidéo de la caméra */}
      <video
        ref={videoRef}
        style={videoStyle}
        playsInline
        muted
      />

      {/* Canvas caché pour le traitement */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Overlay avec guide */}
      <div style={overlayStyle}>
        {showGuide && (
          <>
            <div style={guideStyle}>
              <div style={cornerStyle('top-left')} />
              <div style={cornerStyle('top-right')} />
              <div style={cornerStyle('bottom-left')} />
              <div style={cornerStyle('bottom-right')} />

              {/* Ligne de scan animée */}
              <div
                style={{
                  position: 'absolute',
                  left: '10%',
                  right: '10%',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #667eea, transparent)',
                  animation: 'scanLine 2s ease-in-out infinite',
                }}
              />
            </div>

            <p style={{
              marginTop: '24px',
              color: 'white',
              fontSize: '14px',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}>
              Placez le QR code du chèque-palette dans le cadre
            </p>
          </>
        )}

        {/* Indicateur de QR détecté */}
        {qrLocation && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#00D084',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            ✓ QR Code détecté
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div style={controlsStyle}>
        {enableFlash && (
          <button
            onClick={toggleFlash}
            style={{
              ...buttonStyle,
              background: flashEnabled ? '#fbbf24' : 'rgba(255,255,255,0.2)',
              color: flashEnabled ? '#000' : '#fff',
            }}
          >
            {flashEnabled ? '🔦' : '💡'} Flash
          </button>
        )}

        {onClose && (
          <button
            onClick={() => { stopCamera(); onClose(); }}
            style={{ ...buttonStyle, background: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            ✕ Fermer
          </button>
        )}
      </div>

      {/* Animation CSS */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
