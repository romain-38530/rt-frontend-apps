/**
 * ERPExportButton - Bouton d'export vers ERP
 * Module Préfacturation & Facturation Transport
 * Supporte: SAP, Oracle, Sage X3, Divalto, Dynamics 365, Odoo
 */

import React, { useState } from 'react';

export type ERPSystem = 'sap' | 'oracle' | 'sage_x3' | 'divalto' | 'dynamics365' | 'odoo' | 'csv' | 'xml';

export interface ERPExportConfig {
  system: ERPSystem;
  enabled: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  autoExport?: boolean;
}

export interface ExportResult {
  success: boolean;
  exportId?: string;
  message: string;
  invoiceCount: number;
  totalAmount: number;
  erpReference?: string;
  errors?: string[];
}

export interface ERPExportButtonProps {
  invoiceIds: string[];
  erpConfigs: ERPExportConfig[];
  onExport?: (system: ERPSystem, invoiceIds: string[]) => Promise<ExportResult>;
  onConfigureERP?: (system: ERPSystem) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'compact';
}

const erpInfo: Record<ERPSystem, { name: string; icon: string; color: string }> = {
  sap: { name: 'SAP', icon: '🔷', color: '#0FAAFF' },
  oracle: { name: 'Oracle', icon: '🔴', color: '#F80000' },
  sage_x3: { name: 'Sage X3', icon: '🟢', color: '#00D639' },
  divalto: { name: 'Divalto', icon: '🟣', color: '#6B21A8' },
  dynamics365: { name: 'Dynamics 365', icon: '🔵', color: '#002050' },
  odoo: { name: 'Odoo', icon: '🟠', color: '#714B67' },
  csv: { name: 'Export CSV', icon: '📊', color: '#059669' },
  xml: { name: 'Export XML', icon: '📄', color: '#0284C7' },
};

export const ERPExportButton: React.FC<ERPExportButtonProps> = ({
  invoiceIds,
  erpConfigs,
  onExport,
  onConfigureERP,
  disabled = false,
  variant = 'primary',
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [exporting, setExporting] = useState<ERPSystem | null>(null);
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const enabledConfigs = erpConfigs.filter(c => c.enabled);
  const connectedConfigs = enabledConfigs.filter(c => c.connectionStatus === 'connected');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handleExport = async (system: ERPSystem) => {
    if (!onExport || invoiceIds.length === 0) return;

    setExporting(system);
    setShowDropdown(false);

    try {
      const result = await onExport(system, invoiceIds);
      setLastResult(result);
      setShowResult(true);
    } catch (error) {
      setLastResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'export',
        invoiceCount: 0,
        totalAmount: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
      });
      setShowResult(true);
    } finally {
      setExporting(null);
    }
  };

  const getStatusIcon = (status: ERPExportConfig['connectionStatus']) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'disconnected': return '⚪';
      case 'error': return '🔴';
    }
  };

  if (variant === 'compact') {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled || invoiceIds.length === 0}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: disabled || invoiceIds.length === 0 ? '#E5E7EB' : '#4F46E5',
            color: disabled || invoiceIds.length === 0 ? '#9CA3AF' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: disabled || invoiceIds.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          📤 Export ERP
          <span style={{ fontSize: '10px' }}>▼</span>
        </button>

        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #E5E7EB',
            minWidth: '180px',
            zIndex: 100,
          }}>
            {connectedConfigs.map((config) => {
              const info = erpInfo[config.system];
              return (
                <button
                  key={config.system}
                  onClick={() => handleExport(config.system)}
                  disabled={exporting !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: exporting ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                  }}
                >
                  <span>{info.icon}</span>
                  {info.name}
                  {exporting === config.system && <span style={{ marginLeft: 'auto' }}>⏳</span>}
                </button>
              );
            })}
            {connectedConfigs.length === 0 && (
              <div style={{ padding: '12px', color: '#6B7280', fontSize: '13px' }}>
                Aucun ERP configuré
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Main button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px',
        background: '#F9FAFB',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Export vers ERP
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6B7280' }}>
            {invoiceIds.length} facture{invoiceIds.length > 1 ? 's' : ''} sélectionnée{invoiceIds.length > 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {connectedConfigs.slice(0, 3).map((config) => {
            const info = erpInfo[config.system];
            return (
              <button
                key={config.system}
                onClick={() => handleExport(config.system)}
                disabled={disabled || invoiceIds.length === 0 || exporting !== null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: exporting === config.system ? '#E5E7EB' : info.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: disabled || invoiceIds.length === 0 || exporting !== null ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
              >
                {exporting === config.system ? '⏳' : info.icon} {info.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ERP Status grid */}
      {variant === 'primary' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
        }}>
          {erpConfigs.map((config) => {
            const info = erpInfo[config.system];
            return (
              <div
                key={config.system}
                style={{
                  padding: '16px',
                  background: 'white',
                  borderRadius: '8px',
                  border: `1px solid ${config.enabled ? '#E5E7EB' : '#F3F4F6'}`,
                  opacity: config.enabled ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{info.icon}</span>
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>{info.name}</span>
                  </div>
                  {getStatusIcon(config.connectionStatus)}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  {config.connectionStatus === 'connected' ? (
                    <>Connecté{config.lastSync && ` • Sync: ${new Date(config.lastSync).toLocaleDateString('fr-FR')}`}</>
                  ) : config.connectionStatus === 'error' ? (
                    'Erreur de connexion'
                  ) : (
                    'Non connecté'
                  )}
                </div>
                {onConfigureERP && (
                  <button
                    onClick={() => onConfigureERP(config.system)}
                    style={{
                      marginTop: '8px',
                      padding: '4px 8px',
                      background: 'transparent',
                      color: '#4F46E5',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Configurer
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Result modal */}
      {showResult && lastResult && (
        <div style={{
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
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '48px' }}>
                {lastResult.success ? '✅' : '❌'}
              </span>
              <h3 style={{ margin: '16px 0 8px', fontSize: '18px', fontWeight: 600 }}>
                {lastResult.success ? 'Export réussi' : 'Échec de l\'export'}
              </h3>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
                {lastResult.message}
              </p>
            </div>

            {lastResult.success && (
              <div style={{
                padding: '16px',
                background: '#F9FAFB',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6B7280' }}>Factures exportées:</span>
                  <span style={{ fontWeight: 500 }}>{lastResult.invoiceCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6B7280' }}>Montant total:</span>
                  <span style={{ fontWeight: 500 }}>{formatCurrency(lastResult.totalAmount)}</span>
                </div>
                {lastResult.erpReference && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280' }}>Réf. ERP:</span>
                    <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{lastResult.erpReference}</span>
                  </div>
                )}
              </div>
            )}

            {lastResult.errors && lastResult.errors.length > 0 && (
              <div style={{
                padding: '12px',
                background: '#FEE2E2',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                {lastResult.errors.map((error, i) => (
                  <p key={i} style={{ margin: i > 0 ? '8px 0 0' : 0, fontSize: '13px', color: '#DC2626' }}>
                    • {error}
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowResult(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ERPExportButton;
