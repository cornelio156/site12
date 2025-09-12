const { Client, Storage, Databases, Permission, Role, ID } = require('node-appwrite');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

// Configuração
const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '68c3355600070b44bf1b';
const apiKey = process.env.VITE_APPWRITE_API_KEY || 'YOUR_API_KEY';
const SECRET_KEY = 'site-pro-encryption-key-2024';

// IDs dos buckets e coleções
const videosBucketId = 'videos_bucket';
const thumbnailsBucketId = 'thumbnails_bucket';
const databaseId = 'video_site_db';
const videoCollectionId = 'videos';

// Configurar cliente Appwrite
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const storage = new Storage(client);
const databases = new Databases(client);

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

// Função para fazer download de um arquivo
async function downloadFile(bucketId, fileId, tempPath) {
  try {
    const fileBuffer = await storage.getFileDownload(bucketId, fileId);
    // Converter ArrayBuffer para Buffer
    const buffer = Buffer.from(fileBuffer);
    fs.writeFileSync(tempPath, buffer);
    return true;
  } catch (error) {
    console.error(`Erro ao fazer download do arquivo ${fileId}:`, error.message);
    return false;
  }
}

// Função para fazer upload de um arquivo com nome criptografado
async function uploadFileWithEncryptedName(bucketId, filePath, originalFileName, fileType) {
  try {
    const encryptedFileName = createEncryptedFileName(originalFileName, fileType);
    const fileBuffer = fs.readFileSync(filePath);
    
    const uploadResult = await storage.createFile(
      bucketId,
      ID.unique(),
      fileBuffer,
      [Permission.read(Role.any())]
    );
    
    return {
      success: true,
      fileId: uploadResult.$id,
      encryptedName: encryptedFileName
    };
  } catch (error) {
    console.error(`Erro ao fazer upload do arquivo ${originalFileName}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Função para determinar o MIME type baseado na extensão
function getMimeType(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

// Função para migrar um arquivo
async function migrateFile(file, bucketId, fileType) {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempPath = path.join(tempDir, `temp_${file.$id}`);
  
  try {
    console.log(`\n🔄 Migrando arquivo: ${file.name}`);
    console.log(`   ID: ${file.$id}`);
    console.log(`   Tamanho: ${file.sizeOriginal} bytes`);
    
    // 1. Fazer download do arquivo
    console.log('   📥 Fazendo download...');
    const downloadSuccess = await downloadFile(bucketId, file.$id, tempPath);
    if (!downloadSuccess) {
      throw new Error('Falha no download');
    }
    
    // 2. Fazer upload com nome criptografado
    console.log('   📤 Fazendo upload com nome criptografado...');
    const uploadResult = await uploadFileWithEncryptedName(bucketId, tempPath, file.name, fileType);
    if (!uploadResult.success) {
      throw new Error(`Falha no upload: ${uploadResult.error}`);
    }
    
    console.log(`   ✅ Upload concluído! Novo ID: ${uploadResult.fileId}`);
    console.log(`   🔐 Nome criptografado: ${uploadResult.encryptedName}`);
    
    // 3. Deletar arquivo temporário
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    return {
      success: true,
      oldFileId: file.$id,
      newFileId: uploadResult.fileId,
      encryptedName: uploadResult.encryptedName
    };
    
  } catch (error) {
    console.error(`   ❌ Erro na migração: ${error.message}`);
    
    // Limpar arquivo temporário em caso de erro
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para atualizar referências no banco de dados
async function updateDatabaseReferences(migrationResults) {
  console.log('\n📝 Atualizando referências no banco de dados...');
  
  try {
    // Buscar todos os vídeos
    const videos = await databases.listDocuments(databaseId, videoCollectionId);
    
    let updatedVideos = 0;
    let errors = 0;
    
    for (const video of videos.documents) {
      let needsUpdate = false;
      const updateData = {};
      
      // Verificar se precisa atualizar video_id
      const videoMigration = migrationResults.find(m => m.oldFileId === video.video_id);
      if (videoMigration) {
        updateData.video_id = videoMigration.newFileId;
        needsUpdate = true;
        console.log(`   📹 Atualizando video_id: ${video.video_id} → ${videoMigration.newFileId}`);
      }
      
      // Verificar se precisa atualizar thumbnail_id
      const thumbnailMigration = migrationResults.find(m => m.oldFileId === video.thumbnail_id);
      if (thumbnailMigration) {
        updateData.thumbnail_id = thumbnailMigration.newFileId;
        needsUpdate = true;
        console.log(`   🖼️ Atualizando thumbnail_id: ${video.thumbnail_id} → ${thumbnailMigration.newFileId}`);
      }
      
      if (needsUpdate) {
        try {
          await databases.updateDocument(databaseId, videoCollectionId, video.$id, updateData);
          updatedVideos++;
          console.log(`   ✅ Vídeo ${video.$id} atualizado com sucesso`);
        } catch (error) {
          console.error(`   ❌ Erro ao atualizar vídeo ${video.$id}:`, error.message);
          errors++;
        }
      }
    }
    
    console.log(`\n📊 Resumo da atualização do banco de dados:`);
    console.log(`   Vídeos atualizados: ${updatedVideos}`);
    console.log(`   Erros: ${errors}`);
    
  } catch (error) {
    console.error('Erro ao atualizar banco de dados:', error.message);
  }
}

// Função para deletar arquivos antigos
async function deleteOldFiles(migrationResults) {
  console.log('\n🗑️ Deletando arquivos antigos...');
  
  let deletedCount = 0;
  let errorCount = 0;
  
  for (const result of migrationResults) {
    if (result.success) {
      try {
        // Determinar bucket baseado no tipo de arquivo
        const bucketId = result.encryptedName.startsWith('video_') ? videosBucketId : thumbnailsBucketId;
        
        await storage.deleteFile(bucketId, result.oldFileId);
        console.log(`   ✅ Arquivo antigo deletado: ${result.oldFileId}`);
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ Erro ao deletar arquivo ${result.oldFileId}:`, error.message);
        errorCount++;
      }
    }
  }
  
  console.log(`\n📊 Resumo da deleção:`);
  console.log(`   Arquivos deletados: ${deletedCount}`);
  console.log(`   Erros: ${errorCount}`);
}

async function main() {
  console.log('🔐 Script de Migração de Nomes de Arquivos');
  console.log('==========================================');
  
  try {
    // Listar arquivos existentes
    console.log('\n📋 Listando arquivos existentes...');
    
    const videoFiles = await storage.listFiles(videosBucketId);
    const thumbnailFiles = await storage.listFiles(thumbnailsBucketId);
    
    console.log(`Vídeos encontrados: ${videoFiles.total}`);
    console.log(`Thumbnails encontrados: ${thumbnailFiles.total}`);
    
    if (videoFiles.total === 0 && thumbnailFiles.total === 0) {
      console.log('Nenhum arquivo encontrado para migrar.');
      return;
    }
    
    // Migrar arquivos
    const migrationResults = [];
    
    // Migrar vídeos
    for (const file of videoFiles.files) {
      const result = await migrateFile(file, videosBucketId, 'video');
      migrationResults.push(result);
    }
    
    // Migrar thumbnails
    for (const file of thumbnailFiles.files) {
      const result = await migrateFile(file, thumbnailsBucketId, 'thumbnail');
      migrationResults.push(result);
    }
    
    // Atualizar referências no banco de dados
    await updateDatabaseReferences(migrationResults);
    
    // Deletar arquivos antigos
    await deleteOldFiles(migrationResults);
    
    // Resumo final
    const successfulMigrations = migrationResults.filter(r => r.success).length;
    const failedMigrations = migrationResults.filter(r => !r.success).length;
    
    console.log('\n🎉 Migração concluída!');
    console.log(`   Migrações bem-sucedidas: ${successfulMigrations}`);
    console.log(`   Migrações com erro: ${failedMigrations}`);
    
    // Limpar diretório temporário
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('   🧹 Diretório temporário limpo');
    }
    
  } catch (error) {
    console.error('Erro geral:', error.message);
  }
}

// Executar o script
if (require.main === module) {
  main();
}

module.exports = {
  migrateFile,
  updateDatabaseReferences,
  deleteOldFiles
};
