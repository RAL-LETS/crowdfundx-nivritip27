import { WalletAdapter } from './types';
import { FreighterAdapter } from './adapters/freighter';
import { AlbedoAdapter } from './adapters/albedo';
import { XBullAdapter } from './adapters/xbull';

class WalletService {
  private adapters: Map<string, WalletAdapter> = new Map();
  private activeAdapter: WalletAdapter | null = null;

  constructor() {
    this.registerAdapter(new FreighterAdapter());
    this.registerAdapter(new AlbedoAdapter());
    this.registerAdapter(new XBullAdapter());
  }

  registerAdapter(adapter: WalletAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  getAdapters(): WalletAdapter[] {
    return Array.from(this.adapters.values());
  }

  getAdapter(id: string): WalletAdapter | undefined {
    return this.adapters.get(id);
  }

  setActiveAdapter(adapter: WalletAdapter | null) {
    this.activeAdapter = adapter;
    if (adapter) {
      localStorage.setItem('crowdfundx_wallet_provider', adapter.id);
    } else {
      localStorage.removeItem('crowdfundx_wallet_provider');
    }
  }

  getActiveAdapter(): WalletAdapter | null {
    if (!this.activeAdapter) {
      const savedId = localStorage.getItem('crowdfundx_wallet_provider');
      if (savedId) {
        const adapter = this.getAdapter(savedId);
        if (adapter) {
          this.activeAdapter = adapter;
        }
      }
    }
    return this.activeAdapter;
  }

  async autoConnect(): Promise<string | null> {
    const adapter = this.getActiveAdapter();
    if (adapter) {
      try {
        const installed = await adapter.isInstalled();
        if (installed) {
          const address = await adapter.connect();
          return address;
        }
      } catch (e) {
        console.warn('Auto reconnect failed:', e);
      }
    }
    return null;
  }
}

export const walletService = new WalletService();
export default walletService;
