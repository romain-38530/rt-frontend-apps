"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * PreInvoiceService - Service de préfacturation SYMPHONI.A
 * Gestion complète du cycle de facturation avec contrôle intelligent CMR
 */
const uuid_1 = require("uuid");
const PreInvoice_1 = __importDefault(require("../models/PreInvoice"));
const Order_1 = __importDefault(require("../models/Order"));
const Document_1 = __importDefault(require("../models/Document"));
const event_service_1 = __importDefault(require("./event-service"));
const notification_service_1 = __importDefault(require("./notification-service"));
// Configuration contrat type transport
const CONTRACT_CONFIG = {
    waitingHourlyRate: 45, // EUR/heure d'attente
    freeWaitingMinutes: 60, // Minutes d'attente gratuites
    delayPenaltyPerHour: 25, // EUR/heure de retard
    freeDelayMinutes: 30, // Minutes de retard tolérées
    autoAcceptThreshold: 0.01, // 1% d'écart accepté automatiquement
    defaultPaymentTermDays: 30, // Délai de paiement par défaut
    tvaRate: 20 // Taux TVA
};
class PreInvoiceService {
    /**
     * Génère un numéro de préfacture
     */
    static generatePreInvoiceNumber(year, month) {
        const seq = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        const monthStr = month.toString().padStart(2, '0');
        return `PRE-${year}${monthStr}-${seq}`;
    }
    /**
     * Analyse le CMR pour détecter heures d'attente et retards
     */
    static async analyzeCMR(orderId) {
        const analysis = {
            waitingHours: 0,
            delayHours: 0,
            notes: []
        };
        try {
            // Récupérer l'ordre et ses documents CMR
            const order = await Order_1.default.findOne({ orderId });
            if (!order)
                return analysis;
            const cmrDoc = await Document_1.default.findOne({
                orderId,
                type: 'cmr',
                status: 'validated'
            });
            // Analyse des heures d'attente basée sur les timestamps
            if (order.dates.actualPickupDate && order.dates.pickupTimeSlotEnd) {
                const scheduledEnd = new Date(order.dates.pickupDate);
                const [hours, minutes] = (order.dates.pickupTimeSlotEnd || '12:00').split(':');
                scheduledEnd.setHours(parseInt(hours), parseInt(minutes));
                const actualPickup = new Date(order.dates.actualPickupDate);
                const waitingMs = actualPickup.getTime() - scheduledEnd.getTime();
                if (waitingMs > CONTRACT_CONFIG.freeWaitingMinutes * 60 * 1000) {
                    const waitingMinutes = Math.floor(waitingMs / (1000 * 60)) - CONTRACT_CONFIG.freeWaitingMinutes;
                    analysis.waitingHours = Math.ceil(waitingMinutes / 60);
                    analysis.notes.push(`Attente chargement: ${analysis.waitingHours}h`);
                }
            }
            // Analyse des retards de livraison
            if (order.dates.actualDeliveryDate && order.dates.deliveryDate) {
                const scheduledDelivery = new Date(order.dates.deliveryDate);
                const [hours, minutes] = (order.dates.deliveryTimeSlotEnd || '18:00').split(':');
                scheduledDelivery.setHours(parseInt(hours), parseInt(minutes));
                const actualDelivery = new Date(order.dates.actualDeliveryDate);
                const delayMs = actualDelivery.getTime() - scheduledDelivery.getTime();
                if (delayMs > CONTRACT_CONFIG.freeDelayMinutes * 60 * 1000) {
                    const delayMinutes = Math.floor(delayMs / (1000 * 60)) - CONTRACT_CONFIG.freeDelayMinutes;
                    analysis.delayHours = Math.ceil(delayMinutes / 60);
                    analysis.notes.push(`Retard livraison: ${analysis.delayHours}h`);
                }
            }
            // Ajouter info CMR si disponible
            if (cmrDoc) {
                analysis.notes.push('CMR validé');
            }
            else {
                analysis.notes.push('CMR en attente de validation');
            }
            return analysis;
        }
        catch (error) {
            console.error(`[PreInvoice] CMR analysis error for ${orderId}:`, error);
            return analysis;
        }
    }
    /**
     * Ajoute une commande terminée à la préfacturation
     */
    static async addCompletedOrder(orderId) {
        try {
            const order = await Order_1.default.findOne({ orderId });
            if (!order) {
                console.error(`[PreInvoice] Order not found: ${orderId}`);
                return null;
            }
            if (!order.carrierId) {
                console.error(`[PreInvoice] No carrier assigned for order: ${orderId}`);
                return null;
            }
            // Déterminer la période (mois en cours)
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            // Chercher ou créer la préfacture pour ce transporteur/industriel/période
            let preInvoice = await PreInvoice_1.default.findOne({
                industrialId: order.industrialId,
                carrierId: order.carrierId,
                'period.month': month,
                'period.year': year,
                status: 'pending'
            });
            if (!preInvoice) {
                preInvoice = new PreInvoice_1.default({
                    preInvoiceId: `preinv_${(0, uuid_1.v4)()}`,
                    preInvoiceNumber: this.generatePreInvoiceNumber(year, month),
                    period: { month, year, startDate, endDate },
                    industrialId: order.industrialId,
                    industrialName: order.industrialName || order.industrialId,
                    industrialEmail: `industrial-${order.industrialId.replace('ind_', '')}@symphonia-controltower.com`,
                    carrierId: order.carrierId,
                    carrierName: order.carrierName || order.carrierId,
                    carrierEmail: order.carrierEmail || `carrier-${order.carrierId.replace('carrier_', '')}@symphonia-controltower.com`,
                    lines: [],
                    status: 'pending',
                    history: [{
                            date: new Date(),
                            action: 'created',
                            actor: 'system',
                            details: 'Préfacture créée automatiquement'
                        }]
                });
            }
            // Vérifier si l'ordre n'est pas déjà dans la préfacture
            const existingLine = preInvoice.lines.find(l => l.orderId === orderId);
            if (existingLine) {
                console.log(`[PreInvoice] Order ${orderId} already in preinvoice ${preInvoice.preInvoiceNumber}`);
                return preInvoice;
            }
            // Analyser le CMR
            const cmrAnalysis = await this.analyzeCMR(orderId);
            // Calculer les montants
            const baseAmount = order.agreedPrice || order.finalPrice || order.estimatedPrice || 0;
            const waitingAmount = cmrAnalysis.waitingHours * CONTRACT_CONFIG.waitingHourlyRate;
            const delayPenalty = cmrAnalysis.delayHours * CONTRACT_CONFIG.delayPenaltyPerHour * -1; // Négatif car pénalité
            // Vérifier les KPIs
            const onTimePickup = cmrAnalysis.waitingHours === 0;
            const onTimeDelivery = cmrAnalysis.delayHours === 0;
            // Vérifier si tous les documents sont présents
            const requiredDocs = await Document_1.default.countDocuments({
                orderId,
                type: { $in: ['cmr', 'bl', 'pod'] },
                status: 'validated'
            });
            const documentsComplete = requiredDocs >= 2; // Au moins CMR + POD
            // Vérifier incidents
            const hasIncident = order.status === 'incident';
            // Créer la ligne de préfacturation
            const line = {
                orderId: order.orderId,
                orderReference: order.reference,
                pickupDate: order.dates.pickupDate,
                deliveryDate: order.dates.deliveryDate,
                pickupCity: order.pickupAddress.city,
                deliveryCity: order.deliveryAddress.city,
                baseAmount,
                waitingHours: cmrAnalysis.waitingHours,
                waitingAmount,
                delayHours: cmrAnalysis.delayHours,
                delayPenalty,
                fuelSurcharge: 0,
                tolls: 0,
                otherCharges: 0,
                totalAmount: baseAmount + waitingAmount + delayPenalty,
                cmrValidated: cmrAnalysis.notes.includes('CMR validé'),
                cmrNotes: cmrAnalysis.notes.join('; '),
                kpiData: {
                    onTimePickup,
                    onTimeDelivery,
                    documentsComplete,
                    incidentFree: !hasIncident
                }
            };
            preInvoice.lines.push(line);
            // Recalculer les totaux
            this.recalculateTotals(preInvoice);
            // Ajouter à l'historique
            preInvoice.history.push({
                date: new Date(),
                action: 'line_added',
                actor: 'system',
                details: `Commande ${order.reference} ajoutée - Montant: ${line.totalAmount}€`
            });
            await preInvoice.save();
            console.log(`[PreInvoice] Order ${order.reference} added to preinvoice ${preInvoice.preInvoiceNumber}`);
            // Créer un événement
            await event_service_1.default.createEvent({
                orderId,
                orderReference: order.reference,
                eventType: 'order.completed',
                source: 'system',
                description: `Commande ajoutée à la préfacture ${preInvoice.preInvoiceNumber}`
            });
            return preInvoice;
        }
        catch (error) {
            console.error(`[PreInvoice] Error adding order ${orderId}:`, error);
            return null;
        }
    }
    /**
     * Recalcule les totaux d'une préfacture
     */
    static recalculateTotals(preInvoice) {
        const totals = {
            baseAmount: 0,
            waitingAmount: 0,
            delayPenalty: 0,
            fuelSurcharge: 0,
            tolls: 0,
            otherCharges: 0,
            subtotalHT: 0,
            tvaRate: CONTRACT_CONFIG.tvaRate,
            tvaAmount: 0,
            totalTTC: 0
        };
        let onTimePickupCount = 0;
        let onTimeDeliveryCount = 0;
        let documentsCompleteCount = 0;
        let incidentFreeCount = 0;
        let totalWaitingHours = 0;
        for (const line of preInvoice.lines) {
            totals.baseAmount += line.baseAmount;
            totals.waitingAmount += line.waitingAmount;
            totals.delayPenalty += line.delayPenalty;
            totals.fuelSurcharge += line.fuelSurcharge;
            totals.tolls += line.tolls;
            totals.otherCharges += line.otherCharges;
            totalWaitingHours += line.waitingHours;
            if (line.kpiData.onTimePickup)
                onTimePickupCount++;
            if (line.kpiData.onTimeDelivery)
                onTimeDeliveryCount++;
            if (line.kpiData.documentsComplete)
                documentsCompleteCount++;
            if (line.kpiData.incidentFree)
                incidentFreeCount++;
        }
        totals.subtotalHT = totals.baseAmount + totals.waitingAmount + totals.delayPenalty +
            totals.fuelSurcharge + totals.tolls + totals.otherCharges;
        totals.tvaAmount = Math.round(totals.subtotalHT * totals.tvaRate / 100 * 100) / 100;
        totals.totalTTC = Math.round((totals.subtotalHT + totals.tvaAmount) * 100) / 100;
        preInvoice.totals = totals;
        // Calculer les KPIs
        const totalOrders = preInvoice.lines.length;
        preInvoice.kpis = {
            totalOrders,
            onTimePickupRate: totalOrders > 0 ? Math.round(onTimePickupCount / totalOrders * 100) : 100,
            onTimeDeliveryRate: totalOrders > 0 ? Math.round(onTimeDeliveryCount / totalOrders * 100) : 100,
            documentsCompleteRate: totalOrders > 0 ? Math.round(documentsCompleteCount / totalOrders * 100) : 100,
            incidentFreeRate: totalOrders > 0 ? Math.round(incidentFreeCount / totalOrders * 100) : 100,
            averageWaitingHours: totalOrders > 0 ? Math.round(totalWaitingHours / totalOrders * 10) / 10 : 0,
            totalWaitingHours
        };
    }
    /**
     * Envoie les préfactures du mois aux industriels pour validation
     * À appeler le 1er du mois
     */
    static async sendMonthlyPreInvoicesToIndustrials() {
        try {
            // Récupérer le mois précédent
            const now = new Date();
            const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
            const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            const preInvoices = await PreInvoice_1.default.find({
                'period.month': prevMonth,
                'period.year': year,
                status: 'pending'
            });
            let sentCount = 0;
            for (const preInvoice of preInvoices) {
                try {
                    // Envoyer email à l'industriel
                    await notification_service_1.default.sendPreInvoiceValidationRequest(preInvoice.industrialEmail, preInvoice.industrialName, preInvoice.preInvoiceNumber, preInvoice.carrierName, preInvoice.totals.totalTTC, preInvoice.kpis, preInvoice.lines.length);
                    preInvoice.status = 'sent_to_industrial';
                    preInvoice.sentToIndustrialAt = new Date();
                    preInvoice.history.push({
                        date: new Date(),
                        action: 'sent_to_industrial',
                        actor: 'system',
                        details: `Email de validation envoyé à ${preInvoice.industrialEmail}`
                    });
                    await preInvoice.save();
                    sentCount++;
                }
                catch (err) {
                    console.error(`[PreInvoice] Failed to send ${preInvoice.preInvoiceNumber}:`, err);
                }
            }
            console.log(`[PreInvoice] Sent ${sentCount} preinvoices to industrials for ${prevMonth}/${year}`);
            return sentCount;
        }
        catch (error) {
            console.error('[PreInvoice] Error sending monthly preinvoices:', error);
            return 0;
        }
    }
    /**
     * Validation par l'industriel
     */
    static async validateByIndustrial(preInvoiceId, validatedBy, comments, adjustments) {
        try {
            const preInvoice = await PreInvoice_1.default.findOne({ preInvoiceId });
            if (!preInvoice)
                return null;
            if (preInvoice.status !== 'sent_to_industrial') {
                throw new Error('Cette préfacture ne peut pas être validée dans son état actuel');
            }
            // Appliquer les ajustements si présents
            if (adjustments && adjustments.length > 0) {
                preInvoice.industrialValidation = {
                    validatedAt: new Date(),
                    validatedBy,
                    comments,
                    adjustments: adjustments.map(adj => ({
                        lineIndex: adj.lineIndex,
                        originalAmount: preInvoice.lines[adj.lineIndex]?.totalAmount || 0,
                        adjustedAmount: adj.adjustedAmount,
                        reason: adj.reason
                    }))
                };
                // Appliquer les ajustements aux lignes
                for (const adj of adjustments) {
                    if (preInvoice.lines[adj.lineIndex]) {
                        preInvoice.lines[adj.lineIndex].totalAmount = adj.adjustedAmount;
                    }
                }
                // Recalculer les totaux
                this.recalculateTotals(preInvoice);
            }
            else {
                preInvoice.industrialValidation = {
                    validatedAt: new Date(),
                    validatedBy,
                    comments
                };
            }
            preInvoice.status = 'validated_industrial';
            preInvoice.history.push({
                date: new Date(),
                action: 'validated_by_industrial',
                actor: validatedBy,
                details: comments || 'Préfacture validée par l\'industriel'
            });
            await preInvoice.save();
            // Notifier le transporteur
            await notification_service_1.default.notifyCarrierPreInvoiceValidated(preInvoice.carrierEmail, preInvoice.carrierName, preInvoice.preInvoiceNumber, preInvoice.totals.totalTTC);
            return preInvoice;
        }
        catch (error) {
            console.error(`[PreInvoice] Validation error:`, error);
            throw error;
        }
    }
    /**
     * Upload de la facture transporteur
     */
    static async uploadCarrierInvoice(preInvoiceId, invoiceData) {
        try {
            const preInvoice = await PreInvoice_1.default.findOne({ preInvoiceId });
            if (!preInvoice)
                return null;
            if (preInvoice.status !== 'validated_industrial') {
                throw new Error('La préfacture doit être validée par l\'industriel avant de déposer une facture');
            }
            preInvoice.carrierInvoice = {
                ...invoiceData,
                uploadedAt: new Date()
            };
            preInvoice.status = 'invoice_uploaded';
            preInvoice.history.push({
                date: new Date(),
                action: 'invoice_uploaded',
                actor: preInvoice.carrierId,
                details: `Facture ${invoiceData.invoiceNumber} déposée - Montant: ${invoiceData.invoiceAmount}€`
            });
            await preInvoice.save();
            // Lancer le contrôle automatique
            return await this.performInvoiceControl(preInvoiceId);
        }
        catch (error) {
            console.error(`[PreInvoice] Invoice upload error:`, error);
            throw error;
        }
    }
    /**
     * Contrôle automatique facture vs préfacture
     */
    static async performInvoiceControl(preInvoiceId) {
        try {
            const preInvoice = await PreInvoice_1.default.findOne({ preInvoiceId });
            if (!preInvoice || !preInvoice.carrierInvoice)
                return null;
            const preInvoiceAmount = preInvoice.totals.totalTTC;
            const carrierInvoiceAmount = preInvoice.carrierInvoice.invoiceAmount;
            const difference = carrierInvoiceAmount - preInvoiceAmount;
            const differencePercent = Math.abs(difference / preInvoiceAmount);
            const autoAccepted = differencePercent <= CONTRACT_CONFIG.autoAcceptThreshold;
            preInvoice.invoiceControl = {
                preInvoiceAmount,
                carrierInvoiceAmount,
                difference,
                differencePercent: Math.round(differencePercent * 10000) / 100,
                autoAccepted,
                controlDate: new Date(),
                controlNotes: autoAccepted
                    ? 'Facture acceptée automatiquement (écart < 1%)'
                    : `Écart de ${Math.round(differencePercent * 100)}% - Vérification manuelle requise`
            };
            if (autoAccepted) {
                preInvoice.status = 'invoice_accepted';
                // Initialiser le paiement
                const paymentTermDays = CONTRACT_CONFIG.defaultPaymentTermDays;
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + paymentTermDays);
                preInvoice.payment = {
                    dueDate,
                    paymentTermDays,
                    daysRemaining: paymentTermDays,
                    bankDetails: preInvoice.carrierInvoice.bankDetails
                };
                preInvoice.status = 'payment_pending';
                preInvoice.history.push({
                    date: new Date(),
                    action: 'invoice_accepted',
                    actor: 'system',
                    details: `Facture acceptée automatiquement - Paiement prévu le ${dueDate.toLocaleDateString('fr-FR')}`
                });
                // Notifier le transporteur
                await notification_service_1.default.notifyCarrierInvoiceAccepted(preInvoice.carrierEmail, preInvoice.carrierName, preInvoice.preInvoiceNumber, preInvoice.carrierInvoice.invoiceAmount, dueDate);
            }
            else {
                preInvoice.status = 'invoice_rejected';
                preInvoice.history.push({
                    date: new Date(),
                    action: 'invoice_rejected',
                    actor: 'system',
                    details: `Écart de montant: ${difference.toFixed(2)}€ (${Math.round(differencePercent * 100)}%)`
                });
                // Notifier le transporteur du rejet
                await notification_service_1.default.notifyCarrierInvoiceRejected(preInvoice.carrierEmail, preInvoice.carrierName, preInvoice.preInvoiceNumber, preInvoiceAmount, carrierInvoiceAmount, difference);
            }
            await preInvoice.save();
            return preInvoice;
        }
        catch (error) {
            console.error(`[PreInvoice] Invoice control error:`, error);
            throw error;
        }
    }
    /**
     * Met à jour le décompte des jours restants avant paiement
     * Envoie des rappels automatiques à l'industriel
     */
    static async updatePaymentCountdowns() {
        try {
            const preInvoices = await PreInvoice_1.default.find({
                status: 'payment_pending',
                'payment.dueDate': { $exists: true }
            });
            let updatedCount = 0;
            const now = new Date();
            for (const preInvoice of preInvoices) {
                if (preInvoice.payment?.dueDate) {
                    const dueDate = new Date(preInvoice.payment.dueDate);
                    const diffMs = dueDate.getTime() - now.getTime();
                    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    const previousDays = preInvoice.payment.daysRemaining;
                    preInvoice.payment.daysRemaining = daysRemaining;
                    await preInvoice.save();
                    updatedCount++;
                    // Envoyer rappel à l'industriel si échéance proche
                    // Rappel à J-5 et J-2
                    if ((previousDays === 6 && daysRemaining <= 5) || (previousDays === 3 && daysRemaining <= 2)) {
                        try {
                            await notification_service_1.default.sendPaymentReminderToIndustrial(preInvoice.industrialEmail, preInvoice.industrialName, preInvoice.preInvoiceNumber, preInvoice.carrierName, preInvoice.carrierInvoice?.invoiceAmount || preInvoice.totals.totalTTC, daysRemaining, dueDate);
                            console.log(`[PreInvoice] Payment reminder sent for ${preInvoice.preInvoiceNumber} - ${daysRemaining} days`);
                        }
                        catch (err) {
                            console.error(`[PreInvoice] Failed to send payment reminder:`, err);
                        }
                    }
                    // Alerte paiement en retard (J+1, J+3, J+7)
                    if (daysRemaining < 0) {
                        const daysOverdue = Math.abs(daysRemaining);
                        if (daysOverdue === 1 || daysOverdue === 3 || daysOverdue === 7 || daysOverdue % 7 === 0) {
                            try {
                                await notification_service_1.default.sendOverduePaymentAlert(preInvoice.industrialEmail, preInvoice.industrialName, preInvoice.preInvoiceNumber, preInvoice.carrierName, preInvoice.carrierInvoice?.invoiceAmount || preInvoice.totals.totalTTC, daysOverdue);
                                console.log(`[PreInvoice] Overdue alert sent for ${preInvoice.preInvoiceNumber} - ${daysOverdue} days overdue`);
                            }
                            catch (err) {
                                console.error(`[PreInvoice] Failed to send overdue alert:`, err);
                            }
                        }
                    }
                }
            }
            return updatedCount;
        }
        catch (error) {
            console.error('[PreInvoice] Error updating payment countdowns:', error);
            return 0;
        }
    }
    /**
     * Marque une préfacture comme payée
     */
    static async markAsPaid(preInvoiceId, paymentReference, paidAmount) {
        try {
            const preInvoice = await PreInvoice_1.default.findOne({ preInvoiceId });
            if (!preInvoice)
                return null;
            if (!preInvoice.payment) {
                throw new Error('Aucune information de paiement sur cette préfacture');
            }
            preInvoice.payment.paidAt = new Date();
            preInvoice.payment.paidAmount = paidAmount;
            preInvoice.payment.paymentReference = paymentReference;
            preInvoice.status = 'paid';
            preInvoice.history.push({
                date: new Date(),
                action: 'paid',
                actor: 'system',
                details: `Paiement effectué - Réf: ${paymentReference} - Montant: ${paidAmount}€`
            });
            await preInvoice.save();
            // Notifier le transporteur
            await notification_service_1.default.notifyCarrierPaymentSent(preInvoice.carrierEmail, preInvoice.carrierName, preInvoice.preInvoiceNumber, paidAmount, paymentReference);
            return preInvoice;
        }
        catch (error) {
            console.error(`[PreInvoice] Mark as paid error:`, error);
            throw error;
        }
    }
    /**
     * Génère l'export Excel des règlements à effectuer
     */
    static async generatePaymentExport() {
        try {
            const preInvoices = await PreInvoice_1.default.find({
                status: 'payment_pending',
                'payment.bankDetails': { $exists: true }
            }).sort({ 'payment.dueDate': 1 });
            const exportData = preInvoices.map(pi => ({
                preInvoiceNumber: pi.preInvoiceNumber,
                carrierName: pi.carrierName,
                carrierSiret: pi.carrierSiret || 'N/A',
                invoiceNumber: pi.carrierInvoice?.invoiceNumber || 'N/A',
                invoiceDate: pi.carrierInvoice?.invoiceDate?.toLocaleDateString('fr-FR') || 'N/A',
                amount: pi.carrierInvoice?.invoiceAmount || pi.totals.totalTTC,
                dueDate: pi.payment?.dueDate?.toLocaleDateString('fr-FR') || 'N/A',
                daysRemaining: pi.payment?.daysRemaining || 0,
                bankName: pi.payment?.bankDetails?.bankName || 'N/A',
                accountHolder: pi.payment?.bankDetails?.accountHolder || 'N/A',
                iban: pi.payment?.bankDetails?.iban || 'N/A',
                bic: pi.payment?.bankDetails?.bic || 'N/A',
                industrialName: pi.industrialName,
                period: `${pi.period.month}/${pi.period.year}`
            }));
            return exportData;
        }
        catch (error) {
            console.error('[PreInvoice] Export generation error:', error);
            throw error;
        }
    }
    /**
     * Récupère les préfactures avec filtres
     */
    static async getPreInvoices(filters) {
        const query = {};
        if (filters.industrialId)
            query.industrialId = filters.industrialId;
        if (filters.carrierId)
            query.carrierId = filters.carrierId;
        if (filters.status)
            query.status = filters.status;
        if (filters.month)
            query['period.month'] = filters.month;
        if (filters.year)
            query['period.year'] = filters.year;
        return PreInvoice_1.default.find(query).sort({ createdAt: -1 });
    }
    /**
     * Récupère une préfacture par ID
     */
    static async getPreInvoiceById(preInvoiceId) {
        return PreInvoice_1.default.findOne({ preInvoiceId });
    }
    /**
     * Récupère une préfacture par numéro
     */
    static async getPreInvoiceByNumber(preInvoiceNumber) {
        return PreInvoice_1.default.findOne({ preInvoiceNumber });
    }
}
exports.default = PreInvoiceService;
//# sourceMappingURL=preinvoice-service.js.map