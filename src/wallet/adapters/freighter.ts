import { WalletAdapter } from '../types';
import {
  isConnected,
  requestAccess,
  getNetwork,
  signTransaction,
} from '@stellar/freighter-api';

export class FreighterAdapter implements WalletAdapter {
  id = 'freighter';
  name = 'Freighter';
  logo = 'rocket_launch';

  async isInstalled(): Promise<boolean> {
    try {
      const res = await isConnected();
      return !!(res && res.isConnected);
    } catch (e) {
      return false;
    }
  }

  async connect(): Promise<string> {
    console.log('[Freighter Debug] Step 1: Detect Freighter - Initiating...');
    let connectionResult;
    try {
      connectionResult = await isConnected();
    } catch (e: any) {
      console.error('[Freighter Debug] Step 1 Failure: Error while checking connection status at src/wallet/adapters/freighter.ts line 28.', e);
      throw new Error(`Freighter connection check failed: ${e.message}`);
    }

    if (!connectionResult || !connectionResult.isConnected) {
      console.error('[Freighter Debug] Step 1 Failure: Freighter Wallet not detected at src/wallet/adapters/freighter.ts line 33.');
      throw new Error('Freighter Wallet not detected. Please install the browser extension.');
    }
    console.log('[Freighter Debug] Step 1: Detect Freighter - Success. Freighter is installed.');

    console.log('[Freighter Debug] Step 2: Request Access - Initiating authorization popup...');
    let accessResult;
    try {
      accessResult = await requestAccess();
    } catch (e: any) {
      console.error('[Freighter Debug] Step 2 Failure: Error during requestAccess at src/wallet/adapters/freighter.ts line 41.', e);
      throw new Error(`Freighter authorization request failed: ${e.message}`);
    }

    if (accessResult.error) {
      console.error(`[Freighter Debug] Step 2 Failure: User denied wallet authorization or error returned at src/wallet/adapters/freighter.ts line 46. Error: ${accessResult.error}`);
      throw new Error(accessResult.error || 'User denied wallet authorization.');
    }
    console.log('[Freighter Debug] Step 2: Request Access - Success. Authorization granted.');

    console.log('[Freighter Debug] Step 3: Retrieve Address - Initiating...');
    const key = accessResult.address;
    if (!key) {
      console.error('[Freighter Debug] Step 3 Failure: Address field was empty or missing at src/wallet/adapters/freighter.ts line 53.');
      throw new Error('Could not retrieve public key. Please unlock Freighter and authorize connection.');
    }
    console.log(`[Freighter Debug] Step 3: Retrieve Address - Success. Address retrieved: ${key}`);

    return key;
  }

  async disconnect(): Promise<void> {
    // Freighter extension manages session internally
  }

  async getNetwork(): Promise<string> {
    console.log('[Freighter Debug] Step 4: Retrieve Network - Initiating...');
    try {
      const netResult = await getNetwork();
      if (netResult.error) {
        console.error(`[Freighter Debug] Step 4 Failure: Error from getNetwork at src/wallet/adapters/freighter.ts line 66. Error: ${netResult.error}`);
        return 'TESTNET';
      }
      const net = netResult.network || 'TESTNET';
      console.log(`[Freighter Debug] Step 4: Retrieve Network - Success. Current network: ${net}`);
      return net;
    } catch (e: any) {
      console.error('[Freighter Debug] Step 4 Failure: Error fetching network at src/wallet/adapters/freighter.ts line 72.', e);
      return 'TESTNET';
    }
  }

  async signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string> {
    try {
      const passphrase = opts?.networkPassphrase || 'Testnet ; Stellar Network ; September 2015';
      const signResult = await signTransaction(xdr, {
        networkPassphrase: passphrase,
      });
      
      if (signResult.error) {
        throw new Error(signResult.error);
      }

      return signResult.signedTxXdr;
    } catch (err: any) {
      throw new Error(err.message || 'Transaction signing rejected by Freighter.');
    }
  }
}

