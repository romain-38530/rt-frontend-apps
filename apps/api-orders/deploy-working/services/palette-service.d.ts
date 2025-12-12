export type PalletType = 'EURO_EPAL' | 'EURO_EPAL_2' | 'DEMI_PALETTE' | 'PALETTE_PERDUE';
declare class PaletteService {
    static confirmPickupExchange(orderId: string, params: any): Promise<{
        success: boolean;
        chequeId: string | undefined;
        balance: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        chequeId?: undefined;
        balance?: undefined;
    }>;
    static confirmDeliveryExchange(orderId: string, params: any): Promise<{
        success: boolean;
        balance: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        balance?: undefined;
    }>;
    private static updateLedger;
    static getPalletStatus(orderId: string): Promise<{
        success: boolean;
        tracking: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        tracking?: undefined;
    }>;
    static getCompanyBalance(companyId: string): Promise<{
        success: boolean;
        ledger: unknown;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        ledger?: undefined;
    }>;
}
export default PaletteService;
//# sourceMappingURL=palette-service.d.ts.map