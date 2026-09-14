import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { adapters, connect, isConnecting } = useWallet();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleConnect = async (walletId: string) => {
    try {
      await connect(walletId);
      onClose();
      showToast('success', 'Wallet connected', 'Your Stellar wallet is now connected.');
    } catch (err: any) {
      const msg: string = err?.message ?? String(err);
      // Distinguish user-rejected from other errors
      if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('denied')) {
        showToast('info', 'Connection cancelled', 'You rejected the wallet connection request.');
      } else {
        showToast('error', 'Connection failed', msg || 'Could not connect wallet. Please try again.');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Connect wallet"
    >
      <div
        className="bg-surface-container-low border border-outline-variant rounded-lg p-6 w-full max-w-sm shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close wallet modal"
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Connect Wallet</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">
          Select a Stellar wallet to connect to CrowdfundX.
        </p>

        <div className="flex flex-col gap-3">
          {adapters.map((adapter) => (
            <button
              key={adapter.id}
              disabled={isConnecting}
              onClick={() => handleConnect(adapter.id)}
              aria-label={`Connect with ${adapter.name}`}
              className="flex items-center justify-between w-full p-4 rounded bg-surface-container hover:bg-surface-container-highest border border-outline-variant transition-all disabled:opacity-50 disabled:cursor-not-allowed group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                  {adapter.logo || 'account_balance_wallet'}
                </span>
                <span className="font-label-lg text-label-lg font-bold text-on-surface">
                  {adapter.name}
                </span>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </button>
          ))}
        </div>

        {isConnecting && (
          <div className="mt-4 text-center">
            <p className="font-label-sm text-label-sm text-primary animate-pulse">Connecting...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletModal;
