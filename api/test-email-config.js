// Serverless function to test email configuration
import nodemailer from 'nodemailer';
import { Client, Databases } from 'node-appwrite';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    
    if (!emailUser || !emailPass) {
      return res.status(500).json({ 
        error: 'Email service not configured. Please set up email credentials in the admin panel.'
      });
    }

    // Extract destination email from request body
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ error: 'Test email address is required' });
    }

    // Create a transporter object using the configured SMTP settings
    // Added TLS options to handle SSL issues
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

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: `Test email sent successfully to ${testEmail}`,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString(),
    });
  }
} 