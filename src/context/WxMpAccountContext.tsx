import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WxMpAccount, getWxMpAccountListApi } from '../api/airflow';
import { useUser } from './UserContext';

interface WxMpAccountContextType {
  wxMpAccountList: WxMpAccount[];
  isLoading: boolean;
  error: string | null;
  refreshWxMpAccounts: () => Promise<WxMpAccount[]>;
}

const WxMpAccountContext = createContext<WxMpAccountContextType | undefined>(undefined);

export const WxMpAccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wxMpAccountList, setWxMpAccountList] = useState<WxMpAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isAdmin } = useUser();

  const fetchWxMpAccounts = async (): Promise<WxMpAccount[]> => {
    if (!isAdmin) {
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const accounts = await getWxMpAccountListApi();
      setWxMpAccountList(accounts);
      setIsLoading(false);
      return accounts;
    } catch (err) {
      console.error('WeChat MP 账号列表错误', err);
      setError('Failed to load WeChat MP accounts');
      setIsLoading(false);
      return [];
    }
  };

  useEffect(() => {
    fetchWxMpAccounts();
  }, [isAdmin]);

  // Context value
  const contextValue: WxMpAccountContextType = {
    wxMpAccountList,
    isLoading,
    error,
    refreshWxMpAccounts: fetchWxMpAccounts
  };

  return (
    <WxMpAccountContext.Provider value={contextValue}>
      {children}
    </WxMpAccountContext.Provider>
  );
};

export const useWxMpAccount = (): WxMpAccountContextType => {
  const context = useContext(WxMpAccountContext);
  if (context === undefined) {
    throw new Error('useWxMpAccount must be used within a WxMpAccountProvider');
  }
  return context;
};
