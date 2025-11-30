import React, { useState } from 'react';
import { Send, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export type ERPSystem = 'sap' | 'oracle' | 'sage_x3' | 'divalto' | 'dynamics_365' | 'odoo' | 'generic_api';

export interface ERPConfig {
  system: ERPSystem;
  endpoint?: string;
  apiKey?: string;
  companyCode?: string;
  costCenter?: string;
}

interface ERPExportFormProps {
  prefacturationId: string;
  onExport: (prefacturationId: string, config: ERPConfig) => Promise<void>;
  initialConfig?: Partial<ERPConfig>;
  disabled?: boolean;
}

const erpSystems: { value: ERPSystem; label: string; description: string }[] = [
  { value: 'sap', label: 'SAP', description: 'SAP S/4HANA, ECC via IDoc/BAPI' },
  { value: 'oracle', label: 'Oracle', description: 'Oracle EBS, Cloud ERP' },
  { value: 'sage_x3', label: 'Sage X3', description: 'Sage X3 / Enterprise' },
  { value: 'divalto', label: 'Divalto', description: 'Divalto Infinity' },
  { value: 'dynamics_365', label: 'Microsoft Dynamics 365', description: 'D365 Finance & Operations' },
  { value: 'odoo', label: 'Odoo', description: 'Odoo ERP via JSON-RPC' },
  { value: 'generic_api', label: 'API Générique', description: 'REST API JSON/XML' },
];

export const ERPExportForm: React.FC<ERPExportFormProps> = ({
  prefacturationId,
  onExport,
  initialConfig,
  disabled = false,
}) => {
  const [config, setConfig] = useState<ERPConfig>({
    system: initialConfig?.system || 'generic_api',
    endpoint: initialConfig?.endpoint || '',
    apiKey: initialConfig?.apiKey || '',
    companyCode: initialConfig?.companyCode || '',
    costCenter: initialConfig?.costCenter || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await onExport(prefacturationId, config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  const selectedErp = erpSystems.find(e => e.value === config.system);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ERP System Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Système ERP
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {erpSystems.map((erp) => (
            <button
              key={erp.value}
              type="button"
              onClick={() => setConfig({ ...config, system: erp.value })}
              className={`p-3 rounded-lg border text-left transition-colors ${
                config.system === erp.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled={disabled}
            >
              <p className="font-medium text-sm">{erp.label}</p>
              <p className="text-xs text-gray-500 mt-1">{erp.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Fields */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Configuration {selectedErp?.label}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint URL
            </label>
            <input
              type="url"
              value={config.endpoint}
              onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              placeholder="https://erp.example.com/api/invoices"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              disabled={disabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              Laissez vide pour générer les données sans envoi
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clé API
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="••••••••"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              disabled={disabled}
            />
          </div>

          {(config.system === 'sap' || config.system === 'oracle' || config.system === 'dynamics_365') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code Société
                </label>
                <input
                  type="text"
                  value={config.companyCode}
                  onChange={(e) => setConfig({ ...config, companyCode: e.target.value })}
                  placeholder="1000"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Centre de coûts
                </label>
                <input
                  type="text"
                  value={config.costCenter}
                  onChange={(e) => setConfig({ ...config, costCenter: e.target.value })}
                  placeholder="TRANS001"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  disabled={disabled}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">Export réussi vers {selectedErp?.label}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled || loading}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white transition-colors ${
            disabled || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Exporter vers {selectedErp?.label}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ERPExportForm;
