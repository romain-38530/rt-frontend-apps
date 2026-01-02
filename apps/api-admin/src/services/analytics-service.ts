/**
 * Service d'Analytics Avancé
 * Fournit des métriques complètes pour le suivi d'activité
 */

import LeadCompany from '../models/LeadCompany';
import LeadContact from '../models/LeadContact';
import LeadSalon from '../models/LeadSalon';
import LeadInteraction from '../models/LeadInteraction';
import LeadEmail from '../models/LeadEmail';
import CrmCommercial from '../models/CrmCommercial';
import CrmCommission from '../models/CrmCommission';

interface DateRange {
  start: Date;
  end: Date;
}

class AnalyticsService {
  /**
   * Obtenir la plage de dates pour une période
   */
  getDateRange(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month'): DateRange {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { start, end: now };
  }

  /**
   * Métriques de génération de leads
   */
  async getLeadGenerationMetrics(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const { start, end } = this.getDateRange(period);
    const previousStart = new Date(start);
    previousStart.setTime(previousStart.getTime() - (end.getTime() - start.getTime()));

    // Leads actuels
    const [
      totalLeads,
      newLeads,
      previousNewLeads,
      leadsByStatus,
      leadsByCountry,
      leadsBySource,
      enrichedLeads,
      leadsWithEmail,
      leadsWithPhone,
      leadsInPool
    ] = await Promise.all([
      LeadCompany.countDocuments(),
      LeadCompany.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      LeadCompany.countDocuments({ createdAt: { $gte: previousStart, $lt: start } }),
      LeadCompany.aggregate([
        { $group: { _id: '$statutProspection', count: { $sum: 1 } } }
      ]),
      LeadCompany.aggregate([
        { $group: { _id: '$adresse.pays', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      LeadSalon.aggregate([
        { $lookup: { from: 'leadcompanies', localField: '_id', foreignField: 'salonSourceId', as: 'leads' } },
        { $project: { nom: 1, nbLeads: { $size: '$leads' } } },
        { $sort: { nbLeads: -1 } },
        { $limit: 10 }
      ]),
      LeadCompany.countDocuments({ statutProspection: { $in: ['ENRICHED', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED'] } }),
      LeadCompany.countDocuments({ emailGenerique: { $exists: true, $ne: null } }),
      LeadCompany.countDocuments({ telephone: { $exists: true, $ne: null } }),
      LeadCompany.countDocuments({ inPool: true })
    ]);

    const growth = previousNewLeads > 0
      ? ((newLeads - previousNewLeads) / previousNewLeads * 100).toFixed(1)
      : newLeads > 0 ? '100' : '0';

    return {
      total: totalLeads,
      new: newLeads,
      growth: parseFloat(growth as string),
      enriched: enrichedLeads,
      enrichmentRate: totalLeads > 0 ? ((enrichedLeads / totalLeads) * 100).toFixed(1) : 0,
      withEmail: leadsWithEmail,
      emailRate: totalLeads > 0 ? ((leadsWithEmail / totalLeads) * 100).toFixed(1) : 0,
      withPhone: leadsWithPhone,
      phoneRate: totalLeads > 0 ? ((leadsWithPhone / totalLeads) * 100).toFixed(1) : 0,
      inPool: leadsInPool,
      byStatus: leadsByStatus.reduce((acc, item) => {
        acc[item._id || 'UNKNOWN'] = item.count;
        return acc;
      }, {} as Record<string, number>),
      byCountry: leadsByCountry.map(c => ({ country: c._id || 'Unknown', count: c.count })),
      bySource: leadsBySource.map(s => ({ salon: s.nom, leads: s.nbLeads }))
    };
  }

  /**
   * Métriques des contacts
   */
  async getContactMetrics(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const { start, end } = this.getDateRange(period);

    const [
      totalContacts,
      newContacts,
      contactsByStatus,
      contactsBySeniority,
      validEmails,
      invalidEmails
    ] = await Promise.all([
      LeadContact.countDocuments(),
      LeadContact.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      LeadContact.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      LeadContact.aggregate([
        { $group: { _id: '$seniorityLevel', count: { $sum: 1 } } }
      ]),
      LeadContact.countDocuments({ emailValidationStatus: 'VALID' }),
      LeadContact.countDocuments({ emailValidationStatus: 'INVALID' })
    ]);

    return {
      total: totalContacts,
      new: newContacts,
      validEmails,
      invalidEmails,
      emailValidityRate: totalContacts > 0 ? ((validEmails / totalContacts) * 100).toFixed(1) : 0,
      byStatus: contactsByStatus.reduce((acc, item) => {
        acc[item._id || 'UNKNOWN'] = item.count;
        return acc;
      }, {} as Record<string, number>),
      bySeniority: contactsBySeniority.reduce((acc, item) => {
        acc[item._id || 'unknown'] = item.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Métriques des campagnes email
   */
  async getEmailCampaignMetrics(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const { start, end } = this.getDateRange(period);

    const [
      totalSent,
      delivered,
      opened,
      clicked,
      bounced,
      unsubscribed,
      emailsByType,
      emailsByStatus,
      topPerformingEmails
    ] = await Promise.all([
      LeadEmail.countDocuments({ sentAt: { $gte: start, $lte: end } }),
      LeadEmail.countDocuments({ status: 'DELIVERED', sentAt: { $gte: start, $lte: end } }),
      LeadEmail.countDocuments({ status: { $in: ['OPENED', 'CLICKED'] }, sentAt: { $gte: start, $lte: end } }),
      LeadEmail.countDocuments({ status: 'CLICKED', sentAt: { $gte: start, $lte: end } }),
      LeadEmail.countDocuments({ status: 'BOUNCED', sentAt: { $gte: start, $lte: end } }),
      LeadEmail.countDocuments({ status: 'UNSUBSCRIBED', sentAt: { $gte: start, $lte: end } }),
      LeadEmail.aggregate([
        { $match: { sentAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      LeadEmail.aggregate([
        { $match: { sentAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      LeadEmail.aggregate([
        { $match: { sentAt: { $gte: start, $lte: end }, openCount: { $gt: 0 } } },
        { $group: {
          _id: '$type',
          sent: { $sum: 1 },
          opened: { $sum: { $cond: [{ $gt: ['$openCount', 0] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $gt: ['$clickCount', 0] }, 1, 0] } }
        }},
        { $project: {
          type: '$_id',
          sent: 1,
          opened: 1,
          clicked: 1,
          openRate: { $multiply: [{ $divide: ['$opened', '$sent'] }, 100] },
          clickRate: { $multiply: [{ $divide: ['$clicked', '$sent'] }, 100] }
        }}
      ])
    ]);

    return {
      sent: totalSent,
      delivered,
      deliveryRate: totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(1) : 0,
      opened,
      openRate: delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : 0,
      clicked,
      clickRate: opened > 0 ? ((clicked / opened) * 100).toFixed(1) : 0,
      bounced,
      bounceRate: totalSent > 0 ? ((bounced / totalSent) * 100).toFixed(1) : 0,
      unsubscribed,
      unsubscribeRate: delivered > 0 ? ((unsubscribed / delivered) * 100).toFixed(1) : 0,
      byType: emailsByType.reduce((acc, item) => {
        acc[item._id || 'UNKNOWN'] = item.count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: emailsByStatus.reduce((acc, item) => {
        acc[item._id || 'UNKNOWN'] = item.count;
        return acc;
      }, {} as Record<string, number>),
      performance: topPerformingEmails
    };
  }

  /**
   * Métriques du pipeline commercial
   */
  async getPipelineMetrics(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const { start, end } = this.getDateRange(period);

    const [
      conversions,
      totalConverted,
      leadsByStage,
      avgDaysInPipeline,
      conversionsByCommercial
    ] = await Promise.all([
      LeadCompany.countDocuments({
        statutProspection: 'CONVERTED',
        updatedAt: { $gte: start, $lte: end }
      }),
      LeadCompany.countDocuments({ statutProspection: 'CONVERTED' }),
      LeadCompany.aggregate([
        { $group: {
          _id: '$statutProspection',
          count: { $sum: 1 },
          avgDays: {
            $avg: {
              $divide: [
                { $subtract: ['$updatedAt', '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }}
      ]),
      LeadCompany.aggregate([
        { $match: { statutProspection: 'CONVERTED' } },
        { $project: {
          daysInPipeline: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }},
        { $group: { _id: null, avgDays: { $avg: '$daysInPipeline' } } }
      ]),
      LeadCompany.aggregate([
        { $match: {
          statutProspection: 'CONVERTED',
          commercialAssigneId: { $exists: true },
          updatedAt: { $gte: start, $lte: end }
        }},
        { $group: { _id: '$commercialAssigneId', count: { $sum: 1 } } },
        { $lookup: { from: 'crmcommercials', localField: '_id', foreignField: '_id', as: 'commercial' } },
        { $unwind: { path: '$commercial', preserveNullAndEmptyArrays: true } },
        { $project: {
          name: { $concat: ['$commercial.prenom', ' ', '$commercial.nom'] },
          conversions: '$count'
        }}
      ])
    ]);

    const totalInPipeline = leadsByStage.reduce((sum, stage) => sum + stage.count, 0);
    const inProgress = leadsByStage.find(s => s._id === 'IN_PROGRESS')?.count || 0;
    const contacted = leadsByStage.find(s => s._id === 'CONTACTED')?.count || 0;

    return {
      conversions,
      totalConverted,
      conversionRate: totalInPipeline > 0 ? ((totalConverted / totalInPipeline) * 100).toFixed(2) : 0,
      inProgress,
      contacted,
      avgDaysToConvert: avgDaysInPipeline[0]?.avgDays?.toFixed(1) || 0,
      byStage: leadsByStage.map(s => ({
        stage: s._id || 'UNKNOWN',
        count: s.count,
        avgDays: s.avgDays?.toFixed(1) || 0
      })),
      topPerformers: conversionsByCommercial
    };
  }

  /**
   * Métriques de performance commerciale
   */
  async getCommercialPerformanceMetrics(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const { start, end } = this.getDateRange(period);

    const [
      commercials,
      commissions,
      pendingCommissions,
      paidCommissions,
      leadsAssigned,
      leadsConverted
    ] = await Promise.all([
      CrmCommercial.find({ status: 'active' }).lean(),
      CrmCommission.aggregate([
        { $match: { dateGeneration: { $gte: start, $lte: end } } },
        { $group: {
          _id: '$commercialId',
          total: { $sum: '$montant' },
          count: { $sum: 1 }
        }}
      ]),
      CrmCommission.aggregate([
        { $match: { statut: 'pending' } },
        { $group: { _id: null, total: { $sum: '$montant' } } }
      ]),
      CrmCommission.aggregate([
        { $match: { statut: 'paid', datePaiement: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$montant' } } }
      ]),
      LeadCompany.aggregate([
        { $match: {
          commercialAssigneId: { $exists: true },
          dateAssignation: { $gte: start, $lte: end }
        }},
        { $group: { _id: '$commercialAssigneId', count: { $sum: 1 } } }
      ]),
      LeadCompany.aggregate([
        { $match: {
          commercialAssigneId: { $exists: true },
          statutProspection: 'CONVERTED',
          updatedAt: { $gte: start, $lte: end }
        }},
        { $group: { _id: '$commercialAssigneId', count: { $sum: 1 } } }
      ])
    ]);

    const commercialStats = commercials.map(comm => {
      const commId = comm._id?.toString();
      const assigned = leadsAssigned.find(l => l._id?.toString() === commId)?.count || 0;
      const converted = leadsConverted.find(l => l._id?.toString() === commId)?.count || 0;
      const commissionData = commissions.find(c => c._id?.toString() === commId);

      return {
        id: commId,
        name: `${(comm as any).firstName || ''} ${(comm as any).lastName || ''}`.trim(),
        type: (comm as any).type,
        leadsAssigned: assigned,
        leadsConverted: converted,
        conversionRate: assigned > 0 ? ((converted / assigned) * 100).toFixed(1) : 0,
        commissionsEarned: commissionData?.total || 0,
        target: (comm as any).objectifMensuel || 0,
        targetProgress: (comm as any).objectifMensuel ? ((converted / (comm as any).objectifMensuel) * 100).toFixed(1) : 0
      };
    });

    return {
      totalCommercials: commercials.length,
      activeCommercials: commercials.filter(c => (c as any).status === 'active').length,
      totalCommissions: commissions.reduce((sum, c) => sum + c.total, 0),
      pendingCommissions: pendingCommissions[0]?.total || 0,
      paidCommissions: paidCommissions[0]?.total || 0,
      commercials: commercialStats,
      topPerformers: commercialStats
        .sort((a, b) => b.leadsConverted - a.leadsConverted)
        .slice(0, 5)
    };
  }

  /**
   * Métriques des salons/sources
   */
  async getSalonMetrics() {
    const [
      totalSalons,
      activeSalons,
      completedScraping,
      pendingScraping,
      salonsByStatus,
      topSalons
    ] = await Promise.all([
      LeadSalon.countDocuments(),
      LeadSalon.countDocuments({ statutScraping: { $in: ['A_SCRAPER', 'EN_COURS'] } }),
      LeadSalon.countDocuments({ statutScraping: 'TERMINE' }),
      LeadSalon.countDocuments({ statutScraping: 'A_SCRAPER' }),
      LeadSalon.aggregate([
        { $group: { _id: '$statutScraping', count: { $sum: 1 } } }
      ]),
      LeadSalon.aggregate([
        { $sort: { nbExposantsCollectes: -1 } },
        { $limit: 10 },
        { $project: { nom: 1, pays: 1, nbExposantsCollectes: 1, statutScraping: 1 } }
      ])
    ]);

    return {
      total: totalSalons,
      active: activeSalons,
      completed: completedScraping,
      pending: pendingScraping,
      byStatus: salonsByStatus.reduce((acc, item) => {
        acc[item._id || 'UNKNOWN'] = item.count;
        return acc;
      }, {} as Record<string, number>),
      top: topSalons
    };
  }

  /**
   * Métriques d'interactions/activité
   */
  async getInteractionMetrics(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const { start, end } = this.getDateRange(period);

    const [
      totalInteractions,
      interactionsByType,
      interactionsByDay,
      recentInteractions
    ] = await Promise.all([
      LeadInteraction.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      LeadInteraction.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      LeadInteraction.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      LeadInteraction.find({ createdAt: { $gte: start, $lte: end } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('entrepriseId', 'raisonSociale')
        .populate('contactId', 'prenom nom')
        .lean()
    ]);

    return {
      total: totalInteractions,
      byType: interactionsByType.reduce((acc, item) => {
        acc[item._id || 'UNKNOWN'] = item.count;
        return acc;
      }, {} as Record<string, number>),
      trend: interactionsByDay.map(d => ({
        date: d._id,
        count: d.count
      })),
      recent: recentInteractions.map(i => ({
        type: (i as any).typeInteraction,
        company: (i as any).entrepriseId?.raisonSociale || 'N/A',
        contact: (i as any).contactId ? `${(i as any).contactId.prenom} ${(i as any).contactId.nom}` : null,
        date: i.createdAt,
        description: (i as any).description
      }))
    };
  }

  /**
   * Métriques de qualité des données
   */
  async getDataQualityMetrics() {
    const [
      totalLeads,
      leadsWithAllData,
      leadsWithEmail,
      leadsWithPhone,
      leadsWithAddress,
      leadsWithSiren,
      leadsWithTurnover,
      duplicateCheck
    ] = await Promise.all([
      LeadCompany.countDocuments(),
      LeadCompany.countDocuments({
        emailGenerique: { $exists: true, $ne: null },
        telephone: { $exists: true, $ne: null },
        'adresse.ville': { $exists: true, $ne: null }
      }),
      LeadCompany.countDocuments({ emailGenerique: { $exists: true, $nin: [null, ''] } }),
      LeadCompany.countDocuments({ telephone: { $exists: true, $nin: [null, ''] } }),
      LeadCompany.countDocuments({ 'adresse.ville': { $exists: true, $nin: [null, ''] } }),
      LeadCompany.countDocuments({ siren: { $exists: true, $nin: [null, ''] } }),
      LeadCompany.countDocuments({ trancheCA: { $exists: true, $ne: null } }),
      LeadCompany.aggregate([
        { $group: { _id: '$raisonSociale', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $count: 'duplicates' }
      ])
    ]);

    const completenessScore = totalLeads > 0
      ? (((leadsWithEmail + leadsWithPhone + leadsWithAddress) / (totalLeads * 3)) * 100).toFixed(1)
      : 0;

    return {
      totalRecords: totalLeads,
      completeRecords: leadsWithAllData,
      completenessScore,
      fields: {
        email: { count: leadsWithEmail, rate: ((leadsWithEmail / totalLeads) * 100).toFixed(1) },
        phone: { count: leadsWithPhone, rate: ((leadsWithPhone / totalLeads) * 100).toFixed(1) },
        address: { count: leadsWithAddress, rate: ((leadsWithAddress / totalLeads) * 100).toFixed(1) },
        siren: { count: leadsWithSiren, rate: ((leadsWithSiren / totalLeads) * 100).toFixed(1) },
        turnover: { count: leadsWithTurnover, rate: ((leadsWithTurnover / totalLeads) * 100).toFixed(1) }
      },
      duplicates: duplicateCheck[0]?.duplicates || 0
    };
  }

  /**
   * Dashboard complet
   */
  async getFullDashboard(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const [
      leads,
      contacts,
      emails,
      pipeline,
      commercial,
      salons,
      interactions,
      dataQuality
    ] = await Promise.all([
      this.getLeadGenerationMetrics(period),
      this.getContactMetrics(period),
      this.getEmailCampaignMetrics(period),
      this.getPipelineMetrics(period),
      this.getCommercialPerformanceMetrics(period),
      this.getSalonMetrics(),
      this.getInteractionMetrics(period),
      this.getDataQualityMetrics()
    ]);

    return {
      period,
      generatedAt: new Date(),
      leads,
      contacts,
      emails,
      pipeline,
      commercial,
      salons,
      interactions,
      dataQuality,
      summary: {
        totalLeads: leads.total,
        newLeads: leads.new,
        leadGrowth: leads.growth,
        conversionRate: pipeline.conversionRate,
        emailOpenRate: emails.openRate,
        dataQualityScore: dataQuality.completenessScore,
        pendingCommissions: commercial.pendingCommissions
      }
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
