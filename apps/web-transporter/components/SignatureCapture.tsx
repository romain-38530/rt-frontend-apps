/**
 * SignatureCapture - Composant de capture de signature SYMPHONI.A
 * Canvas interactif pour signature tactile/souris
 */
import React, { useRef, useState, useEffect } from 'react';

interface SignatureCaptureProps {
  onSignature: (signatureData: string) => void;
  width?: number;
  height?: number;
  label?: string;
  disabled?: boolean;
}

const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSignature,
  width = 400,
  height = 200,
  label = 'Signature du destinataire',
  disabled = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);

    if (hasSignature) {
      const canvas = canvasRef.current;
      if (canvas) {
        const signatureData = canvas.toDataURL('image/png');
        onSignature(signatureData);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    onSignature('');
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  };

  const canvasContainerStyle: React.CSSProperties = {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ffffff',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'crosshair'
  };

  const canvasStyle: React.CSSProperties = {
    display: 'block',
    touchAction: 'none',
    width: '100%',
    maxWidth: `${width}px`,
    height: 'auto'
  };

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#9ca3af',
    fontSize: '14px',
    pointerEvents: 'none',
    display: hasSignature ? 'none' : 'block'
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end'
  };

  const clearButtonStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '12px',
    color: '#dc2626',
    backgroundColor: 'transparent',
    border: '1px solid #dc2626',
    borderRadius: '4px',
    cursor: 'pointer',
    opacity: hasSignature ? 1 : 0.5
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={canvasContainerStyle}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={canvasStyle}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <span style={placeholderStyle}>
          Signez ici avec votre doigt ou souris
        </span>
      </div>
      <div style={buttonContainerStyle}>
        <button
          type="button"
          onClick={clearSignature}
          disabled={!hasSignature || disabled}
          style={clearButtonStyle}
        >
          Effacer
        </button>
      </div>
    </div>
  );
};

export default SignatureCapture;
