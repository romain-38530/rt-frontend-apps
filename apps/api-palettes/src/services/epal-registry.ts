import PalletCheque from '../models/PalletCheque';
import PalletLedger from '../models/PalletLedger';

/**
 * Service d'intégration avec le registre EPAL
 * Simule les interactions avec le registre européen EPAL
 * Dans un système réel, ceci communiquerait avec l'API EPAL officielle
 */

// Structure d'une palette EPAL dans le registre
interface EPALPalletRecord {
  serialNumber: string;
  type: 'EURO_EPAL' | 'EURO_EPAL_2';
  manufacturerCode: string;
  productionDate: Date;
  certificationStatus: 'valid' | 'expired' | 'revoked' | 'unknown';
  lastInspectionDate?: Date;
  repairHistory: Array<{
    date: Date;
    repairedBy: string;
    description: string;
  }>;
  currentLocation?: string;
  movementHistory: Array<{
    date: Date;
    from: string;
    to: string;
    quantity: number;
  }>;
}

// Stockage en mémoire pour simulation (dans un vrai système, ceci serait l'API EPAL)
const epalRegistryMock = new Map<string, EPALPalletRecord>();

// Initialiser quelques palettes de test
function initializeMockData() {
  if (epalRegistryMock.size === 0) {
    const testSerials = [
      'EPAL-2024-FR-001234',
      'EPAL-2024-FR-001235',
      'EPAL-2024-DE-005678',
      'EPAL-2023-NL-009876',
      'EPAL-2024-BE-004321',
    ];

    testSerials.forEach(serial => {
      epalRegistryMock.set(serial, {
        serialNumber: serial,
        type: 'EURO_EPAL',
        manufacturerCode: serial.split('-')[2],
        productionDate: new Date(2024, 0, 1),
        certificationStatus: 'valid',
        lastInspectionDate: new Date(2024, 10, 1),
        repairHistory: [],
        movementHistory: [],
      });
    });
  }
}

/**
 * Valider un numéro de série EPAL
 */
export async function validatePalletSerial(serialNumber: string): Promise<{
  valid: boolean;
  record?: EPALPalletRecord;
  error?: string;
}> {
  try {
    initializeMockData();

    // Format attendu: EPAL-YYYY-CC-NNNNNN
    const epalPattern = /^EPAL-\d{4}-[A-Z]{2}-\d{6}$/;

    if (!epalPattern.test(serialNumber)) {
      return {
        valid: false,
        error: 'Format de numéro de série invalide. Format attendu: EPAL-YYYY-CC-NNNNNN',
      };
    }

    // Vérifier dans le registre mock
    const record = epalRegistryMock.get(serialNumber);

    if (!record) {
      // Si pas trouvé, créer un nouveau record (simulation d'enregistrement)
      const parts = serialNumber.split('-');
      const newRecord: EPALPalletRecord = {
        serialNumber,
        type: 'EURO_EPAL',
        manufacturerCode: parts[2],
        productionDate: new Date(parseInt(parts[1]), 0, 1),
        certificationStatus: 'valid',
        repairHistory: [],
        movementHistory: [],
      };
      epalRegistryMock.set(serialNumber, newRecord);

      return {
        valid: true,
        record: newRecord,
      };
    }

    // Vérifier le statut de certification
    if (record.certificationStatus !== 'valid') {
      return {
        valid: false,
        record,
        error: `Palette non valide: statut ${record.certificationStatus}`,
      };
    }

    return {
      valid: true,
      record,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: `Erreur validation: ${error.message}`,
    };
  }
}

/**
 * Signaler un mouvement de palettes au registre EPAL
 */
export async function reportMovement(
  chequeId: string,
  movementType: 'emission' | 'reception' | 'transfert'
): Promise<{
  success: boolean;
  reportId?: string;
  error?: string;
}> {
  try {
    initializeMockData();

    const cheque = await PalletCheque.findOne({ chequeId });
    if (!cheque) {
      return {
        success: false,
        error: 'Chèque non trouvé',
      };
    }

    // Générer un ID de rapport
    const reportId = `EPAL-RPT-${Date.now().toString(36).toUpperCase()}`;

    // Dans un vrai système, envoyer les données à l'API EPAL
    const movement = {
      reportId,
      chequeId,
      type: movementType,
      palletType: cheque.palletType,
      quantity: cheque.quantity,
      from: cheque.fromCompanyName,
      to: cheque.toSiteName,
      timestamp: new Date(),
      status: 'reported',
    };

    console.log(`[EPAL Registry] Mouvement signalé: ${reportId}`, movement);

    return {
      success: true,
      reportId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erreur signalement: ${error.message}`,
    };
  }
}

/**
 * Récupérer les statistiques du registre EPAL
 */
export async function getRegistryStats(): Promise<{
  totalPallets: number;
  byType: Record<string, number>;
  byCountry: Record<string, number>;
  byStatus: Record<string, number>;
  recentMovements: number;
  averageAge: number;
}> {
  try {
    initializeMockData();

    const allRecords = Array.from(epalRegistryMock.values());

    // Stats par type
    const byType: Record<string, number> = {};
    allRecords.forEach(record => {
      byType[record.type] = (byType[record.type] || 0) + 1;
    });

    // Stats par pays (code fabricant)
    const byCountry: Record<string, number> = {};
    allRecords.forEach(record => {
      byCountry[record.manufacturerCode] = (byCountry[record.manufacturerCode] || 0) + 1;
    });

    // Stats par statut
    const byStatus: Record<string, number> = {};
    allRecords.forEach(record => {
      byStatus[record.certificationStatus] = (byStatus[record.certificationStatus] || 0) + 1;
    });

    // Mouvements récents (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    let recentMovements = 0;
    allRecords.forEach(record => {
      recentMovements += record.movementHistory.filter(m => m.date >= sevenDaysAgo).length;
    });

    // Âge moyen des palettes
    const now = Date.now();
    const totalAge = allRecords.reduce((sum, record) => {
      return sum + (now - record.productionDate.getTime());
    }, 0);
    const averageAgeMs = allRecords.length > 0 ? totalAge / allRecords.length : 0;
    const averageAgeDays = Math.round(averageAgeMs / (1000 * 60 * 60 * 24));

    return {
      totalPallets: allRecords.length,
      byType,
      byCountry,
      byStatus,
      recentMovements,
      averageAge: averageAgeDays,
    };
  } catch (error: any) {
    throw new Error(`Erreur récupération stats: ${error.message}`);
  }
}

/**
 * Synchroniser le ledger local avec le registre EPAL
 */
export async function syncLedgerWithRegistry(companyId: string): Promise<{
  success: boolean;
  synchronized: boolean;
  differences?: {
    local: number;
    registry: number;
    delta: number;
  };
  error?: string;
}> {
  try {
    initializeMockData();

    const ledger = await PalletLedger.findOne({ companyId });
    if (!ledger) {
      return {
        success: false,
        synchronized: false,
        error: 'Ledger non trouvé pour cette entreprise',
      };
    }

    // Dans un vrai système, interroger l'API EPAL pour obtenir le solde réel
    // Pour la simulation, on considère que le registre est toujours synchronisé
    const localBalance = ledger.balances.EURO_EPAL || 0;
    const registryBalance = localBalance; // Simulation: même valeur

    const differences = {
      local: localBalance,
      registry: registryBalance,
      delta: Math.abs(localBalance - registryBalance),
    };

    const synchronized = differences.delta === 0;

    if (!synchronized) {
      // Dans un vrai système, corriger les écarts
      console.log(`[EPAL Registry] Écart détecté pour ${companyId}: ${differences.delta} palettes`);
    }

    return {
      success: true,
      synchronized,
      differences,
    };
  } catch (error: any) {
    return {
      success: false,
      synchronized: false,
      error: `Erreur synchronisation: ${error.message}`,
    };
  }
}

/**
 * Rechercher une palette par numéro de série
 */
export async function searchPalletBySerial(serialNumber: string): Promise<{
  found: boolean;
  record?: EPALPalletRecord;
}> {
  initializeMockData();
  const record = epalRegistryMock.get(serialNumber);
  return {
    found: !!record,
    record,
  };
}

/**
 * Enregistrer une réparation de palette
 */
export async function recordPalletRepair(
  serialNumber: string,
  repairedBy: string,
  description: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    initializeMockData();

    const record = epalRegistryMock.get(serialNumber);
    if (!record) {
      return {
        success: false,
        error: 'Palette non trouvée dans le registre',
      };
    }

    record.repairHistory.push({
      date: new Date(),
      repairedBy,
      description,
    });

    record.lastInspectionDate = new Date();

    console.log(`[EPAL Registry] Réparation enregistrée pour ${serialNumber}`);

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erreur enregistrement réparation: ${error.message}`,
    };
  }
}

/**
 * Obtenir l'historique d'une palette
 */
export async function getPalletHistory(serialNumber: string): Promise<{
  found: boolean;
  history?: {
    serial: string;
    type: string;
    age: number;
    totalMovements: number;
    totalRepairs: number;
    lastActivity: Date;
    movements: Array<any>;
    repairs: Array<any>;
  };
  error?: string;
}> {
  try {
    initializeMockData();

    const record = epalRegistryMock.get(serialNumber);
    if (!record) {
      return {
        found: false,
        error: 'Palette non trouvée',
      };
    }

    const age = Math.round((Date.now() - record.productionDate.getTime()) / (1000 * 60 * 60 * 24));

    const lastActivityDates = [
      ...record.movementHistory.map(m => m.date),
      ...record.repairHistory.map(r => r.date),
    ];
    const lastActivity = lastActivityDates.length > 0
      ? new Date(Math.max(...lastActivityDates.map(d => d.getTime())))
      : record.productionDate;

    return {
      found: true,
      history: {
        serial: record.serialNumber,
        type: record.type,
        age,
        totalMovements: record.movementHistory.length,
        totalRepairs: record.repairHistory.length,
        lastActivity,
        movements: record.movementHistory,
        repairs: record.repairHistory,
      },
    };
  } catch (error: any) {
    return {
      found: false,
      error: `Erreur récupération historique: ${error.message}`,
    };
  }
}
