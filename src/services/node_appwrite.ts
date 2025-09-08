import { Client, Account, Databases, Storage } from 'appwrite';
import { AppwriteCredentialsManager } from './AppwriteCredentialsManager';

// Appwrite configuration
const endpoint = 'https://fra.cloud.appwrite.io/v1'; // Endpoint fixo

// Database and collection IDs - IDs simples e consistentes
export const databaseId = 'video_site_db';
export const videoCollectionId = 'videos';
export const userCollectionId = 'users'; 
export const siteConfigCollectionId = 'site_config';
export const sessionCollectionId = 'sessions';

// Storage bucket IDs - IDs simples e consistentes
export const videosBucketId = 'videos_bucket';
export const thumbnailsBucketId = 'thumbnails_bucket';

// Create Appwrite client
const client = new Client();
client.setEndpoint(endpoint);

// Função para configurar o cliente com as credenciais atuais
const configureClient = () => {
  const projectId = AppwriteCredentialsManager.getProjectId();
  if (projectId) {
    client.setProject(projectId);
  }
};

// Configurar cliente inicialmente
configureClient();

// Export Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Função para recarregar o cliente quando as credenciais mudarem
const reloadClient = () => {
  configureClient();
};

// Escutar mudanças nas credenciais
if (typeof window !== 'undefined') {
  window.addEventListener('appwriteCredentialsChanged', reloadClient);
}

export default client;

