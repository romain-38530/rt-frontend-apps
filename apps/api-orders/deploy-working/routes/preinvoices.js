"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes Préfacturation - Gestion du cycle de facturation SYMPHONI.A
 */
const express_1 = require("express");
const preinvoice_service_1 = __importDefault(require("../services/preinvoice-service"));
const PreInvoice_1 = __importDefault(require("../models/PreInvoice"));
const router = (0, express_1.Router)();
/**
 * GET /api/v1/preinvoices
 * Liste les préfactures avec filtres
 */
router.get('/', async (req, res) => {
    try {
        const { industrialId, carrierId, status, month, year } = req.query;
        const preInvoices = await preinvoice_service_1.default.getPreInvoices({
            industrialId: industrialId,
            carrierId: carrierId,
            status: status,
            month: month ? parseInt(month) : undefined,
            year: year ? parseInt(year) : undefined
        });
        res.json({
            success: true,
            count: preInvoices.length,
            data: preInvoices
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/preinvoices/stats
 * Statistiques de préfacturation
 */
router.get('/stats', async (req, res) => {
    try {
        const { industrialId, carrierId, year } = req.query;
        const currentYear = year ? parseInt(year) : new Date().getFullYear();
        const query = { 'period.year': currentYear };
        if (industrialId)
            query.industrialId = industrialId;
        if (carrierId)
            query.carrierId = carrierId;
        const preInvoices = await PreInvoice_1.default.find(query);
        const stats = {
            totalPreInvoices: preInvoices.length,
            totalAmount: 0,
            byStatus: {},
            byMonth: {},
            pendingPayments: 0,
            pendingAmount: 0,
            paidAmount: 0
        };
        for (const pi of preInvoices) {
            stats.totalAmount += pi.totals.totalTTC;
            // Par statut
            stats.byStatus[pi.status] = (stats.byStatus[pi.status] || 0) + 1;
            // Par mois
            if (!stats.byMonth[pi.period.month]) {
                stats.byMonth[pi.period.month] = { count: 0, amount: 0 };
            }
            stats.byMonth[pi.period.month].count++;
            stats.byMonth[pi.period.month].amount += pi.totals.totalTTC;
            // Paiements en attente
            if (pi.status === 'payment_pending') {
                stats.pendingPayments++;
                stats.pendingAmount += pi.totals.totalTTC;
            }
            // Payés
            if (pi.status === 'paid') {
                stats.paidAmount += pi.payment?.paidAmount || pi.totals.totalTTC;
            }
        }
        res.json({
            success: true,
            year: currentYear,
            stats
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/preinvoices/export
 * Export Excel des règlements à effectuer
 */
router.get('/export', async (req, res) => {
    try {
        const exportData = await preinvoice_service_1.default.generatePaymentExport();
        // Générer le CSV (alternative à Excel pour simplicité)
        const headers = [
            'Préfacture', 'Transporteur', 'SIRET', 'N° Facture', 'Date Facture',
            'Montant', 'Échéance', 'Jours restants', 'Banque', 'Titulaire',
            'IBAN', 'BIC', 'Industriel', 'Période'
        ];
        let csv = headers.join(';') + '\n';
        for (const row of exportData) {
            csv += [
                row.preInvoiceNumber,
                row.carrierName,
                row.carrierSiret,
                row.invoiceNumber,
                row.invoiceDate,
                row.amount.toFixed(2).replace('.', ','),
                row.dueDate,
                row.daysRemaining,
                row.bankName,
                row.accountHolder,
                row.iban,
                row.bic,
                row.industrialName,
                row.period
            ].join(';') + '\n';
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=reglements-${new Date().toISOString().split('T')[0]}.csv`);
        res.send('\uFEFF' + csv); // BOM pour Excel
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/preinvoices/:preInvoiceId
 * Détail d'une préfacture
 */
router.get('/:preInvoiceId', async (req, res) => {
    try {
        const { preInvoiceId } = req.params;
        const preInvoice = preInvoiceId.startsWith('PRE-')
            ? await preinvoice_service_1.default.getPreInvoiceByNumber(preInvoiceId)
            : await preinvoice_service_1.default.getPreInvoiceById(preInvoiceId);
        if (!preInvoice) {
            return res.status(404).json({ success: false, error: 'Préfacture non trouvée' });
        }
        res.json({
            success: true,
            data: preInvoice
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/preinvoices/send-monthly
 * Envoie les préfactures du mois aux industriels
 * À appeler via cron le 1er du mois
 */
router.post('/send-monthly', async (req, res) => {
    try {
        const sentCount = await preinvoice_service_1.default.sendMonthlyPreInvoicesToIndustrials();
        res.json({
            success: true,
            message: `${sentCount} préfactures envoyées aux industriels`,
            sentCount
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/preinvoices/:preInvoiceId/validate
 * Validation par l'industriel
 */
router.post('/:preInvoiceId/validate', async (req, res) => {
    try {
        const { preInvoiceId } = req.params;
        const { validatedBy, comments, adjustments } = req.body;
        if (!validatedBy) {
            return res.status(400).json({ success: false, error: 'validatedBy est requis' });
        }
        const preInvoice = await preinvoice_service_1.default.validateByIndustrial(preInvoiceId, validatedBy, comments, adjustments);
        if (!preInvoice) {
            return res.status(404).json({ success: false, error: 'Préfacture non trouvée' });
        }
        res.json({
            success: true,
            message: 'Préfacture validée par l\'industriel',
            data: preInvoice
        });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/preinvoices/:preInvoiceId/upload-invoice
 * Upload de la facture transporteur
 */
router.post('/:preInvoiceId/upload-invoice', async (req, res) => {
    try {
        const { preInvoiceId } = req.params;
        const { invoiceNumber, invoiceDate, invoiceAmount, documentId, bankDetails } = req.body;
        // Validation
        if (!invoiceNumber || !invoiceDate || !invoiceAmount || !documentId) {
            return res.status(400).json({
                success: false,
                error: 'invoiceNumber, invoiceDate, invoiceAmount et documentId sont requis'
            });
        }
        if (!bankDetails || !bankDetails.iban || !bankDetails.bic || !bankDetails.bankName) {
            return res.status(400).json({
                success: false,
                error: 'Coordonnées bancaires (iban, bic, bankName, accountHolder) requises'
            });
        }
        const preInvoice = await preinvoice_service_1.default.uploadCarrierInvoice(preInvoiceId, {
            invoiceNumber,
            invoiceDate: new Date(invoiceDate),
            invoiceAmount: parseFloat(invoiceAmount),
            documentId,
            bankDetails
        });
        if (!preInvoice) {
            return res.status(404).json({ success: false, error: 'Préfacture non trouvée' });
        }
        res.json({
            success: true,
            message: preInvoice.status === 'payment_pending'
                ? 'Facture acceptée - Paiement en attente'
                : 'Facture rejetée - Écart de montant',
            data: preInvoice
        });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/preinvoices/:preInvoiceId/mark-paid
 * Marque une préfacture comme payée
 */
router.post('/:preInvoiceId/mark-paid', async (req, res) => {
    try {
        const { preInvoiceId } = req.params;
        const { paymentReference, paidAmount } = req.body;
        if (!paymentReference || !paidAmount) {
            return res.status(400).json({
                success: false,
                error: 'paymentReference et paidAmount sont requis'
            });
        }
        const preInvoice = await preinvoice_service_1.default.markAsPaid(preInvoiceId, paymentReference, parseFloat(paidAmount));
        if (!preInvoice) {
            return res.status(404).json({ success: false, error: 'Préfacture non trouvée' });
        }
        res.json({
            success: true,
            message: 'Paiement enregistré',
            data: preInvoice
        });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/v1/preinvoices/update-countdowns
 * Met à jour les décomptes de paiement
 * À appeler quotidiennement via cron
 */
router.post('/update-countdowns', async (req, res) => {
    try {
        const updatedCount = await preinvoice_service_1.default.updatePaymentCountdowns();
        res.json({
            success: true,
            message: `${updatedCount} préfactures mises à jour`,
            updatedCount
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/preinvoices/carrier/:carrierId/pending
 * Préfactures en attente pour un transporteur
 */
router.get('/carrier/:carrierId/pending', async (req, res) => {
    try {
        const { carrierId } = req.params;
        const preInvoices = await PreInvoice_1.default.find({
            carrierId,
            status: { $in: ['validated_industrial', 'invoice_rejected'] }
        }).sort({ 'period.year': -1, 'period.month': -1 });
        res.json({
            success: true,
            count: preInvoices.length,
            data: preInvoices.map(pi => ({
                preInvoiceId: pi.preInvoiceId,
                preInvoiceNumber: pi.preInvoiceNumber,
                period: `${pi.period.month}/${pi.period.year}`,
                industrialName: pi.industrialName,
                totalAmount: pi.totals.totalTTC,
                status: pi.status,
                ordersCount: pi.lines.length
            }))
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/v1/preinvoices/industrial/:industrialId/to-validate
 * Préfactures à valider pour un industriel
 */
router.get('/industrial/:industrialId/to-validate', async (req, res) => {
    try {
        const { industrialId } = req.params;
        const preInvoices = await PreInvoice_1.default.find({
            industrialId,
            status: 'sent_to_industrial'
        }).sort({ sentToIndustrialAt: 1 });
        res.json({
            success: true,
            count: preInvoices.length,
            data: preInvoices.map(pi => ({
                preInvoiceId: pi.preInvoiceId,
                preInvoiceNumber: pi.preInvoiceNumber,
                period: `${pi.period.month}/${pi.period.year}`,
                carrierName: pi.carrierName,
                totalAmount: pi.totals.totalTTC,
                ordersCount: pi.lines.length,
                kpis: pi.kpis,
                sentAt: pi.sentToIndustrialAt
            }))
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=preinvoices.js.map