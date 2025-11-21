import { useState, useEffect } from 'react'
import { storageAdminApi, type StorageStats } from '@/lib/api/storage'

export default function StorageMarketAdminDashboard() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await storageAdminApi.getStats()
        setStats(data)
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des statistiques...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erreur: {error || 'Impossible de charger les statistiques'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Dashboard Bourse de Stockage</h1>
      <p className="text-gray-600 mb-6">Vue d'ensemble et gestion du marché</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Besoins publiés</div>
          <div className="text-3xl font-bold">{stats.totalNeeds}</div>
          <div className="text-sm text-gray-600 mt-1">
            {Object.entries(stats.needsByStatus).map(([status, count]) => (
              <span key={status} className="mr-2">{status}: {count}</span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Offres soumises</div>
          <div className="text-3xl font-bold">{stats.totalOffers}</div>
          <div className="text-sm text-gray-600 mt-1">
            Moyenne: {stats.averageOffersPerNeed.toFixed(1)}/besoin
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Contrats actifs</div>
          <div className="text-3xl font-bold">{stats.activeContracts}/{stats.totalContracts}</div>
          <div className="text-sm text-gray-600 mt-1">
            Taux: {stats.totalNeeds > 0 ? ((stats.totalContracts / stats.totalNeeds) * 100).toFixed(0) : 0}%
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Sites logistiques</div>
          <div className="text-3xl font-bold">{stats.totalSites}</div>
          <div className="text-sm text-gray-600 mt-1">Capacités disponibles</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Répartition par type de stockage</h3>
          <div className="space-y-3">
            {[
              { type: 'Long terme', count: 6, percent: 40 },
              { type: 'Temporaire', count: 4, percent: 27 },
              { type: 'Picking', count: 3, percent: 20 },
              { type: 'Cross-dock', count: 2, percent: 13 }
            ].map((item) => (
              <div key={item.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.type}</span>
                  <span className="text-gray-600">{item.count} contrats</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Top régions actives</h3>
          <div className="space-y-3">
            {[
              { region: 'Île-de-France', count: 5 },
              { region: 'Auvergne-Rhône-Alpes', count: 3 },
              { region: 'Hauts-de-France', count: 2 },
              { region: 'Provence-Alpes-Côte d\'Azur', count: 2 }
            ].map((item) => (
              <div key={item.region} className="flex justify-between items-center">
                <span>{item.region}</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <a href="/storage-market/needs" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="font-semibold mb-2">Gérer les besoins</h3>
          <p className="text-sm text-gray-600">Superviser toutes les publications</p>
        </a>
        <a href="/storage-market/logisticians" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="font-semibold mb-2">Gérer les logisticiens</h3>
          <p className="text-sm text-gray-600">Valider les abonnements</p>
        </a>
        <a href="/storage-market/analytics" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="font-semibold mb-2">Analytics avancés</h3>
          <p className="text-sm text-gray-600">Rapports et statistiques</p>
        </a>
      </div>
    </div>
  )
}
