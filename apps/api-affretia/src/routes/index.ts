/**
 * Routes Index
 * Export de toutes les routes AFFRET.IA
 */

import triggerRoutes from './trigger';
import broadcastRoutes from './broadcast';
import proposalsRoutes from './proposals';
import selectionRoutes from './selection';
import assignRoutes from './assign';
import trackingRoutes from './tracking';
import vigilanceRoutes from './vigilance';
import documentsRoutes from './documents';
import statsRoutes from './stats';
import bourseRoutes from './bourse';

export {
  triggerRoutes,
  broadcastRoutes,
  proposalsRoutes,
  selectionRoutes,
  assignRoutes,
  trackingRoutes,
  vigilanceRoutes,
  documentsRoutes,
  statsRoutes,
  bourseRoutes
};

export default {
  trigger: triggerRoutes,
  broadcast: broadcastRoutes,
  proposals: proposalsRoutes,
  selection: selectionRoutes,
  assign: assignRoutes,
  tracking: trackingRoutes,
  vigilance: vigilanceRoutes,
  documents: documentsRoutes,
  stats: statsRoutes,
  bourse: bourseRoutes
};
