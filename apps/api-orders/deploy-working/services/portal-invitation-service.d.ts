import type { IAddress } from '../models/Order';
interface CreateInvitationParams {
    orderId: string;
    orderReference: string;
    address?: IAddress;
    email: string;
    contactName: string;
    phone?: string;
    role: 'supplier' | 'recipient' | 'logistician' | 'carrier';
    invitedBy: string;
}
interface CreateInvitationFromAddressParams {
    orderId: string;
    orderReference: string;
    address: IAddress;
    role: 'supplier' | 'recipient';
    invitedBy: string;
}
export declare class PortalInvitationService {
    /**
     * Détermine l'URL du portail selon le rôle
     */
    private static getPortalUrl;
    /**
     * Crée et envoie une invitation portail (méthode générique)
     */
    static createInvitation(params: CreateInvitationParams): Promise<string | null>;
    /**
     * Crée et envoie une invitation portail depuis une adresse (si accès activé)
     */
    static createAndSendInvitation(params: CreateInvitationFromAddressParams): Promise<string | null>;
    /**
     * Envoie l'email d'invitation
     */
    private static sendInvitationEmail;
    /**
     * Accepte une invitation et lie l'utilisateur
     */
    static acceptInvitation(token: string, userId: string): Promise<any>;
    /**
     * Récupère les invitations d'une commande
     */
    static getOrderInvitations(orderId: string): Promise<any[]>;
    /**
     * Renvoie une invitation expirée
     */
    static resendInvitation(invitationId: string): Promise<void>;
}
export default PortalInvitationService;
//# sourceMappingURL=portal-invitation-service.d.ts.map