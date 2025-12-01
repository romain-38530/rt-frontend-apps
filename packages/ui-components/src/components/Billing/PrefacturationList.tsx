/**
 * PrefacturationList - Liste des préfactures avec statuts
 * Module Préfacturation & Facturation Transport
 */

import React, { useState, useMemo } from 'react';

export interface PrefacturationLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  hasDiscrepancy?: boolean;
  discrepancyAmount?: number;
}

export interface Prefacturation {
  id: string;
  orderRef: string;
  carrierName: string;
  carrierId: string;
  date: Date;
  dueDate: Date;
  status: 'draft' | 'pending_validation' | 'validated' | 'disputed' | 'invoiced' | 'paid';
  lines: PrefacturationLine[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  carrierInvoiceRef?: string;
  carrierInvoiceAmount?: number;
  discrepancyDetected: boolean;
  discrepancyAmount?: number;
  blockings: string[];
  createdAt: Date;
  validatedAt?: Date;
}

export interface PrefacturationListProps {
  prefacturations: Prefacturation[];
  onSelect?: (prefacturation: Prefacturation) => void;
  onValidate?: (id: string) => void;
  onDispute?: (id: string, reason: string) => void;
  onExport?: (ids: string[]) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  showFilters?: boolean;
}

const statusConfig: Record<Prefacturation['status'], { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Brouillon', color: '#6B7280', bgColor: '#F3F4F6' },
  pending_validation: { label: 'En attente', color: '#F59E0B', bgColor: '#FEF3C7' },
  validated: { label: 'Validée', color: '#10B981', bgColor: '#D1FAE5' },
  disputed: { label: 'Contestée', color: '#EF4444', bgColor: '#FEE2E2' },
  invoiced: { label: 'Facturée', color: '#3B82F6', bgColor: '#DBEAFE' },
  paid: { label: 'Payée', color: '#8B5CF6', bgColor: '#EDE9FE' },
};

export const PrefacturationList: React.FC<PrefacturationListProps> = ({
  prefacturations,
  onSelect,
  onValidate,
  onDispute,
  onExport,
  selectedIds = [],
  onSelectionChange,
  showFilters = true,
}) => {
  const [statusFilter, setStatusFilter] = useState<Prefacturation['status'] | 'all'>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [discrepancyFilter, setDiscrepancyFilter] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'date' | 'totalTTC' | 'carrier'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const carriers = useMemo(() => {
    const unique = new Set(prefacturations.map(p => p.carrierName));
    return Array.from(unique).sort();
  }, [prefacturations]);

  const filteredPrefacturations = useMemo(() => {
    return prefacturations
      .filter(p => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (carrierFilter !== 'all' && p.carrierName !== carrierFilter) return false;
        if (discrepancyFilter !== null && p.discrepancyDetected !== discrepancyFilter) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            p.orderRef.toLowerCase().includes(query) ||
            p.carrierName.toLowerCase().includes(query) ||
            p.id.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'totalTTC':
            comparison = a.totalTTC - b.totalTTC;
            break;
          case 'carrier':
            comparison = a.carrierName.localeCompare(b.carrierName);
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [prefacturations, statusFilter, carrierFilter, discrepancyFilter, searchQuery, sortField, sortOrder]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPrefacturations.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(filteredPrefacturations.map(p => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
  };

  const totals = useMemo(() => {
    const selected = filteredPrefacturations.filter(p => selectedIds.includes(p.id));
    return {
      count: selected.length,
      totalHT: selected.reduce((sum, p) => sum + p.totalHT, 0),
      totalTTC: selected.reduce((sum, p) => sum + p.totalTTC, 0),
    };
  }, [filteredPrefacturations, selectedIds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filters */}
      {showFilters && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px',
          background: '#F9FAFB',
          borderRadius: '8px',
        }}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              minWidth: '200px',
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Prefacturation['status'] | 'all')}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              background: 'white',
            }}
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              background: 'white',
            }}
          >
            <option value="all">Tous les transporteurs</option>
            {carriers.map(carrier => (
              <option key={carrier} value={carrier}>{carrier}</option>
            ))}
          </select>

          <select
            value={discrepancyFilter === null ? 'all' : discrepancyFilter.toString()}
            onChange={(e) => setDiscrepancyFilter(
              e.target.value === 'all' ? null : e.target.value === 'true'
            )}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              background: 'white',
            }}
          >
            <option value="all">Écarts: tous</option>
            <option value="true">Avec écarts</option>
            <option value="false">Sans écarts</option>
          </select>
        </div>
      )}

      {/* Actions bar */}
      {selectedIds.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#EEF2FF',
          borderRadius: '8px',
        }}>
          <span style={{ fontWeight: 500 }}>
            {totals.count} sélectionnée(s) - Total HT: {formatCurrency(totals.totalHT)} - Total TTC: {formatCurrency(totals.totalTTC)}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onExport?.(selectedIds)}
              style={{
                padding: '8px 16px',
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Exporter
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredPrefacturations.length && filteredPrefacturations.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th
                style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #E5E7EB', cursor: 'pointer' }}
                onClick={() => { setSortField('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
              >
                Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>
                Référence
              </th>
              <th
                style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #E5E7EB', cursor: 'pointer' }}
                onClick={() => { setSortField('carrier'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
              >
                Transporteur {sortField === 'carrier' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #E5E7EB', cursor: 'pointer' }}
                onClick={() => { setSortField('totalTTC'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
              >
                Montant TTC {sortField === 'totalTTC' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #E5E7EB' }}>
                Écart
              </th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #E5E7EB' }}>
                Blocages
              </th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #E5E7EB' }}>
                Statut
              </th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #E5E7EB' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPrefacturations.map((prefacturation) => {
              const status = statusConfig[prefacturation.status];
              return (
                <tr
                  key={prefacturation.id}
                  style={{
                    cursor: 'pointer',
                    background: selectedIds.includes(prefacturation.id) ? '#EEF2FF' : 'transparent',
                  }}
                  onClick={() => onSelect?.(prefacturation)}
                >
                  <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(prefacturation.id)}
                      onChange={(e) => { e.stopPropagation(); handleToggleSelect(prefacturation.id); }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                    {formatDate(prefacturation.date)}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', fontWeight: 500 }}>
                    {prefacturation.orderRef}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                    {prefacturation.carrierName}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'right', fontWeight: 500 }}>
                    {formatCurrency(prefacturation.totalTTC)}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'center' }}>
                    {prefacturation.discrepancyDetected ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}>
                        ⚠️ {formatCurrency(prefacturation.discrepancyAmount || 0)}
                      </span>
                    ) : (
                      <span style={{ color: '#10B981' }}>✓</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'center' }}>
                    {prefacturation.blockings.length > 0 ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        background: '#FEF3C7',
                        color: '#D97706',
                        borderRadius: '50%',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {prefacturation.blockings.length}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      background: status.bgColor,
                      color: status.color,
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      {prefacturation.status === 'pending_validation' && (
                        <>
                          <button
                            onClick={() => onValidate?.(prefacturation.id)}
                            style={{
                              padding: '4px 8px',
                              background: '#10B981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => onDispute?.(prefacturation.id, '')}
                            style={{
                              padding: '4px 8px',
                              background: '#EF4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            Contester
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredPrefacturations.length === 0 && (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          color: '#6B7280',
        }}>
          Aucune préfacturation trouvée
        </div>
      )}

      {/* Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px',
        background: '#F9FAFB',
        borderRadius: '8px',
        fontWeight: 500,
      }}>
        <span>{filteredPrefacturations.length} préfacturation(s)</span>
        <span>
          Total: {formatCurrency(filteredPrefacturations.reduce((sum, p) => sum + p.totalTTC, 0))}
        </span>
      </div>
    </div>
  );
};

export default PrefacturationList;
