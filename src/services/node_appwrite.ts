import { Client, Account, Databases, Storage } from 'appwrite';

// Appwrite configuration
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

// Database and collection IDs
export const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const videoCollectionId = import.meta.env.VITE_APPWRITE_VIDEO_COLLECTION_ID;
export const userCollectionId = import.meta.env.VITE_APPWRITE_USER_COLLECTION_ID;
export const siteConfigCollectionId = import.meta.env.VITE_APPWRITE_SITE_CONFIG_COLLECTION_ID;
export const sessionCollectionId = import.meta.env.VITE_APPWRITE_SESSION_COLLECTION_ID;

// Storage bucket IDs
export const videosBucketId = import.meta.env.VITE_APPWRITE_VIDEOS_BUCKET_ID;
export const thumbnailsBucketId = import.meta.env.VITE_APPWRITE_THUMBNAILS_BUCKET_ID;

// Create Appwrite client
const client = new Client();
client.setEndpoint(endpoint).setProject(projectId);

// Export Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export default client;

// VITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
// VITE_PROJECT_ID=681f80fb0002d0579432
// VITE_DATABASE_ID=681f818100229727cfc0
// VITE_USERS_COLECTION_ID=681f81d400299a7b65f0
// VITE_VIDEOS_COLECTION_ID=681f81a4001d1281896e
// VITE_SITE_CONFIG_COLECTION_ID=681f81f2002d7e998cc1
// VITE_SESSION_COLECTION_ID=681f9c5500255f0f15d4
// VITE_VIDEO_BUCKET_ID=681f820d00319f2aa58b
// VITE_THUMBNAIL_BUCKET_ID=681f82280005e6182fdd 
// Correcoes:
// VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
// VITE_APPWRITE_PROJECT_ID=681f80fb0002d0579432
// VITE_APPWRITE_DATABASE_ID=681f818100229727cfc0
// VITE_APPWRITE_USER_COLLECTION_ID=681f81d400299a7b65f0
// VITE_APPWRITE_VIDEO_COLLECTION_ID=681f81a4001d1281896e
// VITE_APPWRITE_SITE_CONFIG_COLLECTION_ID=681f81f2002d7e998cc1
// VITE_APPWRITE_SESSION_COLLECTION_ID=681f9c5500255f0f15d4
// VITE_APPWRITE_VIDEOS_BUCKET_ID=681f820d00319f2aa58b
// VITE_APPWRITE_THUMBNAILS_BUCKET_ID=681f82280005e6182fdd
