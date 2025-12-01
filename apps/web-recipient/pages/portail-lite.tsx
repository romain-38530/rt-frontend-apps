/**
 * Portail Lite Destinataire - Version gratuite
 * SYMPHONI.A - Espace Destinataire simplifie
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';

// Types
interface Delivery {
  id: string;
  reference: string;
  sender: string;
  expectedDate: string;
  expectedTime: string;
  status: 'scheduled' | 'in_transit' | 'arriving' | 'delivered';
  eta?: string;
  driver?: string;
}

interface Slot {
  id: string;
  date: string;
  time: string;
  dock: string;
  available: boolean;
}

interface Stats {
  incomingToday: number;
  inTransit: number;
  deliveredThisWeek: number;
}

// Mock data
const mockDeliveries: Delivery[] = [
  { id: '1', reference: 'LIV-2024-001', sender: 'Fournisseur ABC', expectedDate: '2024-12-01', expectedTime: '10:00-12:00', status: 'arriving', eta: '15 min', driver: 'Jean Dupont' },
  { id: '2', reference: 'LIV-2024-002', sender: 'Usine XYZ', expectedDate: '2024-12-01', expectedTime: '14:00-16:00', status: 'in_transit', eta: '2h30' },
  { id: '3', reference: 'LIV-2024-003', sender: 'Entrepot Central', expectedDate: '2024-12-02', expectedTime: '08:00-09:00', status: 'scheduled' },
  { id: '4', reference: 'LIV-2024-004', sender: 'Logistique Pro', expectedDate: '2024-11-30', expectedTime: '16:00-17:00', status: 'delivered' },
];

const mockSlots: Slot[] = [
  { id: '1', date: '2024-12-02', time: '08:00 - 09:00', dock: 'Quai Reception 1', available: true },
  { id: '2', date: '2024-12-02', time: '09:00 - 10:00', dock: 'Quai Reception 2', available: true },
  { id: '3', date: '2024-12-02', time: '10:00 - 11:00', dock: 'Quai Reception 1', available: false },
  { id: '4', date: '2024-12-02', time: '14:00 - 15:00', dock: 'Quai Reception 3', available: true },
];

const faqs = [
  { q: 'Comment suivre ma livraison en temps reel?', a: 'Les livraisons en cours affichent l\'ETA estim\u00e9e. Pour le tracking GPS, passez a Premium.' },
  { q: 'Comment confirmer la reception?', a: 'Cliquez sur "Signer" a cote de la livraison pour confirmer la reception.' },
  { q: 'Comment signaler un probleme?', a: 'Utilisez le formulaire dans l\'onglet "Support" ou passez a Premium pour la gestion des incidents.' },
  { q: 'Comment gerer plusieurs sites?', a: 'La gestion multi-sites est disponible dans l\'offre Premium.' },
];

export default function PortailLiteDestinataire() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'deliveries' | 'slots' | 'support'>('dashboard');
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries);
  const [slots] = useState<Slot[]>(mockSlots);
  const [stats] = useState<Stats>({
    incomingToday: 2,
    inTransit: 1,
    deliveredThisWeek: 12
  });
  const [filter, setFilter] = useState<string>('all');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState<string | null>(null);

  const filteredDeliveries = deliveries.filter(d => filter === 'all' || d.status === filter);

  const signDelivery = (deliveryId: string) => {
    setDeliveries(deliveries.map(d =>
      d.id === deliveryId ? { ...d, status: 'delivered' as const } : d
    ));
    setShowSignModal(null);
  };

  const confirmSlot = (slotId: string) => {
    alert(`Disponibilite confirmee pour le creneau ${slotId}`);
  };

  const showUpgrade = () => setShowUpgradeModal(true);

  return (
    <>
      <Head>
        <title>Portail Destinataire Lite | SYMPHONI.A</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-green-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold">SYMPHONI.A</h1>
                <p className="text-green-200 text-sm">Portail Destinataire - Version Lite</p>
              </div>
              <button
                onClick={showUpgrade}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold text-sm"
              >
                Passer a Premium
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-4">
              {[
                { id: 'dashboard', label: 'Tableau de bord' },
                { id: 'deliveries', label: 'Livraisons' },
                { id: 'slots', label: 'Creneaux' },
                { id: 'support', label: 'Support' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-3 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl font-bold text-blue-600">{stats.incomingToday}</div>
                  <div className="text-gray-600 mt-1">Livraisons aujourd'hui</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl font-bold text-orange-600">{stats.inTransit}</div>
                  <div className="text-gray-600 mt-1">En transit</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl font-bold text-green-600">{stats.deliveredThisWeek}</div>
                  <div className="text-gray-600 mt-1">Recues cette semaine</div>
                </div>
              </div>

              {/* Arriving Soon Alert */}
              {deliveries.filter(d => d.status === 'arriving').map(delivery => (
                <div key={delivery.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-blue-800">Livraison imminente!</h3>
                      <p className="text-blue-700">{delivery.reference} - {delivery.sender}</p>
                      <p className="text-blue-600 text-sm">Chauffeur: {delivery.driver} - ETA: {delivery.eta}</p>
                    </div>
                    <div className="text-blue-600 text-2xl font-bold">{delivery.eta}</div>
                  </div>
                </div>
              ))}

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('deliveries')}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Voir les livraisons
                  </button>
                  <button
                    onClick={() => setActiveTab('slots')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Gerer mes creneaux
                  </button>
                </div>
              </div>

              {/* Limitations Banner */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800">Version Lite - Limitations</h3>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>- Maximum 100 livraisons/mois</li>
                  <li>- Pas de tracking GPS temps reel</li>
                  <li>- Pas de gestion des incidents</li>
                  <li>- Un seul site de livraison</li>
                  <li>- Pas d'analytics avances</li>
                </ul>
                <button
                  onClick={showUpgrade}
                  className="mt-3 text-yellow-800 font-semibold underline"
                >
                  Passer a Premium pour tout debloquer
                </button>
              </div>
            </div>
          )}

          {/* Deliveries Tab */}
          {activeTab === 'deliveries' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-wrap gap-2">
                  {['all', 'scheduled', 'in_transit', 'arriving', 'delivered'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded text-sm ${
                        filter === f
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {f === 'all' ? 'Toutes' : f === 'scheduled' ? 'Planifiees' : f === 'in_transit' ? 'En transit' : f === 'arriving' ? 'Arrivee imminente' : 'Livrees'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deliveries List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Reference</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Expediteur</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date/Heure</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Statut</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredDeliveries.map(delivery => (
                      <tr key={delivery.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{delivery.reference}</td>
                        <td className="px-4 py-3 text-gray-600">{delivery.sender}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {delivery.expectedDate}<br />
                          <span className="text-sm text-gray-500">{delivery.expectedTime}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            delivery.status === 'scheduled' ? 'bg-gray-100 text-gray-700' :
                            delivery.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                            delivery.status === 'arriving' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {delivery.status === 'scheduled' ? 'Planifiee' : delivery.status === 'in_transit' ? 'En transit' : delivery.status === 'arriving' ? 'Imminente' : 'Livree'}
                          </span>
                          {delivery.eta && delivery.status !== 'delivered' && (
                            <div className="text-xs text-gray-500 mt-1">ETA: {delivery.eta}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {delivery.status === 'arriving' && (
                            <button
                              onClick={() => setShowSignModal(delivery.id)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              Signer
                            </button>
                          )}
                          {delivery.status === 'in_transit' && (
                            <button
                              onClick={showUpgrade}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Tracking GPS (Premium)
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Slots Tab */}
          {activeTab === 'slots' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Confirmer vos disponibilites</h2>
                <p className="text-gray-600 mb-4">Indiquez vos creneaux de reception disponibles</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {slots.map(slot => (
                    <div
                      key={slot.id}
                      className={`border rounded-lg p-4 ${
                        slot.available ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="font-medium">{slot.date}</div>
                      <div className="text-gray-600">{slot.time}</div>
                      <div className="text-sm text-gray-500">{slot.dock}</div>
                      <button
                        onClick={() => confirmSlot(slot.id)}
                        className={`mt-3 w-full py-1 rounded text-sm ${
                          slot.available
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {slot.available ? 'Confirmer dispo' : 'Marquer dispo'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scheduled Deliveries */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Livraisons programmees</h2>
                <div className="space-y-2">
                  {deliveries.filter(d => d.status === 'scheduled').map(delivery => (
                    <div key={delivery.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{delivery.reference}</span>
                        <span className="text-gray-500 ml-2">{delivery.sender}</span>
                      </div>
                      <div className="text-gray-600">
                        {delivery.expectedDate} {delivery.expectedTime}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Support Tab */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              {/* FAQ */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Questions frequentes</h2>
                <div className="space-y-4">
                  {faqs.map((faq, i) => (
                    <div key={i} className="border-b pb-4">
                      <h3 className="font-medium text-gray-900">{faq.q}</h3>
                      <p className="text-gray-600 mt-1">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Issue */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Signaler un probleme</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de probleme</label>
                    <select className="w-full border rounded px-3 py-2">
                      <option>Livraison en retard</option>
                      <option>Colis endommage</option>
                      <option>Colis manquant</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea className="w-full border rounded px-3 py-2 h-32" placeholder="Decrivez le probleme..." />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                      Envoyer
                    </button>
                    <button
                      type="button"
                      onClick={showUpgrade}
                      className="border border-green-600 text-green-600 px-6 py-2 rounded hover:bg-green-50"
                    >
                      Gestion incidents (Premium)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>

        {/* Signature Modal */}
        {showSignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
              <h2 className="text-xl font-bold mb-4">Signer la reception</h2>
              <p className="text-gray-600 mb-4">
                Confirmez la reception de la livraison {deliveries.find(d => d.id === showSignModal)?.reference}
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center mb-4">
                <p className="text-gray-500">Zone de signature</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignModal(null)}
                  className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => signDelivery(showSignModal)}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                  Confirmer reception
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Passez a Premium</h2>
              <p className="text-gray-600 mb-4">
                Debloquez toutes les fonctionnalites avec l'offre Premium:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-green-600">
                  <span className="mr-2">&#10003;</span> Livraisons illimitees
                </li>
                <li className="flex items-center text-green-600">
                  <span className="mr-2">&#10003;</span> Tracking GPS temps reel
                </li>
                <li className="flex items-center text-green-600">
                  <span className="mr-2">&#10003;</span> Gestion des incidents
                </li>
                <li className="flex items-center text-green-600">
                  <span className="mr-2">&#10003;</span> Multi-sites
                </li>
                <li className="flex items-center text-green-600">
                  <span className="mr-2">&#10003;</span> Notifications SMS
                </li>
                <li className="flex items-center text-green-600">
                  <span className="mr-2">&#10003;</span> Analytics avances
                </li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
                >
                  Plus tard
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">
                  Decouvrir les offres
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </>
  );
}
