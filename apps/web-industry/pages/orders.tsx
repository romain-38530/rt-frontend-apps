/**
 * Page de gestion des commandes - Portail Industry
 * Intégration complète avec l'API Orders
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { useSafeRouter } from '../lib/useSafeRouter';
import { CreateOrderForm, OrdersList, useToast, AutoPlanningModal } from '@rt/ui-components';
import { OrdersService } from '@rt/utils';
import type {
  Order,
  CreateOrderInput,
  OrderFilters,
  PaginatedOrders,
} from '@rt/contracts';

export default function OrdersPage() {
  const router = useSafeRouter();
  const { toast } = useToast();

  // État de la page
  const [view, setView] = useState<'list' | 'create'>('list');
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isAffretMode, setIsAffretMode] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [directAffretIA, setDirectAffretIA] = useState(false); // true = skip auto-dispatch, go direct to Affret.IA

  // Charger les commandes
  const loadOrders = async (newFilters?: OrderFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const filtersToUse = newFilters || filters;
      const result: PaginatedOrders = await OrdersService.getOrders(filtersToUse);

      setOrders(result.data);
      setPagination({
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des commandes');
      console.error('Error loading orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Créer une commande
  const handleCreateOrder = async (input: CreateOrderInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const newOrder = await OrdersService.createOrder(input);
      console.log('Order created:', newOrder);

      // Retourner à la liste et recharger
      setView('list');
      await loadOrders();

      // Afficher une notification de succès
      toast.success(`Commande ${newOrder.reference} créée avec succès !`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la commande');
      console.error('Error creating order:', err);
      throw err; // Remonter l'erreur au formulaire
    } finally {
      setIsLoading(false);
    }
  };

  // Dupliquer une commande
  const handleDuplicateOrder = async (orderId: string) => {
    try {
      const duplicatedOrder = await OrdersService.duplicateOrder(orderId);
      console.log('Order duplicated:', duplicatedOrder);
      await loadOrders();
      toast.success(`Commande ${duplicatedOrder.reference} dupliquée avec succès !`);
    } catch (err: any) {
      toast.error(`Erreur lors de la duplication : ${err.message}`);
      console.error('Error duplicating order:', err);
    }
  };

  // Annuler une commande
  const handleCancelOrder = async (orderId: string) => {
    try {
      const cancelledOrder = await OrdersService.cancelOrder(orderId, 'Annulation manuelle');
      console.log('Order cancelled:', cancelledOrder);
      await loadOrders();
      toast.success(`Commande ${cancelledOrder.reference} annulée avec succès !`);
    } catch (err: any) {
      toast.error(`Erreur lors de l'annulation : ${err.message}`);
      console.error('Error cancelling order:', err);
    }
  };

  // Voir le détail d'une commande
  const handleOrderClick = (orderId: string) => {
    if (isAffretMode) {
      // Toggle selection in Affret mode
      const newSelected = new Set(selectedOrders);
      if (newSelected.has(orderId)) {
        newSelected.delete(orderId);
      } else {
        newSelected.add(orderId);
      }
      setSelectedOrders(newSelected);
    } else {
      router.push(`/orders/${orderId}`);
    }
  };

  // Toggle selection d'une commande
  const handleToggleSelect = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // Sélectionner/Désélectionner toutes les commandes éligibles (sans transporteur)
  const getEligibleOrders = () => {
    return orders.filter(o => !o.carrierId && ['draft', 'created', 'pending'].includes(o.status));
  };

  const handleSelectAll = () => {
    const eligibleOrders = getEligibleOrders();
    if (selectedOrders.size === eligibleOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(eligibleOrders.map(o => o.id)));
    }
  };

  // Lancer la planification automatique (avec dispatch chain)
  const handleLaunchAutoPlanning = () => {
    if (selectedOrders.size === 0) {
      toast.error('Sélectionnez au moins une commande pour la planification automatique');
      return;
    }
    setDirectAffretIA(false);
    setShowPlanningModal(true);
  };

  // Lancer Affret.IA directement (sans passer par la chaîne de dispatch)
  const handleLaunchDirectAffretIA = () => {
    if (selectedOrders.size === 0) {
      toast.error('Sélectionnez au moins une commande pour Affret.IA');
      return;
    }
    // Envoyer directement vers Affret.IA
    const ordersToSend = orders.filter(o => selectedOrders.has(o.id));
    sessionStorage.setItem('affretia_orders', JSON.stringify(ordersToSend));
    router.push('/affret-ia?mode=direct');
  };

  // Valider une commande avec un transporteur
  const handleValidateCarrier = async (orderId: string, carrierId: string) => {
    try {
      // Update order with carrier assignment
      await OrdersService.updateOrder(orderId, { carrierId, status: 'sent_to_carrier' as any });
      toast.success('Transporteur assigné avec succès');
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`);
    }
  };

  // Escalader vers Affret.IA (bourse de fret)
  const handleEscalateToAffretIA = (orderIds: string[]) => {
    const ordersToEscalate = orders.filter(o => orderIds.includes(o.id));
    sessionStorage.setItem('affretia_orders', JSON.stringify(ordersToEscalate));
    router.push('/affret-ia?mode=escalated');
  };

  // Quitter le mode Affret.IA
  const handleExitAffretMode = () => {
    setIsAffretMode(false);
    setSelectedOrders(new Set());
  };

  // Changement de page
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadOrders(newFilters);
  };

  // Changement de filtres
  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    loadOrders(newFilters);
  };

  // Vérifier l'authentification et charger les commandes
  useEffect(() => {
    if (!router.mounted) return;

    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadOrders();
  }, [router.mounted]);

  return (
    <>
      <Head>
        <title>Gestion des commandes - Industry | SYMPHONI.A</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          background: 'url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80) center/cover',
          position: 'relative',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 0,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: '20px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 1,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => {
                if (view === 'create') {
                  setView('list');
                } else {
                  router.push('/');
                }
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}>
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>📦</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                Gestion des commandes
              </h1>
            </div>
          </div>

          {view === 'list' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isAffretMode ? (
                <>
                  <div style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}>
                    {selectedOrders.size} commande{selectedOrders.size > 1 ? 's' : ''} sélectionnée{selectedOrders.size > 1 ? 's' : ''}
                  </div>
                  <button
                    onClick={handleSelectAll}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                    {selectedOrders.size === getEligibleOrders().length && selectedOrders.size > 0 ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                  <button
                    onClick={handleLaunchAutoPlanning}
                    disabled={selectedOrders.size === 0}
                    style={{
                      background: selectedOrders.size > 0
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                        : 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: 'white',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      cursor: selectedOrders.size > 0 ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '700',
                      boxShadow: selectedOrders.size > 0 ? '0 4px 12px rgba(139, 92, 246, 0.4)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                    🚀 Planification Auto
                  </button>
                  <button
                    onClick={handleLaunchDirectAffretIA}
                    disabled={selectedOrders.size === 0}
                    style={{
                      background: selectedOrders.size > 0
                        ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                        : 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: 'white',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      cursor: selectedOrders.size > 0 ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '700',
                      boxShadow: selectedOrders.size > 0 ? '0 4px 12px rgba(236, 72, 153, 0.4)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                    🤖 Affret.IA Direct
                  </button>
                  <button
                    onClick={handleExitAffretMode}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                    ✕ Annuler
                  </button>
                </>
              ) : (
                <>
                  {/* Afficher les boutons Affret uniquement s'il y a des commandes sans transporteur */}
                  {getEligibleOrders().length > 0 && (
                    <>
                      <button
                        onClick={() => setIsAffretMode(true)}
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          border: 'none',
                          color: 'white',
                          padding: '12px 20px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '700',
                          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                        🚀 Mode Planification Auto
                      </button>
                      <button
                        onClick={() => router.push('/affret-ia')}
                        style={{
                          background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                          border: 'none',
                          color: 'white',
                          padding: '12px 20px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '700',
                          boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                        🤖 Affret.IA
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setView('create')}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '700',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    }}>
                    + Nouvelle commande
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Contenu principal */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '40px',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          {/* Message d'erreur */}
          {error && (
            <div
              style={{
                padding: '16px',
                marginBottom: '20px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#dc2626',
                fontWeight: '600',
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* Vue Liste */}
          {view === 'list' && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Bandeau mode Affret.IA */}
              {isAffretMode && (
                <div style={{
                  marginBottom: '20px',
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '12px',
                  border: '2px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <span style={{ fontSize: '24px' }}>🤖</span>
                  <div>
                    <div style={{ fontWeight: '700', color: '#92400e', fontSize: '16px' }}>
                      Mode Planification Automatique Affret.IA
                    </div>
                    <div style={{ fontSize: '13px', color: '#a16207' }}>
                      {getEligibleOrders().length > 0
                        ? `${getEligibleOrders().length} commande${getEligibleOrders().length > 1 ? 's' : ''} sans transporteur disponible${getEligibleOrders().length > 1 ? 's' : ''} - Cliquez pour sélectionner`
                        : 'Aucune commande sans transporteur à planifier'}
                    </div>
                  </div>
                </div>
              )}

              {/* Liste avec sélection - Filtrer uniquement les commandes sans transporteur */}
              {isAffretMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {orders
                    .filter((order) => {
                      // Ne montrer que les commandes sans transporteur assigné
                      const hasNoCarrier = !order.carrierId;
                      // Et qui sont dans un statut permettant la planification
                      const eligibleStatus = ['draft', 'created', 'pending'].includes(order.status);
                      return hasNoCarrier && eligibleStatus;
                    })
                    .map((order) => {
                    const isSelected = selectedOrders.has(order.id);
                    return (
                      <div
                        key={order.id}
                        onClick={() => handleToggleSelect(order.id)}
                        style={{
                          padding: '16px 20px',
                          backgroundColor: isSelected ? '#fef3c7' : '#f9fafb',
                          border: isSelected ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: isSelected ? 'none' : '2px solid #d1d5db',
                          backgroundColor: isSelected ? '#f59e0b' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '14px',
                        }}>
                          {isSelected && '✓'}
                        </div>

                        {/* Infos commande */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '700', color: '#111827', fontSize: '15px' }}>
                              {order.reference}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: order.status === 'created' ? '#dbeafe' : order.status === 'sent_to_carrier' ? '#ede9fe' : '#f3f4f6',
                              color: order.status === 'created' ? '#1e40af' : order.status === 'sent_to_carrier' ? '#6d28d9' : '#374151',
                            }}>
                              {order.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            {order.pickupAddress?.city} → {order.deliveryAddress?.city}
                            {order.goods?.weight && ` • ${order.goods.weight} kg`}
                          </div>
                        </div>

                        {/* Prix */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', color: '#059669', fontSize: '16px' }}>
                            {order.estimatedPrice ? `${order.estimatedPrice} €` : '-'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {order.dates?.pickupDate ? new Date(order.dates.pickupDate).toLocaleDateString('fr-FR') : '-'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <OrdersList
                  orders={orders}
                  total={pagination.total}
                  page={pagination.page}
                  limit={pagination.limit}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  onFiltersChange={handleFiltersChange}
                  onOrderClick={handleOrderClick}
                  onDuplicateOrder={handleDuplicateOrder}
                  onCancelOrder={handleCancelOrder}
                  isLoading={isLoading}
                />
              )}
            </div>
          )}

          {/* Vue Création */}
          {view === 'create' && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CreateOrderForm
                onSubmit={handleCreateOrder}
                onCancel={() => setView('list')}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal de planification automatique */}
      {showPlanningModal && (
        <AutoPlanningModal
          orders={orders.filter(o => selectedOrders.has(o.id))}
          onClose={() => {
            setShowPlanningModal(false);
            setIsAffretMode(false);
            setSelectedOrders(new Set());
            loadOrders();
          }}
          onValidate={handleValidateCarrier}
          onEscalateToAffretIA={handleEscalateToAffretIA}
        />
      )}
    </>
  );
}
