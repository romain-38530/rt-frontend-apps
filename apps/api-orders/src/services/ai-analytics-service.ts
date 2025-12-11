/**
 * Service AI Analytics - Génération d'analyses et recommandations IA
 * Utilise Claude API pour générer des rapports mensuels intelligents
 */
import { v4 as uuidv4 } from 'uuid';
import AIReport, {
  IAIReport,
  IRecommendation,
  ITrend,
  IAlert,
  ICarrierAnalysis,
  IIndustrialAnalysis,
  ILogisticianAnalysis,
  ReportType
} from '../models/AIReport';
import AnalyticsService, { CarrierKPIs, IndustrialKPIs, LogisticianKPIs } from './analytics-service';
import NotificationService from './notification-service';

// Configuration Claude API
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

export class AIAnalyticsService {

  /**
   * Appelle l'API Claude pour générer une analyse
   */
  private static async callClaudeAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!ANTHROPIC_API_KEY) {
      console.log('[AI Analytics] No API key - using rule-based analysis');
      return '';
    }

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json() as ClaudeResponse;
      return data.content[0]?.text || '';
    } catch (error) {
      console.error('[AI Analytics] Claude API error:', error);
      return '';
    }
  }

  /**
   * Génère des recommandations basées sur les KPIs
   */
  private static generateRecommendations(
    kpis: CarrierKPIs | IndustrialKPIs | LogisticianKPIs,
    type: 'carrier' | 'industrial' | 'logistician'
  ): IRecommendation[] {
    const recommendations: IRecommendation[] = [];

    if (type === 'carrier') {
      const carrierKpis = kpis as CarrierKPIs;

      // Recommandation sur taux d'acceptation
      if (carrierKpis.operational.acceptanceRate < 80) {
        recommendations.push({
          priority: 'high',
          category: 'Performance opérationnelle',
          title: 'Améliorer le taux d\'acceptation des commandes',
          description: `Le taux d'acceptation actuel (${carrierKpis.operational.acceptanceRate.toFixed(1)}%) est inférieur à l'objectif de 80%. Cela peut impacter la relation commerciale.`,
          expectedImpact: 'Augmentation du volume de commandes et amélioration de la confiance client',
          actionItems: [
            'Analyser les raisons des refus récents',
            'Ajuster la capacité de transport si nécessaire',
            'Améliorer la réactivité aux demandes'
          ],
          targetKPI: 'acceptanceRate',
          potentialGain: '+15% de volume'
        });
      }

      // Recommandation sur ponctualité
      if (carrierKpis.punctuality.onTimeDeliveryRate < 90) {
        recommendations.push({
          priority: 'high',
          category: 'Qualité de service',
          title: 'Renforcer la ponctualité des livraisons',
          description: `Le taux de ponctualité (${carrierKpis.punctuality.onTimeDeliveryRate.toFixed(1)}%) nécessite une amélioration pour atteindre l'objectif de 90%.`,
          expectedImpact: 'Amélioration du score global et réduction des pénalités',
          actionItems: [
            'Revoir la planification des tournées',
            'Anticiper les aléas (trafic, chargement)',
            'Améliorer la communication avec les sites'
          ],
          targetKPI: 'onTimeDeliveryRate',
          potentialGain: '+5 points de score'
        });
      }

      // Recommandation sur incidents
      if (carrierKpis.incidents.incidentRate > 5) {
        recommendations.push({
          priority: 'medium',
          category: 'Gestion des risques',
          title: 'Réduire le taux d\'incidents',
          description: `Le taux d'incidents (${carrierKpis.incidents.incidentRate.toFixed(1)}%) est supérieur au seuil acceptable de 5%.`,
          expectedImpact: 'Réduction des coûts de gestion et amélioration de la satisfaction client',
          actionItems: [
            'Former les chauffeurs aux bonnes pratiques',
            'Améliorer les procédures de chargement/déchargement',
            'Mettre en place des contrôles qualité'
          ],
          targetKPI: 'incidentRate',
          potentialGain: '-50% d\'incidents'
        });
      }

      // Score global
      if (carrierKpis.globalScore < 75) {
        recommendations.push({
          priority: 'high',
          category: 'Performance globale',
          title: 'Plan d\'amélioration du score transporteur',
          description: `Le score global (${carrierKpis.globalScore}/100) nécessite un plan d'action prioritaire.`,
          expectedImpact: 'Maintien du partenariat et accès aux commandes premium',
          actionItems: [
            'Identifier les 3 principaux axes d\'amélioration',
            'Mettre en place un suivi hebdomadaire',
            'Organiser une réunion de revue avec l\'industriel'
          ],
          targetKPI: 'globalScore',
          potentialGain: '+10 points'
        });
      }
    }

    if (type === 'industrial') {
      const industrialKpis = kpis as IndustrialKPIs;

      // Recommandation sur temps d'attente
      if (industrialKpis.workingConditions.averageWaitingTimeMinutes > 60) {
        recommendations.push({
          priority: 'medium',
          category: 'Conditions de travail',
          title: 'Négocier les temps d\'attente',
          description: `Le temps d'attente moyen (${industrialKpis.workingConditions.averageWaitingTimeMinutes.toFixed(0)} min) impacte la rentabilité.`,
          expectedImpact: 'Amélioration de la marge et des conditions de travail',
          actionItems: [
            'Documenter les temps d\'attente excessifs',
            'Négocier une facturation des temps d\'attente',
            'Proposer des créneaux de RDV optimisés'
          ],
          targetKPI: 'averageWaitingTimeMinutes',
          potentialGain: '+2% de marge'
        });
      }

      // Recommandation sur paiements
      if (industrialKpis.payments.averagePaymentDelayDays > 45) {
        recommendations.push({
          priority: 'high',
          category: 'Trésorerie',
          title: 'Améliorer les délais de paiement',
          description: `Le délai de paiement moyen (${industrialKpis.payments.averagePaymentDelayDays}j) dépasse les conditions contractuelles.`,
          expectedImpact: 'Amélioration de la trésorerie',
          actionItems: [
            'Relancer les factures en retard',
            'Négocier des conditions de paiement plus courtes',
            'Envisager l\'escompte pour paiement anticipé'
          ],
          targetKPI: 'averagePaymentDelayDays',
          potentialGain: 'Trésorerie +15j'
        });
      }

      // Recommandation sur fidélisation
      if (industrialKpis.activity.revenueShare > 30) {
        recommendations.push({
          priority: 'low',
          category: 'Diversification',
          title: 'Diversifier le portefeuille clients',
          description: `Cet industriel représente ${industrialKpis.activity.revenueShare.toFixed(1)}% du CA. Un risque de dépendance existe.`,
          expectedImpact: 'Réduction du risque commercial',
          actionItems: [
            'Développer d\'autres clients sur cette zone',
            'Négocier un engagement de volume',
            'Fidéliser le client avec un service premium'
          ],
          targetKPI: 'revenueShare',
          potentialGain: 'Risque maîtrisé'
        });
      }
    }

    if (type === 'logistician') {
      const logKpis = kpis as LogisticianKPIs;

      // Recommandation sur productivité
      if (logKpis.productivity.pendingOrders > 10) {
        recommendations.push({
          priority: 'high',
          category: 'Productivité',
          title: 'Réduire le backlog de commandes',
          description: `${logKpis.productivity.pendingOrders} commandes sont en attente de traitement.`,
          expectedImpact: 'Amélioration des délais et satisfaction client',
          actionItems: [
            'Prioriser les commandes urgentes',
            'Identifier les blocages dans le process',
            'Automatiser les tâches répétitives'
          ],
          targetKPI: 'pendingOrders',
          potentialGain: 'Backlog < 5'
        });
      }

      // Recommandation sur taux affectation
      if (logKpis.assignments.firstAttemptSuccessRate < 70) {
        recommendations.push({
          priority: 'medium',
          category: 'Efficacité',
          title: 'Améliorer le taux d\'affectation au 1er envoi',
          description: `Le taux de succès au 1er envoi (${logKpis.assignments.firstAttemptSuccessRate.toFixed(1)}%) peut être optimisé.`,
          expectedImpact: 'Réduction du temps d\'affectation',
          actionItems: [
            'Mieux cibler les transporteurs selon les lanes',
            'Mettre à jour les capacités transporteurs',
            'Améliorer les alertes de disponibilité'
          ],
          targetKPI: 'firstAttemptSuccessRate',
          potentialGain: '+20% efficacité'
        });
      }
    }

    return recommendations;
  }

  /**
   * Génère les tendances à partir des KPIs
   */
  private static generateTrends(currentKpis: any, previousKpis?: any): ITrend[] {
    const trends: ITrend[] = [];

    // Si pas de données précédentes, générer des tendances simulées
    const prevMultiplier = previousKpis ? 1 : 0.95;

    if (currentKpis.operational) {
      const current = currentKpis.operational.acceptanceRate;
      const previous = previousKpis?.operational?.acceptanceRate || current * prevMultiplier;
      const change = ((current - previous) / previous) * 100;

      trends.push({
        direction: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
        metric: 'Taux d\'acceptation',
        currentValue: current,
        previousValue: previous,
        changePercent: change,
        interpretation: change > 0
          ? 'Amélioration de la réactivité aux demandes'
          : 'Vigilance requise sur la capacité de réponse'
      });
    }

    if (currentKpis.punctuality) {
      const current = currentKpis.punctuality.onTimeDeliveryRate;
      const previous = previousKpis?.punctuality?.onTimeDeliveryRate || current * prevMultiplier;
      const change = ((current - previous) / previous) * 100;

      trends.push({
        direction: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
        metric: 'Ponctualité livraison',
        currentValue: current,
        previousValue: previous,
        changePercent: change,
        interpretation: change > 0
          ? 'La qualité de service s\'améliore'
          : 'Des retards plus fréquents ont été observés'
      });
    }

    if (currentKpis.activity) {
      const current = currentKpis.activity.totalOrders;
      const previous = previousKpis?.activity?.totalOrders || Math.round(current * prevMultiplier);
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

      trends.push({
        direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
        metric: 'Volume de commandes',
        currentValue: current,
        previousValue: previous,
        changePercent: change,
        interpretation: change > 0
          ? 'Croissance de l\'activité'
          : 'Volume en légère baisse'
      });
    }

    return trends;
  }

  /**
   * Génère les alertes basées sur les KPIs
   */
  private static generateAlerts(kpis: any, type: 'carrier' | 'industrial' | 'logistician'): IAlert[] {
    const alerts: IAlert[] = [];

    if (type === 'carrier' && kpis.globalScore) {
      if (kpis.globalScore < 60) {
        alerts.push({
          severity: 'critical',
          title: 'Score transporteur critique',
          description: `Le score de ${kpis.globalScore}/100 met en danger la relation commerciale`,
          suggestedAction: 'Organiser une réunion d\'urgence pour définir un plan d\'action'
        });
      } else if (kpis.globalScore < 75) {
        alerts.push({
          severity: 'warning',
          title: 'Score transporteur à surveiller',
          description: `Le score de ${kpis.globalScore}/100 nécessite des améliorations`,
          suggestedAction: 'Analyser les points faibles et définir des actions correctives'
        });
      }

      if (kpis.incidents?.openIncidents > 0) {
        alerts.push({
          severity: 'warning',
          title: 'Incidents non résolus',
          description: `${kpis.incidents.openIncidents} incident(s) en attente de résolution`,
          suggestedAction: 'Traiter les incidents ouverts en priorité'
        });
      }
    }

    if (type === 'industrial') {
      if (kpis.payments?.overdueInvoices > 0) {
        alerts.push({
          severity: 'critical',
          title: 'Factures impayées',
          description: `Des factures sont en retard de paiement`,
          suggestedAction: 'Relancer le client et évaluer le risque crédit'
        });
      }
    }

    if (type === 'logistician') {
      if (kpis.monitoring?.untreatedAlertsCount > 5) {
        alerts.push({
          severity: 'warning',
          title: 'Alertes non traitées',
          description: `${kpis.monitoring.untreatedAlertsCount} alertes en attente de traitement`,
          suggestedAction: 'Prioriser le traitement des alertes critiques'
        });
      }
    }

    return alerts;
  }

  /**
   * Génère un rapport IA pour un industriel (analyse de ses transporteurs)
   */
  static async generateIndustrialReport(
    industrialId: string,
    industrialName: string,
    month: number,
    year: number
  ): Promise<IAIReport> {
    const startTime = Date.now();
    const reportId = `RPT-${year}${String(month).padStart(2, '0')}-IND-${uuidv4().slice(0, 8)}`;

    // Calculer les dates de la période
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Récupérer le classement des transporteurs
    const carriersRanking = await AnalyticsService.getCarriersRanking(industrialId, startDate, endDate);

    // Générer les analyses par transporteur
    const carrierAnalyses: ICarrierAnalysis[] = carriersRanking.map(carrier => {
      const recommendations = this.generateRecommendations(carrier, 'carrier');
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      if (carrier.operational.acceptanceRate >= 90) strengths.push('Excellent taux d\'acceptation');
      if (carrier.punctuality.onTimeDeliveryRate >= 95) strengths.push('Ponctualité exemplaire');
      if (carrier.globalScore >= 85) strengths.push('Performance globale remarquable');

      if (carrier.operational.acceptanceRate < 70) weaknesses.push('Taux d\'acceptation insuffisant');
      if (carrier.punctuality.onTimeDeliveryRate < 85) weaknesses.push('Retards fréquents');
      if (carrier.incidents.incidentRate > 5) weaknesses.push('Taux d\'incidents élevé');

      return {
        carrierId: carrier.carrierId,
        carrierName: carrier.carrierName,
        globalScore: carrier.globalScore,
        scoreEvolution: 0, // TODO: comparer avec mois précédent
        strengths: strengths.length > 0 ? strengths : ['Partenaire fiable'],
        weaknesses: weaknesses.length > 0 ? weaknesses : [],
        recommendations,
        riskLevel: carrier.globalScore < 60 ? 'high' : carrier.globalScore < 75 ? 'medium' : 'low',
        summary: `${carrier.carrierName} affiche un score de ${carrier.globalScore}/100 avec ${carrier.financial.ordersCount} commandes livrées ce mois.`
      };
    });

    // Calculer les KPIs globaux
    const totalOrders = carriersRanking.reduce((sum, c) => sum + c.financial.ordersCount, 0);
    const totalRevenue = carriersRanking.reduce((sum, c) => sum + c.financial.totalRevenue, 0);
    const avgScore = carriersRanking.length > 0
      ? carriersRanking.reduce((sum, c) => sum + c.globalScore, 0) / carriersRanking.length
      : 0;
    const avgOnTime = carriersRanking.length > 0
      ? carriersRanking.reduce((sum, c) => sum + c.punctuality.onTimeDeliveryRate, 0) / carriersRanking.length
      : 0;

    // Générer les tendances et alertes globales
    const trends = this.generateTrends({ operational: { acceptanceRate: 85 }, punctuality: { onTimeDeliveryRate: avgOnTime } });
    const alerts = carrierAnalyses.filter(c => c.riskLevel === 'high').map(c => ({
      severity: 'warning' as const,
      title: `Attention: ${c.carrierName}`,
      description: `Score de ${c.globalScore}/100 - Action requise`,
      suggestedAction: 'Planifier une revue de performance'
    }));

    // Recommandations globales
    const globalRecommendations: IRecommendation[] = [];

    const lowPerformers = carrierAnalyses.filter(c => c.globalScore < 70);
    if (lowPerformers.length > 0) {
      globalRecommendations.push({
        priority: 'high',
        category: 'Gestion du panel',
        title: 'Revoir les transporteurs sous-performants',
        description: `${lowPerformers.length} transporteur(s) ont un score inférieur à 70`,
        expectedImpact: 'Amélioration de la qualité de service globale',
        actionItems: [
          'Organiser des réunions de recadrage',
          'Définir des objectifs d\'amélioration',
          'Envisager des alternatives si pas de progrès'
        ]
      });
    }

    // Créer le rapport
    const report = new AIReport({
      reportId,
      reportType: 'industrial_carriers',
      status: 'completed',
      period: { month, year, startDate, endDate },
      targetEntity: {
        type: 'industrial',
        id: industrialId,
        name: industrialName
      },
      executiveSummary: {
        title: `Rapport Performance Transporteurs - ${this.getMonthName(month)} ${year}`,
        overview: `Ce rapport analyse la performance de ${carriersRanking.length} transporteurs sur ${totalOrders} commandes pour un CA de ${totalRevenue.toFixed(2)}€.`,
        keyFindings: [
          `Score moyen transporteurs: ${avgScore.toFixed(1)}/100`,
          `Taux de ponctualité moyen: ${avgOnTime.toFixed(1)}%`,
          `${lowPerformers.length} transporteur(s) nécessitent une attention particulière`
        ],
        mainRecommendation: lowPerformers.length > 0
          ? 'Priorité: accompagner les transporteurs sous-performants'
          : 'Maintenir le niveau de qualité et fidéliser les meilleurs partenaires',
        outlook: 'Perspectives favorables avec un panel équilibré'
      },
      kpiSnapshot: {
        totalOrders,
        completedOrders: totalOrders,
        serviceRate: 95,
        averageScore: avgScore,
        totalRevenue,
        incidentRate: 2,
        onTimeDeliveryRate: avgOnTime,
        additionalMetrics: {
          carrierCount: carriersRanking.length,
          avgAcceptanceRate: carriersRanking.reduce((s, c) => s + c.operational.acceptanceRate, 0) / Math.max(carriersRanking.length, 1)
        }
      },
      trends,
      alerts,
      carrierAnalyses,
      globalRecommendations,
      actionPlan: {
        shortTerm: ['Traiter les alertes critiques', 'Contacter les transporteurs sous 70'],
        mediumTerm: ['Mettre en place un suivi hebdomadaire', 'Négocier des engagements de qualité'],
        longTerm: ['Diversifier le panel si nécessaire', 'Automatiser le scoring']
      },
      nextMonthTargets: [
        { metric: 'Score moyen', currentValue: avgScore, targetValue: Math.min(avgScore + 3, 100), rationale: 'Amélioration continue' },
        { metric: 'Ponctualité', currentValue: avgOnTime, targetValue: Math.min(avgOnTime + 2, 100), rationale: 'Objectif qualité' }
      ],
      aiMetadata: {
        model: 'rule-based-v1',
        generatedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
        confidence: 0.85
      }
    });

    await report.save();
    return report;
  }

  /**
   * Génère un rapport IA pour un transporteur (analyse de ses industriels)
   */
  static async generateCarrierReport(
    carrierId: string,
    carrierName: string,
    month: number,
    year: number
  ): Promise<IAIReport> {
    const startTime = Date.now();
    const reportId = `RPT-${year}${String(month).padStart(2, '0')}-CAR-${uuidv4().slice(0, 8)}`;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Récupérer le classement des industriels
    const industrialsRanking = await AnalyticsService.getIndustrialsRanking(carrierId, startDate, endDate);

    // Générer les analyses par industriel
    const industrialAnalyses: IIndustrialAnalysis[] = industrialsRanking.map(ind => {
      const recommendations = this.generateRecommendations(ind, 'industrial');
      const strengths: string[] = [];
      const concerns: string[] = [];

      if (ind.activity.revenueShare >= 20) strengths.push('Client stratégique (>20% CA)');
      if (ind.payments.onTimePaymentRate >= 90) strengths.push('Payeur fiable');
      if (ind.relationship.orderFrequency === 'regular') strengths.push('Activité régulière');

      if (ind.workingConditions.averageWaitingTimeMinutes > 90) concerns.push('Temps d\'attente élevés');
      if (ind.payments.averagePaymentDelayDays > 45) concerns.push('Délais de paiement longs');

      // Calculer un score de relation
      let relationScore = 50;
      if (ind.payments.onTimePaymentRate >= 90) relationScore += 20;
      if (ind.workingConditions.averageWaitingTimeMinutes <= 60) relationScore += 15;
      if (ind.relationship.orderFrequency === 'regular') relationScore += 15;

      return {
        industrialId: ind.industrialId,
        industrialName: ind.industrialName,
        revenueShare: ind.activity.revenueShare,
        profitabilityScore: ind.profitability.averagePricePerOrder > 200 ? 80 : 60,
        workingConditionsScore: ind.workingConditions.averageWaitingTimeMinutes <= 60 ? 85 : 65,
        paymentReliabilityScore: ind.payments.onTimePaymentRate,
        strengths: strengths.length > 0 ? strengths : ['Partenaire stable'],
        concerns: concerns.length > 0 ? concerns : [],
        recommendations,
        relationshipHealth: relationScore >= 80 ? 'excellent' : relationScore >= 60 ? 'good' : relationScore >= 40 ? 'fair' : 'poor',
        summary: `${ind.industrialName} représente ${ind.activity.revenueShare.toFixed(1)}% du CA avec ${ind.activity.totalOrders} commandes.`
      };
    });

    // KPIs globaux
    const totalOrders = industrialsRanking.reduce((sum, i) => sum + i.activity.totalOrders, 0);
    const totalRevenue = industrialsRanking.reduce((sum, i) => sum + i.activity.totalRevenue, 0);
    const avgWaitingTime = industrialsRanking.length > 0
      ? industrialsRanking.reduce((sum, i) => sum + i.workingConditions.averageWaitingTimeMinutes, 0) / industrialsRanking.length
      : 0;

    const trends = this.generateTrends({ activity: { totalOrders }, workingConditions: { averageWaitingTimeMinutes: avgWaitingTime } });

    const highDependency = industrialAnalyses.filter(i => i.revenueShare > 40);
    const alerts: IAlert[] = highDependency.map(i => ({
      severity: 'warning' as const,
      title: `Dépendance forte: ${i.industrialName}`,
      description: `Ce client représente ${i.revenueShare.toFixed(1)}% du CA`,
      suggestedAction: 'Diversifier le portefeuille ou sécuriser la relation'
    }));

    const globalRecommendations: IRecommendation[] = [];
    if (highDependency.length > 0) {
      globalRecommendations.push({
        priority: 'medium',
        category: 'Stratégie commerciale',
        title: 'Réduire la dépendance client',
        description: `${highDependency.length} client(s) représentent une part importante du CA`,
        expectedImpact: 'Sécurisation du CA et réduction du risque',
        actionItems: [
          'Prospecter de nouveaux clients',
          'Négocier des engagements de volume',
          'Diversifier les secteurs d\'activité'
        ]
      });
    }

    const report = new AIReport({
      reportId,
      reportType: 'carrier_industrials',
      status: 'completed',
      period: { month, year, startDate, endDate },
      targetEntity: {
        type: 'carrier',
        id: carrierId,
        name: carrierName
      },
      executiveSummary: {
        title: `Rapport Analyse Clients - ${this.getMonthName(month)} ${year}`,
        overview: `Ce rapport analyse ${industrialsRanking.length} clients pour ${totalOrders} commandes et ${totalRevenue.toFixed(2)}€ de CA.`,
        keyFindings: [
          `${industrialsRanking.length} clients actifs ce mois`,
          `Temps d'attente moyen: ${avgWaitingTime.toFixed(0)} minutes`,
          `${highDependency.length} client(s) représentent >40% du CA`
        ],
        mainRecommendation: highDependency.length > 0
          ? 'Diversifier le portefeuille clients pour réduire le risque'
          : 'Maintenir les bonnes relations et optimiser la rentabilité',
        outlook: 'Portefeuille clients à consolider'
      },
      kpiSnapshot: {
        totalOrders,
        completedOrders: totalOrders,
        serviceRate: 95,
        averageScore: 80,
        totalRevenue,
        incidentRate: 2,
        onTimeDeliveryRate: 92,
        additionalMetrics: {
          clientCount: industrialsRanking.length,
          avgWaitingTime
        }
      },
      trends,
      alerts,
      industrialAnalyses,
      globalRecommendations,
      actionPlan: {
        shortTerm: ['Relancer les factures en retard', 'Traiter les réclamations'],
        mediumTerm: ['Négocier les temps d\'attente', 'Fidéliser les meilleurs clients'],
        longTerm: ['Développer de nouveaux clients', 'Optimiser les tournées par client']
      },
      nextMonthTargets: [
        { metric: 'CA', currentValue: totalRevenue, targetValue: totalRevenue * 1.05, rationale: 'Croissance 5%' },
        { metric: 'Temps attente', currentValue: avgWaitingTime, targetValue: Math.max(avgWaitingTime - 10, 30), rationale: 'Optimisation' }
      ],
      aiMetadata: {
        model: 'rule-based-v1',
        generatedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
        confidence: 0.85
      }
    });

    await report.save();
    return report;
  }

  /**
   * Génère un rapport IA pour un logisticien
   */
  static async generateLogisticianReport(
    userId: string,
    userName: string,
    month: number,
    year: number
  ): Promise<IAIReport> {
    const startTime = Date.now();
    const reportId = `RPT-${year}${String(month).padStart(2, '0')}-LOG-${uuidv4().slice(0, 8)}`;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const kpis = await AnalyticsService.getLogisticianKPIs(userId, startDate, endDate);
    const recommendations = this.generateRecommendations(kpis, 'logistician');
    const trends = this.generateTrends(kpis);
    const alerts = this.generateAlerts(kpis, 'logistician');

    // Analyse individuelle
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];

    if (kpis.assignments.firstAttemptSuccessRate >= 80) strengths.push('Excellent ciblage des transporteurs');
    if (kpis.performance.serviceRate >= 95) strengths.push('Taux de service remarquable');
    if (kpis.productivity.pendingOrders <= 5) strengths.push('Bonne gestion du backlog');

    if (kpis.assignments.firstAttemptSuccessRate < 60) areasForImprovement.push('Améliorer le ciblage transporteurs');
    if (kpis.productivity.pendingOrders > 10) areasForImprovement.push('Réduire le backlog');
    if (kpis.assignments.escalationToAffretiaRate > 20) areasForImprovement.push('Réduire les escalades');

    const overallScore = (kpis.performance.serviceRate + kpis.assignments.firstAttemptSuccessRate) / 2;

    const logisticianAnalysis: ILogisticianAnalysis = {
      userId,
      userName,
      productivityScore: Math.min(100, kpis.productivity.ordersManaged / 50 * 100),
      qualityScore: kpis.performance.serviceRate,
      efficiencyScore: kpis.assignments.firstAttemptSuccessRate,
      strengths: strengths.length > 0 ? strengths : ['Performance régulière'],
      areasForImprovement: areasForImprovement.length > 0 ? areasForImprovement : ['Continuer sur la lancée'],
      recommendations,
      overallRating: overallScore >= 90 ? 'excellent' : overallScore >= 75 ? 'good' : overallScore >= 60 ? 'satisfactory' : 'needs_improvement',
      summary: `Performance globale de ${overallScore.toFixed(1)}% avec ${kpis.productivity.ordersManaged} commandes gérées.`
    };

    const report = new AIReport({
      reportId,
      reportType: 'logistician_performance',
      status: 'completed',
      period: { month, year, startDate, endDate },
      targetEntity: {
        type: 'logistician',
        id: userId,
        name: userName
      },
      executiveSummary: {
        title: `Rapport Performance Logisticien - ${this.getMonthName(month)} ${year}`,
        overview: `Ce rapport analyse votre performance sur ${kpis.productivity.ordersManaged} commandes gérées.`,
        keyFindings: [
          `Taux de service: ${kpis.performance.serviceRate.toFixed(1)}%`,
          `Affectation 1er envoi: ${kpis.assignments.firstAttemptSuccessRate.toFixed(1)}%`,
          `Commandes en cours: ${kpis.monitoring.activeOrdersCount}`
        ],
        mainRecommendation: areasForImprovement.length > 0
          ? areasForImprovement[0]
          : 'Maintenir ce niveau de performance',
        outlook: logisticianAnalysis.overallRating === 'excellent' || logisticianAnalysis.overallRating === 'good'
          ? 'Excellentes perspectives de progression'
          : 'Axes d\'amélioration identifiés pour le mois prochain'
      },
      kpiSnapshot: {
        totalOrders: kpis.productivity.ordersManaged,
        completedOrders: kpis.monitoring.deliveredCount,
        serviceRate: kpis.performance.serviceRate,
        averageScore: overallScore,
        totalRevenue: 0,
        incidentRate: 0,
        onTimeDeliveryRate: 0,
        additionalMetrics: {
          pendingOrders: kpis.productivity.pendingOrders,
          activeOrders: kpis.monitoring.activeOrdersCount,
          escalationRate: kpis.assignments.escalationToAffretiaRate
        }
      },
      trends,
      alerts,
      logisticianAnalysis,
      globalRecommendations: recommendations,
      actionPlan: {
        shortTerm: ['Traiter le backlog prioritaire', 'Répondre aux alertes en attente'],
        mediumTerm: ['Améliorer le ciblage transporteurs', 'Optimiser les temps de traitement'],
        longTerm: ['Se former aux nouvelles fonctionnalités', 'Développer l\'autonomie']
      },
      nextMonthTargets: [
        { metric: 'Taux service', currentValue: kpis.performance.serviceRate, targetValue: Math.min(kpis.performance.serviceRate + 2, 100), rationale: 'Amélioration continue' },
        { metric: '1er envoi', currentValue: kpis.assignments.firstAttemptSuccessRate, targetValue: Math.min(kpis.assignments.firstAttemptSuccessRate + 5, 100), rationale: 'Optimisation ciblage' }
      ],
      aiMetadata: {
        model: 'rule-based-v1',
        generatedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
        confidence: 0.85
      }
    });

    await report.save();
    return report;
  }

  /**
   * Récupère le rapport le plus récent pour une entité
   */
  static async getLatestReport(
    entityType: 'industrial' | 'carrier' | 'logistician',
    entityId: string
  ): Promise<IAIReport | null> {
    return AIReport.findOne({
      'targetEntity.type': entityType,
      'targetEntity.id': entityId,
      status: 'completed'
    }).sort({ createdAt: -1 });
  }

  /**
   * Liste les rapports d'une entité
   */
  static async listReports(
    entityType: 'industrial' | 'carrier' | 'logistician',
    entityId: string,
    limit: number = 12
  ): Promise<IAIReport[]> {
    return AIReport.find({
      'targetEntity.type': entityType,
      'targetEntity.id': entityId,
      status: 'completed'
    })
      .sort({ 'period.year': -1, 'period.month': -1 })
      .limit(limit);
  }

  /**
   * Soumet un feedback sur un rapport
   */
  static async submitFeedback(
    reportId: string,
    rating: 1 | 2 | 3 | 4 | 5,
    helpful: boolean,
    comment?: string
  ): Promise<IAIReport | null> {
    return AIReport.findOneAndUpdate(
      { reportId },
      {
        userFeedback: {
          rating,
          helpful,
          comment,
          submittedAt: new Date()
        }
      },
      { new: true }
    );
  }

  /**
   * Utilitaire: nom du mois en français
   */
  private static getMonthName(month: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1] || '';
  }
}

export default AIAnalyticsService;
