/**
 * Service GDPR - Export et suppression des données personnelles
 */

import User from '../models/User';
import { GDPRRequest, IGDPRRequest } from '../models/GDPRRequest';
import AuditLog from '../models/AuditLog';
import LeadCompany from '../models/LeadCompany';
import LeadContact from '../models/LeadContact';
import mongoose from 'mongoose';
import { logger } from '../config/logger';

export interface UserDataExport {
  exportDate: string;
  user: any;
  companies?: any[];
  contacts?: any[];
  auditLogs?: any[];
}

class GDPRService {
  /**
   * Exporter toutes les données d'un utilisateur
   */
  async exportUserData(userId: string): Promise<UserDataExport> {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    // Collecter toutes les données liées
    const [companies, contacts, auditLogs] = await Promise.all([
      LeadCompany.find({
        $or: [
          { createdBy: userId },
          { assignedTo: userId }
        ]
      }).lean(),
      LeadContact.find({
        $or: [
          { createdBy: userId }
        ]
      }).lean(),
      AuditLog.find({ userId }).lean()
    ]);

    return {
      exportDate: new Date().toISOString(),
      user: this.sanitizeUser(user),
      companies: companies.map(c => this.sanitizeCompany(c)),
      contacts: contacts.map(c => this.sanitizeContact(c)),
      auditLogs: auditLogs.map((l: any) => ({
        action: l.action,
        timestamp: l.createdAt,
        details: l.details
      }))
    };
  }

  /**
   * Supprimer/anonymiser les données d'un utilisateur
   */
  async deleteUserData(userId: string): Promise<{ success: boolean; deletedItems: Record<string, number> }> {
    const deletedItems: Record<string, number> = {};

    try {
      // Anonymiser l'utilisateur (ne pas supprimer pour garder l'intégrité référentielle)
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      await User.findByIdAndUpdate(userId, {
        email: `deleted_${userId}@anonymized.local`,
        firstName: 'DELETED',
        lastName: 'USER',
        phone: null,
        password: 'DELETED',
        isActive: false,
        isDeleted: true,
        deletedAt: new Date()
      });
      deletedItems.user = 1;

      // Anonymiser les contacts créés par l'utilisateur
      const contactResult = await LeadContact.updateMany(
        { createdBy: new mongoose.Types.ObjectId(userId) },
        {
          $set: {
            email: 'anonymized@deleted.local',
            telephone: null,
            prenom: 'ANONYMIZED',
            nom: 'USER'
          }
        }
      );
      deletedItems.contacts = contactResult.modifiedCount;

      // Supprimer les logs d'audit (ou anonymiser si nécessaire pour compliance)
      const auditResult = await AuditLog.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
      deletedItems.auditLogs = auditResult.deletedCount;

      logger.info('GDPR deletion completed', { userId, deletedItems });

      return { success: true, deletedItems };
    } catch (error) {
      logger.error('GDPR deletion failed', { userId, error });
      throw error;
    }
  }

  /**
   * Créer une demande GDPR
   */
  async createRequest(
    type: 'access' | 'deletion' | 'portability' | 'rectification',
    requestedBy: string,
    targetUser: string,
    reason?: string
  ): Promise<IGDPRRequest> {
    const request = await GDPRRequest.create({
      type,
      requestedBy: new mongoose.Types.ObjectId(requestedBy),
      targetUser: new mongoose.Types.ObjectId(targetUser),
      reason
    });

    logger.info('GDPR request created', { type, requestedBy, targetUser, requestId: request._id });

    return request;
  }

  /**
   * Traiter une demande GDPR
   */
  async processRequest(
    requestId: string,
    action: 'approve' | 'reject',
    processedBy: string,
    notes?: string
  ): Promise<IGDPRRequest> {
    const request = await GDPRRequest.findById(requestId);
    if (!request) throw new Error('Request not found');

    if (request.status !== 'pending') {
      throw new Error('Request has already been processed');
    }

    if (action === 'reject') {
      request.status = 'rejected';
      request.processedBy = new mongoose.Types.ObjectId(processedBy);
      request.processedAt = new Date();
      request.notes = notes;
      await request.save();

      logger.info('GDPR request rejected', { requestId, processedBy });
      return request;
    }

    // Traiter selon le type
    request.status = 'processing';
    await request.save();

    try {
      switch (request.type) {
        case 'access':
        case 'portability':
          const data = await this.exportUserData(request.targetUser.toString());
          request.result = data;
          break;

        case 'deletion':
          const deleteResult = await this.deleteUserData(request.targetUser.toString());
          request.result = deleteResult;
          break;

        case 'rectification':
          // La rectification est manuelle, juste marquer comme complété
          request.result = { manual: true, notes };
          break;
      }

      request.status = 'completed';
      request.processedBy = new mongoose.Types.ObjectId(processedBy);
      request.processedAt = new Date();
      request.notes = notes;
      await request.save();

      logger.info('GDPR request completed', { requestId, type: request.type, processedBy });

      return request;
    } catch (error) {
      request.status = 'pending';
      await request.save();
      throw error;
    }
  }

  /**
   * Lister les demandes GDPR
   */
  async listRequests(options: { status?: string; limit?: number; offset?: number } = {}): Promise<{ requests: IGDPRRequest[]; total: number }> {
    const query: any = {};
    if (options.status) {
      query.status = options.status;
    }

    const [requests, total] = await Promise.all([
      GDPRRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(options.offset || 0)
        .limit(options.limit || 50)
        .populate('requestedBy', 'email firstName lastName')
        .populate('targetUser', 'email firstName lastName')
        .populate('processedBy', 'email firstName lastName')
        .lean(),
      GDPRRequest.countDocuments(query)
    ]);

    return { requests: requests as unknown as IGDPRRequest[], total };
  }

  /**
   * Obtenir une demande par ID
   */
  async getRequest(requestId: string): Promise<IGDPRRequest | null> {
    return GDPRRequest.findById(requestId)
      .populate('requestedBy', 'email firstName lastName')
      .populate('targetUser', 'email firstName lastName')
      .populate('processedBy', 'email firstName lastName');
  }

  // === Helpers privés ===

  private sanitizeUser(user: any): any {
    const { password, adminKey, ...safe } = user;
    return safe;
  }

  private sanitizeCompany(company: any): any {
    return company;
  }

  private sanitizeContact(contact: any): any {
    return contact;
  }
}

export const gdprService = new GDPRService();
export default gdprService;
