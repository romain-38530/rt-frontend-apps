/**
 * Page de gestion des commandes - Portail Supplier
 * Intégration complète avec l'API Orders
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { CreateOrderForm, OrdersList, useToast } from '@rt/ui-components';
import { OrdersService } from '@rt/utils';
import type {
  Order,
  CreateOrderInput,
  OrderFilters,
  PaginatedOrders,
} from '@rt/contracts';

export default function OrdersPage() {
  const router = useRouter();
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
    router.push(`/orders/${orderId}`);
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
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadOrders();
  }, [router]);

  return (
    <>
      <Head>
        <title>Gestion des commandes - Supplier | SYMPHONI.A</title>
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
              }}
            >
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
                transition: 'all 0.2s ease',
              }}
            >
              + Nouvelle commande
            </button>
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
    </>
  );
}
