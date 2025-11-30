import React from 'react';
import { Leaf, TrendingDown, Truck, Clock, FileCheck, Shield } from 'lucide-react';
import type { RSEKPIs } from '../../services/kpi-api';

export interface RSEMetricsProps {
  data: RSEKPIs;
  loading?: boolean;
}

export const RSEMetrics: React.FC<RSEMetricsProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalHoursSaved =
    (data.operationalGains?.planningHoursSaved || 0) +
    (data.operationalGains?.freightHoursSaved || 0) +
    (data.operationalGains?.trackingHoursSaved || 0) +
    (data.operationalGains?.followUpHoursSaved || 0);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Performance RSE & Environnement</h3>
        </div>
      </div>

      <div className="p-4">
        {/* Carbon Footprint */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Empreinte Carbone</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{data.carbonFootprint?.totalCO2 || 0}</p>
              <p className="text-xs text-gray-500">kg CO2 total</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{data.carbonFootprint?.co2PerTrip || 0}</p>
              <p className="text-xs text-gray-500">kg CO2/trajet</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{data.carbonFootprint?.co2PerKm || 0}</p>
              <p className="text-xs text-gray-500">kg CO2/km</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center text-green-600 mb-1">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span className="text-2xl font-bold">-{data.optimization?.co2Reduction || 0}%</span>
              </div>
              <p className="text-xs text-gray-500">Reduction CO2</p>
            </div>
          </div>

          {/* Vehicle Type Breakdown */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Par type de vehicule</p>
            <div className="flex gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-500 mr-2" />
                <span className="text-xs text-gray-600">Camion: {data.carbonFootprint?.byVehicleType?.truck || 0} kg</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <span className="text-xs text-gray-600">Van: {data.carbonFootprint?.byVehicleType?.van || 0} kg</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                <span className="text-xs text-gray-600">Electrique: {data.carbonFootprint?.byVehicleType?.electric || 0} kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Optimisations SYMPHONI.A</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <Truck className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-xl font-bold text-gray-900">{data.optimization?.truckFillRate || 0}%</p>
              <p className="text-xs text-gray-500">Taux remplissage</p>
            </div>
            <div className="border rounded-lg p-4">
              <TrendingDown className="w-5 h-5 text-green-600 mb-2" />
              <p className="text-xl font-bold text-gray-900">{data.optimization?.kmAvoided?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-500">km evites</p>
            </div>
            <div className="border rounded-lg p-4">
              <Truck className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-xl font-bold text-gray-900">-{data.optimization?.emptyKmReduction || 0}%</p>
              <p className="text-xs text-gray-500">km a vide reduits</p>
            </div>
            <div className="border rounded-lg p-4 bg-green-50">
              <Clock className="w-5 h-5 text-green-600 mb-2" />
              <p className="text-xl font-bold text-green-700">{totalHoursSaved}h</p>
              <p className="text-xs text-gray-500">economisees</p>
            </div>
          </div>
        </div>

        {/* Hours Saved Breakdown */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Heures economisees par activite</h4>
          <div className="space-y-2">
            {[
              { label: 'Planning', value: data.operationalGains?.planningHoursSaved || 0, color: 'bg-blue-500' },
              { label: 'Affretement', value: data.operationalGains?.freightHoursSaved || 0, color: 'bg-purple-500' },
              { label: 'Suivi tracking', value: data.operationalGains?.trackingHoursSaved || 0, color: 'bg-green-500' },
              { label: 'Relances', value: data.operationalGains?.followUpHoursSaved || 0, color: 'bg-orange-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center">
                <span className="text-sm text-gray-600 w-28">{item.label}</span>
                <div className="flex-1 mx-3">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${(item.value / totalHoursSaved) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">{item.value}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Conformite</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#10b981"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(parseFloat(data.compliance?.regulatoryCompliance || '0') / 100) * 175.9} 175.9`}
                  />
                </svg>
                <span className="absolute text-sm font-bold text-gray-900">
                  {parseFloat(data.compliance?.regulatoryCompliance || '0').toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Reglementaire</p>
            </div>
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(parseFloat(data.compliance?.documentCompliance || '0') / 100) * 175.9} 175.9`}
                  />
                </svg>
                <span className="absolute text-sm font-bold text-gray-900">
                  {parseFloat(data.compliance?.documentCompliance || '0').toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Documentaire</p>
            </div>
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#8b5cf6"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(parseFloat(data.compliance?.safetyCompliance || '0') / 100) * 175.9} 175.9`}
                  />
                </svg>
                <span className="absolute text-sm font-bold text-gray-900">
                  {parseFloat(data.compliance?.safetyCompliance || '0').toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Securite</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSEMetrics;
