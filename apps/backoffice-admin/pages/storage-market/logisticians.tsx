import { useState, useEffect } from 'react'
import { storageAdminApi, type LogisticianSubscription } from '@/lib/api/storage'
import { useToast } from '@rt/ui-components'

export default function LogisticiansManagementPage() {
  const { toast } = useToast()
  const [logisticians, setLogisticians] = useState<LogisticianSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogisticians = async () => {
      try {
        setLoading(true)
        const data = await storageAdminApi.getLogisticians()
        setLogisticians(data)
      } catch (err) {
        console.error('Error fetching logisticians:', err)
        setError(err instanceof Error ? err.message : 'Failed to load logisticians')
      } finally {
        setLoading(false)
      }
    }

    fetchLogisticians()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await storageAdminApi.approveLogistician(id)
      setLogisticians(prev => prev.map(l => l.id === id ? { ...l, status: 'APPROVED' as const, approvedAt: new Date().toISOString() } : l))
    } catch (err) {
      console.error('Error approving logistician:', err)
      toast.error('Erreur lors de l\'approbation')
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Raison du rejet:')
    if (!reason) return

    try {
      await storageAdminApi.rejectLogistician(id, reason)
      setLogisticians(prev => prev.map(l => l.id === id ? { ...l, status: 'REJECTED' as const } : l))
    } catch (err) {
      console.error('Error rejecting logistician:', err)
      toast.error('Erreur lors du rejet')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des logisticiens...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Gestion des Logisticiens</h1>
      <p className="text-gray-600 mb-6">Validation des abonnements et supervision</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Erreur: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total logisticiens</div>
          <div className="text-3xl font-bold">{logisticians.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Approuvés</div>
          <div className="text-3xl font-bold text-green-600">
            {logisticians.filter(l => l.status === 'APPROVED').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">En attente</div>
          <div className="text-3xl font-bold text-orange-600">
            {logisticians.filter(l => l.status === 'PENDING').length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Nom</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Sites</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Contrats actifs</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date inscription</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logisticians.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  Aucun logisticien enregistré
                </td>
              </tr>
            ) : (
              logisticians.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 font-medium">{log.id}</td>
                  <td className="px-6 py-4">-</td>
                  <td className="px-6 py-4 text-sm text-gray-600">-</td>
                  <td className="px-6 py-4">-</td>
                  <td className="px-6 py-4">-</td>
                  <td className="px-6 py-4 text-sm">{new Date(log.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-sm ${
                      log.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      log.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                      log.status === 'SUSPENDED' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.status === 'APPROVED' ? 'Approuvé' :
                       log.status === 'PENDING' ? 'En attente' :
                       log.status === 'SUSPENDED' ? 'Suspendu' : 'Rejeté'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(log.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleReject(log.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                    {log.status === 'APPROVED' && log.approvedAt && (
                      <span className="text-sm text-gray-600">
                        Approuvé le {new Date(log.approvedAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
