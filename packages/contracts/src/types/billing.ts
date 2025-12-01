// Prefacturation Types
export interface PrefacturationLine {
  orderReference: string;
  deliveryDate: Date;
  origin: string;
  destination: string;
  weight: number;
  pallets: number;
  tariffCode: string;
  baseAmount: number;
  fuelSurcharge: number;
  options: Array<{
    code: string;
    label: string;
    amount: number;
  }>;
  totalHT: number;
  tva: number;
  totalTTC: number;
  discrepancies?: DiscrepancyItem[];
}

export interface DiscrepancyItem {
  type: 'weight' | 'pallets' | 'options' | 'tariff' | 'documents';
  description: string;
  expectedValue: any;
  actualValue: any;
  impact: number;
}

export interface PrefacturationTotals {
  baseAmount: number;
  fuelSurcharge: number;
  options: number;
  totalHT: number;
  tva: number;
  totalTTC: number;
  discrepancyAmount: number;
}

export interface Prefacturation {
  _id: string;
  reference: string;
  carrier: {
    id: string;
    name: string;
    siret?: string;
  };
  client: {
    id: string;
    name: string;
    siret?: string;
  };
  period: {
    start: Date;
    end: Date;
  };
  lines: PrefacturationLine[];
  totals: PrefacturationTotals;
  status: 'draft' | 'pending_validation' | 'validated' | 'finalized' | 'invoiced';
  hasDiscrepancies: boolean;
  discrepanciesCount: number;
  blocks: Array<{
    type: string;
    reason: string;
  }>;
  validationDate?: Date;
  finalizationDate?: Date;
  invoiceReference?: string;
  pdfUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tariff Types
export interface WeightBracket {
  minWeight: number;
  maxWeight: number;
  pricePerKg?: number;
  flatRate?: number;
}

export interface ZoneTariff {
  zoneName: string;
  zoneCode: string;
  postalCodes: string[];
  weightBrackets: WeightBracket[];
}

export interface TariffOption {
  code: string;
  label: string;
  type: 'percentage' | 'flat' | 'per_unit';
  value: number;
  applicable: boolean;
}

export interface TariffGrid {
  _id: string;
  reference: string;
  name: string;
  carrier: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    name: string;
  };
  validFrom: Date;
  validTo?: Date;
  zones: ZoneTariff[];
  fuelSurcharge: {
    type: 'percentage' | 'flat';
    value: number;
    appliedOn: 'base' | 'total';
  };
  options: TariffOption[];
  currency: string;
  tva: number;
  status: 'draft' | 'active' | 'archived';
  priority: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice Types
export interface BillingOCRResult {
  invoiceNumber?: string;
  invoiceDate?: Date;
  totalAmount?: number;
  tva?: number;
  carrier?: {
    name?: string;
    siret?: string;
    address?: string;
  };
  client?: {
    name?: string;
    siret?: string;
  };
  lines?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
  confidence: number;
  rawText?: string;
}

export interface CarrierInvoice {
  _id: string;
  reference: string;
  carrier: {
    id: string;
    name: string;
  };
  uploadDate: Date;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  ocrResult?: BillingOCRResult;
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrError?: string;
  validation: {
    status: 'pending' | 'in_progress' | 'validated' | 'rejected';
    validatedBy?: string;
    validatedAt?: Date;
    rejectionReason?: string;
  };
  matching: {
    prefacturationId?: string;
    matchScore?: number;
    discrepancies?: Array<{
      field: string;
      expected: any;
      actual: any;
      difference: number;
    }>;
  };
  totalAmount: number;
  period?: {
    start: Date;
    end: Date;
  };
  notes?: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Block Types
export interface Block {
  _id: string;
  reference: string;
  type: 'missing_documents' | 'vigilance' | 'pallets' | 'late' | 'manual';
  entity: {
    type: 'order' | 'carrier' | 'client' | 'prefacturation';
    id: string;
    reference?: string;
  };
  reason: string;
  details?: {
    missingDocs?: string[];
    vigilanceExpired?: {
      documentType: string;
      expiryDate: Date;
    };
    palletsDiscrepancy?: {
      expected: number;
      actual: number;
      difference: number;
    };
    delayDays?: number;
    customData?: any;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'cancelled';
  resolution?: {
    action: string;
    comment: string;
    resolvedBy: string;
    resolvedAt: Date;
  };
  impact: {
    blocksBilling: boolean;
    requiresApproval: boolean;
    affectedAmount?: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Dispute Types
export interface Dispute {
  _id: string;
  reference: string;
  prefacturationId: string;
  invoiceId?: string;
  orderReference?: string;
  type: 'tariff' | 'weight' | 'pallets' | 'documents' | 'delay' | 'quality' | 'other';
  status: 'open' | 'under_review' | 'resolved' | 'rejected' | 'escalated';
  initiator: {
    type: 'carrier' | 'client' | 'internal';
    id: string;
    name: string;
  };
  subject: string;
  description: string;
  evidence: Array<{
    type: 'document' | 'photo' | 'email' | 'note';
    url?: string;
    description: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
  amount: {
    disputed: number;
    proposed?: number;
    final?: number;
  };
  timeline: Array<{
    date: Date;
    action: string;
    actor: string;
    comment?: string;
    status: string;
  }>;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  resolution?: {
    decision: string;
    adjustedAmount?: number;
    comment: string;
    resolvedBy: string;
    resolvedAt: Date;
  };
  dueDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ERP Export Types
export interface ERPExportLine {
  accountCode: string;
  accountLabel: string;
  debit: number;
  credit: number;
  label: string;
  reference: string;
  analyticalCode?: string;
}

export interface ERPExport {
  _id: string;
  reference: string;
  exportDate: Date;
  period: {
    start: Date;
    end: Date;
  };
  erpSystem: 'sage' | 'sap' | 'cegid' | 'quadratus' | 'ebp' | 'other';
  format: 'csv' | 'xml' | 'json' | 'edi' | 'fec';
  type: 'invoices' | 'payments' | 'general_ledger' | 'analytical';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'sent';
  prefacturations: Array<{
    id: string;
    reference: string;
    amount: number;
  }>;
  lines: ERPExportLine[];
  totals: {
    linesCount: number;
    totalDebit: number;
    totalCredit: number;
    balance: number;
  };
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  validation: {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  };
  transmission: {
    method?: 'api' | 'ftp' | 'email' | 'manual';
    sentAt?: Date;
    sentBy?: string;
    confirmationRef?: string;
  };
  error?: {
    message: string;
    details?: any;
    occurredAt: Date;
  };
  metadata?: {
    journalCode?: string;
    companyCode?: string;
    fiscalYear?: number;
    customFields?: Record<string, any>;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Vigilance Types
export interface BillingVigilanceDocument {
  _id?: string;
  type: 'urssaf' | 'assurance' | 'licence' | 'kbis' | 'other';
  documentName: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  issueDate: Date;
  expiryDate?: Date;
  status: 'valid' | 'expiring_soon' | 'expired' | 'missing';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  alertDays: number;
  metadata?: {
    documentNumber?: string;
    issuingAuthority?: string;
    customFields?: Record<string, any>;
  };
  uploadedAt: Date;
  uploadedBy: string;
}

export interface CarrierVigilance {
  _id: string;
  carrier: {
    id: string;
    name: string;
    siret: string;
  };
  documents: BillingVigilanceDocument[];
  overallStatus: 'compliant' | 'warning' | 'non_compliant';
  compliance: {
    hasURSSAF: boolean;
    hasAssurance: boolean;
    hasLicence: boolean;
    hasKBIS: boolean;
    allValid: boolean;
    expiringCount: number;
    expiredCount: number;
    missingCount: number;
  };
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    documentType?: string;
    expiryDate?: Date;
    createdAt: Date;
  }>;
  billingRestrictions: {
    isBlocked: boolean;
    reason?: string;
    blockedSince?: Date;
  };
  lastReviewDate?: Date;
  lastReviewedBy?: string;
  nextReviewDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Statistics Types
export interface BillingStats {
  period: string;
  startDate: Date;
  endDate: Date;
  prefacturations: {
    total: number;
    draft: number;
    validated: number;
    finalized: number;
    withDiscrepancies: number;
    totalAmount: number;
    byStatus: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
  };
  blocks: {
    active: number;
    byType: Record<string, number>;
  };
  disputes: {
    open: number;
    byStatus: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
  };
  exports: {
    total: number;
    recent: any[];
  };
  vigilance: {
    totalCarriers: number;
    compliant: number;
    nonCompliant: number;
    withAlerts: number;
    complianceRate: number;
  };
}

// Request/Response Types
export interface GeneratePrefacturationRequest {
  carrierId: string;
  clientId: string;
  carrier: {
    id: string;
    name: string;
    siret?: string;
  };
  client: {
    id: string;
    name: string;
    siret?: string;
  };
  period: {
    start: Date;
    end: Date;
  };
  orders: Array<{
    reference: string;
    deliveryDate: Date;
    origin: string;
    destination: string;
    weight: number;
    pallets: number;
    tariffCode?: string;
    pricePerKg?: number;
    fuelSurchargeRate?: number;
    options?: Array<{
      code: string;
      label: string;
      amount: number;
    }>;
    discrepancies?: DiscrepancyItem[];
  }>;
  userId?: string;
}

export interface UploadInvoiceRequest {
  carrierId: string;
  carrierName: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  totalAmount?: number;
  userId?: string;
}

export interface CreateBlockRequest {
  entityType: 'order' | 'carrier' | 'client' | 'prefacturation';
  entityId: string;
  entityReference?: string;
  type: 'missing_documents' | 'vigilance' | 'pallets' | 'late' | 'manual';
  reason: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  details?: any;
  userId?: string;
}

export interface CreateTariffRequest {
  name: string;
  carrier: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    name: string;
  };
  validFrom: Date;
  validTo?: Date;
  zones: ZoneTariff[];
  fuelSurcharge: {
    type: 'percentage' | 'flat';
    value: number;
    appliedOn: 'base' | 'total';
  };
  options: TariffOption[];
  currency?: string;
  tva?: number;
  priority?: number;
  userId?: string;
}

export interface CreateVigilanceDocumentRequest {
  carrierId: string;
  carrierName: string;
  carrierSiret: string;
  document: {
    type: 'urssaf' | 'assurance' | 'licence' | 'kbis' | 'other';
    documentName: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    issueDate: Date;
    expiryDate?: Date;
    alertDays?: number;
    metadata?: any;
  };
  userId?: string;
}

export interface ExportToERPRequest {
  prefacturationIds: string[];
  erpSystem: 'sage' | 'sap' | 'cegid' | 'quadratus' | 'ebp' | 'other';
  format: 'csv' | 'xml' | 'json' | 'edi' | 'fec';
  type?: 'invoices' | 'payments' | 'general_ledger' | 'analytical';
  period?: {
    start: Date;
    end: Date;
  };
  metadata?: any;
  userId?: string;
}
