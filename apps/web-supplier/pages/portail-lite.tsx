/**
 * Portail Lite Fournisseur - Version gratuite
 * SYMPHONI.A - Espace Fournisseur simplifie
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';

// Types
interface Order {
  id: string;
  reference: string;
  client: string;
  pickupDate: string;
  status: 'pending' | 'confirmed' | 'ready' | 'picked_up';
  items: number;
}

interface Slot {
  id: string;
  date: string;
  time: string;
  dock: string;
  available: boolean;
}

interface Stats {
  pendingOrders: number;
  todayPickups: number;
  completedThisMonth: number;
}

// Mock data
const mockOrders: Order[] = [
  { id: '1', reference: 'CMD-2024-001', client: 'Transport Express', pickupDate: '2024-12-02', status: 'pending', items: 5 },
  { id: '2', reference: 'CMD-2024-002', client: 'Logistique Pro', pickupDate: '2024-12-01', status: 'confirmed', items: 12 },
  { id: '3', reference: 'CMD-2024-003', client: 'Fret National', pickupDate: '2024-12-01', status: 'ready', items: 3 },
  { id: '4', reference: 'CMD-2024-004', client: 'Express Livraison', pickupDate: '2024-12-03', status: 'pending', items: 8 },
];

const mockSlots: Slot[] = [
  { id: '1', date: '2024-12-02', time: '08:00 - 09:00', dock: 'Quai A', available: true },
  { id: '2', date: '2024-12-02', time: '09:00 - 10:00', dock: 'Quai B', available: true },
  { id: '3', date: '2024-12-02', time: '10:00 - 11:00', dock: 'Quai A', available: false },
  { id: '4', date: '2024-12-02', time: '14:00 - 15:00', dock: 'Quai C', available: true },
];

const faqs = [
  { q: 'Comment confirmer une commande prete?', a: 'Cliquez sur le bouton "Confirmer Pret" a cote de la commande dans la liste.' },
  { q: 'Comment reserver un creneau de chargement?', a: 'Allez dans l\'onglet "Creneaux" et selectionnez un creneau disponible.' },
  { q: 'Que faire en cas de probleme?', a: 'Utilisez le formulaire de contact dans l\'onglet "Support".' },
  { q: 'Comment passer a la version complete?', a: 'Cliquez sur "Passer a Premium" pour debloquer toutes les fonctionnalites.' },
];

export default function PortailLiteFournisseur() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'slots' | 'support'>('dashboard');
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [slots] = useState<Slot[]>(mockSlots);
  const [stats] = useState<Stats>({
    pendingOrders: 2,
    todayPickups: 2,
    completedThisMonth: 45
  });
  const [filter, setFilter] = useState<string>('all');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  const confirmReady = (orderId: string) => {
    setOrders(orders.map(o =>
      o.id === orderId ? { ...o, status: 'ready' as const } : o
    ));
  };

  const bookSlot = (slotId: string) => {
    if (orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length >= 50) {
      setShowUpgradeModal(true);
      return;
    }
    alert(`Creneau ${slotId} reserve avec succes!`);
  };

  const showUpgrade = () => setShowUpgradeModal(true);

  return (
    <>
      <Head>
        <title>Portail Fournisseur Lite | SYMPHONI.A</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold">SYMPHONI.A</h1>
                <p className="text-blue-200 text-sm">Portail Fournisseur - Version Lite</p>
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
                { id: 'orders', label: 'Commandes' },
                { id: 'slots', label: 'Creneaux' },
                { id: 'support', label: 'Support' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-3 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
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
                  <div className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</div>
                  <div className="text-gray-600 mt-1">Commandes en attente</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl font-bold text-blue-600">{stats.todayPickups}</div>
                  <div className="text-gray-600 mt-1">Enlevements aujourd'hui</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-3xl font-bold text-green-600">{stats.completedThisMonth}</div>
                  <div className="text-gray-600 mt-1">Terminees ce mois</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Voir les commandes
                  </button>
                  <button
                    onClick={() => setActiveTab('slots')}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Reserver un creneau
                  </button>
                </div>
              </div>

              {/* Limitations Banner */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800">Version Lite - Limitations</h3>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>- Maximum 50 commandes/mois</li>
                  <li>- Pas d'acces API</li>
                  <li>- Pas d'analytics avances</li>
                  <li>- Support par email uniquement</li>
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

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-wrap gap-2">
                  {['all', 'pending', 'confirmed', 'ready', 'picked_up'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded text-sm ${
                        filter === f
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {f === 'all' ? 'Toutes' : f === 'pending' ? 'En attente' : f === 'confirmed' ? 'Confirmees' : f === 'ready' ? 'Pretes' : 'Enlevees'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Reference</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Client</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Statut</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{order.reference}</td>
                        <td className="px-4 py-3 text-gray-600">{order.client}</td>
                        <td className="px-4 py-3 text-gray-600">{order.pickupDate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'ready' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status === 'pending' ? 'En attente' : order.status === 'confirmed' ? 'Confirmee' : order.status === 'ready' ? 'Prete' : 'Enlevee'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <button
                              onClick={() => confirmReady(order.id)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              Confirmer Pret
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
                <h2 className="text-lg font-semibold mb-4">Creneaux disponibles</h2>
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
                      {slot.available ? (
                        <button
                          onClick={() => bookSlot(slot.id)}
                          className="mt-3 w-full bg-green-600 text-white py-1 rounded text-sm hover:bg-green-700"
                        >
                          Reserver
                        </button>
                      ) : (
                        <div className="mt-3 text-center text-gray-500 text-sm">Indisponible</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* My Bookings - Limited */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Mes reservations</h2>
                  <button onClick={showUpgrade} className="text-blue-600 text-sm">
                    Historique complet (Premium)
                  </button>
                </div>
                <p className="text-gray-500">Aucune reservation active</p>
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

              {/* Contact Form */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Nous contacter</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                    <select className="w-full border rounded px-3 py-2">
                      <option>Question generale</option>
                      <option>Probleme technique</option>
                      <option>Demande de fonctionnalite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea className="w-full border rounded px-3 py-2 h-32" placeholder="Decrivez votre demande..." />
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                    Envoyer
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>

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
                  <span className="mr-2">&#10003;</span> Commandes illimitees
                </li>
                <li className="flex items-center text-green-600">
                  <span className="mr-2">&#10003;</span> Acces API complet
                </li>
                <li className="flex items-center text-green-600">
                  <span className="mr-2">&#10003;</span> Analytics avances
                </li>
                <li className="flex items-center text-green-600">
                  <span className="mr-2">&#10003;</span> Multi-utilisateurs
                </li>
                <li className="flex items-center text-green-600">
                  <span className="mr-2">&#10003;</span> Support prioritaire
                </li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
                >
                  Plus tard
                </button>
                <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
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
