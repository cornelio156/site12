import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { databases, databaseId, siteConfigCollectionId } from '../services/node_appwrite';

// Define the site config interface
interface SiteConfig {
  $id: string;
  site_name: string;
  paypal_client_id: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
  telegram_username: string;
  video_list_title?: string;
  crypto?: string[];
  email_host?: string;
  email_port?: string;
  email_secure?: boolean;
  email_user?: string;
  email_pass?: string;
  email_from?: string;
}

// Define the context interface
interface SiteConfigContextType {
  siteName: string;
  paypalClientId: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  telegramUsername: string;
  videoListTitle: string;
  cryptoWallets: string[];
  emailHost: string;
  emailPort: string;
  emailSecure: boolean;
  emailUser: string;
  emailPass: string;
  emailFrom: string;
  siteConfig: SiteConfig | null;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

// Create the context with default values
const SiteConfigContext = createContext<SiteConfigContextType>({
  siteName: 'VideosPlus',
  paypalClientId: '',
  stripePublishableKey: '',
  stripeSecretKey: '',
  telegramUsername: '',
  videoListTitle: 'Available Videos',
  cryptoWallets: [],
  emailHost: 'smtp.gmail.com',
  emailPort: '587',
  emailSecure: false,
  emailUser: '',
  emailPass: '',
  emailFrom: '',
  siteConfig: null,
  loading: false,
  error: null,
  refreshConfig: async () => {},
});

// Provider component
export const SiteConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch site configuration
  const fetchSiteConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await databases.listDocuments(
        databaseId,
        siteConfigCollectionId
      );
      
      if (response.documents.length > 0) {
        const config = response.documents[0] as unknown as SiteConfig;
        setConfig(config);
      }
    } catch (err) {
      console.error('Error fetching site config:', err);
      setError('Failed to load site configuration');
    } finally {
      setLoading(false);
    }
  };

  // Fetch config on mount
  useEffect(() => {
    fetchSiteConfig();
  }, []);

  // Context value
  const value = {
    siteName: config?.site_name || 'VideosPlus',
    paypalClientId: config?.paypal_client_id || '',
    stripePublishableKey: config?.stripe_publishable_key || '',
    stripeSecretKey: config?.stripe_secret_key || '',
    telegramUsername: config?.telegram_username || '',
    videoListTitle: config?.video_list_title || 'Available Videos',
    cryptoWallets: config?.crypto || [],
    emailHost: config?.email_host || 'smtp.gmail.com',
    emailPort: config?.email_port || '587',
    emailSecure: config?.email_secure || false,
    emailUser: config?.email_user || '',
    emailPass: config?.email_pass || '',
    emailFrom: config?.email_from || '',
    siteConfig: config,
    loading,
    error,
    refreshConfig: fetchSiteConfig,
  };

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
};

// Custom hook for using the context
export const useSiteConfig = () => useContext(SiteConfigContext);

export default SiteConfigContext; 