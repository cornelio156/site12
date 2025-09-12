/*
 * Script para forçar a criptografia dos product_links
 */

const { Client, Databases, Query } = require('node-appwrite');
const CryptoJS = require('crypto-js');

// Configuração do Appwrite
const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '68b57623001723ccd259';
const databaseId = 'video_site_db';
const videoCollectionId = 'videos';
const apiKey = process.env.VITE_APPWRITE_API_KEY || 'YOUR_API_KEY';

// Chave de criptografia (deve ser a mesma usada no CryptoService)
const SECRET_KEY = 'site-pro-encryption-key-2024';

// Funções de criptografia
function generateIV() {
  return CryptoJS.lib.WordArray.random(16).toString();
}

function encrypt(text) {
  try {
    const iv = generateIV();
    const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY, {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return {
      encrypted: encrypted.toString(),
      iv: iv
    };
  } catch (error) {
    console.error('Erro ao criptografar texto:', error);
    throw new Error('Falha na criptografia');
  }
}

function encryptProductLink(link) {
  if (!link || link.trim() === '') return link;
  const { encrypted, iv } = encrypt(link);
  return `${encrypted}:${iv}`;
}

function isEncrypted(text) {
  // Verificar se está no formato de criptografia: texto_criptografado:iv
  // O texto criptografado geralmente começa com U2FsdGVkX1
  return text && 
         text.includes(':') && 
         text.split(':').length === 2 &&
         text.startsWith('U2FsdGVkX1');
}

// Inicializar cliente Appwrite
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

// Função principal para forçar criptografia dos links
async function forceEncryptLinks() {
  try {
    console.log('Forçando criptografia dos product_links...');
    
    // Buscar todos os vídeos
    const response = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.limit(100)]
    );
    
    console.log(`Encontrados ${response.documents.length} vídeos para processar`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const video of response.documents) {
      try {
        console.log(`Processando vídeo: ${video.$id}`);
        
        // Verificar se o product_link existe e não está criptografado
        if (video.product_link && !isEncrypted(video.product_link)) {
          console.log(`  - Link original: ${video.product_link}`);
          
          const encryptedLink = encryptProductLink(video.product_link);
          console.log(`  - Link criptografado: ${encryptedLink.substring(0, 50)}...`);
          
          // Atualizar apenas o product_link
          await databases.updateDocument(
            databaseId,
            videoCollectionId,
            video.$id,
            {
              product_link: encryptedLink
            }
          );
          
          console.log(`  ✓ Vídeo ${video.$id} atualizado com sucesso`);
          processedCount++;
        } else if (video.product_link && isEncrypted(video.product_link)) {
          console.log(`  - Link já está criptografado: ${video.product_link.substring(0, 50)}...`);
        } else {
          console.log(`  - Vídeo não tem product_link`);
        }
        
      } catch (error) {
        console.error(`  ✗ Erro ao processar vídeo ${video.$id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== Resumo da Criptografia de Links ===');
    console.log(`Total de vídeos processados: ${processedCount}`);
    console.log(`Erros encontrados: ${errorCount}`);
    console.log('Criptografia de links concluída!');
    
  } catch (error) {
    console.error('Erro geral na criptografia de links:', error);
  }
}

// Executar script
forceEncryptLinks();
