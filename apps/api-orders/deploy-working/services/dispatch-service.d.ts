import { ILane } from '../models/Lane';
import { IDispatchChain, IDispatchAttempt } from '../models/DispatchChain';
declare class DispatchService {
    /**
     * Détecte la ligne de transport correspondant à une commande
     * Lane Matching basé sur origine/destination et type de marchandise
     */
    static detectLane(orderId: string): Promise<ILane | null>;
    /**
     * Trouve les lanes correspondantes pour une commande
     */
    private static findMatchingLanes;
    /**
     * Évalue si une lane correspond à une commande
     */
    private static evaluateLaneMatch;
    /**
     * Vérifie la correspondance d'un critère de localisation
     */
    private static checkLocationMatch;
    /**
     * Génère la chaîne d'affectation à partir d'une lane
     * Tri des transporteurs: 60% position lane + 40% score global
     */
    static generateDispatchChain(orderId: string, lane: ILane): Promise<IDispatchChain>;
    /**
     * Démarre le processus de dispatch - envoie au premier transporteur
     */
    static startDispatch(chainId: string): Promise<IDispatchAttempt>;
    /**
     * Envoie la commande au prochain transporteur dans la chaîne
     */
    static sendToNextCarrier(chain: IDispatchChain): Promise<IDispatchAttempt>;
    /**
     * Envoie la notification email/SMS au transporteur
     */
    private static sendCarrierNotification;
    /**
     * Récupère les informations du transporteur (email, téléphone)
     * Priorité: 1) Contact stocké dans Lane, 2) Variable d'env, 3) Email générique
     */
    private static getCarrierInfo;
    /**
     * Traite l'acceptation par un transporteur
     */
    static handleCarrierAccept(chainId: string, carrierId: string, proposedPrice?: number): Promise<IDispatchChain>;
    /**
     * Notifie l'industriel d'un changement de statut dispatch
     */
    private static notifyIndustrialStatus;
    /**
     * Traite le refus par un transporteur
     */
    static handleCarrierRefuse(chainId: string, carrierId: string, reason?: string): Promise<IDispatchChain>;
    /**
     * Traite le timeout d'un transporteur
     */
    static handleCarrierTimeout(chainId: string, attemptIndex: number): Promise<IDispatchChain>;
    /**
     * Escalade vers Affret.IA
     */
    static escalateToAffretia(chain: IDispatchChain, reason: string): Promise<void>;
    /**
     * Récupère le statut de dispatch d'une commande
     */
    static getDispatchStatus(orderId: string): Promise<IDispatchChain | null>;
    /**
     * Récupère toutes les lanes actives
     */
    static getActiveLanes(): Promise<ILane[]>;
    /**
     * Crée une nouvelle lane
     */
    static createLane(laneData: Partial<ILane>): Promise<ILane>;
    /**
     * Met à jour une lane
     */
    static updateLane(laneId: string, updates: Partial<ILane>): Promise<ILane | null>;
}
export default DispatchService;
//# sourceMappingURL=dispatch-service.d.ts.map