import React, { createContext, useContext, useState, useEffect } from 'react';
import { Horizon } from 'stellar-sdk';
import walletService from '../wallet/walletService';
import { WalletAdapter } from '../wallet/types';
import { STELLAR_CONFIG } from '../config/stellar';

interface WalletContextType {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  activeWallet: WalletAdapter | null;
  isConnecting: boolean;
  adapters: WalletAdapter[];
  connect: (walletId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signTx: (xdr: string, opts?: { networkPassphrase?: string }) => Promise<string>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [activeWallet, setActiveWallet] = useState<WalletAdapter | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const adapters = walletService.getAdapters();

  const horizonServer = new Horizon.Server(STELLAR_CONFIG.HORIZON_URL);

  const refreshBalance = async () => {
    if (!address) return;
    try {
      const account = await horizonServer.loadAccount(address);
      const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
      if (nativeBalance) {
        const formattedBalance = Number(nativeBalance.balance).toLocaleString('en-US', { maximumFractionDigits: 2 });
        setBalance(formattedBalance);
      } else {
        setBalance('0.00');
      }
    } catch (e: any) {
      console.error('WalletContext: Could not fetch Stellar balance for address:', address, e);
      setBalance(null);
    }
  };

  useEffect(() => {
    if (address) {
      refreshBalance();
    } else {
      setBalance(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Handle auto connection on load
  useEffect(() => {
    const tryAutoConnect = async () => {
      const savedAdapter = walletService.getActiveAdapter();
      if (savedAdapter) {
        setIsConnecting(true);
        try {
          const addr = await walletService.autoConnect();
          if (addr) {
            setAddress(addr);
            setActiveWallet(savedAdapter);
          }
        } catch (e) {
          console.error('Wallet auto connection failed:', e);
        } finally {
          setIsConnecting(false);
        }
      }
    };
    tryAutoConnect();
  }, []);

  const connect = async (walletId: string) => {
    setIsConnecting(true);
    try {
      const adapter = walletService.getAdapter(walletId);
      if (!adapter) throw new Error(`Wallet provider ${walletId} not found`);

      let addr;
      try {
        addr = await adapter.connect();
      } catch (e: any) {
        console.error(`WalletContext: Could not connect to ${adapter.name}:`, e);
        throw e;
      }
      setAddress(addr);
      walletService.setActiveAdapter(adapter);
      setActiveWallet(adapter);
    } catch (e: any) {
      console.error('Connection error:', e);
      throw e;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    const adapter = walletService.getActiveAdapter();
    if (adapter) {
      await adapter.disconnect();
    }
    walletService.setActiveAdapter(null);
    setAddress(null);
    setActiveWallet(null);
    setBalance(null);
  };

  const signTx = async (xdr: string, opts?: { networkPassphrase?: string }) => {
    const adapter = walletService.getActiveAdapter();
    if (!adapter) throw new Error('No active wallet connected');
    try {
      return await adapter.signTransaction(xdr, opts);
    } catch (e) {
      console.error('WalletContext: Real wallet signing failed:', e);
      throw e;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        isConnected: !!address,
        activeWallet,
        isConnecting,
        adapters,
        connect,
        disconnect,
        signTx,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
