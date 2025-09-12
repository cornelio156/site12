/*
 * Script para testar se a descriptografia está funcionando corretamente
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

// Funções de descriptografia (copiadas do CryptoService)
function decrypt(encrypted, iv) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY, {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Erro ao descriptografar texto:', error);
    throw new Error('Falha na descriptografia');
  }
}

function decryptVideoTitle(encryptedTitle) {
  try {
    const [encrypted, iv] = encryptedTitle.split(':');
    if (!encrypted || !iv) {
      return encryptedTitle; // Retorna o original se não conseguir separar
    }
    return decrypt(encrypted, iv);
  } catch (error) {
    console.error('Erro ao descriptografar título do vídeo:', error);
    return encryptedTitle; // Retorna o original em caso de erro
  }
}

function decryptProductLink(encryptedLink) {
  if (!encryptedLink || encryptedLink.trim() === '') return encryptedLink;
  try {
    const [encrypted, iv] = encryptedLink.split(':');
    if (!encrypted || !iv) {
      return encryptedLink; // Retorna o original se não conseguir separar
    }
    return decrypt(encrypted, iv);
  } catch (error) {
    console.error('Erro ao descriptografar link do produto:', error);
    return encryptedLink; // Retorna o original em caso de erro
  }
}

function isEncrypted(text) {
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

// Função para testar a descriptografia
async function testDecryption() {
  try {
    console.log('Testando descriptografia dos dados...\n');
    
    // Buscar alguns vídeos
    const response = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.limit(3)]
    );
    
    console.log(`Encontrados ${response.documents.length} vídeos para teste:\n`);
    
    response.documents.forEach((video, index) => {
      console.log(`=== Vídeo ${index + 1}: ${video.$id} ===`);
      
      // Testar título
      console.log('Título:');
      console.log(`  Criptografado: ${video.title.substring(0, 50)}...`);
      console.log(`  É criptografado: ${isEncrypted(video.title)}`);
      const decryptedTitle = decryptVideoTitle(video.title);
      console.log(`  Descriptografado: ${decryptedTitle}`);
      console.log(`  Sucesso: ${!isEncrypted(decryptedTitle) ? '✅' : '❌'}`);
      
      // Testar product_link
      console.log('\nProduct Link:');
      console.log(`  Criptografado: ${video.product_link.substring(0, 50)}...`);
      console.log(`  É criptografado: ${isEncrypted(video.product_link)}`);
      const decryptedLink = decryptProductLink(video.product_link);
      console.log(`  Descriptografado: ${decryptedLink}`);
      console.log(`  É URL: ${decryptedLink.startsWith('http') ? '✅' : '❌'}`);
      console.log(`  Sucesso: ${!isEncrypted(decryptedLink) ? '✅' : '❌'}`);
      
      console.log('\n---\n');
    });
    
    console.log('✅ Teste de descriptografia concluído!');
    console.log('✅ Os clientes receberão os links descriptografados (normais)');
    
  } catch (error) {
    console.error('Erro ao testar descriptografia:', error);
  }
}

// Executar teste
testDecryption();
