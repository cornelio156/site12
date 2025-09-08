/**
 * Servidor Express local para desenvolvimento
 * Este arquivo usa o formato ESM
 * Versão limpa sem funcionalidades de email
 */
// Servidor Express para desenvolvimento local
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Client, Databases, Storage, Permission, Role, ID } from 'node-appwrite';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Para trabalhar com __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do .env
dotenv.config();

const app = express();
const defaultPort = 3000;
let port = process.env.PORT || defaultPort;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Servir arquivos estáticos da pasta dist (para produção)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Rota principal para verificar se o servidor está rodando
app.get('/api', (req, res) => {
  res.send('API local rodando! Endpoints disponíveis:\n- /api/setup (teste de conexão Appwrite)\n- /api/create-checkout-session (sessões de checkout Stripe)');
});

// Endpoint para setup da base de dados Appwrite
app.post('/api/setup', async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('📥 Requisição recebida:', req.body);
  const { projectId, apiKey, action } = req.body;

  if (!projectId || !apiKey) {
    return res.status(400).json({ message: 'Project ID e API Key são obrigatórios' });
  }

  try {
    // Configurar cliente Appwrite
    const client = new Client()
      .setEndpoint('https://fra.cloud.appwrite.io/v1')
      .setProject(projectId)
      .setKey(apiKey);

    const databases = new Databases(client);
    const storage = new Storage(client);

    // IDs das collections e buckets
    const databaseId = 'video_site_db';
    const videoCollectionId = 'videos';
    const userCollectionId = 'users';
    const siteConfigCollectionId = 'site_config';
    const sessionCollectionId = 'sessions';
    const videosBucketId = 'videos_bucket';
    const thumbnailsBucketId = 'thumbnails_bucket';

    console.log('🔍 Ação solicitada:', action);
    switch (action) {
      case 'test-connection':
        try {
          await databases.list();
          return res.json({ 
            success: true, 
            message: 'Conexão estabelecida com sucesso' 
          });
        } catch (error) {
          console.error('Erro na conexão:', error);
          return res.status(400).json({ 
            success: false, 
            message: 'Falha na conexão: Credenciais inválidas ou projeto não encontrado' 
          });
        }

      case 'create-database':
        try {
          await databases.create(databaseId, 'Video Site Database');
          return res.json({ success: true, message: 'Database criada com sucesso' });
        } catch (error) {
          if (error.message.includes('already exists')) {
            return res.json({ success: true, message: 'Database já existe' });
          }
          throw error;
        }

      case 'create-collection':
        const { collectionId, collectionName, collectionType } = req.body;
        
        try {
          // Criar collection
          await databases.createCollection(
            databaseId,
            collectionId,
            collectionName,
            [
              Permission.read(Role.any()),
              Permission.write(Role.users()),
              Permission.create(Role.users()),
              Permission.update(Role.users()),
              Permission.delete(Role.users())
            ]
          );

          // Aguardar um pouco para a collection ser criada
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Criar atributos baseados no tipo
          const attributes = getAttributesForType(collectionType);
          for (const attr of attributes) {
            try {
              await createAttribute(databases, databaseId, collectionId, attr);
              // Aguardar entre criação de atributos
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (attrError) {
              // Ignorar se atributo já existe
              if (!attrError.message.includes('already exists')) {
                console.warn(`Erro ao criar atributo ${attr.key}:`, attrError);
              }
            }
          }

          // Aguardar um pouco antes de criar índices
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Criar índices
          const indexes = getIndexesForType(collectionType);
          for (const index of indexes) {
            try {
              await databases.createIndex(databaseId, collectionId, index.key, index.type, index.attributes);
              // Aguardar entre criação de índices
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (indexError) {
              // Ignorar se índice já existe
              if (!indexError.message.includes('already exists')) {
                console.warn(`Erro ao criar índice ${index.key}:`, indexError);
              }
            }
          }

          return res.json({ success: true, message: `Collection '${collectionName}' criada e configurada` });
        } catch (error) {
          if (error.message.includes('already exists')) {
            return res.json({ success: true, message: `Collection '${collectionName}' já existe` });
          }
          throw error;
        }

      case 'create-bucket':
        const { bucketId, bucketName } = req.body;
        
        try {
          await storage.createBucket(
            bucketId,
            bucketName,
            [
              Permission.read(Role.any()),
              Permission.write(Role.users()),
              Permission.create(Role.users()),
              Permission.update(Role.users()),
              Permission.delete(Role.users())
            ]
          );
          return res.json({ success: true, message: `Bucket '${bucketName}' criado` });
        } catch (error) {
          if (error.message.includes('already exists')) {
            return res.json({ success: true, message: `Bucket '${bucketName}' já existe` });
          }
          throw error;
        }

      case 'create-initial-data':
        try {
          // Verificar se já existe configuração do site
          const siteConfigs = await databases.listDocuments(databaseId, siteConfigCollectionId);
          
          if (siteConfigs.documents.length === 0) {
            // Criar configuração inicial do site
            await databases.createDocument(
              databaseId,
              siteConfigCollectionId,
              ID.unique(),
              {
                site_name: 'Video Site',
                video_list_title: 'Featured Videos',
                crypto: []
              }
            );
            return res.json({ success: true, message: 'Configuração inicial do site criada' });
          } else {
            return res.json({ success: true, message: 'Configuração do site já existe' });
          }
        } catch (error) {
          throw error;
        }

      default:
        console.log('❌ Ação não reconhecida:', action);
        return res.status(400).json({ message: 'Ação não reconhecida' });
    }

  } catch (error) {
    console.error('Erro no setup:', error);
    return res.status(500).json({ 
      message: `Erro interno: ${error.message}` 
    });
  }
});

// Funções auxiliares para criar atributos e índices
function getAttributesForType(type) {
  switch (type) {
    case 'video':
      return [
        { key: 'title', type: 'string', size: 255, required: true },
        { key: 'description', type: 'string', size: 2000, required: false },
        { key: 'price', type: 'float', required: true, min: 0 },
        { key: 'duration', type: 'integer', required: false, min: 0 },
        { key: 'video_id', type: 'string', size: 255, required: false },
        { key: 'thumbnail_id', type: 'string', size: 255, required: false },
        { key: 'created_at', type: 'datetime', required: false },
        { key: 'is_active', type: 'boolean', required: false, default: true },
        { key: 'views', type: 'integer', required: false, min: 0, default: 0 },
        { key: 'product_link', type: 'string', size: 500, required: false }
      ];

    case 'user':
      return [
        { key: 'email', type: 'string', size: 255, required: true },
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'password', type: 'string', size: 255, required: true },
        { key: 'created_at', type: 'datetime', required: false }
      ];

    case 'config':
      return [
        { key: 'site_name', type: 'string', size: 255, required: true },
        { key: 'paypal_client_id', type: 'string', size: 255, required: false },
        { key: 'stripe_publishable_key', type: 'string', size: 255, required: false },
        { key: 'stripe_secret_key', type: 'string', size: 255, required: false },
        { key: 'telegram_username', type: 'string', size: 255, required: false },
        { key: 'video_list_title', type: 'string', size: 255, required: false },
        { key: 'crypto', type: 'string', size: 2000, required: false, array: true },
        { key: 'email_host', type: 'string', size: 255, required: false },
        { key: 'email_port', type: 'string', size: 10, required: false },
        { key: 'email_secure', type: 'boolean', required: false },
        { key: 'email_user', type: 'string', size: 255, required: false },
        { key: 'email_pass', type: 'string', size: 255, required: false },
        { key: 'email_from', type: 'string', size: 255, required: false }
      ];

    case 'session':
      return [
        { key: 'user_id', type: 'string', size: 255, required: true },
        { key: 'token', type: 'string', size: 255, required: true },
        { key: 'expires_at', type: 'datetime', required: true },
        { key: 'created_at', type: 'datetime', required: false },
        { key: 'ip_address', type: 'string', size: 45, required: false },
        { key: 'user_agent', type: 'string', size: 1000, required: false }
      ];

    default:
      return [];
  }
}

function getIndexesForType(type) {
  switch (type) {
    case 'video':
      return [
        { key: 'title_index', type: 'key', attributes: ['title'] },
        { key: 'created_at_index', type: 'key', attributes: ['created_at'] },
        { key: 'is_active_index', type: 'key', attributes: ['is_active'] }
      ];

    case 'user':
      return [
        { key: 'email_index', type: 'unique', attributes: ['email'] }
      ];

    case 'session':
      return [
        { key: 'token_index', type: 'unique', attributes: ['token'] },
        { key: 'user_id_index', type: 'key', attributes: ['user_id'] },
        { key: 'expires_at_index', type: 'key', attributes: ['expires_at'] }
      ];

    default:
      return [];
  }
}

async function createAttribute(databases, databaseId, collectionId, attr) {
  if (attr.type === 'string') {
    await databases.createStringAttribute(
      databaseId,
      collectionId,
      attr.key,
      attr.size,
      attr.required,
      attr.default,
      attr.array || false
    );
  } else if (attr.type === 'integer') {
    await databases.createIntegerAttribute(
      databaseId,
      collectionId,
      attr.key,
      attr.required,
      attr.min,
      attr.max,
      attr.default,
      attr.array || false
    );
  } else if (attr.type === 'float') {
    await databases.createFloatAttribute(
      databaseId,
      collectionId,
      attr.key,
      attr.required,
      attr.min,
      attr.max,
      attr.default,
      attr.array || false
    );
  } else if (attr.type === 'boolean') {
    await databases.createBooleanAttribute(
      databaseId,
      collectionId,
      attr.key,
      attr.required,
      attr.default,
      attr.array || false
    );
  } else if (attr.type === 'datetime') {
    await databases.createDatetimeAttribute(
      databaseId,
      collectionId,
      attr.key,
      attr.required,
      attr.default,
      attr.array || false
    );
  }
}

// Endpoint para criar sessão de checkout do Stripe
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Buscar chave secreta do Stripe no Appwrite
    let stripeSecretKey = '';
    
    // Inicializar cliente Appwrite com variáveis de ambiente
    const client = new Client()
      .setEndpoint('https://fra.cloud.appwrite.io/v1') // Endpoint fixo
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
      .setKey(process.env.VITE_APPWRITE_API_KEY);
      
    const databases = new Databases(client);
    
    try {
      // Buscar configurações do site no Appwrite
      console.log('Buscando configurações no Appwrite...');
      
      const response = await databases.listDocuments(
        'video_site_db', // Database ID consistente
        'site_config'    // Site Config Collection ID consistente
      );
      
      if (response.documents.length > 0) {
        const config = response.documents[0];
        stripeSecretKey = config.stripe_secret_key;
        console.log('Chave secreta do Stripe obtida com sucesso do Appwrite');
      } else {
        console.log('Nenhum documento de configuração encontrado no Appwrite');
      }
    } catch (appwriteError) {
      console.error('Erro ao buscar chave do Stripe no Appwrite:', appwriteError);
    }
    
    // Fallback para variável de ambiente se não encontrar no Appwrite
    if (!stripeSecretKey) {
      stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (stripeSecretKey) {
        console.log('Usando chave do Stripe da variável de ambiente como fallback');
      } else {
        return res.status(500).json({ 
          error: 'Chave secreta do Stripe não encontrada nem no Appwrite nem nas variáveis de ambiente' 
        });
      }
    }
    
    // Inicializar Stripe com a chave obtida do Appwrite
    const stripe = new Stripe(stripeSecretKey);
    
    const { amount, currency = 'usd', name, success_url, cancel_url } = req.body;

    console.log('Dados recebidos para checkout:', JSON.stringify(req.body, null, 2));

    // Validar os dados recebidos
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount é obrigatório e deve ser um número positivo' });
    }
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name é obrigatório e deve ser uma string' });
    }
    if (!success_url || typeof success_url !== 'string') {
      return res.status(400).json({ error: 'success_url é obrigatório e deve ser uma string' });
    }
    if (!cancel_url || typeof cancel_url !== 'string') {
      return res.status(400).json({ error: 'cancel_url é obrigatório e deve ser uma string' });
    }

    // Criar line_items baseado nos dados recebidos
    const lineItems = [{
      price_data: {
        currency: 'usd', // Sempre usar USD
        product_data: {
          name: name,
        },
        unit_amount: Math.round(amount), // Amount já deve vir em centavos
      },
      quantity: 1,
    }];

    console.log('Line items criados:', JSON.stringify(lineItems, null, 2));

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      billing_address_collection: 'auto',
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Rota catch-all para SPA (deve vir por último)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Função para tentar conectar na porta especificada
function startServer(targetPort) {
  const server = http.createServer(app);
  
  server.listen(targetPort, () => {
    console.log(`🚀 Servidor rodando na porta ${targetPort}`);
    console.log(`📱 Acesse: http://localhost:${targetPort}`);
    console.log('💳 API Stripe configurada e pronta para uso!');
    console.log('📄 Use /api/create-checkout-session para criar sessões de checkout Stripe.');
    console.log('🔧 API de setup Appwrite configurada!');
    console.log('📄 Use /api/setup para testar conexão com Appwrite.');
    
    if (port !== 3000) {
      console.log(`ATENÇÃO: A API está rodando na porta ${port} em vez da porta padrão 3000.`);
      console.log(`Se você configurou sua aplicação para usar http://localhost:3000, atualize para http://localhost:${port}`);
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`❌ Porta ${targetPort} está em uso. Tentando porta ${targetPort + 1}...`);
      port = targetPort + 1;
      startServer(port);
    } else {
      console.error('❌ Erro ao iniciar servidor:', error);
    }
  });
}

// Iniciar servidor
if (process.env.NODE_ENV !== 'test') {
  startServer(port);
}