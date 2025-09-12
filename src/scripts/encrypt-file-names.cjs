const { Client, Storage, Permission, Role, ID } = require('node-appwrite');
const CryptoJS = require('crypto-js');

// Configuração
const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '68acc22d00356e5532b9';
const apiKey = process.env.VITE_APPWRITE_API_KEY || 'YOUR_API_KEY';
const SECRET_KEY = 'site-pro-encryption-key-2024';

// IDs dos buckets
const videosBucketId = 'videos_bucket';
const thumbnailsBucketId = 'thumbnails_bucket';

// Configurar cliente Appwrite
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const storage = new Storage(client);

// Funções de criptografia (copiadas do CryptoService)
function encrypt(text) {
  try {
    const iv = CryptoJS.lib.WordArray.random(16).toString();
    const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY, {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return { encrypted: encrypted.toString(), iv: iv };
  } catch (error) {
    console.error('Erro ao criptografar texto:', error);
    throw new Error('Falha na criptografia');
  }
}

function encryptFileName(fileName) {
  if (!fileName || fileName.trim() === '') return fileName;
  const { encrypted, iv } = encrypt(fileName);
  return `${encrypted}:${iv}`;
}

function createEncryptedFileName(originalFileName, fileType) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const encryptedName = encryptFileName(originalFileName);
  const extension = originalFileName.split('.').pop() || '';
  return `${fileType}_${timestamp}_${randomSuffix}_${encryptedName}.${extension}`;
}

async function listFiles(bucketId, bucketName) {
  try {
    console.log(`\n=== Listando arquivos do bucket: ${bucketName} ===`);
    const files = await storage.listFiles(bucketId);
    
    console.log(`Total de arquivos encontrados: ${files.total}`);
    
    files.files.forEach((file, index) => {
      console.log(`${index + 1}. ID: ${file.$id}`);
      console.log(`   Nome atual: ${file.name}`);
      console.log(`   Tamanho: ${file.sizeOriginal} bytes`);
      console.log(`   Criado em: ${file.$createdAt}`);
      console.log('---');
    });
    
    return files.files;
  } catch (error) {
    console.error(`Erro ao listar arquivos do bucket ${bucketName}:`, error.message);
    return [];
  }
}

async function encryptFileNames(bucketId, bucketName, files) {
  console.log(`\n=== Criptografando nomes dos arquivos do bucket: ${bucketName} ===`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    try {
      // Verificar se o nome já está criptografado
      if (file.name.includes('_') && file.name.includes(':')) {
        console.log(`Arquivo ${file.$id} já tem nome criptografado: ${file.name}`);
        continue;
      }
      
      // Determinar o tipo de arquivo baseado no bucket
      const fileType = bucketId === videosBucketId ? 'video' : 'thumbnail';
      
      // Criar novo nome criptografado
      const encryptedFileName = createEncryptedFileName(file.name, fileType);
      
      console.log(`Criptografando arquivo ${file.$id}:`);
      console.log(`  Nome original: ${file.name}`);
      console.log(`  Nome criptografado: ${encryptedFileName}`);
      
      // Nota: O Appwrite não permite renomear arquivos diretamente
      // Seria necessário fazer download, upload com novo nome e deletar o antigo
      // Por enquanto, apenas mostramos o que seria feito
      console.log(`  [SIMULAÇÃO] Arquivo seria renomeado para: ${encryptedFileName}`);
      
      successCount++;
    } catch (error) {
      console.error(`Erro ao processar arquivo ${file.$id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\nResumo do bucket ${bucketName}:`);
  console.log(`  Arquivos processados com sucesso: ${successCount}`);
  console.log(`  Erros: ${errorCount}`);
}

async function main() {
  console.log('🔐 Script de Criptografia de Nomes de Arquivos');
  console.log('==============================================');
  
  try {
    // Listar arquivos de vídeos
    const videoFiles = await listFiles(videosBucketId, 'Videos');
    
    // Listar arquivos de thumbnails
    const thumbnailFiles = await listFiles(thumbnailsBucketId, 'Thumbnails');
    
    // Criptografar nomes dos arquivos de vídeos
    if (videoFiles.length > 0) {
      await encryptFileNames(videosBucketId, 'Videos', videoFiles);
    }
    
    // Criptografar nomes dos arquivos de thumbnails
    if (thumbnailFiles.length > 0) {
      await encryptFileNames(thumbnailsBucketId, 'Thumbnails', thumbnailFiles);
    }
    
    console.log('\n✅ Processo concluído!');
    console.log('\nNota: Este script apenas simula a criptografia dos nomes.');
    console.log('Para implementar a renomeação real, seria necessário:');
    console.log('1. Fazer download de cada arquivo');
    console.log('2. Fazer upload com o novo nome criptografado');
    console.log('3. Deletar o arquivo original');
    console.log('4. Atualizar as referências no banco de dados');
    
  } catch (error) {
    console.error('Erro geral:', error.message);
  }
}

// Executar o script
if (require.main === module) {
  main();
}

module.exports = {
  listFiles,
  encryptFileNames,
  createEncryptedFileName
};
