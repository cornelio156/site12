/*
 * Script para criptografar dados existentes no Appwrite
 * Este script deve ser executado uma vez para criptografar todos os dados existentes
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

// Funções de criptografia (copiadas do CryptoService)
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

function encryptVideoTitle(title) {
  const { encrypted, iv } = encrypt(title);
  return `${encrypted}:${iv}`;
}

function encryptVideoDescription(description) {
  const { encrypted, iv } = encrypt(description);
  return `${encrypted}:${iv}`;
}

function encryptProductLink(link) {
  if (!link || link.trim() === '') return link;
  const { encrypted, iv } = encrypt(link);
  return `${encrypted}:${iv}`;
}

function encryptFileId(fileId) {
  if (!fileId || fileId.trim() === '') return fileId;
  const { encrypted, iv } = encrypt(fileId);
  return `${encrypted}:${iv}`;
}

function isEncrypted(text) {
  return text && text.includes(':') && text.split(':').length === 2;
}

// Inicializar cliente Appwrite
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

// Função principal para criptografar dados existentes
async function encryptExistingData() {
  try {
    console.log('Iniciando criptografia de dados existentes...');
    
    // Buscar todos os vídeos
    const response = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.limit(100)] // Ajustar conforme necessário
    );
    
    console.log(`Encontrados ${response.documents.length} vídeos para processar`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const video of response.documents) {
      try {
        console.log(`Processando vídeo: ${video.$id}`);
        
        const updateData = {};
        let hasChanges = false;
        
        // Criptografar título se não estiver criptografado
        if (video.title && !isEncrypted(video.title)) {
          updateData.title = encryptVideoTitle(video.title);
          hasChanges = true;
          console.log(`  - Criptografando título: ${video.title.substring(0, 50)}...`);
        }
        
        // Criptografar descrição se não estiver criptografado
        if (video.description && !isEncrypted(video.description)) {
          updateData.description = encryptVideoDescription(video.description);
          hasChanges = true;
          console.log(`  - Criptografando descrição: ${video.description.substring(0, 50)}...`);
        }
        
        // Criptografar link do produto se não estiver criptografado
        if (video.product_link && !isEncrypted(video.product_link)) {
          updateData.product_link = encryptProductLink(video.product_link);
          hasChanges = true;
          console.log(`  - Criptografando link do produto: ${video.product_link.substring(0, 50)}...`);
        }
        
        // Criptografar ID do vídeo se não estiver criptografado
        if (video.video_id && !isEncrypted(video.video_id)) {
          updateData.video_id = encryptFileId(video.video_id);
          hasChanges = true;
          console.log(`  - Criptografando ID do vídeo: ${video.video_id}`);
        }
        
        // Criptografar ID da miniatura se não estiver criptografado
        if (video.thumbnail_id && !isEncrypted(video.thumbnail_id)) {
          updateData.thumbnail_id = encryptFileId(video.thumbnail_id);
          hasChanges = true;
          console.log(`  - Criptografando ID da miniatura: ${video.thumbnail_id}`);
        }
        
        // Atualizar documento se houver mudanças
        if (hasChanges) {
          await databases.updateDocument(
            databaseId,
            videoCollectionId,
            video.$id,
            updateData
          );
          
          console.log(`  ✓ Vídeo ${video.$id} atualizado com sucesso`);
          processedCount++;
        } else {
          console.log(`  - Vídeo ${video.$id} já está criptografado ou não precisa de alterações`);
        }
        
      } catch (error) {
        console.error(`  ✗ Erro ao processar vídeo ${video.$id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== Resumo da Criptografia ===');
    console.log(`Total de vídeos processados: ${processedCount}`);
    console.log(`Erros encontrados: ${errorCount}`);
    console.log('Criptografia concluída!');
    
  } catch (error) {
    console.error('Erro geral na criptografia:', error);
  }
}

// Função para verificar se os dados estão criptografados
async function checkEncryptionStatus() {
  try {
    console.log('Verificando status da criptografia...');
    
    const response = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.limit(10)]
    );
    
    let encryptedCount = 0;
    let unencryptedCount = 0;
    
    for (const video of response.documents) {
      const isTitleEncrypted = isEncrypted(video.title);
      const isDescEncrypted = isEncrypted(video.description);
      const isLinkEncrypted = isEncrypted(video.product_link);
      const isVideoIdEncrypted = isEncrypted(video.video_id);
      const isThumbnailIdEncrypted = isEncrypted(video.thumbnail_id);
      
      if (isTitleEncrypted && isDescEncrypted && isLinkEncrypted && 
          isVideoIdEncrypted && isThumbnailIdEncrypted) {
        encryptedCount++;
      } else {
        unencryptedCount++;
        console.log(`Vídeo ${video.$id} não está totalmente criptografado:`);
        console.log(`  - Título: ${isTitleEncrypted ? '✓' : '✗'}`);
        console.log(`  - Descrição: ${isDescEncrypted ? '✓' : '✗'}`);
        console.log(`  - Link: ${isLinkEncrypted ? '✓' : '✗'}`);
        console.log(`  - Video ID: ${isVideoIdEncrypted ? '✓' : '✗'}`);
        console.log(`  - Thumbnail ID: ${isThumbnailIdEncrypted ? '✓' : '✗'}`);
      }
    }
    
    console.log(`\nStatus da Criptografia:`);
    console.log(`Vídeos criptografados: ${encryptedCount}`);
    console.log(`Vídeos não criptografados: ${unencryptedCount}`);
    
  } catch (error) {
    console.error('Erro ao verificar status:', error);
  }
}

// Executar script baseado no argumento da linha de comando
const command = process.argv[2];

if (command === 'check') {
  checkEncryptionStatus();
} else if (command === 'encrypt') {
  encryptExistingData();
} else {
  console.log('Uso: node encrypt-existing-data.js [check|encrypt]');
  console.log('  check   - Verifica o status da criptografia');
  console.log('  encrypt - Criptografa os dados existentes');
}
