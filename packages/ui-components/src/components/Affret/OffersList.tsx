/**
 * Liste des offres Affret.IA
 * Affiche les offres reçues avec actions
 */

import React from 'react';
import type { AffretOffer } from '@rt/contracts';
import { AffretIAService } from '@rt/utils';

interface OffersListProps {
  offers: AffretOffer[];
  onAccept?: (offerId: string) => void;
  onReject?: (offerId: string) => void;
  onCounter?: (offerId: string) => void;
  onViewDetails?: (offer: AffretOffer) => void;
}

export const OffersList: React.FC<OffersListProps> = ({
  offers,
  onAccept,
  onReject,
  onCounter,
  onViewDetails,
}) => {
  if (offers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
          Aucune offre
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Les offres des transporteurs apparaîtront ici
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {offers.map((offer) => (
        <div
          key={offer.id}
          onClick={() => onViewDetails?.(offer)}
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: onViewDetails ? 'pointer' : 'default',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
                {offer.carrierName}
              </h4>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Offre soumise le {new Date(offer.submittedAt).toLocaleString('fr-FR')}
              </div>
            </div>
            <div>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: `${AffretIAService.getAffretOfferStatusColor(offer.status)}15`,
                  color: AffretIAService.getAffretOfferStatusColor(offer.status),
                }}
              >
                {AffretIAService.getAffretOfferStatusLabel(offer.status)}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Prix</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#667eea' }}>
                {AffretIAService.formatPrice(offer.price.amount, offer.price.currency)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Durée</div>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>
                {offer.estimatedDuration}h
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Distance</div>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>
                {offer.distance} km
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Tracking</div>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>
                {offer.tracking === 'premium' ? '🛰️ Premium' : offer.tracking === 'gps' ? '📱 GPS' : '📧 Basic'}
              </div>
            </div>
          </div>

          {offer.status === 'submitted' && (
            <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
              {onAccept && (
                <button
                  onClick={() => onAccept(offer.id)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  ✅ Accepter
                </button>
              )}
              {onCounter && (
                <button
                  onClick={() => onCounter(offer.id)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  💬 Négocier
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => onReject(offer.id)}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  ❌ Refuser
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OffersList;
