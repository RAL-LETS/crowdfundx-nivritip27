export interface WalletAdapter {
  id: string;
  name: string;
  logo: string;
  isInstalled(): Promise<boolean>;
  connect(): Promise<string>;
  disconnect(): Promise<void>;
  getNetwork(): Promise<string>;
  signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string>;
}
