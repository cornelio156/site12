/**
 * Servidor Express local para desenvolvimento
 * Este arquivo usa o formato ESM
 */
// Servidor Express para desenvolvimento local
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Client, Databases } from 'node-appwrite';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import http from 'http';
import nodemailer from 'nodemailer';
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
  res.send('API local rodando! Use /api/create-checkout-session para criar sessões de checkout do Stripe, /api/send-paypal-confirmation para enviar emails de confirmação PayPal, ou /api/test-email-config para testar a configuração de email.');
});

// Endpoint para criar sessão de checkout do Stripe
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Buscar chave secreta do Stripe no Appwrite
    let stripeSecretKey = '';
    
    // Inicializar cliente Appwrite
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
      
    const databases = new Databases(client);
    
    try {
      // Buscar configurações do site no Appwrite
      console.log('Buscando configurações no Appwrite...');
      console.log('Database ID:', process.env.APPWRITE_DATABASE_ID);
      console.log('Collection ID:', process.env.APPWRITE_SITE_CONFIG_COLLECTION_ID);
      
      const response = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_SITE_CONFIG_COLLECTION_ID
      );
      
      if (response.documents.length > 0) {
        const config = response.documents[0];
        stripeSecretKey = config.stripe_secret_key;
        console.log('Chave secreta do Stripe obtida com sucesso do Appwrite');
      } else {
        console.log('Nenhum documento de configuração encontrado no Appwrite');
        return res.status(500).json({ error: 'Configurações do Stripe não encontradas no Appwrite' });
      }
    } catch (appwriteError) {
      console.error('Erro ao buscar chave do Stripe no Appwrite:', appwriteError);
      return res.status(500).json({ 
        error: 'Erro ao buscar configurações do Stripe',
        details: appwriteError.message
      });
    }
    
    if (!stripeSecretKey) {
      console.error('Chave secreta do Stripe não encontrada');
      return res.status(500).json({ error: 'Chave secreta do Stripe não encontrada no Appwrite' });
    }
    
    const { amount, currency = 'usd', name, success_url, cancel_url } = req.body;
    console.log('Dados recebidos:', { amount, currency, success_url, cancel_url });
    
    if (!amount || !success_url || !cancel_url) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes' });
    }
    
    // Inicializar o Stripe com a chave obtida
    const stripe = new Stripe(stripeSecretKey);

    // Lista de nomes de produtos genéricos
    const productNames = [
      "Personal Development Ebook",
      "Financial Freedom Ebook",
      "Digital Marketing Guide",
      "Health & Wellness Ebook",
      "Productivity Masterclass",
      "Mindfulness & Meditation Guide",
      "Entrepreneurship Blueprint",
      "Wellness Program",
      "Success Coaching",
      "Executive Mentoring",
      "Learning Resources",
      "Online Course Access",
      "Premium Content Subscription",
      "Digital Asset Package"
    ];
    
    // Selecionar um nome aleatório
    const randomProductName = productNames[Math.floor(Math.random() * productNames.length)];
    
    console.log('Criando sessão de checkout para:', {
      amount: amount,
      currency: currency,
      product: randomProductName,
    });
    
    // Criar a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: randomProductName,
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url,
      cancel_url,
    });
    
    console.log('Sessão criada com sucesso:', session.id);
    res.status(200).json({ sessionId: session.id });
    
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Função para verificar se uma porta está em uso
function isPortInUse(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer()
      .once('error', err => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        server.once('close', () => resolve(false));
        server.close();
      })
      .listen(port);
  });
}

// Tentar iniciar o servidor na porta padrão ou em uma porta alternativa
async function startServer() {
  // Checar se a porta padrão está em uso
  if (port === defaultPort) {
    const portInUse = await isPortInUse(port);
    if (portInUse) {
      // Tentar portas alternativas
      for (let alternativePort = 3001; alternativePort < 3010; alternativePort++) {
        const alternativePortInUse = await isPortInUse(alternativePort);
        if (!alternativePortInUse) {
          port = alternativePort;
          console.log(`Porta ${defaultPort} está em uso, usando porta alternativa ${port}`);
          break;
        }
      }
    }
  }

  // Iniciar servidor
  app.listen(port, () => {
    console.log(`Servidor API local rodando na porta ${port}`);
    console.log(`Acesse http://localhost:${port}/ para verificar`);
    
    // Se estamos usando uma porta diferente da 3000, mostrar uma mensagem especial
    if (port !== 3000) {
      console.log(`ATENÇÃO: A API está rodando na porta ${port} em vez da porta padrão 3000.`);
      console.log(`Se você configurou sua aplicação para usar http://localhost:3000, atualize para http://localhost:${port}`);
    }
  });
}

// Adicionar endpoint para enviar emails de confirmação PayPal
app.post('/api/send-paypal-confirmation', async (req, res) => {
  try {
    const { buyerEmail, buyerName, transactionId, isCompany } = req.body;

    if (!buyerEmail || !transactionId) {
      return res.status(400).json({ error: 'Required parameters missing' });
    }

    // Get email configuration from Appwrite
    let emailHost = 'smtp.gmail.com';
    let emailPort = '587';
    let emailSecure = false;
    let emailUser = '';
    let emailPass = '';
    let emailFrom = '';
    
    // Inicializar cliente Appwrite
    const appwriteClient = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
      
    const appwriteDatabases = new Databases(appwriteClient);
    
    try {
      // Buscar configurações do site no Appwrite
      console.log('Buscando configurações de email no Appwrite...');
      console.log('Database ID:', process.env.APPWRITE_DATABASE_ID);
      console.log('Collection ID:', process.env.APPWRITE_SITE_CONFIG_COLLECTION_ID);
      
      const response = await appwriteDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_SITE_CONFIG_COLLECTION_ID
      );
      
      if (response.documents.length > 0) {
        const config = response.documents[0];
        emailHost = config.email_host || 'smtp.gmail.com';
        emailPort = config.email_port || '587';
        emailSecure = config.email_secure || false;
        emailUser = config.email_user || '';
        emailPass = config.email_pass || '';
        emailFrom = config.email_from || '';
        console.log('Configurações de email obtidas com sucesso do Appwrite');
      }
    } catch (appwriteError) {
      console.error('Erro ao buscar configurações de email no Appwrite:', appwriteError);
      // Vai usar as variáveis de ambiente como fallback
    }
    
    // Use as variáveis de ambiente como fallback
    if (!emailUser) emailUser = process.env.EMAIL_USER || '';
    if (!emailPass) emailPass = process.env.EMAIL_PASS || '';
    if (!emailFrom) emailFrom = process.env.EMAIL_FROM || emailUser;
    
    // Verificar se as credenciais de email estão configuradas
    if (!emailUser || !emailPass) {
      console.error('Email credentials not configured');
      return res.status(500).json({ 
        error: 'Email service not configured. Please set up email credentials in the admin panel or .env file.'
      });
    }

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: emailSecure,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Prepare email content
    const subject = 'Please confirm your PayPal order receipt';
    const text = `
Hi ${buyerName || 'there'},

I hope you're doing well!

I'm kindly asking if you could please confirm the receipt of your order on PayPal. This will help release the pending funds on my side.

Here's how you can do it:

Log in to your PayPal account.

Go to Activity and find the transaction with this ID:
Transaction ID: ${transactionId}

Click Confirm Receipt (or Confirm Order Received).

Please let me know if you need any help. I'd really appreciate your support!

Best regards,
${isCompany || 'Seller'}
    `;

    const html = `
<p>Hi ${buyerName || 'there'},</p>

<p>I hope you're doing well!</p>

<p>I'm kindly asking if you could please confirm the receipt of your order on PayPal. This will help release the pending funds on my side.</p>

<p>Here's how you can do it:</p>

<ol>
  <li>Log in to your PayPal account.</li>
  <li>Go to Activity and find the transaction with this ID:<br/>
  <strong>Transaction ID: ${transactionId}</strong></li>
  <li>Click <strong>Confirm Receipt</strong> (or <strong>Confirm Order Received</strong>).</li>
</ol>

<p>Please let me know if you need any help. I'd really appreciate your support!</p>

<p>Best regards,<br/>
${isCompany || 'Seller'}</p>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: emailFrom || emailUser,
      to: buyerEmail,
      subject,
      text,
      html,
    });

    console.log('Email sent:', info.messageId);
    res.status(200).json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Adicionar endpoint para testar configuração de email
app.post('/api/test-email-config', async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ error: 'Email para teste é obrigatório' });
    }

    // Get email configuration from Appwrite
    let emailHost = 'smtp.gmail.com';
    let emailPort = '587';
    let emailSecure = false;
    let emailUser = '';
    let emailPass = '';
    let emailFrom = '';
    
    // Inicializar cliente Appwrite
    const appwriteClient = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
      
    const appwriteDatabases = new Databases(appwriteClient);
    
    try {
      // Buscar configurações do site no Appwrite
      console.log('Buscando configurações de email no Appwrite...');
      
      const response = await appwriteDatabases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_SITE_CONFIG_COLLECTION_ID
      );
      
      if (response.documents.length > 0) {
        const config = response.documents[0];
        emailHost = config.email_host || 'smtp.gmail.com';
        emailPort = config.email_port || '587';
        emailSecure = config.email_secure || false;
        emailUser = config.email_user || '';
        emailPass = config.email_pass || '';
        emailFrom = config.email_from || '';
        console.log('Configurações de email obtidas com sucesso do Appwrite');
      }
    } catch (appwriteError) {
      console.error('Erro ao buscar configurações de email no Appwrite:', appwriteError);
      // Vai usar as variáveis de ambiente como fallback
    }
    
    // Use as variáveis de ambiente como fallback
    if (!emailUser) emailUser = process.env.EMAIL_USER || '';
    if (!emailPass) emailPass = process.env.EMAIL_PASS || '';
    if (!emailFrom) emailFrom = process.env.EMAIL_FROM || emailUser;
    
    // Verificar se as credenciais de email estão configuradas
    if (!emailUser || !emailPass) {
      console.error('Email credentials not configured');
      return res.status(500).json({ 
        error: 'Email service not configured. Please set up email credentials in the admin panel or .env file.'
      });
    }

    // Create a transporter object using the configured SMTP settings
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: emailSecure,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Send test email
    const info = await transporter.sendMail({
      from: emailFrom || emailUser,
      to: testEmail,
      subject: 'Email Configuration Test',
      text: 'If you received this email, your email configuration is working correctly!',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email to verify your email configuration.</p>
        <p>If you received this email, your email settings are working correctly!</p>
        <hr>
        <h3>Configuration Details:</h3>
        <ul>
          <li><strong>SMTP Host:</strong> ${emailHost}</li>
          <li><strong>SMTP Port:</strong> ${emailPort}</li>
          <li><strong>Secure Connection:</strong> ${emailSecure ? 'Yes' : 'No'}</li>
          <li><strong>Email User:</strong> ${emailUser}</li>
        </ul>
        <p>You can now send PayPal confirmation emails through your application.</p>
      `,
    });

    console.log('Email de teste enviado com sucesso:', info.messageId);
    res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: `Email de teste enviado com sucesso para ${testEmail}`,
    });
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Configuração para SPA - deve vir após todas as outras rotas de API
if (process.env.NODE_ENV === 'production') {
  // Configuração de SPA - redirecionar todas as solicitações para index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Iniciar o servidor
startServer().catch(err => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
}); 