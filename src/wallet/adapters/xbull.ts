import { WalletAdapter } from '../types';

declare global {
  interface Window {
    xBullSDK?: {
      connect(): Promise<string>;
      sign(params: { xdr: string; publicKey?: string; networkPassphrase?: string }): Promise<string>;
      getNetwork(): Promise<string>;
    };
  }
}

export class XBullAdapter implements WalletAdapter {
  id = 'xbull';
  name = 'xBull';
  logo = 'shield';

  async isInstalled(): Promise<boolean> {
    return typeof window !== 'undefined' && !!window.xBullSDK;
  }

  async connect(): Promise<string> {
    if (typeof window === 'undefined' || !window.xBullSDK) {
      throw new Error('xBull Wallet not detected. Please install the browser extension.');
    }
    try {
      const pubkey = await window.xBullSDK.connect();
      if (!pubkey) {
        throw new Error('Could not retrieve public key from xBull.');
      }
      return pubkey;
    } catch (err: any) {
      throw new Error(err.message || 'xBull connection failed.');
    }
  }

  async disconnect(): Promise<void> {
    // xBull manages sessions internally
  }

  async getNetwork(): Promise<string> {
    if (typeof window === 'undefined' || !window.xBullSDK) {
      return 'TESTNET';
    }
    try {
      // xBull getNetwork might return passphrase or network name
      const net = await window.xBullSDK.getNetwork();
      return net || 'TESTNET';
    } catch (e) {
      return 'TESTNET';
    }
  }

  async signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string> {
    if (typeof window === 'undefined' || !window.xBullSDK) {
      throw new Error('xBull Wallet not detected.');
    }
    try {
      const passphrase = opts?.networkPassphrase || 'Testnet ; Stellar Network ; September 2015';
      const signedTx = await window.xBullSDK.sign({
        xdr,
        networkPassphrase: passphrase,
      });
      return signedTx;
    } catch (err: any) {
      throw new Error(err.message || 'Transaction signing rejected by xBull.');
    }
  }
}
