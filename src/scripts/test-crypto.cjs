/*
 * Script de teste para verificar se a criptografia está funcionando
 */

const CryptoJS = require('crypto-js');

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

function encryptVideoTitle(title) {
  const { encrypted, iv } = encrypt(title);
  return `${encrypted}:${iv}`;
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

function isEncrypted(text) {
  return text && text.includes(':') && text.split(':').length === 2;
}

// Teste principal
function testEncryption() {
  console.log('=== Teste de Criptografia ===\n');
  
  // Dados de teste
  const testData = [
    'Introduction to Web Development',
    'Advanced React Patterns',
    'Node.js Backend Development',
    'TypeScript Fundamentals',
    'CSS Animation Masterclass'
  ];
  
  console.log('1. Testando criptografia de títulos:');
  testData.forEach((title, index) => {
    console.log(`\nTeste ${index + 1}:`);
    console.log(`  Original: "${title}"`);
    
    const encrypted = encryptVideoTitle(title);
    console.log(`  Criptografado: "${encrypted}"`);
    console.log(`  É criptografado: ${isEncrypted(encrypted)}`);
    
    const decrypted = decryptVideoTitle(encrypted);
    console.log(`  Descriptografado: "${decrypted}"`);
    console.log(`  Sucesso: ${title === decrypted ? '✅' : '❌'}`);
  });
  
  console.log('\n2. Testando compatibilidade com dados não criptografados:');
  const unencryptedTitle = 'Título não criptografado';
  console.log(`  Original: "${unencryptedTitle}"`);
  console.log(`  É criptografado: ${isEncrypted(unencryptedTitle)}`);
  const result = decryptVideoTitle(unencryptedTitle);
  console.log(`  Resultado: "${result}"`);
  console.log(`  Sucesso: ${unencryptedTitle === result ? '✅' : '❌'}`);
  
  console.log('\n3. Testando com dados vazios:');
  const emptyTitle = '';
  console.log(`  Original: "${emptyTitle}"`);
  const encryptedEmpty = encryptVideoTitle(emptyTitle);
  console.log(`  Criptografado: "${encryptedEmpty}"`);
  const decryptedEmpty = decryptVideoTitle(encryptedEmpty);
  console.log(`  Descriptografado: "${decryptedEmpty}"`);
  console.log(`  Sucesso: ${emptyTitle === decryptedEmpty ? '✅' : '❌'}`);
  
  console.log('\n4. Testando com caracteres especiais:');
  const specialTitle = 'Título com acentos: ção, ão, í, é, ó, ú';
  console.log(`  Original: "${specialTitle}"`);
  const encryptedSpecial = encryptVideoTitle(specialTitle);
  console.log(`  Criptografado: "${encryptedSpecial}"`);
  const decryptedSpecial = decryptVideoTitle(encryptedSpecial);
  console.log(`  Descriptografado: "${decryptedSpecial}"`);
  console.log(`  Sucesso: ${specialTitle === decryptedSpecial ? '✅' : '❌'}`);
  
  console.log('\n5. Testando com URLs:');
  const testUrl = 'https://example.com/product/advanced-react-patterns?ref=test&id=123';
  console.log(`  Original: "${testUrl}"`);
  const encryptedUrl = encryptVideoTitle(testUrl);
  console.log(`  Criptografado: "${encryptedUrl}"`);
  const decryptedUrl = decryptVideoTitle(encryptedUrl);
  console.log(`  Descriptografado: "${decryptedUrl}"`);
  console.log(`  Sucesso: ${testUrl === decryptedUrl ? '✅' : '❌'}`);
  
  console.log('\n=== Teste Concluído ===');
}

// Executar teste
testEncryption();
