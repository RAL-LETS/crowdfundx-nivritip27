import { WalletAdapter } from '../types';
import albedo from '@albedo-link/intent';

export class AlbedoAdapter implements WalletAdapter {
  id = 'albedo';
  name = 'Albedo';
  logo = 'account_balance_wallet';

  async isInstalled(): Promise<boolean> {
    // Albedo is web-based, so it is always available
    return true;
  }

  async connect(): Promise<string> {
    try {
      const res = await albedo.publicKey({});
      if (!res.pubkey) {
        throw new Error('Could not retrieve public key from Albedo.');
      }
      return res.pubkey;
    } catch (err: any) {
      throw new Error(err.message || 'Albedo connection failed.');
    }
  }

  async disconnect(): Promise<void> {
    // Albedo is web-based and doesn't store active persistent sessions
  }

  async getNetwork(): Promise<string> {
    // Albedo requests network dynamically on intent request, we fallback to TESTNET
    return 'TESTNET';
  }

  async signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string> {
    try {
      const passphrase = opts?.networkPassphrase || 'Testnet ; Stellar Network ; September 2015';
      const network = passphrase.toLowerCase().includes('public') ? 'public' : 'testnet';
      
      const res = await albedo.tx({
        xdr,
        network,
      });

      if (!res.signed_envelope_xdr) {
        throw new Error('Albedo did not return a signed envelope.');
      }

      return res.signed_envelope_xdr;
    } catch (err: any) {
      throw new Error(err.message || 'Transaction signing rejected by Albedo.');
    }
  }
}
