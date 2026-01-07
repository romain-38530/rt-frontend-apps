/**
 * AFFRET.IA API - Système autonome de recherche de transporteurs
 * API client pour déclencher et gérer les sessions de recherche automatique
 */

// API URL
const AFFRET_IA_API = process.env.NEXT_PUBLIC_AFFRET_IA_API_URL || 'https://d393yiia4ig3bw.cloudfront.net';

// Helper to get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`,
  'Content-Type': 'application/json'
});

export interface AffretIASession {
  sessionId: string;
  orderId: string;
  status: string;
  createdAt: string;
  analysis?: {
    complexity: number;
    estimatedPrice: number;
  };
  selection?: {
    carrierId: string;
    carrierName: string;
    finalPrice: number;
  };
  proposalsReceived?: number;
}

export interface AffretIAProposal {
  _id: string;
  carrierId: string;
  carrierName: string;
  proposedPrice: number;
  status: string;
  scores?: {
    price: number;
    quality: number;
    overall: number;
  };
  submittedAt: string;
}

export interface AffretIAStats {
  totalSessions: number;
  successRate: number;
  avgResponseTime: number;
  avgPrice: number;
  topCarriers: Array<{
    carrierId: string;
    name: string;
    assignations: number;
    avgScore: number;
  }>;
}

export const affretIAApi = {
  /**
   * Déclencher AFFRET.IA pour une commande
   */
  trigger: async (orderId: string, reason: string = 'Déclenchement manuel'): Promise<{ success: boolean; data?: { sessionId: string }; error?: string }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/trigger`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        orderId,
        reason,
        triggerType: 'manual',
        organizationId: 'org-default'
      })
    });
    return res.json();
  },

  /**
   * Déclencher AFFRET.IA pour plusieurs commandes (batch)
   */
  triggerBatch: async (orderIds: string[], reason: string = 'Déclenchement batch manuel'): Promise<{ success: boolean; results: any[] }> => {
    const results = await Promise.all(
      orderIds.map(orderId =>
        fetch(`${AFFRET_IA_API}/api/v1/affretia/trigger`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            orderId,
            reason,
            triggerType: 'batch',
            organizationId: 'org-default'
          })
        }).then(res => res.json())
      )
    );
    return { success: true, results };
  },

  /**
   * Obtenir les statistiques AFFRET.IA
   */
  getStats: async (): Promise<{ success: boolean; data?: AffretIAStats }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/stats`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Liste des sessions
   */
  getSessions: async (limit = 50): Promise<{ success: boolean; data?: AffretIASession[] }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/sessions?limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Détails d'une session
   */
  getSession: async (sessionId: string): Promise<{ success: boolean; data?: AffretIASession }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/session/${sessionId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Lancer l'analyse IA d'une commande
   */
  analyze: async (sessionId: string): Promise<{ success: boolean; data?: { complexity: number; estimatedPrice: number } }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId })
    });
    return res.json();
  },

  /**
   * Diffuser aux transporteurs
   */
  broadcast: async (sessionId: string, channels: string[] = ['email', 'bourse', 'push']): Promise<{ success: boolean; data?: { recipientsCount: number } }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/broadcast`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, channels })
    });
    return res.json();
  },

  /**
   * Workflow automatique: Analyser et diffuser
   */
  analyzeAndBroadcast: async (sessionId: string) => {
    // Étape 1: Analyse
    const analysis = await affretIAApi.analyze(sessionId);

    // Étape 2: Diffusion
    const broadcast = await affretIAApi.broadcast(sessionId);

    return { analysis, broadcast };
  },

  /**
   * Obtenir les propositions d'une session
   */
  getProposals: async (sessionId: string): Promise<{ success: boolean; data?: AffretIAProposal[] }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/proposals/${sessionId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Sélectionner automatiquement le meilleur transporteur
   */
  selectBest: async (sessionId: string): Promise<{ success: boolean; data?: { selectedCarrierName: string; selectedPrice: number } }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/select`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId })
    });
    return res.json();
  },

  /**
   * Assigner le transporteur sélectionné
   */
  assign: async (sessionId: string, userId: string = 'system'): Promise<{ success: boolean; data?: { carrierName: string } }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, userId })
    });
    return res.json();
  },

  /**
   * Workflow automatique: Sélectionner et assigner
   */
  selectAndAssign: async (sessionId: string) => {
    // Étape 1: Sélection
    const selection = await affretIAApi.selectBest(sessionId);

    // Étape 2: Assignation
    const assignment = await affretIAApi.assign(sessionId);

    return { selection, assignment };
  },

  /**
   * Obtenir la décision/recommandation IA
   */
  getDecision: async (sessionId: string): Promise<{ success: boolean; data?: { recommendation: string; confidence: number } }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/decision/${sessionId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Accepter une proposition
   */
  acceptProposal: async (proposalId: string, userId: string = 'system', reason: string = 'Acceptation manuelle'): Promise<{ success: boolean }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/proposals/${proposalId}/accept`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, reason })
    });
    return res.json();
  },

  /**
   * Rejeter une proposition
   */
  rejectProposal: async (proposalId: string, userId: string = 'system', reason: string = 'Rejet manuel'): Promise<{ success: boolean }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/proposals/${proposalId}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, reason })
    });
    return res.json();
  },

  /**
   * Offres de la bourse
   */
  getBourseOffers: async (): Promise<{ success: boolean; data?: any[] }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/bourse`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Niveaux de tracking disponibles
   */
  getTrackingLevels: async (): Promise<{ success: boolean; data?: any }> => {
    const res = await fetch(`${AFFRET_IA_API}/api/v1/affretia/tracking/levels`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  /**
   * Workflow complet autonome: Trigger -> Analyze -> Broadcast
   * Lance le processus complet de recherche de transporteur pour une commande
   */
  launchAutonomousSearch: async (orderId: string, reason: string = 'Recherche autonome') => {
    // Étape 1: Déclencher la session
    const triggerResult = await affretIAApi.trigger(orderId, reason);

    if (!triggerResult.success || !triggerResult.data?.sessionId) {
      return { success: false, error: triggerResult.error || 'Échec du déclenchement' };
    }

    const sessionId = triggerResult.data.sessionId;

    // Étape 2: Analyser et diffuser
    const { analysis, broadcast } = await affretIAApi.analyzeAndBroadcast(sessionId);

    return {
      success: true,
      sessionId,
      analysis: analysis.data,
      broadcast: broadcast.data
    };
  },

  /**
   * Workflow batch autonome: Lance la recherche pour plusieurs commandes
   */
  launchAutonomousSearchBatch: async (orderIds: string[], reason: string = 'Recherche autonome batch') => {
    const results = await Promise.all(
      orderIds.map(orderId => affretIAApi.launchAutonomousSearch(orderId, reason))
    );

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return {
      success: failedCount === 0,
      totalOrders: orderIds.length,
      successCount,
      failedCount,
      results
    };
  }
};
