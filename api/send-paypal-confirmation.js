// Serverless function to send PayPal confirmation emails
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Client, Databases } from 'node-appwrite';

// Load environment variables
dotenv.config();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { buyerEmail, buyerName, transactionId, isCompany } = req.body;

    if (!buyerEmail || !transactionId) {
      return res.status(400).json({ error: 'Required parameters missing' });
    }

    // Get email configuration from Appwrite
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || '')
      .setProject(process.env.APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '');
    
    const databases = new Databases(client);
    let emailHost = 'smtp.gmail.com';
    let emailPort = '587';
    let emailSecure = false;
    let emailUser = '';
    let emailPass = '';
    let emailFrom = '';
    let telegramUsername = '';
    
    try {
      // Fetch site config from Appwrite
      const response = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || '',
        process.env.APPWRITE_SITE_CONFIG_COLLECTION_ID || ''
      );
      
      if (response.documents.length > 0) {
        const config = response.documents[0];
        
        // Get email settings
        emailHost = config.email_host || 'smtp.gmail.com';
        emailPort = config.email_port || '587';
        emailSecure = config.email_secure || false;
        emailUser = config.email_user || '';
        emailPass = config.email_pass || '';
        emailFrom = config.email_from || '';
        telegramUsername = config.telegram_username || '';
        
        console.log('Email configuration loaded from Appwrite');
      }
    } catch (appwriteError) {
      console.error('Error fetching email configuration from Appwrite:', appwriteError);
      // Will fall back to environment variables
    }
    
    // Use environment variables as fallback
    if (!emailUser) emailUser = process.env.EMAIL_USER || '';
    if (!emailPass) emailPass = process.env.EMAIL_PASS || '';
    if (!emailFrom) emailFrom = process.env.EMAIL_FROM || emailUser;
    if (!telegramUsername) telegramUsername = process.env.TELEGRAM_USERNAME || '';
    
    if (!emailUser || !emailPass) {
      return res.status(500).json({ 
        error: 'Email service not configured. Please set up email credentials in the admin panel.'
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
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false,
        // Force using TLSv1 method instead of the default
        minVersion: 'TLSv1'
      }
    });

    // Format telegram username (add @ if needed)
    const telegramContact = telegramUsername ? 
      (telegramUsername.startsWith('@') ? telegramUsername : '@' + telegramUsername) : 
      'Contact support';

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

If you haven't received your content yet or have any questions, please contact me via Telegram: ${telegramContact}

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

<p><strong>Haven't received your content?</strong> If you're having any issues accessing your purchase or have any questions, please contact me via Telegram: ${telegramContact}</p>

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

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
} 