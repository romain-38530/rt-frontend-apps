/**
 * Routes: AI Planning Optimization
 * Moteur IA pour suggestion de créneaux et résolution de conflits
 */

import { Router, Request, Response } from 'express';
import { TimeSlot, Booking, Site, Dock, DriverCheckin } from '../models';

const router = Router();

// ============================================
// AI SLOT SUGGESTIONS
// ============================================

// POST /ai/suggest-slots - Suggérer les meilleurs créneaux
router.post('/suggest-slots', async (req: Request, res: Response) => {
  try {
    const {
      siteId,
      requestedDate,
      requestedTimeSlot,
      flowType,
      cargo,
      transporterOrgId,
      maxSuggestions = 5
    } = req.body;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ success: false, error: 'Site non trouvé' });
    }

    // Récupérer les créneaux disponibles sur 7 jours
    const dateStart = new Date(requestedDate);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 7);

    const query: any = {
      siteId,
      date: {
        $gte: dateStart.toISOString().split('T')[0],
        $lte: dateEnd.toISOString().split('T')[0]
      },
      status: { $in: ['available', 'partial'] }
    };

    // Filtrer par type de flux si nécessaire
    if (cargo?.isAdr) {
      query.isAdr = true;
    }

    const slots = await TimeSlot.find(query).sort({ date: 1, startTime: 1 });

    // Récupérer l'historique du transporteur pour le scoring
    const transporterHistory = await Booking.find({
      'transporter.orgId': transporterOrgId,
      siteId,
      status: 'completed'
    }).limit(50).sort({ createdAt: -1 });

    // Calculer le score de fiabilité du transporteur
    const totalBookings = transporterHistory.length;
    const onTimeBookings = transporterHistory.filter(b =>
      b.metrics?.waitTimeMinutes && b.metrics.waitTimeMinutes < 30
    ).length;
    const transporterReliability = totalBookings > 0 ? onTimeBookings / totalBookings : 0.5;

    // Récupérer les statistiques de temps d'attente par créneau
    const recentBookings = await Booking.find({
      siteId,
      status: 'completed',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Calculer le temps d'attente moyen par heure
    const waitTimeByHour: Record<number, number[]> = {};
    recentBookings.forEach(b => {
      if (b.confirmedTimeSlot?.start && b.metrics?.waitTimeMinutes) {
        const hour = parseInt(b.confirmedTimeSlot.start.split(':')[0]);
        if (!waitTimeByHour[hour]) waitTimeByHour[hour] = [];
        waitTimeByHour[hour].push(b.metrics.waitTimeMinutes);
      }
    });

    const avgWaitByHour: Record<number, number> = {};
    Object.keys(waitTimeByHour).forEach(hour => {
      const times = waitTimeByHour[parseInt(hour)];
      avgWaitByHour[parseInt(hour)] = times.reduce((a, b) => a + b, 0) / times.length;
    });

    // Scorer chaque créneau
    const suggestions = slots.map(slot => {
      const hour = parseInt(slot.startTime.split(':')[0]);
      const avgWait = avgWaitByHour[hour] || 15;

      // Score de disponibilité (plus le créneau est vide, mieux c'est)
      const availabilityScore = (slot.availableCapacity / slot.totalCapacity) * 30;

      // Score de temps d'attente (moins il y a d'attente, mieux c'est)
      const waitScore = Math.max(0, 30 - avgWait);

      // Score de proximité avec la date demandée
      const daysFromRequest = Math.abs(
        (new Date(slot.date).getTime() - new Date(requestedDate).getTime()) / (24 * 60 * 60 * 1000)
      );
      const proximityScore = Math.max(0, 20 - daysFromRequest * 3);

      // Score de correspondance horaire
      let timeMatchScore = 0;
      if (requestedTimeSlot) {
        const requestedHour = parseInt(requestedTimeSlot.start.split(':')[0]);
        const slotHour = parseInt(slot.startTime.split(':')[0]);
        timeMatchScore = Math.max(0, 20 - Math.abs(requestedHour - slotHour) * 4);
      } else {
        timeMatchScore = 10;
      }

      const totalScore = availabilityScore + waitScore + proximityScore + timeMatchScore;

      return {
        slotId: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dockId: slot.dockId,
        score: Math.round(totalScore),
        estimatedWaitMinutes: Math.round(avgWait),
        confidence: Math.min(1, totalScore / 100),
        reasons: [
          availabilityScore > 20 ? 'Créneau très disponible' : 'Capacité limitée',
          waitScore > 20 ? 'Temps d\'attente court' : 'Pic d\'affluence',
          proximityScore > 15 ? 'Date proche de votre demande' : 'Date alternative',
          timeMatchScore > 15 ? 'Horaire correspondant' : 'Horaire alternatif'
        ].filter((_, i) => [availabilityScore, waitScore, proximityScore, timeMatchScore][i] > 10)
      };
    });

    // Trier par score et limiter
    suggestions.sort((a, b) => b.score - a.score);
    const topSuggestions = suggestions.slice(0, maxSuggestions);

    // Enrichir avec les infos des quais
    const enrichedSuggestions = await Promise.all(
      topSuggestions.map(async (suggestion) => {
        const dock = await Dock.findById(suggestion.dockId);
        return {
          ...suggestion,
          dockName: dock?.name || 'Quai'
        };
      })
    );

    res.json({
      success: true,
      data: {
        suggestions: enrichedSuggestions,
        recommendedSlotId: enrichedSuggestions[0]?.slotId,
        factors: {
          transporterReliability: Math.round(transporterReliability * 100),
          averageSiteWaitTime: Math.round(
            Object.values(avgWaitByHour).reduce((a, b) => a + b, 0) /
            Math.max(1, Object.keys(avgWaitByHour).length)
          ),
          slotsAnalyzed: slots.length,
          daysSearched: 7
        },
        reasoning: generateReasoning(enrichedSuggestions[0], transporterReliability)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /ai/optimize-planning - Optimiser le planning global
router.post('/optimize-planning', async (req: Request, res: Response) => {
  try {
    const { siteId, date } = req.body;

    // Récupérer toutes les réservations du jour
    const bookings = await Booking.find({
      siteId,
      $or: [
        { requestedDate: date },
        { confirmedDate: date }
      ],
      status: { $in: ['confirmed', 'requested'] }
    });

    // Récupérer les quais disponibles
    const docks = await Dock.find({ siteId, active: true, status: 'available' });

    // Algorithme d'optimisation simple: répartir équitablement
    const optimizedAssignments: any[] = [];
    const dockLoads: Record<string, number> = {};

    docks.forEach(dock => {
      dockLoads[dock._id.toString()] = 0;
    });

    // Trier les réservations par heure
    bookings.sort((a, b) => {
      const aTime = a.confirmedTimeSlot?.start || a.requestedTimeSlot.start;
      const bTime = b.confirmedTimeSlot?.start || b.requestedTimeSlot.start;
      return aTime.localeCompare(bTime);
    });

    // Assigner chaque réservation au quai le moins chargé compatible
    for (const booking of bookings) {
      let bestDock = null;
      let minLoad = Infinity;

      for (const dock of docks) {
        // Vérifier la compatibilité
        if (booking.cargo.isAdr && !dock.adrOnly && dock.type !== 'adr') continue;
        if (booking.cargo.temperatureRequired && !dock.hasRefrigeration) continue;

        const load = dockLoads[dock._id.toString()];
        if (load < minLoad) {
          minLoad = load;
          bestDock = dock;
        }
      }

      if (bestDock) {
        dockLoads[bestDock._id.toString()]++;
        optimizedAssignments.push({
          bookingId: booking._id,
          bookingReference: booking.reference,
          suggestedDockId: bestDock._id,
          suggestedDockName: bestDock.name,
          currentDockId: booking.dockId,
          reassignmentNeeded: booking.dockId !== bestDock._id.toString()
        });
      }
    }

    // Statistiques d'optimisation
    const reassignments = optimizedAssignments.filter(a => a.reassignmentNeeded).length;

    res.json({
      success: true,
      data: {
        assignments: optimizedAssignments,
        stats: {
          totalBookings: bookings.length,
          docksUsed: docks.length,
          reassignmentsNeeded: reassignments,
          loadBalance: dockLoads
        },
        recommendation: reassignments > 0
          ? `${reassignments} réaffectation(s) suggérée(s) pour équilibrer la charge`
          : 'Le planning est déjà optimisé'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /ai/resolve-conflict - Résoudre un conflit de planning
router.post('/resolve-conflict', async (req: Request, res: Response) => {
  try {
    const { slotId, conflictingBookingIds } = req.body;

    const slot = await TimeSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, error: 'Créneau non trouvé' });
    }

    // Récupérer les réservations en conflit
    const bookings = await Booking.find({
      _id: { $in: conflictingBookingIds }
    });

    // Trouver des créneaux alternatifs
    const alternatives = await TimeSlot.find({
      siteId: slot.siteId,
      date: slot.date,
      status: { $in: ['available', 'partial'] },
      _id: { $ne: slotId }
    }).limit(5);

    // Proposer des solutions
    const solutions: any[] = [];

    for (const booking of bookings) {
      // Option 1: Autre créneau même jour
      const sameDayAlt = alternatives.find(a =>
        a.availableCapacity > 0 &&
        (!booking.cargo.isAdr || a.isAdr)
      );

      if (sameDayAlt) {
        const dock = await Dock.findById(sameDayAlt.dockId);
        solutions.push({
          type: 'reschedule',
          description: `Déplacer ${booking.reference} vers ${sameDayAlt.startTime}-${sameDayAlt.endTime}`,
          affectedBookingId: booking._id,
          newSlotId: sameDayAlt._id,
          newDockId: sameDayAlt.dockId,
          newDockName: dock?.name,
          impact: 'low'
        });
      } else {
        // Option 2: Autre quai même heure
        const sameSiteDocks = await Dock.find({
          siteId: slot.siteId,
          active: true,
          _id: { $ne: slot.dockId }
        });

        for (const dock of sameSiteDocks) {
          const dockSlot = await TimeSlot.findOne({
            dockId: dock._id,
            date: slot.date,
            startTime: slot.startTime,
            status: { $in: ['available', 'partial'] }
          });

          if (dockSlot && dockSlot.availableCapacity > 0) {
            solutions.push({
              type: 'reassign_dock',
              description: `Déplacer ${booking.reference} vers ${dock.name}`,
              affectedBookingId: booking._id,
              newSlotId: dockSlot._id,
              newDockId: dock._id,
              newDockName: dock.name,
              impact: 'low'
            });
            break;
          }
        }
      }
    }

    // Si pas de solution automatique
    if (solutions.length < bookings.length) {
      solutions.push({
        type: 'manual',
        description: 'Intervention manuelle requise pour certaines réservations',
        impact: 'high'
      });
    }

    res.json({
      success: true,
      data: {
        conflictType: 'capacity',
        affectedBookings: bookings.map(b => ({
          id: b._id,
          reference: b.reference,
          transporter: b.transporter.orgName
        })),
        proposedSolutions: solutions,
        autoResolved: solutions.every(s => s.type !== 'manual'),
        recommendation: solutions.length > 0
          ? solutions[0].description
          : 'Aucune solution automatique disponible'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /ai/predict-wait-time - Prédire le temps d'attente
router.post('/predict-wait-time', async (req: Request, res: Response) => {
  try {
    const { siteId, date, timeSlot } = req.body;

    // Récupérer l'historique
    const hour = parseInt(timeSlot.start.split(':')[0]);
    const dayOfWeek = new Date(date).getDay();

    const historicalData = await Booking.find({
      siteId,
      status: 'completed',
      'confirmedTimeSlot.start': { $regex: `^${String(hour).padStart(2, '0')}` }
    }).limit(100);

    // Calculer les statistiques
    const waitTimes = historicalData
      .filter(b => b.metrics?.waitTimeMinutes)
      .map(b => b.metrics!.waitTimeMinutes!);

    if (waitTimes.length === 0) {
      return res.json({
        success: true,
        data: {
          predictedWaitMinutes: 15,
          confidence: 0.3,
          basedOn: 0,
          factors: ['Données insuffisantes, estimation par défaut']
        }
      });
    }

    const avgWait = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
    const minWait = Math.min(...waitTimes);
    const maxWait = Math.max(...waitTimes);

    // Récupérer la charge actuelle
    const currentQueue = await DriverCheckin.countDocuments({
      siteId,
      status: { $in: ['waiting', 'called'] }
    });

    // Ajuster la prédiction
    const queueFactor = currentQueue * 10;
    const predictedWait = Math.round(avgWait + queueFactor);

    res.json({
      success: true,
      data: {
        predictedWaitMinutes: predictedWait,
        confidence: Math.min(1, waitTimes.length / 50),
        range: {
          min: Math.round(minWait),
          max: Math.round(maxWait + queueFactor)
        },
        basedOn: waitTimes.length,
        currentQueueSize: currentQueue,
        factors: [
          `Moyenne historique: ${Math.round(avgWait)} min`,
          `${currentQueue} camion(s) en attente`,
          `Créneau ${hour}h00 - ${hour + 1}h00`
        ]
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /ai/stats/:siteId - Statistiques IA du site
router.get('/stats/:siteId', async (req: Request, res: Response) => {
  try {
    const { period = '7d' } = req.query;

    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);

    const bookings = await Booking.find({
      siteId: req.params.siteId,
      createdAt: { $gte: startDate }
    });

    const completed = bookings.filter(b => b.status === 'completed');
    const noShows = bookings.filter(b => b.status === 'no_show');
    const cancelled = bookings.filter(b => b.status === 'cancelled');

    const waitTimes = completed
      .filter(b => b.metrics?.waitTimeMinutes)
      .map(b => b.metrics!.waitTimeMinutes!);

    const avgWait = waitTimes.length > 0
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      : 0;

    // Pics d'affluence par heure
    const byHour: Record<number, number> = {};
    completed.forEach(b => {
      if (b.confirmedTimeSlot?.start) {
        const hour = parseInt(b.confirmedTimeSlot.start.split(':')[0]);
        byHour[hour] = (byHour[hour] || 0) + 1;
      }
    });

    const peakHours = Object.entries(byHour)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}h00`);

    res.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: new Date().toISOString()
        },
        volumes: {
          total: bookings.length,
          completed: completed.length,
          cancelled: cancelled.length,
          noShows: noShows.length
        },
        rates: {
          completion: bookings.length > 0 ? Math.round((completed.length / bookings.length) * 100) : 0,
          noShow: bookings.length > 0 ? Math.round((noShows.length / bookings.length) * 100) : 0,
          cancellation: bookings.length > 0 ? Math.round((cancelled.length / bookings.length) * 100) : 0
        },
        performance: {
          averageWaitMinutes: Math.round(avgWait),
          peakHours,
          busiestDay: 'Mardi' // Simplification
        },
        recommendations: generateRecommendations(completed.length, avgWait, noShows.length)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fonctions utilitaires
function generateReasoning(suggestion: any, reliability: number): string {
  if (!suggestion) return 'Aucun créneau disponible correspondant à vos critères.';

  const reasons = [];
  if (suggestion.score > 80) {
    reasons.push('Créneau optimal avec excellente disponibilité');
  } else if (suggestion.score > 60) {
    reasons.push('Bon créneau avec disponibilité correcte');
  } else {
    reasons.push('Créneau alternatif proposé');
  }

  if (reliability > 0.8) {
    reasons.push('Votre historique de ponctualité permet un accès prioritaire');
  }

  if (suggestion.estimatedWaitMinutes < 15) {
    reasons.push('Temps d\'attente minimal prévu');
  }

  return reasons.join('. ') + '.';
}

function generateRecommendations(volume: number, avgWait: number, noShows: number): string[] {
  const recommendations = [];

  if (avgWait > 30) {
    recommendations.push('Envisager d\'ajouter des créneaux aux heures de pointe');
  }
  if (noShows > volume * 0.1) {
    recommendations.push('Mettre en place des rappels automatiques pour réduire les no-shows');
  }
  if (volume < 10) {
    recommendations.push('Promouvoir le système de réservation auprès des transporteurs');
  }

  if (recommendations.length === 0) {
    recommendations.push('Les performances du site sont optimales');
  }

  return recommendations;
}

export default router;
