/**
 * SignatureCapture - Composant de capture de signature manuscrite
 * Permet de dessiner une signature sur un canvas tactile
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';

export interface SignatureData {
  // Signature en base64 (PNG)
  imageBase64: string;

  // Points de la signature (pour vérification)
  points: Array<{ x: number; y: number; time: number }>;

  // Timestamp de la signature
  timestamp: string;

  // Dimensions du canvas
  dimensions: { width: number; height: number };
}

export interface SignatureCaptureProps {
  // Callback quand la signature est terminée
  onCapture: (signature: SignatureData) => void;

  // Callback pour annuler
  onCancel?: () => void;

  // Largeur du canvas
  width?: number;

  // Hauteur du canvas
  height?: number;

  // Couleur du trait
  strokeColor?: string;

  // Épaisseur du trait
  strokeWidth?: number;

  // Couleur de fond
  backgroundColor?: string;

  // Afficher le guide
  showGuide?: boolean;

  // Texte du guide
  guideText?: string;

  // Style du conteneur
  style?: React.CSSProperties;

  // Nom du signataire (optionnel)
  signerName?: string;

  // Rôle du signataire (optionnel)
  signerRole?: 'transporter' | 'receiver' | 'validator';

  // Désactivé
  disabled?: boolean;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onCapture,
  onCancel,
  width = 400,
  height = 200,
  strokeColor = '#1a1a2e',
  strokeWidth = 2.5,
  backgroundColor = '#ffffff',
  showGuide = true,
  guideText = 'Signez ici avec votre doigt ou souris',
  style,
  signerName,
  signerRole,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [points, setPoints] = useState<Array<{ x: number; y: number; time: number }>>([]);

  // Initialiser le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurer le canvas avec la résolution de l'écran
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Fond
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Style du trait
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Ligne de signature
    if (showGuide) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, height - 40);
      ctx.lineTo(width - 20, height - 40);
      ctx.stroke();

      // X pour marquer l'endroit
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px sans-serif';
      ctx.fillText('✕', 10, height - 35);
    }

    // Remettre le style du trait
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
  }, [width, height, strokeColor, strokeWidth, backgroundColor, showGuide]);

  // Obtenir les coordonnées du point
  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width / (window.devicePixelRatio || 1);
    const scaleY = canvas.height / rect.height / (window.devicePixelRatio || 1);

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  }, []);

  // Commencer à dessiner
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);

    setPoints(prev => [...prev, { ...coords, time: Date.now() }]);
  }, [disabled, getCoordinates]);

  // Dessiner
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setPoints(prev => [...prev, { ...coords, time: Date.now() }]);
  }, [isDrawing, disabled, getCoordinates]);

  // Arrêter de dessiner
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Effacer la signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Effacer
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Redessiner le guide
    if (showGuide) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, height - 40);
      ctx.lineTo(width - 20, height - 40);
      ctx.stroke();

      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px sans-serif';
      ctx.fillText('✕', 10, height - 35);

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
    }

    setIsEmpty(true);
    setPoints([]);
  }, [backgroundColor, width, height, showGuide, strokeColor, strokeWidth]);

  // Valider la signature
  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const imageBase64 = canvas.toDataURL('image/png');

    onCapture({
      imageBase64,
      points,
      timestamp: new Date().toISOString(),
      dimensions: { width, height },
    });
  }, [isEmpty, points, width, height, onCapture]);

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    maxWidth: width + 40,
    ...style,
  };

  const canvasContainerStyle: React.CSSProperties = {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid #e5e7eb',
    background: backgroundColor,
  };

  const canvasStyle: React.CSSProperties = {
    width,
    height,
    display: 'block',
    touchAction: 'none',
    cursor: disabled ? 'not-allowed' : 'crosshair',
    opacity: disabled ? 0.5 : 1,
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const roleLabels: Record<string, string> = {
    transporter: 'Transporteur',
    receiver: 'Récepteur',
    validator: 'Validateur',
  };

  return (
    <div style={containerStyle}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1a2e' }}>
            ✍️ Signature numérique
          </h3>
          {signerName && (
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
              {signerName}
              {signerRole && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  background: 'rgba(102,126,234,0.1)',
                  color: '#667eea',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}>
                  {roleLabels[signerRole] || signerRole}
                </span>
              )}
            </p>
          )}
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>

      {/* Canvas */}
      <div style={canvasContainerStyle}>
        <canvas
          ref={canvasRef}
          style={canvasStyle}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Guide overlay */}
        {isEmpty && showGuide && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#9ca3af',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✍️</div>
            <div style={{ fontSize: '14px' }}>{guideText}</div>
          </div>
        )}

        {/* Indicateur de validité */}
        {!isEmpty && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#00D084',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
          }}>
            ✓ Signature détectée
          </div>
        )}
      </div>

      {/* Informations légales */}
      <div style={{
        fontSize: '11px',
        color: '#9ca3af',
        lineHeight: 1.4,
        textAlign: 'center',
      }}>
        En signant, vous confirmez avoir vérifié les informations du chèque-palette.
        Cette signature est horodatée et liée cryptographiquement au document.
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              ...buttonStyle,
              flex: 1,
              background: 'rgba(0,0,0,0.05)',
              color: '#666',
            }}
          >
            ✕ Annuler
          </button>
        )}

        <button
          onClick={clearSignature}
          disabled={isEmpty}
          style={{
            ...buttonStyle,
            flex: 1,
            background: isEmpty ? 'rgba(0,0,0,0.05)' : 'rgba(239,68,68,0.1)',
            color: isEmpty ? '#ccc' : '#ef4444',
            cursor: isEmpty ? 'not-allowed' : 'pointer',
          }}
        >
          🔄 Effacer
        </button>

        <button
          onClick={handleConfirm}
          disabled={isEmpty}
          style={{
            ...buttonStyle,
            flex: 2,
            background: isEmpty ? '#e5e7eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: isEmpty ? '#999' : 'white',
            cursor: isEmpty ? 'not-allowed' : 'pointer',
            boxShadow: isEmpty ? 'none' : '0 4px 12px rgba(102,126,234,0.4)',
          }}
        >
          ✓ Confirmer la signature
        </button>
      </div>
    </div>
  );
};

export default SignatureCapture;
