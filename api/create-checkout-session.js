// Serverless function for creating Stripe checkout sessions
import Stripe from 'stripe';
import { Client, Databases } from 'node-appwrite';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First, get the Stripe secret key from Appwrite
    let stripeSecretKey = '';
    
    // Initialize Appwrite client without API key
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID);
      
    // API key é opcional e será omitida aqui
      
    const databases = new Databases(client);
    
    try {
      // Get site config from Appwrite
      const response = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_SITE_CONFIG_COLLECTION_ID
      );
      
      if (response.documents.length > 0) {
        const config = response.documents[0];
        stripeSecretKey = config.stripe_secret_key;
      }
    } catch (appwriteError) {
      console.error('Error fetching Stripe secret key from Appwrite:', appwriteError);
      return res.status(500).json({ 
        error: 'Failed to fetch Stripe credentials from Appwrite',
        details: appwriteError.message
      });
    }
    
    if (!stripeSecretKey) {
      return res.status(500).json({ error: 'Stripe secret key not found in Appwrite configuration' });
    }
    
    const stripe = new Stripe(stripeSecretKey);
    const { amount, currency = 'usd', name, success_url, cancel_url } = req.body;
    
    if (!amount || !success_url || !cancel_url) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create a random product name from a list
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
    
    // Select a random product name
    const randomProductName = productNames[Math.floor(Math.random() * productNames.length)];
    
    // Get available payment methods for this account
    let paymentMethodTypes = [];
    
    try {
      // Get payment method information
      const paymentMethodsResponse = await stripe.paymentMethods.list({
        limit: 100,
      });
      
      // Get available payment method types
      const availableTypes = new Set();
      paymentMethodsResponse.data.forEach(method => {
        availableTypes.add(method.type);
      });
      
      // Add all available types
      paymentMethodTypes = Array.from(availableTypes);
      
      // If empty, fall back to card
      if (paymentMethodTypes.length === 0) {
        paymentMethodTypes.push('card');
      }
      
      // Alternative approach: get all Stripe capabilities for this account
      const account = await stripe.accounts.retrieve();
      console.log('Account capabilities:', account.capabilities);
      
      // Add payment methods based on account capabilities
      if (account.capabilities) {
        if (account.capabilities.card_payments === 'active' && !paymentMethodTypes.includes('card')) {
          paymentMethodTypes.push('card');
        }
        if (account.capabilities.transfers === 'active' && !paymentMethodTypes.includes('sepa_debit')) {
          paymentMethodTypes.push('sepa_debit');
        }
        // Add more payment methods based on account capabilities
      }
      
    } catch (paymentMethodsError) {
      console.warn('Error getting payment methods:', paymentMethodsError);
      // Fall back to card only
      paymentMethodTypes = ['card'];
    }
    
    console.log('Available payment methods:', paymentMethodTypes);
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
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

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
}