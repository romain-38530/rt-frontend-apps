/**
 * Liste des commandes avec design tableau professionnel
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
  onViewDocuments?: (orderId: string) => void;
  isLoading?: boolean;
  showCreatedBy?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  // Status codes utilises dans la base de donnees
  pending: { label: 'En attente', color: '#6b7280', bgColor: '#f3f4f6' },
  draft: { label: 'Brouillon', color: '#6b7280', bgColor: '#f3f4f6' },
  created: { label: 'Creee', color: '#3b82f6', bgColor: '#dbeafe' },
  // Auto-dispatch statuts
  planification_auto: { label: 'Planification auto', color: '#8b5cf6', bgColor: '#ede9fe' },
  affret_ia: { label: 'Affret IA', color: '#ec4899', bgColor: '#fce7f3' },
  echec_planification: { label: 'Echec planification', color: '#dc2626', bgColor: '#fee2e2' },
  // Carrier statuts
  sent_to_carrier: { label: 'Envoyee', color: '#8b5cf6', bgColor: '#ede9fe' },
  accepted: { label: 'Acceptee', color: '#10b981', bgColor: '#d1fae5' },
  carrier_accepted: { label: 'Acceptee', color: '#10b981', bgColor: '#d1fae5' },
  refused: { label: 'Refusee', color: '#ef4444', bgColor: '#fee2e2' },
  carrier_refused: { label: 'Refusee', color: '#ef4444', bgColor: '#fee2e2' },
  // Transit statuts
  in_transit: { label: 'En transit', color: '#f59e0b', bgColor: '#fef3c7' },
  arrived_pickup: { label: 'Arrive collecte', color: '#14b8a6', bgColor: '#ccfbf1' },
  loaded: { label: 'Charge', color: '#06b6d4', bgColor: '#cffafe' },
  arrived_delivery: { label: 'Arrive livraison', color: '#0ea5e9', bgColor: '#e0f2fe' },
  delivered: { label: 'Livree', color: '#22c55e', bgColor: '#dcfce7' },
  closed: { label: 'Cloturee', color: '#64748b', bgColor: '#f1f5f9' },
  cancelled: { label: 'Annulee', color: '#dc2626', bgColor: '#fee2e2' },
  escalated: { label: 'Escaladee', color: '#f97316', bgColor: '#ffedd5' },
};

const getStatusInfo = (status: string) => {
  return STATUS_LABELS[status] || { label: status || 'Inconnu', color: '#6b7280', bgColor: '#f3f4f6' };
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
  onViewDocuments,
  isLoading = false,
  showCreatedBy = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

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

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
    setDateFrom('');
    setDateTo('');
    onFiltersChange({ page: 1, limit });
  };

  const toggleStatusFilter = (status: OrderStatus) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter((s) => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  const toggleSelectOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  };

  const tdStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'top',
  };

  return (
    <div>
      {/* Filtres */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Recherche et filtres
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Rechercher par reference, client..."
            aria-label="Rechercher une commande"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inputStyle}
          />

          <input
            type="date"
            placeholder="Date debut"
            aria-label="Date de debut"
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
          Reinitialiser
        </button>
      </div>

      {/* Resume */}
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{total} commande{total > 1 ? 's' : ''} trouvee{total > 1 ? 's' : ''}</span>
        {selectedOrders.length > 0 && (
          <span style={{ color: '#667eea', fontWeight: '600' }}>
            {selectedOrders.length} selectionnee{selectedOrders.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tableau des commandes */}
      {isLoading ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Chargement...</div>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Aucune commande trouvee</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Essayez de modifier vos filtres</div>
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                {showCreatedBy && <th style={thStyle}>Cree par</th>}
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Enlevement</th>
                <th style={thStyle}>Date enl.</th>
                <th style={thStyle}>Livraison</th>
                <th style={thStyle}>Date liv.</th>
                <th style={thStyle}>Marchandises</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Documents</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <tr
                    key={order.id}
                    onClick={() => onOrderClick(order.id)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      backgroundColor: selectedOrders.includes(order.id) ? '#f0f4ff' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedOrders.includes(order.id)) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedOrders.includes(order.id)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <td style={{ ...tdStyle, textAlign: 'center', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onClick={(e) => toggleSelectOrder(order.id, e)}
                        onChange={() => {}}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>

                    {showCreatedBy && (
                      <td style={tdStyle}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                          {order.carrierName || order.industrialName || order.supplierName || 'Non assigne'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#667eea', fontWeight: '500' }}>
                          {order.reference}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {order.createdAt ? formatDate(order.createdAt) : '-'}
                        </div>
                      </td>
                    )}

                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: statusInfo.bgColor,
                          color: statusInfo.color,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                        {order.pickupAddress?.city || '-'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.pickupAddress?.street || ''}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {order.pickupAddress?.postalCode || ''}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      {order.dates?.pickupDate ? (
                        <>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {formatDate(order.dates.pickupDate)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {formatTime(order.dates.pickupDate)}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                        {order.deliveryAddress?.city || '-'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.deliveryAddress?.street || ''}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {order.deliveryAddress?.postalCode || ''}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      {order.dates?.deliveryDate ? (
                        <>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {formatDate(order.dates.deliveryDate)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {formatTime(order.dates.deliveryDate)}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                        {order.goods?.palettes || 0} pal.
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {order.goods?.weight || 0} kg
                      </div>
                      {order.goods?.volume && (
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {order.goods.volume} m3
                        </div>
                      )}
                    </td>

                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewDocuments) {
                            onViewDocuments(order.id);
                          } else {
                            onOrderClick(order.id);
                          }
                        }}
                        style={{
                          padding: '6px 16px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }}
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ ...cardStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
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
            Precedent
          </button>

          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  style={{
                    ...buttonStyle,
                    padding: '10px 14px',
                    backgroundColor: pageNum === page ? '#667eea' : 'white',
                    color: pageNum === page ? 'white' : '#374151',
                    border: pageNum === page ? 'none' : '1px solid #e5e7eb',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
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
