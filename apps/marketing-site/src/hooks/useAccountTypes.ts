import { useState, useEffect, useCallback } from 'react';
import type {
  AccountType,
  AccountTypeInfo,
  GetAvailableAccountTypesResponse,
  SelectAccountTypeRequest,
  SelectAccountTypeResponse
} from '@/types/account';
import { getCreatableAccountTypes } from '@/types/account';

interface UseAccountTypesReturn {
  accountTypes: AccountTypeInfo[];
  currentType: AccountType | null;
  creatableTypes: AccountType[];
  loading: boolean;
  error: string | null;
  selectAccountType: (type: AccountType, userId: string) => Promise<SelectAccountTypeResponse>;
  refreshAccountTypes: () => Promise<void>;
}

export function useAccountTypes(userId?: string): UseAccountTypesReturn {
  const [accountTypes, setAccountTypes] = useState<AccountTypeInfo[]>([]);
  const [currentType, setCurrentType] = useState<AccountType | null>(null);
  const [creatableTypes, setCreatableTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_ACCOUNT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net';
      const url = userId
        ? `${apiUrl}/api/account-types/available?userId=${userId}`
        : `${apiUrl}/api/account-types/available`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetAvailableAccountTypesResponse = await response.json();

      setAccountTypes(data.types);
      setCurrentType(data.currentType);
      setCreatableTypes(data.canCreate);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des types de comptes';
      setError(message);
      // Fallback sur les types locaux si l'API échoue
      const localTypes = getCreatableAccountTypes();
      setAccountTypes(localTypes);
      setCreatableTypes(localTypes.map(t => t.type));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const selectAccountType = useCallback(async (
    type: AccountType,
    userId: string
  ): Promise<SelectAccountTypeResponse> => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_ACCOUNT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net';
      const requestBody: SelectAccountTypeRequest = {
        userId,
        accountType: type
      };

      const response = await fetch(`${apiUrl}/api/account/select-type`, {
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

      const data: SelectAccountTypeResponse = await response.json();

      if (data.success) {
        setCurrentType(type);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sélection du type de compte';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAccountTypes = useCallback(async () => {
    await fetchAccountTypes();
  }, [fetchAccountTypes]);

  useEffect(() => {
    fetchAccountTypes();
  }, [fetchAccountTypes]);

  return {
    accountTypes,
    currentType,
    creatableTypes,
    loading,
    error,
    selectAccountType,
    refreshAccountTypes
  };
}
