/**
 * Types SMS pour SYMPHONI.A
 */

export type SmsProvider = 'twilio' | 'ovh' | 'vonage' | 'mock';

export type SmsTemplateCategory = 'delivery' | 'tracking' | 'alert' | 'marketing' | 'auth';

export interface SmsConfig {
  provider: SmsProvider;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  ovhApplicationKey?: string;
  ovhApplicationSecret?: string;
  ovhConsumerKey?: string;
  ovhServiceName?: string;
  ovhSender?: string;
  vonageApiKey?: string;
  vonageApiSecret?: string;
  vonageFromNumber?: string;
}

export interface SmsMessage {
  to: string;
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  provider: SmsProvider;
  error?: string;
  cost?: number;
  segments?: number;
}

export interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  variables: string[];
  category: SmsTemplateCategory;
}

export interface SmsLog {
  id: string;
  to: string;
  body: string;
  templateId?: string;
  provider: SmsProvider;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  messageId?: string;
  error?: string;
  cost?: number;
  segments?: number;
  createdAt: Date;
  deliveredAt?: Date;
}

export interface SmsBulkJob {
  id: string;
  recipients: string[];
  templateId: string;
  variables: Record<string, string>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface SmsStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalCost: number;
  byProvider: Record<SmsProvider, { sent: number; cost: number }>;
  byTemplate: Record<string, number>;
  byDay: { date: string; count: number }[];
}
