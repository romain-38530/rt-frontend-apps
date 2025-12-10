declare class TimeoutScheduler {
    private intervalId;
    private isRunning;
    private checkIntervalMs;
    constructor(checkIntervalMinutes?: number);
    /**
     * Démarre le scheduler
     */
    start(): void;
    /**
     * Arrête le scheduler
     */
    stop(): void;
    /**
     * Vérifie et traite les tentatives expirées et envoie les rappels
     */
    checkExpiredAttempts(): Promise<void>;
    /**
     * Vérifie si un rappel doit être envoyé (50% du délai écoulé)
     */
    private checkAndSendReminder;
    /**
     * Récupère l'email d'un transporteur depuis la Lane
     */
    private getCarrierEmail;
    /**
     * Traite les timeouts pour une chaîne spécifique
     */
    private processChainTimeouts;
    /**
     * Récupère les statistiques du scheduler
     */
    getStats(): Promise<{
        isRunning: boolean;
        checkIntervalMs: number;
        pendingTimeouts: number;
    }>;
}
declare const timeoutScheduler: TimeoutScheduler;
export default timeoutScheduler;
//# sourceMappingURL=timeout-scheduler.d.ts.map