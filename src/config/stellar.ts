// Helper to dynamically sanitize and validate URL strings
const sanitizeUrl = (url: string | undefined, defaultUrl: string): string => {
  if (!url) return defaultUrl;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const STELLAR_CONFIG = {
  NETWORK_PASSPHRASE: import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  RPC_URL: sanitizeUrl(import.meta.env.VITE_RPC_URL, 'https://soroban-testnet.stellar.org'),
  HORIZON_URL: sanitizeUrl(import.meta.env.VITE_HORIZON_URL, 'https://horizon-testnet.stellar.org'),
  TOKEN_CONTRACT_ID: import.meta.env.VITE_TOKEN_CONTRACT_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  REGISTRY_CONTRACT_ID: import.meta.env.VITE_CAMPAIGN_CONTRACT_ID || 'CC7YYA5M66GAGKUQDK6WLBVXTSBJCKWW7YYOKFCCEGS4JJGMILXLTJG7',
  TREASURY_CONTRACT_ID: import.meta.env.VITE_TREASURY_CONTRACT_ID || 'CBTBJGGZO5UTUOSPPQO7DLXNESC34FHCCKWLUJA7R434BBY2T3VNM66J',
  ANALYTICS_CONTRACT_ID: import.meta.env.VITE_ANALYTICS_CONTRACT_ID || 'CB6OUFU2RGYBIZJZYDEBUX5E4FTF3HS3WC5XJL7U3OPLTF3AFQEQFURK',
};

export default STELLAR_CONFIG;
