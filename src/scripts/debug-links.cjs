/*
 * Script para debugar os product_links no banco de dados
 */

const { Client, Databases, Query } = require('node-appwrite');

// Configuração do Appwrite
const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '68b57623001723ccd259';
const databaseId = 'video_site_db';
const videoCollectionId = 'videos';
const apiKey = process.env.VITE_APPWRITE_API_KEY || 'YOUR_API_KEY';

// Inicializar cliente Appwrite
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

// Função para debugar os links
async function debugLinks() {
  try {
    console.log('Debugando product_links no banco de dados...');
    
    // Buscar alguns vídeos
    const response = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.limit(5)]
    );
    
    console.log(`\nEncontrados ${response.documents.length} vídeos para debug:\n`);
    
    response.documents.forEach((video, index) => {
      console.log(`=== Vídeo ${index + 1}: ${video.$id} ===`);
      console.log(`Título: ${video.title}`);
      console.log(`Product Link: ${video.product_link}`);
      console.log(`Tipo do link: ${typeof video.product_link}`);
      console.log(`Contém ':' : ${video.product_link && video.product_link.includes(':')}`);
      console.log(`Split por ':': ${video.product_link ? video.product_link.split(':').length : 'N/A'}`);
      console.log(`É URL: ${video.product_link && video.product_link.startsWith('http')}`);
      console.log('---\n');
    });
    
  } catch (error) {
    console.error('Erro ao debugar links:', error);
  }
}

// Executar script
debugLinks();
