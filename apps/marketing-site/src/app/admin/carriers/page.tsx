'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
interface Carrier {
  _id: string;
  email: string;
  companyName: string;
  siret: string;
  vatNumber: string;
  phone: string;
  address: string;
  status: 'guest' | 'referenced' | 'premium';
  vigilanceStatus: 'compliant' | 'warning' | 'blocked';
  score: number;
  isInDispatchChain: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  invitedAt: string;
  onboardedAt?: string;
}

// Configuration API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://d2i50a1vlg138w.cloudfront.net';

export default function CarriersAdminPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'guest' | 'referenced' | 'premium'>('all');
  const [vigilanceFilter, setVigilanceFilter] = useState<'all' | 'compliant' | 'warning' | 'blocked'>('all');

  // Fetch carriers
  useEffect(() => {
    fetchCarriers();
  }, [filter, vigilanceFilter]);

  const fetchCarriers = async () => {
    setLoading(true);
    setError('');

    try {
      let url = `${API_URL}/api/carriers`;
      const params = new URLSearchParams();

      if (filter !== 'all') params.append('status', filter);
      if (vigilanceFilter !== 'all') params.append('vigilanceStatus', vigilanceFilter);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCarriers(data.carriers);
      } else {
        setError('Erreur lors du chargement des transporteurs');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      guest: 'bg-gray-100 text-gray-800 border-gray-300',
      referenced: 'bg-blue-100 text-blue-800 border-blue-300',
      premium: 'bg-purple-100 text-purple-800 border-purple-300'
    };

    const labels = {
      guest: 'Niveau 2 - Invité',
      referenced: 'Niveau 1 - Référencé',
      premium: 'Niveau 1+ - Premium'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // Vigilance badge
  const getVigilanceBadge = (vigilanceStatus: string, isBlocked: boolean) => {
    if (isBlocked) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
          🚫 Bloqué
        </span>
      );
    }

    const badges = {
      compliant: 'bg-green-100 text-green-800 border-green-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      blocked: 'bg-red-100 text-red-800 border-red-300'
    };

    const labels = {
      compliant: '✅ Conforme',
      warning: '⚠️ Alerte',
      blocked: '🚫 Bloqué'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badges[vigilanceStatus as keyof typeof badges]}`}>
        {labels[vigilanceStatus as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Gestion des Transporteurs
              </h1>
              <p className="text-lg text-gray-600">
                Système de référencement SYMPHONI.A
              </p>
            </div>
            <Link
              href="/admin/carriers/invite"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              + Inviter un Transporteur
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filtrer par statut
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="all">Tous les statuts</option>
                <option value="guest">Niveau 2 - Invités</option>
                <option value="referenced">Niveau 1 - Référencés</option>
                <option value="premium">Niveau 1+ - Premium</option>
              </select>
            </div>

            {/* Vigilance Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filtrer par vigilance
              </label>
              <select
                value={vigilanceFilter}
                onChange={(e) => setVigilanceFilter(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="all">Toutes les vigilances</option>
                <option value="compliant">✅ Conformes</option>
                <option value="warning">⚠️ En alerte</option>
                <option value="blocked">🚫 Bloqués</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total</span>
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{carriers.length}</p>
            <p className="text-sm text-gray-500 mt-1">Transporteurs</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Invités</span>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-gray-600">
              {carriers.filter(c => c.status === 'guest').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Niveau 2</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Référencés</span>
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {carriers.filter(c => c.status === 'referenced').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Niveau 1</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Premium</span>
              <span className="text-3xl">⭐</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {carriers.filter(c => c.status === 'premium').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Niveau 1+</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        )}

        {/* Carriers Table */}
        {!loading && carriers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Entreprise
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Vigilance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {carriers.map((carrier) => (
                    <tr key={carrier._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{carrier.companyName}</p>
                          <p className="text-xs text-gray-500">SIRET: {carrier.siret}</p>
                          <p className="text-xs text-gray-500">TVA: {carrier.vatNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{carrier.email}</p>
                          <p className="text-xs text-gray-500">{carrier.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(carrier.status)}
                      </td>
                      <td className="px-6 py-4">
                        {getVigilanceBadge(carrier.vigilanceStatus, carrier.isBlocked)}
                        {carrier.isBlocked && carrier.blockedReason && (
                          <p className="text-xs text-red-600 mt-1">{carrier.blockedReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-gray-900">{carrier.score}</span>
                          <span className="text-sm text-gray-500 ml-2">pts</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/carriers/${carrier._id}`}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                        >
                          Voir détails →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No carriers */}
        {!loading && carriers.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <span className="text-6xl mb-4 block">📦</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucun transporteur trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez par inviter votre premier transporteur
            </p>
            <Link
              href="/admin/carriers/invite"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Inviter un transporteur
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
