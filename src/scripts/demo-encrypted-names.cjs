const CryptoJS = require('crypto-js');

// Configuração
const SECRET_KEY = 'site-pro-encryption-key-2024';

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

function decryptFileName(encryptedFileName) {
  if (!encryptedFileName || encryptedFileName.trim() === '') return encryptedFileName;
  try {
    const [encrypted, iv] = encryptedFileName.split(':');
    if (!encrypted || !iv) {
      return encryptedFileName;
    }
    
    const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY, {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Erro ao descriptografar nome do arquivo:', error);
    return encryptedFileName;
  }
}

function extractOriginalFileName(encryptedFileName) {
  // Formato: video_1757644868956_1066lk_U2FsdGVkX19Gnpg+HTfXVbrVlRgwQY9rexvwZmjiVuzaLHF29wbNYNtXfSUOMriV:d1565f3b3c280a8bc040ce09374446ca.MP4
  const parts = encryptedFileName.split('_');
  if (parts.length < 4) return encryptedFileName;
  
  // Remover o prefixo (video_ ou thumbnail_) e timestamp e randomSuffix
  const encryptedPart = parts.slice(3).join('_');
  return decryptFileName(encryptedPart);
}

async function main() {
  console.log('🔐 Demonstração de Criptografia de Nomes de Arquivos');
  console.log('===================================================');
  
  // Exemplos de nomes de arquivos
  const examples = [
    { name: 'Emmi seelers.MP4', type: 'video' },
    { name: 'paypal.png', type: 'thumbnail' },
    { name: 'video_tutorial.mp4', type: 'video' },
    { name: 'thumbnail_image.jpg', type: 'thumbnail' },
    { name: 'meu_video_importante.avi', type: 'video' }
  ];
  
  console.log('\n📝 Exemplos de criptografia de nomes de arquivos:\n');
  
  examples.forEach((example, index) => {
    console.log(`${index + 1}. Arquivo original: ${example.name}`);
    
    // Criptografar o nome
    const encryptedFileName = createEncryptedFileName(example.name, example.type);
    console.log(`   Nome criptografado: ${encryptedFileName}`);
    
    // Extrair o nome original
    const extractedName = extractOriginalFileName(encryptedFileName);
    console.log(`   Nome extraído: ${extractedName}`);
    
    // Verificar se a extração funcionou
    const isCorrect = extractedName === example.name;
    console.log(`   ✅ Extração correta: ${isCorrect ? 'Sim' : 'Não'}`);
    console.log('   ---');
  });
  
  console.log('\n🔍 Como funciona a criptografia:');
  console.log('1. O nome original é criptografado usando AES-256-CBC');
  console.log('2. Um timestamp e sufixo aleatório são adicionados para unicidade');
  console.log('3. O tipo de arquivo (video/thumbnail) é prefixado');
  console.log('4. A extensão original é preservada');
  console.log('5. O resultado é um nome completamente ofuscado');
  
  console.log('\n🛡️ Benefícios da criptografia:');
  console.log('• Nomes originais não são visíveis no storage');
  console.log('• Impossível identificar o conteúdo pelo nome do arquivo');
  console.log('• Cada upload gera um nome único mesmo para arquivos iguais');
  console.log('• A descriptografia só é possível com a chave correta');
  
  console.log('\n📋 Implementação no código:');
  console.log('• Admin.tsx: Criptografa nomes antes do upload');
  console.log('• CryptoService.ts: Funções de criptografia/descriptografia');
  console.log('• VideoService.ts: Descriptografa nomes para exibição');
  
  console.log('\n✅ Sistema de criptografia de nomes implementado com sucesso!');
}

// Executar o script
if (require.main === module) {
  main();
}

module.exports = {
  createEncryptedFileName,
  extractOriginalFileName,
  encryptFileName,
  decryptFileName
};
