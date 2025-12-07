/**
 * Liste des commandes avec filtres et pagination
 * Composant réutilisable pour tous les portails
 */

import React, { useState } from 'react';
import type { Order, OrderStatus, OrderFilters } from '@rt/contracts';

export interface OrdersListProps {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onFiltersChange: (filters: OrderFilters) => void;
  onOrderClick: (orderId: string) => void;
  onDuplicateOrder?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
  isLoading?: boolean;
}

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: '#9ca3af' },
  created: { label: 'Créée', color: '#3b82f6' },
  sent_to_carrier: { label: 'Envoyée', color: '#8b5cf6' },
  carrier_accepted: { label: 'Acceptée', color: '#10b981' },
  carrier_refused: { label: 'Refusée', color: '#ef4444' },
  in_transit: { label: 'En transit', color: '#f59e0b' },
  arrived_pickup: { label: 'Arrivé collecte', color: '#14b8a6' },
  loaded: { label: 'Chargé', color: '#06b6d4' },
  arrived_delivery: { label: 'Arrivé livraison', color: '#0ea5e9' },
  delivered: { label: 'Livrée', color: '#22c55e' },
  closed: { label: 'Clôturée', color: '#64748b' },
  cancelled: { label: 'Annulée', color: '#dc2626' },
  escalated: { label: 'Escaladée', color: '#f97316' },
};

export const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  onFiltersChange,
  onOrderClick,
  onDuplicateOrder,
  onCancelOrder,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Appliquer les filtres
  const applyFilters = () => {
    onFiltersChange({
      search: searchQuery || undefined,
      status: statusFilter.length > 0 ? statusFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: 1,
      limit,
    });
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
    setDateFrom('');
    setDateTo('');
    onFiltersChange({ page: 1, limit });
  };

  // Toggle status filter
  const toggleStatusFilter = (status: OrderStatus) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter((s) => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Formater le prix
  const formatPrice = (price?: number, currency: string = 'EUR') => {
    if (!price) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(price);
  };

  const cardStyle: React.CSSProperties = {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '16px',
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <div>
      {/* Filtres */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          🔍 Recherche et filtres
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Rechercher par référence, client..."
            aria-label="Rechercher une commande"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inputStyle}
          />

          <input
            type="date"
            placeholder="Date début"
            aria-label="Date de début"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={inputStyle}
          />

          <input
            type="date"
            placeholder="Date fin"
            aria-label="Date de fin"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={applyFilters}
            style={{ ...buttonStyle, backgroundColor: '#667eea', color: 'white' }}
          >
            Appliquer
          </button>
        </div>

        {/* Filtres par statut */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
            Statut
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(STATUS_LABELS).map(([status, { label, color }]) => (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatusFilter(status as OrderStatus)}
                style={{
                  padding: '6px 12px',
                  border: statusFilter.includes(status as OrderStatus) ? `2px solid ${color}` : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: statusFilter.includes(status as OrderStatus) ? `${color}15` : 'white',
                  color: statusFilter.includes(status as OrderStatus) ? color : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={resetFilters}
          style={{ ...buttonStyle, backgroundColor: 'white', color: '#6b7280', border: '1px solid #e5e7eb' }}
        >
          Réinitialiser
        </button>
      </div>

      {/* Résumé */}
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
        {total} commande{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
      </div>

      {/* Liste des commandes */}
      {isLoading ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Chargement...</div>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Aucune commande trouvée</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Essayez de modifier vos filtres</div>
        </div>
      ) : (
        <div>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                ...cardStyle,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => onOrderClick(order.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                      {order.reference}
                    </h4>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: `${STATUS_LABELS[order.status].color}15`,
                        color: STATUS_LABELS[order.status].color,
                      }}
                    >
                      {STATUS_LABELS[order.status].label}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Collecte</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>
                        {order.pickupAddress.city}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {formatDate(order.dates.pickupDate)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Livraison</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>
                        {order.deliveryAddress.city}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {formatDate(order.dates.deliveryDate)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Marchandise</div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>
                        {order.goods.weight} kg
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {order.goods.description.substring(0, 30)}...
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginLeft: '24px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                    {formatPrice(order.estimatedPrice || order.finalPrice, order.currency)}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {onDuplicateOrder && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateOrder(order.id);
                        }}
                        style={{
                          ...buttonStyle,
                          padding: '6px 12px',
                          backgroundColor: 'white',
                          color: '#667eea',
                          border: '1px solid #667eea',
                          fontSize: '12px',
                        }}
                      >
                        Dupliquer
                      </button>
                    )}

                    {onCancelOrder && order.status !== 'cancelled' && order.status !== 'closed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
                            onCancelOrder(order.id);
                          }
                        }}
                        style={{
                          ...buttonStyle,
                          padding: '6px 12px',
                          backgroundColor: 'white',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          fontSize: '12px',
                        }}
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ ...cardStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            style={{
              ...buttonStyle,
              backgroundColor: page === 1 ? '#f3f4f6' : 'white',
              color: page === 1 ? '#9ca3af' : '#374151',
              border: '1px solid #e5e7eb',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Précédent
          </button>

          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                style={{
                  ...buttonStyle,
                  backgroundColor: pageNum === page ? '#667eea' : 'white',
                  color: pageNum === page ? 'white' : '#374151',
                  border: pageNum === page ? 'none' : '1px solid #e5e7eb',
                }}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            style={{
              ...buttonStyle,
              backgroundColor: page === totalPages ? '#f3f4f6' : 'white',
              color: page === totalPages ? '#9ca3af' : '#374151',
              border: '1px solid #e5e7eb',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
