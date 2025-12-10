import { IDispatchChain } from '../models/DispatchChain';
interface AffretiaOrderResponse {
    success: boolean;
    affretiaOrderId: string;
    status: 'received' | 'searching' | 'matched' | 'failed';
    estimatedResponseTime?: number;
    message?: string;
}
interface AffretiaStatusResponse {
    success: boolean;
    status: 'searching' | 'matched' | 'failed' | 'cancelled';
    carrier?: {
        carrierId: string;
        carrierName: string;
        price: number;
        estimatedPickup?: Date;
        estimatedDelivery?: Date;
    };
    message?: string;
}
declare class AffretiaService {
    private client;
    private baseUrl;
    private apiKey;
    constructor();
    /**
     * Envoie une commande à Affret.IA pour recherche de transporteur
     */
    escalateOrder(chain: IDispatchChain): Promise<AffretiaOrderResponse>;
    /**
     * Vérifie le statut d'une commande escaladée
     */
    checkStatus(affretiaOrderId: string): Promise<AffretiaStatusResponse>;
    /**
     * Annule une demande Affret.IA
     */
    cancelRequest(affretiaOrderId: string, reason: string): Promise<boolean>;
    /**
     * Traite le callback d'Affret.IA (transporteur trouvé ou échec)
     */
    handleCallback(payload: {
        affretiaOrderId: string;
        externalOrderId: string;
        status: 'matched' | 'failed';
        carrier?: {
            carrierId: string;
            carrierName: string;
            price: number;
        };
        reason?: string;
    }): Promise<void>;
    /**
     * Détermine l'urgence en fonction de la date d'enlèvement
     */
    private determineUrgency;
    /**
     * Mode mock pour les tests sans connexion Affret.IA
     */
    private mockEscalateResponse;
}
declare const _default: AffretiaService;
export default _default;
//# sourceMappingURL=affretia-service.d.ts.map