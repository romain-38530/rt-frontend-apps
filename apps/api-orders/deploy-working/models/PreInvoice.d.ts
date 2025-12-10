/**
 * Modèle PreInvoice - Préfacturation SYMPHONI.A
 * Gestion du cycle de facturation transporteur avec contrôle intelligent
 */
import mongoose, { Document } from 'mongoose';
export type PreInvoiceStatus = 'pending' | 'sent_to_industrial' | 'validated_industrial' | 'invoice_uploaded' | 'invoice_accepted' | 'invoice_rejected' | 'payment_pending' | 'paid' | 'disputed';
export interface IPreInvoiceLine {
    orderId: string;
    orderReference: string;
    pickupDate: Date;
    deliveryDate: Date;
    pickupCity: string;
    deliveryCity: string;
    baseAmount: number;
    waitingHours: number;
    waitingAmount: number;
    delayHours: number;
    delayPenalty: number;
    fuelSurcharge: number;
    tolls: number;
    otherCharges: number;
    totalAmount: number;
    cmrValidated: boolean;
    cmrNotes?: string;
    kpiData: {
        onTimePickup: boolean;
        onTimeDelivery: boolean;
        documentsComplete: boolean;
        incidentFree: boolean;
    };
}
export interface ICarrierBankDetails {
    bankName: string;
    iban: string;
    bic: string;
    accountHolder: string;
}
export interface IPreInvoice extends Document {
    preInvoiceId: string;
    preInvoiceNumber: string;
    period: {
        month: number;
        year: number;
        startDate: Date;
        endDate: Date;
    };
    industrialId: string;
    industrialName: string;
    industrialEmail: string;
    carrierId: string;
    carrierName: string;
    carrierEmail: string;
    carrierSiret?: string;
    lines: IPreInvoiceLine[];
    totals: {
        baseAmount: number;
        waitingAmount: number;
        delayPenalty: number;
        fuelSurcharge: number;
        tolls: number;
        otherCharges: number;
        subtotalHT: number;
        tvaRate: number;
        tvaAmount: number;
        totalTTC: number;
    };
    kpis: {
        totalOrders: number;
        onTimePickupRate: number;
        onTimeDeliveryRate: number;
        documentsCompleteRate: number;
        incidentFreeRate: number;
        averageWaitingHours: number;
        totalWaitingHours: number;
    };
    status: PreInvoiceStatus;
    industrialValidation?: {
        validatedAt: Date;
        validatedBy: string;
        comments?: string;
        adjustments?: {
            lineIndex: number;
            originalAmount: number;
            adjustedAmount: number;
            reason: string;
        }[];
    };
    carrierInvoice?: {
        invoiceNumber: string;
        invoiceDate: Date;
        invoiceAmount: number;
        documentId: string;
        uploadedAt: Date;
        bankDetails: ICarrierBankDetails;
    };
    invoiceControl?: {
        preInvoiceAmount: number;
        carrierInvoiceAmount: number;
        difference: number;
        differencePercent: number;
        autoAccepted: boolean;
        controlDate: Date;
        controlNotes?: string;
    };
    payment?: {
        dueDate: Date;
        paymentTermDays: number;
        daysRemaining: number;
        paidAt?: Date;
        paidAmount?: number;
        paymentReference?: string;
        bankDetails: ICarrierBankDetails;
    };
    history: {
        date: Date;
        action: string;
        actor: string;
        details?: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
    sentToIndustrialAt?: Date;
}
declare const _default: mongoose.Model<IPreInvoice, {}, {}, {}, mongoose.Document<unknown, {}, IPreInvoice, {}, {}> & IPreInvoice & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PreInvoice.d.ts.map