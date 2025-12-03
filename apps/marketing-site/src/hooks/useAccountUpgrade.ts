import { useState, useCallback } from 'react';
import type {
  AccountType,
  CheckEligibilityRequest,
  CheckEligibilityResponse,
  UpgradeAccountRequest,
  UpgradeAccountResponse
} from '@/types/account';
import { canUpgradeAccountType } from '@/types/account';

interface UseAccountUpgradeReturn {
  loading: boolean;
  error: string | null;
  checkEligibility: (userId: string, desiredType: AccountType) => Promise<CheckEligibilityResponse>;
  upgradeAccount: (userId: string, fromType: AccountType, toType: AccountType, reason: string) => Promise<UpgradeAccountResponse>;
  canUpgrade: (fromType: AccountType, toType: AccountType) => boolean;
}

export function useAccountUpgrade(): UseAccountUpgradeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEligibility = useCallback(async (
    userId: string,
    desiredType: AccountType
  ): Promise<CheckEligibilityResponse> => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_ACCOUNT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net';
      const requestBody: CheckEligibilityRequest = {
        userId,
        desiredType
      };

      const response = await fetch(`${apiUrl}/api/account/check-eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: CheckEligibilityResponse = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la vérification d\'éligibilité';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const upgradeAccount = useCallback(async (
    userId: string,
    fromType: AccountType,
    toType: AccountType,
    reason: string
  ): Promise<UpgradeAccountResponse> => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_ACCOUNT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net';
      const requestBody: UpgradeAccountRequest = {
        userId,
        fromType,
        toType,
        reason
      };

      const response = await fetch(`${apiUrl}/api/account/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: UpgradeAccountResponse = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'évolution du compte';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const canUpgrade = useCallback((fromType: AccountType, toType: AccountType): boolean => {
    return canUpgradeAccountType(fromType, toType);
  }, []);

  return {
    loading,
    error,
    checkEligibility,
    upgradeAccount,
    canUpgrade
  };
}
