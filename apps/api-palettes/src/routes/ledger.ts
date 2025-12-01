import { Router, Request, Response } from 'express';
import PalletLedger from '../models/PalletLedger';

const router = Router();

// GET /ledger - Liste tous les ledgers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { companyType, minBalance, maxBalance, limit = 50, offset = 0 } = req.query;

    const filter: any = {};
    if (companyType) filter.companyType = companyType;
    if (minBalance) filter.balance = { $gte: Number(minBalance) };
    if (maxBalance) filter.balance = { ...filter.balance, $lte: Number(maxBalance) };

    const ledgers = await PalletLedger.find(filter)
      .sort({ balance: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await PalletLedger.countDocuments(filter);

    // Statistiques globales
    const stats = await PalletLedger.aggregate([
      {
        $group: {
          _id: null,
          totalCredits: { $sum: { $cond: [{ $gt: ['$balance', 0] }, '$balance', 0] } },
          totalDebts: { $sum: { $cond: [{ $lt: ['$balance', 0] }, '$balance', 0] } },
          avgBalance: { $avg: '$balance' },
          companiesCount: { $sum: 1 },
        },
      },
    ]);

    res.json({
      data: ledgers,
      total,
      stats: stats[0] || { totalCredits: 0, totalDebts: 0, avgBalance: 0, companiesCount: 0 },
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /ledger/:companyId - Ledger d'une entreprise
router.get('/:companyId', async (req: Request, res: Response) => {
  try {
    const ledger = await PalletLedger.findOne({ companyId: req.params.companyId });
    if (!ledger) {
      return res.status(404).json({ error: 'Ledger non trouvé' });
    }
    res.json(ledger);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /ledger/:companyId/history - Historique des mouvements
router.get('/:companyId/history', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, palletType } = req.query;

    const ledger = await PalletLedger.findOne({ companyId: req.params.companyId });
    if (!ledger) {
      return res.status(404).json({ error: 'Ledger non trouvé' });
    }

    let history = ledger.history;

    // Filtrer par type de palette si spécifié
    if (palletType) {
      history = history.filter(h => h.palletType === palletType);
    }

    // Trier par date décroissante
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pagination
    const total = history.length;
    history = history.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      companyId: ledger.companyId,
      companyName: ledger.companyName,
      currentBalances: ledger.balances,
      history,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /ledger/:companyId/adjust - Ajustement manuel (admin)
router.post('/:companyId/adjust', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { palletType, delta, reason, adminId } = req.body;

    if (!palletType || delta === undefined || !reason) {
      return res.status(400).json({ error: 'Champs obligatoires manquants (palletType, delta, reason)' });
    }

    let ledger = await PalletLedger.findOne({ companyId });
    if (!ledger) {
      return res.status(404).json({ error: 'Ledger non trouvé' });
    }

    // Appliquer l'ajustement
    ledger.balances[palletType as keyof typeof ledger.balances] += delta;
    const newBalance = ledger.balances[palletType as keyof typeof ledger.balances];

    ledger.history.push({
      date: new Date(),
      delta,
      reason: `[Admin: ${adminId || 'système'}] ${reason}`,
      newBalance,
      palletType,
    });

    await ledger.save();

    res.json({
      message: 'Ajustement effectué',
      newBalance,
      ledger,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /ledger/stats/global - Statistiques globales
router.get('/stats/global', async (req: Request, res: Response) => {
  try {
    const stats = await PalletLedger.aggregate([
      {
        $group: {
          _id: '$companyType',
          count: { $sum: 1 },
          totalBalance: { $sum: '$balance' },
          avgBalance: { $avg: '$balance' },
          totalEUROEPAL: { $sum: '$balances.EURO_EPAL' },
          totalEUROEPAL2: { $sum: '$balances.EURO_EPAL_2' },
          totalDEMI: { $sum: '$balances.DEMI_PALETTE' },
          totalPERDUE: { $sum: '$balances.PALETTE_PERDUE' },
        },
      },
    ]);

    const topCreditors = await PalletLedger.find({ balance: { $gt: 0 } })
      .sort({ balance: -1 })
      .limit(10)
      .select('companyId companyName balance companyType');

    const topDebtors = await PalletLedger.find({ balance: { $lt: 0 } })
      .sort({ balance: 1 })
      .limit(10)
      .select('companyId companyName balance companyType');

    res.json({
      byCompanyType: stats,
      topCreditors,
      topDebtors,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /ledger - Créer un nouveau ledger
router.post('/', async (req: Request, res: Response) => {
  try {
    const { companyId, companyName, companyType } = req.body;

    if (!companyId || !companyName || !companyType) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const existing = await PalletLedger.findOne({ companyId });
    if (existing) {
      return res.status(409).json({ error: 'Ledger existe déjà pour cette entreprise' });
    }

    const ledger = await PalletLedger.create({
      companyId,
      companyName,
      companyType,
      balance: 0,
      balances: {
        EURO_EPAL: 0,
        EURO_EPAL_2: 0,
        DEMI_PALETTE: 0,
        PALETTE_PERDUE: 0,
      },
      history: [],
    });

    res.status(201).json(ledger);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
